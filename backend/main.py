# SubHub — Football Substitution Intelligence Engine
# Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
# Unauthorised copying, distribution, or use is strictly prohibited.
# See LICENSE file for full terms.
"""
SubHub FastAPI Backend — FC26-powered engine
"""
import os
import time
import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from .engine.recommender      import get_recommendations
from .engine.scenario_planner import plan_scenarios, injury_response
from .engine.fc26_loader      import get_player_attributes, get_position_profile, get_player_versatility
from .engine.squad_builder    import build_squad, build_squad_fc26, FC26_DF, find_fc26_club_name
from .engine.formation_slots  import reassign_for_formation, FORMATION_SLOTS
from .engine.opponent_dna     import derive_opponent_dna

load_dotenv()

# ── Two-level cache ────────────────────────────────────────────────────────

_cache: dict = {}
_CACHE_TTL = {
    "teams":     900,   # 15 mins — league teams rarely change
    "squad":     600,   # 10 mins — squads don't change mid-session
    "team_meta": 3600,  # 1 hour  — team name/badge never changes
}


def cache_get(key: str):
    entry = _cache.get(key)
    if not entry:
        return None
    if time.time() - entry["ts"] > entry["ttl"]:
        del _cache[key]
        return None
    return entry["data"]


def cache_set(key: str, data, ttl: int) -> None:
    _cache[key] = {"data": data, "ts": time.time(), "ttl": ttl}


# ── Retry wrapper for football-data.org ───────────────────────────────────

async def _api_get(url: str, params: dict | None = None, retries: int = 3):
    """GET with exponential back-off on 429."""
    async with httpx.AsyncClient(timeout=15) as client:
        for attempt in range(retries):
            resp = await client.get(url, headers=FD_HEADERS, params=params)
            if resp.status_code == 429:
                wait = 12 * (attempt + 1)
                print(f"[API] Rate limited — waiting {wait}s (attempt {attempt + 1}/{retries})")
                time.sleep(wait)
                continue
            return resp
    raise HTTPException(429, "API rate limit — please wait 60 seconds and try again")


# ── App ───────────────────────────────────────────────────────────────────

app = FastAPI(title="SubHub API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FD_BASE    = "https://api.football-data.org/v4"
FD_HEADERS = {"X-Auth-Token": os.getenv("FOOTBALL_DATA_KEY", "")}

LEAGUE_CODES = ["PL", "BL1", "PD", "SA", "FL1", "PPL", "DED"]
LEAGUE_META  = {
    "PL":  {"name": "Premier League",  "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "country": "England"},
    "BL1": {"name": "Bundesliga",      "flag": "🇩🇪",       "country": "Germany"},
    "PD":  {"name": "La Liga",         "flag": "🇪🇸",       "country": "Spain"},
    "SA":  {"name": "Serie A",         "flag": "🇮🇹",       "country": "Italy"},
    "FL1": {"name": "Ligue 1",         "flag": "🇫🇷",       "country": "France"},
    "PPL": {"name": "Primeira Liga",   "flag": "🇵🇹",       "country": "Portugal"},
    "DED": {"name": "Eredivisie",      "flag": "🇳🇱",       "country": "Netherlands"},
}

POS_MAP = {
    "Goalkeeper":         "GK",
    "Centre-Back":        "CB",
    "Left-Back":          "LB",
    "Right-Back":         "RB",
    "Defensive Midfield": "DM",
    "Central Midfield":   "CM",
    "Left Midfield":      "LM",
    "Right Midfield":     "RM",
    "Attacking Midfield": "CAM",
    "Left Winger":        "LW",
    "Right Winger":       "RW",
    "Centre-Forward":     "ST",
    "Second Striker":     "SS",
    "Midfielder":         "CM",
    "Defender":           "CB",
    "Forward":            "ST",
    "Attacker":           "ST",
}

POS_ORDER = [
    "GK","LCB","CB","RCB","LB","LWB","RB","RWB",
    "DM","CDM","LCM","CM","RCM","LM","RM",
    "LAM","CAM","RAM","AM",
    "LW","RW","W","ST","SS","CF",
]


# ── Pydantic models ────────────────────────────────────────────────────────

class PlayerIn(BaseModel):
    id: int | str | None = None
    name: str
    position: str
    minutes_played: int = 0
    impact_score: float = 50.0
    is_injury_return: bool = False


class RecommendRequest(BaseModel):
    starting_xi: list[PlayerIn]
    bench: list[PlayerIn]
    home_score: int = 0
    away_score: int = 0
    minute: int = 60
    manager_intent: str = "tactical_change"
    days_since_last_match: int | None = None
    injured_players: list[str] = []
    intensity: str = ""


class InjuryRequest(BaseModel):
    injured_player: PlayerIn
    current_xi: list[PlayerIn]
    bench: list[PlayerIn]
    minute: int = 60
    formation: str = "4-3-3"


class ScenarioRequest(BaseModel):
    current_xi: list[PlayerIn]
    bench: list[PlayerIn]
    minute: int = 60
    days_since_last_match: int | None = None


# ── Helpers ────────────────────────────────────────────────────────────────

def _merge_fc26(player: dict) -> dict:
    """Merge FC26 attributes into a player dict."""
    attrs = get_player_attributes(player.get("name", ""))
    if attrs:
        player["overall"]          = attrs.get("overall")
        player["tactical_profile"] = attrs.get("tactical_profile")
        player["power_stamina"]    = attrs.get("power_stamina")
        player["fc26_found"]       = True
    else:
        player["overall"]          = None
        player["tactical_profile"] = None
        player["power_stamina"]    = None
        player["fc26_found"]       = False
    return player


# ── Routes ─────────────────────────────────────────────────────────────────

@app.get("/api/competitions")
async def get_competitions():
    return [{"code": c, **LEAGUE_META[c]} for c in LEAGUE_CODES]


@app.get("/api/teams/{league_code}")
async def get_teams(league_code: str):
    if league_code not in LEAGUE_CODES:
        raise HTTPException(404, "Unknown league code")

    cache_key = f"teams_{league_code}"
    cached = cache_get(cache_key)
    if cached:
        print(f"[Cache] HIT {cache_key}")
        return cached
    print(f"[Cache] MISS {cache_key}")

    resp = await _api_get(
        f"{FD_BASE}/competitions/{league_code}/teams",
        params={"season": 2025},
    )
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, "football-data.org error")

    result = [
        {"id": t["id"], "name": t["name"],
         "shortName": t.get("shortName", t["name"]),
         "tla": t.get("tla", ""),
         "crestUrl": t.get("crest", "")}
        for t in resp.json().get("teams", [])
    ]
    cache_set(cache_key, result, _CACHE_TTL["teams"])
    return result


@app.get("/api/squad/{team_id}")
async def get_squad(
    team_id: int,
    league_code: str = "PL",
    formation: str = "4-3-3",
):
    cache_key = f"squad_{team_id}_{formation}"
    cached = cache_get(cache_key)
    if cached:
        print(f"[Cache] HIT {cache_key}")
        return cached
    print(f"[Cache] MISS {cache_key}")

    # Step 1: fetch team name + crest — cached separately so formation
    # changes reuse the meta without hitting the API again.
    meta_key = f"team_meta_{team_id}"
    meta = cache_get(meta_key)
    if meta:
        print(f"[Cache] HIT {meta_key}")
    else:
        print(f"[Cache] MISS {meta_key}")
        resp = await _api_get(f"{FD_BASE}/teams/{team_id}", params={"season": 2025})
        if resp.status_code != 200:
            raise HTTPException(resp.status_code, "football-data.org error")
        meta = resp.json()
        cache_set(meta_key, meta, _CACHE_TTL["team_meta"])

    team_name = meta.get("name", "")
    crest_url = meta.get("crest", "")

    # Step 2: build squad entirely from FC26 club data
    result = build_squad_fc26(team_name, formation)

    if not result:
        raise HTTPException(
            404,
            f"Club not found in FC26 data: {team_name!r}. "
            "Check club name mapping or add to find_fc26_club_name()."
        )

    print(
        f"[Squad] {team_name} → {result['fc26_club']}: "
        f"XI={len(result['starting_xi'])} bench={len(result['bench'])} "
        f"reserves={len(result['reserves'])} total={result['total']}"
    )

    all_players = result["starting_xi"] + result["bench"] + result["reserves"]
    print(f"=== FINAL SQUAD SENT TO FRONTEND ({team_name}) ===")
    for p in all_players:
        print(f"  {p.get('short_name', p['name']):<22} "
              f"pos={p['api_position']:<5} ovr={p['overall']}")

    response = {
        "team": {
            "id":       team_id,
            "name":     team_name,
            "crestUrl": crest_url,
        },
        "squad":        all_players,
        "starting_xi":  result["starting_xi"],
        "bench":        result["bench"],
        "reserves":     result["reserves"],
        "meta": {
            "fc26_club":     result["fc26_club"],
            "total_squad":   result["total"],
            "unmatched_count": 0,
        },
    }
    cache_set(cache_key, response, _CACHE_TTL["squad"])
    return response


@app.get("/api/squad-comparison")
async def squad_comparison(team_id: int):
    resp_data = await get_squad(team_id)
    return resp_data


# ── Formation assignment routes ────────────────────────────────────────────

class AssignFormationRequest(BaseModel):
    players:   list[dict]
    formation: str = "4-3-3"


@app.post("/api/assign-formation")
async def assign_formation(req: AssignFormationRequest):
    """Re-assign current XI players to optimal slots for a different formation."""
    if req.formation not in FORMATION_SLOTS:
        raise HTTPException(400, f"Unknown formation: {req.formation}. "
                                 f"Valid: {list(FORMATION_SLOTS.keys())}")
    assigned = reassign_for_formation(req.players, req.formation)
    return {"formation": req.formation, "players": assigned}


@app.get("/api/player-versatility")
async def player_versatility(name: str):
    """Top 3 formation slots + ratings for a player."""
    vers = get_player_versatility(name)
    return {"name": name, "versatility": [{"slot": s, "rating": r} for s, r in vers]}


@app.get("/api/player-profile")
async def player_profile(name: str, position: str = "CM"):
    profile = get_position_profile(name, position)
    attrs   = get_player_attributes(name)
    return {
        "name":    name,
        "profile": profile,
        "attrs":   attrs,
    }


@app.post("/api/recommend")
async def recommend(request: Request):
    body = await request.json()

    # Support both new (on_pitch / bench_available) and legacy (starting_xi / bench) keys
    on_pitch      = body.get("on_pitch")      or body.get("starting_xi", [])
    bench_avail   = body.get("bench_available") or body.get("bench", [])
    subbed_off    = body.get("subbed_off")    or body.get("applied_subs", [])
    cur_minute    = body.get("current_minute") or body.get("minute", 60)
    score_home    = body.get("current_score_home") if body.get("current_score_home") is not None \
                    else body.get("home_score", 0)
    score_away    = body.get("current_score_away") if body.get("current_score_away") is not None \
                    else body.get("away_score", 0)
    subs_rem        = body.get("subs_remaining", 5)
    competition     = body.get("competition", "")
    pk_mode         = body.get("pk_mode", False)
    straight_to_pks = body.get("straight_to_pks", False)
    intensity          = body.get("intensity", "")
    opponent_playstyle = body.get("opponent_playstyle") or None
    plan_scenario      = body.get("plan_scenario") or None
    plan_formation     = body.get("plan_formation") or None

    print(f"[Rec] {cur_minute}' | {score_home}-{score_away} | "
          f"playstyle={body.get('playstyle')} formation={body.get('formation')} "
          f"subs_left={subs_rem} subbed_off={subbed_off}")

    return get_recommendations(
        on_pitch            = on_pitch,
        bench_available     = bench_avail,
        subbed_off          = subbed_off,
        current_minute      = int(cur_minute),
        current_score_home  = int(score_home),
        current_score_away  = int(score_away),
        is_home             = body.get("is_home", True),
        subs_remaining      = int(subs_rem),
        formation           = body.get("formation", "4-3-3"),
        playstyle           = body.get("playstyle", "high_press"),
        competition         = competition,
        pk_mode             = pk_mode,
        straight_to_pks     = straight_to_pks,
        intensity           = intensity,
        opponent_playstyle  = opponent_playstyle,
        plan_scenario       = plan_scenario,
        plan_formation      = plan_formation,
    )


@app.get("/api/playstyles")
async def get_playstyles():
    from .engine.playstyle_profiles import PLAYSTYLES
    return {
        k: {
            "label":       v["label"],
            "icon":        v["icon"],
            "description": v["description"],
        }
        for k, v in PLAYSTYLES.items()
    }


@app.get("/api/compatibility")
async def check_compatibility(playstyle: str, formation: str):
    from .engine.playstyle_profiles import get_compatibility as ps_compat
    return ps_compat(playstyle, formation)


@app.post("/api/injury-response")
async def injury_resp(req: InjuryRequest):
    injured = req.injured_player.model_dump()
    xi      = [p.model_dump() for p in req.current_xi]
    bench   = [p.model_dump() for p in req.bench]
    return injury_response(
        injured_player=injured,
        bench=bench,
        current_xi=xi,
        minute=req.minute,
    )


@app.post("/api/scenarios")
async def scenarios(req: ScenarioRequest):
    xi    = [p.model_dump() for p in req.current_xi]
    bench = [p.model_dump() for p in req.bench]
    return plan_scenarios(
        starting_xi=xi,
        bench=bench,
        minute=req.minute,
        days_since_last_match=req.days_since_last_match,
    )


@app.get("/api/opponent-dna")
async def opponent_dna(team: str):
    """
    GET /api/opponent-dna?team={team_name}
    Returns a tactical DNA profile derived from FC26 squad data.
    Results are cached in memory — the CSV does not change at runtime.
    """
    try:
        profile = derive_opponent_dna(team)
        return profile
    except ValueError as e:
        raise HTTPException(404, str(e))


@app.get("/api/key-matchup-players")
async def key_matchup_players(team: str, opponent: str):
    """
    GET /api/key-matchup-players?team={fc26_club}&opponent={fc26_club}
    Cross-references opponent DNA thresholds against the user's squad.
    Returns up to 3 key players with name, position, overall, reason.
    """
    def _i(val, default: int = 65) -> int:
        try:
            return int(float(str(val).split("+")[0].split("-")[0].strip()))
        except Exception:
            return default

    user_fc26 = find_fc26_club_name(team)
    if not user_fc26:
        raise HTTPException(404, f"Team not found in FC26: {team!r}")

    user_df = FC26_DF[FC26_DF["club_name"] == user_fc26].copy()
    if user_df.empty:
        raise HTTPException(404, f"No squad data for {user_fc26!r}")

    try:
        dna = derive_opponent_dna(opponent)
    except ValueError:
        raise HTTPException(404, f"Opponent DNA unavailable for {opponent!r}")

    results: list[dict] = []
    used: set[str] = set()

    def _add(pool_df, score_col: str, n: int, reason: str) -> None:
        pool = pool_df.copy()
        pool["_s"] = pool[score_col].apply(lambda x: _i(x))
        for _, row in pool.sort_values("_s", ascending=False).iterrows():
            if len(results) >= 3 or n <= 0:
                break
            name = str(row.get("short_name") or row.get("long_name") or "").strip()
            if not name or name in used:
                continue
            used.add(name)
            pos_raw  = str(row.get("player_positions", ""))
            position = pos_raw.split(",")[0].strip() if pos_raw else "?"
            results.append({
                "name":     name,
                "position": position,
                "overall":  _i(row.get("overall"), 70),
                "reason":   reason,
            })
            n -= 1

    def _pos_filter(*codes):
        mask = user_df["player_positions"].apply(
            lambda p: any(c in str(p).upper() for c in codes)
        )
        return user_df[mask]

    pace_threat        = _i(dna.get("pace_threat",        0))
    press_intensity    = _i(dna.get("press_intensity",    0))
    physical_dominance = _i(dna.get("physical_dominance", 0))
    creative_threat    = _i(dna.get("creative_threat",    0))

    if pace_threat > 65:
        _add(_pos_filter("CB", "LB", "RB", "LWB", "RWB"), "pace", 2,
             "Pace to match their threat in behind")
        _add(_pos_filter("ST", "LW", "RW", "CF"), "pace", 1,
             "Pace to match their threat in behind")

    if press_intensity > 60 and len(results) < 3:
        _add(user_df, "mentality_composure", 3 - len(results),
             "Composure to beat their high press")

    if physical_dominance > 65 and len(results) < 3:
        user_df["_phys"] = user_df.apply(
            lambda r: (_i(r.get("power_jumping")) + _i(r.get("power_strength"))) // 2, axis=1
        )
        _add(user_df, "_phys", 3 - len(results),
             "Aerial strength against their physicality")

    if creative_threat > 65 and len(results) < 3:
        _add(_pos_filter("CDM", "CM", "CB"), "defending_marking_awareness",
             3 - len(results), "Defensive awareness to nullify their creativity")

    return results[:3]


# ── Competition → FC26 league name ────────────────────────────────────────────
_COMP_TO_LEAGUE: dict[str, str] = {
    "premier_league": "Premier League",
    "bundesliga":     "Bundesliga",
    "la_liga":        "La Liga",
    "serie_a":        "Serie A",
    "ligue_1":        "Ligue 1",
}

# 2024/25 UCL participants — teams outside the 7 target leagues will return
# DNA unavailable but are included for completeness.
_UCL_2024_25: list[str] = sorted([
    "Arsenal", "Aston Villa", "Manchester City", "Liverpool",
    "Bayern München", "Bayer 04 Leverkusen", "Borussia Dortmund", "RB Leipzig", "VfB Stuttgart",
    "Real Madrid", "Atlético Madrid", "Barcelona", "Girona",
    "Inter", "Juventus", "Atalanta", "AC Milan", "Bologna",
    "Paris SG", "Monaco", "Stade Brest",
    "Benfica", "Sporting CP",
    "PSV Eindhoven", "Feyenoord",
    "Celtic", "Club Brugge", "Red Bull Salzburg", "Young Boys",
    "Slavia Praha", "Dinamo Zagreb", "Sparta Praha",
    "Crvena zvezda", "Sturm Graz", "Bodo/Glimt", "Shakhtar Donetsk",
])

_UEL_2024_25: list[str] = sorted([
    "Manchester United", "Tottenham Hotspur",
    "Eintracht Frankfurt", "Hoffenheim",
    "Athletic Club", "Real Sociedad", "Villarreal",
    "Lazio", "Roma", "Napoli", "Fiorentina",
    "Lyon", "Nice", "Lens",
    "Porto", "Braga",
    "Ajax", "AZ Alkmaar", "Twente",
    "Rangers", "Anderlecht", "Fenerbahçe", "Galatasaray",
])


@app.get("/api/teams-by-competition")
async def teams_by_competition(competition: str):
    """
    GET /api/teams-by-competition?competition={key}
    Returns [{ name, fc26_club }] sorted alphabetically.

    Keys: premier_league | bundesliga | la_liga | serie_a | ligue_1 | ucl | uel
    UCL/UEL use hardcoded 2024/25 participant lists.
    Domestic leagues are read directly from the FC26 CSV.
    """
    comp_key = competition.lower().strip()

    if comp_key == "ucl":
        return [{"name": t, "fc26_club": t} for t in _UCL_2024_25]

    if comp_key == "uel":
        return [{"name": t, "fc26_club": t} for t in _UEL_2024_25]

    league_name = _COMP_TO_LEAGUE.get(comp_key)
    if not league_name:
        raise HTTPException(400, f"Unknown competition key: {competition!r}. "
                                 f"Valid: {list(_COMP_TO_LEAGUE)} + ucl + uel")

    if FC26_DF.empty:
        return []

    clubs = (
        FC26_DF[FC26_DF["league_name"] == league_name]["club_name"]
        .dropna()
        .unique()
        .tolist()
    )
    clubs.sort()
    return [{"name": c, "fc26_club": c} for c in clubs]


@app.get("/api/health")
async def health():
    from .engine.fc26_loader import _db
    return {"status": "ok", "fc26_players_loaded": len(_db)}
