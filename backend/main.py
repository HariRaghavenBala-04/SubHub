# SubHub — Football Substitution Intelligence Engine
# Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
# Unauthorised copying, distribution, or use is strictly prohibited.
# See LICENSE file for full terms.
"""
SubHub FastAPI Backend — FC26-powered engine
"""
import os
import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from .engine.recommender      import get_recommendations
from .engine.scenario_planner import plan_scenarios, injury_response
from .engine.fc26_loader      import get_player_attributes, get_position_profile, get_player_versatility
from .engine.squad_builder    import build_squad, build_squad_fc26
from .engine.formation_slots  import reassign_for_formation, FORMATION_SLOTS

load_dotenv()

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
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{FD_BASE}/competitions/{league_code}/teams",
            headers=FD_HEADERS,
            params={"season": 2025},
        )
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, "football-data.org error")
    return [
        {"id": t["id"], "name": t["name"],
         "shortName": t.get("shortName", t["name"]),
         "tla": t.get("tla", ""),
         "crestUrl": t.get("crest", "")}
        for t in resp.json().get("teams", [])
    ]


@app.get("/api/squad/{team_id}")
async def get_squad(
    team_id: int,
    league_code: str = "PL",
    formation: str = "4-3-3",
):
    # Step 1: fetch team name + crest from football-data.org (lightweight call)
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{FD_BASE}/teams/{team_id}",
            headers=FD_HEADERS,
            params={"season": 2025},
        )
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, "football-data.org error")

    data      = resp.json()
    team_name = data.get("name", "")
    crest_url = data.get("crest", "")

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

    return {
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
    print(f"=== RECOMMEND REQUEST ===")
    print(f"minute: {body.get('minute')}")
    print(f"home_score: {body.get('home_score')}")
    print(f"away_score: {body.get('away_score')}")
    print(f"is_home: {body.get('is_home')}")
    print(f"manager_intent: {body.get('manager_intent')}")
    print(f"playstyle: {body.get('playstyle')}")
    print(f"formation: {body.get('formation')}")
    print(f"XI players: {[p.get('name') for p in body.get('starting_xi', [])]}")
    print(f"Bench players: {[p.get('name') for p in body.get('bench', [])]}")
    print(f"========================")
    return get_recommendations(
        starting_xi     = body.get("starting_xi", []),
        bench           = body.get("bench", []),
        home_score      = body.get("home_score", 0),
        away_score      = body.get("away_score", 0),
        is_home         = body.get("is_home", True),
        minute          = body.get("minute", 60),
        manager_intent  = body.get("manager_intent", "tactical_change"),
        playstyle       = body.get("playstyle", "high_press"),
        formation       = body.get("formation", "4-3-3"),
        injured_players = body.get("injured_players", []),
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


@app.get("/api/health")
async def health():
    from .engine.fc26_loader import _db
    return {"status": "ok", "fc26_players_loaded": len(_db)}
