"""
Expected Impact Scoring Engine
Calculates historical substitution impact from last 20 finished matches per team.
"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

BSD_BASE = "https://sports.bzzoiro.com/api/v2"
BSD_HEADERS = {"Authorization": f"Token {os.getenv('BSD_KEY')}"}

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


async def fetch_team_impact(team_bsd_id: int, league_code: str) -> dict[int, float]:
    """
    Fetch last 20 finished matches for a team and compute impact scores per player_in_id.
    Returns {player_id: impact_score (0-100)}.
    """
    league_id = LEAGUE_BSD_IDS.get(league_code, 49)
    impact_data: dict[int, dict] = {}

    async with httpx.AsyncClient(timeout=15) as client:
        # Fetch recent finished events for this team
        resp = await client.get(
            f"{BSD_BASE}/events/",
            headers=BSD_HEADERS,
            params={"team_id": team_bsd_id, "league_id": league_id, "status": "FT", "page_size": 20},
        )
        if resp.status_code != 200:
            return {}

        events = resp.json().get("results", resp.json() if isinstance(resp.json(), list) else [])

        for event in events[:20]:
            event_id = event.get("id")
            home_score = event.get("home_score", 0) or 0
            away_score = event.get("away_score", 0) or 0
            home_team_id = event.get("home_team", {}).get("id") if isinstance(event.get("home_team"), dict) else event.get("home_team_id")
            is_home = str(home_team_id) == str(team_bsd_id)

            # Fetch match incidents
            inc_resp = await client.get(
                f"{BSD_BASE}/incidents/",
                headers=BSD_HEADERS,
                params={"event_id": event_id},
            )
            if inc_resp.status_code != 200:
                continue

            incidents = inc_resp.json().get("results", inc_resp.json() if isinstance(inc_resp.json(), list) else [])
            subs = [i for i in incidents if i.get("type") in ("substitution", "sub") and i.get("player_in_id")]

            for sub in subs:
                player_in = sub.get("player_in_id")
                minute = sub.get("minute", 0) or 0
                minutes_remaining = max(0, 90 - minute)
                weight = _time_weight(minutes_remaining)

                # Determine result after sub (use final scoreline as proxy)
                if is_home:
                    result = "W" if home_score > away_score else ("D" if home_score == away_score else "L")
                else:
                    result = "W" if away_score > home_score else ("D" if away_score == home_score else "L")

                if player_in not in impact_data:
                    impact_data[player_in] = {"appearances": 0, "weighted_score": 0.0}

                impact_data[player_in]["appearances"] += 1
                if result == "W":
                    impact_data[player_in]["weighted_score"] += 1.0 * weight
                elif result == "D":
                    impact_data[player_in]["weighted_score"] += 0.5 * weight

    scores: dict[int, float] = {}
    for player_id, data in impact_data.items():
        if data["appearances"] > 0:
            raw = data["weighted_score"] / data["appearances"] * 100
            scores[player_id] = round(min(100.0, raw), 1)
    return scores


def compute_impact_score(wins: int, draws: int, appearances: int, avg_minutes_remaining: float = 30) -> float:
    """Synchronous helper for inline scoring."""
    if appearances == 0:
        return 0.0
    weight = _time_weight(int(avg_minutes_remaining))
    raw = (wins + 0.5 * draws) / appearances * 100 * weight
    return round(min(100.0, raw), 1)
