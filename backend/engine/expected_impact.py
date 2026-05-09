"""
Expected Impact Engine — 3-signal composite:
  40% historical BSD sub performance
  35% FC26 position rating
  25% attribute upgrade delta vs starter
"""
import os
import httpx
from dotenv import load_dotenv
from .fc26_loader import get_position_profile, get_attribute_upgrade_delta

load_dotenv()

BSD_BASE    = "https://sports.bzzoiro.com/api/v2"
BSD_HEADERS = {"Authorization": f"Token {os.getenv('BSD_KEY', '')}"}

LEAGUE_BSD_IDS = {
    "PL": 49, "BL1": 78, "PD": 140,
    "SA": 135, "FL1": 61, "PPL": 94, "DED": 88,
}


def _time_weight(minutes_remaining: int) -> float:
    if minutes_remaining < 15:
        return 0.5
    elif minutes_remaining < 30:
        return 0.75
    return 1.0


async def _fetch_sub_score(
    player_name: str,
    team_bsd_id: int,
    league_code: str,
) -> tuple[float | None, int]:
    """
    Returns (sub_score 0-100 or None, appearances).
    sub_score = None if fewer than 3 appearances.
    """
    league_id = LEAGUE_BSD_IDS.get(league_code, 49)
    wins = draws = appearances = 0

    try:
        async with httpx.AsyncClient(timeout=12) as client:
            resp = await client.get(
                f"{BSD_BASE}/events/",
                headers=BSD_HEADERS,
                params={"team_id": team_bsd_id, "league_id": league_id, "status": "FT", "page_size": 20},
            )
            if resp.status_code != 200:
                return None, 0

            events = resp.json()
            if isinstance(events, dict):
                events = events.get("results", [])

            for event in events[:20]:
                event_id = event.get("id")
                home_score = event.get("home_score", 0) or 0
                away_score = event.get("away_score", 0) or 0
                ht = event.get("home_team", {})
                home_team_id = ht.get("id") if isinstance(ht, dict) else event.get("home_team_id")
                is_home = str(home_team_id) == str(team_bsd_id)

                inc_resp = await client.get(
                    f"{BSD_BASE}/incidents/",
                    headers=BSD_HEADERS,
                    params={"event_id": event_id},
                )
                if inc_resp.status_code != 200:
                    continue

                incidents = inc_resp.json()
                if isinstance(incidents, dict):
                    incidents = incidents.get("results", [])

                for inc in incidents:
                    if inc.get("type") not in ("substitution", "sub"):
                        continue
                    pname = inc.get("player_in_name", "") or ""
                    if player_name.lower() not in pname.lower():
                        continue
                    minute = inc.get("minute", 0) or 0
                    minutes_remaining = max(0, 90 - minute)
                    weight = _time_weight(minutes_remaining)

                    if is_home:
                        result = "W" if home_score > away_score else ("D" if home_score == away_score else "L")
                    else:
                        result = "W" if away_score > home_score else ("D" if away_score == home_score else "L")

                    appearances += 1
                    if result == "W":
                        wins  += weight
                    elif result == "D":
                        draws += weight * 0.5
    except Exception as e:
        print(f"[BSD] sub_score fetch error for {player_name}: {e}")
        return None, 0

    if appearances < 3:
        return None, appearances

    raw = (wins + draws) / appearances * 100
    return round(min(100.0, raw), 1), appearances


def compute_impact_score(
    bench_name: str,
    bench_position: str,
    starter_name: str | None,
    sub_score: float | None,
    appearances: int,
) -> dict:
    """
    Combine 3 signals into final impact_score.
    Returns full breakdown dict.
    """
    profile  = get_position_profile(bench_name, bench_position)
    fc26_score = profile.get("pos_rating")  # already 0-99

    # Signal 3 — attribute upgrade
    if starter_name:
        upgrade = get_attribute_upgrade_delta(bench_name, starter_name, bench_position)
        upgrade_score = upgrade["upgrade_score"]
        comparisons   = upgrade["comparisons"]
        flag          = upgrade["flag"]
    else:
        upgrade_score = 50.0
        comparisons   = []
        flag          = "unknown"

    # Compose
    w1, w2, w3 = 0.40, 0.35, 0.25
    parts: list[float] = []

    if sub_score is not None:
        parts.append(sub_score * w1)
    else:
        # Redistribute weight when BSD data unavailable
        w2 += w1 * 0.5; w3 += w1 * 0.5

    if fc26_score is not None:
        parts.append(fc26_score * w2)
    else:
        w3 += w2

    parts.append(upgrade_score * w3)

    final = round(sum(parts), 1)

    # Confidence
    if appearances >= 5 and profile["fc26_found"]:
        confidence = "HIGH"
    elif appearances >= 2 or profile["fc26_found"]:
        confidence = "MEDIUM"
    else:
        confidence = "LOW"

    # Build key upgrade description
    best_upgrade = None
    if comparisons:
        best = max(comparisons, key=lambda x: x["delta"])
        if best["delta"] > 3:
            best_upgrade = f"{best['attr']} ({best['bench_val']} vs {best['starter_val']})"

    return {
        "impact_score":        min(100, max(0, int(final))),
        "confidence":          confidence,
        "sub_history_score":   sub_score,
        "fc26_score":          fc26_score,
        "upgrade_score":       round(upgrade_score, 1),
        "upgrade_flag":        flag,
        "best_upgrade":        best_upgrade,
        "key_attrs_comparison": comparisons[:5],
        "appearances_as_sub":  appearances,
        "pos_rating":          fc26_score,
        "tactical_profile":    profile.get("tactical_profile"),
        "fc26_found":          profile["fc26_found"],
        "overall":             profile.get("overall"),
    }


def compute_impact_sync(
    bench_name: str,
    bench_position: str,
    starter_name: str | None = None,
    fallback_score: float = 55.0,
) -> dict:
    """
    Synchronous version — uses only FC26 signals (no BSD fetch).
    Used in client-side fallback paths and sync engine calls.
    """
    return compute_impact_score(
        bench_name=bench_name,
        bench_position=bench_position,
        starter_name=starter_name,
        sub_score=None,
        appearances=0,
    )
