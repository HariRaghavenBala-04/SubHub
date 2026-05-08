"""
SubHub FastAPI Backend
"""
import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from .engine.recommender import recommend_subs
from .engine.scenario_planner import plan_scenarios
from .engine.stamina_decay import compute_squad_stamina
from .engine.expected_impact import fetch_team_impact

load_dotenv()

app = FastAPI(title="SubHub API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FD_BASE = "https://api.football-data.org/v4"
FD_HEADERS = {"X-Auth-Token": os.getenv("FOOTBALL_DATA_KEY", "")}

BSD_BASE = "https://sports.bzzoiro.com/api/v2"
BSD_HEADERS = {"Authorization": f"Token {os.getenv('BSD_KEY', '')}"}

LEAGUE_CODES = ["PL", "BL1", "PD", "SA", "FL1", "PPL", "DED"]
LEAGUE_BSD_IDS = {
    "PL": 49, "BL1": 78, "PD": 140,
    "SA": 135, "FL1": 61, "PPL": 94, "DED": 88,
}
LEAGUE_META = {
    "PL":  {"name": "Premier League",   "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "country": "England"},
    "BL1": {"name": "Bundesliga",        "flag": "🇩🇪",       "country": "Germany"},
    "PD":  {"name": "La Liga",           "flag": "🇪🇸",       "country": "Spain"},
    "SA":  {"name": "Serie A",           "flag": "🇮🇹",       "country": "Italy"},
    "FL1": {"name": "Ligue 1",           "flag": "🇫🇷",       "country": "France"},
    "PPL": {"name": "Primeira Liga",     "flag": "🇵🇹",       "country": "Portugal"},
    "DED": {"name": "Eredivisie",        "flag": "🇳🇱",       "country": "Netherlands"},
}


# ── Pydantic models ──────────────────────────────────────────────────────────

class PlayerIn(BaseModel):
    id: int | str
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
    manager_intent: str = "tactical"
    days_since_last_match: int | None = None


class ScenarioRequest(BaseModel):
    starting_xi: list[PlayerIn]
    bench: list[PlayerIn]
    minute: int = 60
    days_since_last_match: int | None = None


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/api/competitions")
async def get_competitions():
    """Return the 7 supported leagues with metadata."""
    return [{"code": code, **LEAGUE_META[code]} for code in LEAGUE_CODES]


@app.get("/api/teams/{league_code}")
async def get_teams(league_code: str):
    """Fetch teams for a competition from football-data.org."""
    if league_code not in LEAGUE_CODES:
        raise HTTPException(status_code=404, detail="Unknown league code")
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{FD_BASE}/competitions/{league_code}/teams",
            headers=FD_HEADERS,
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="football-data.org error")
    data = resp.json()
    teams = data.get("teams", [])
    return [
        {
            "id": t["id"],
            "name": t["name"],
            "shortName": t.get("shortName", t["name"]),
            "tla": t.get("tla", ""),
            "crestUrl": t.get("crest", ""),
        }
        for t in teams
    ]


@app.get("/api/squad/{team_id}")
async def get_squad(team_id: int, league_code: str = "PL", days_since_last_match: int | None = None):
    """Fetch squad for a team and enrich with stamina calculations."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{FD_BASE}/teams/{team_id}",
            headers=FD_HEADERS,
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="football-data.org error")

    data = resp.json()
    squad_raw = data.get("squad", [])

    # Map football-data positions to our engine positions
    pos_map = {
        "Goalkeeper": "GK",
        "Centre-Back": "CB",
        "Left-Back": "LB",
        "Right-Back": "RB",
        "Defensive Midfield": "DM",
        "Central Midfield": "CM",
        "Left Midfield": "W",
        "Right Midfield": "W",
        "Attacking Midfield": "AM",
        "Left Winger": "LW",
        "Right Winger": "RW",
        "Centre-Forward": "ST",
        "Second Striker": "SS",
        "Midfielder": "CM",
        "Defender": "CB",
        "Forward": "ST",
        "Attacker": "ST",
    }

    players = []
    for p in squad_raw:
        raw_pos = p.get("position") or "Midfielder"
        position = pos_map.get(raw_pos, "CM")
        players.append({
            "id": p["id"],
            "name": p["name"],
            "position": position,
            "minutes_played": 60,  # default; overridden by live match data
            "is_injury_return": False,
        })

    enriched = compute_squad_stamina(players, days_since_last_match)

    # Try to get impact scores from BSD
    bsd_id = None  # Would need team BSD ID mapping; skip for now
    impact_scores: dict = {}

    result = []
    for p in enriched:
        result.append({
            **p,
            "impact_score": impact_scores.get(p["id"], round(40 + (p["id"] % 60), 1)),
        })

    return {
        "team": {
            "id": data["id"],
            "name": data["name"],
            "crestUrl": data.get("crest", ""),
        },
        "squad": result,
    }


@app.get("/api/fixtures/{league_code}")
async def get_fixtures(league_code: str):
    """Fetch upcoming fixtures from football-data.org."""
    if league_code not in LEAGUE_CODES:
        raise HTTPException(status_code=404, detail="Unknown league code")
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{FD_BASE}/competitions/{league_code}/matches",
            headers=FD_HEADERS,
            params={"status": "SCHEDULED", "limit": 10},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="football-data.org error")
    return resp.json().get("matches", [])


@app.post("/api/recommend")
async def recommend(req: RecommendRequest):
    """Generate top-3 substitution recommendations."""
    xi = [p.model_dump() for p in req.starting_xi]
    bench = [p.model_dump() for p in req.bench]
    recs = recommend_subs(
        starting_xi=xi,
        bench=bench,
        scoreline=(req.home_score, req.away_score),
        minute=req.minute,
        manager_intent=req.manager_intent,
        days_since_last_match=req.days_since_last_match,
    )
    # Serialise — remove nested dicts for clean JSON
    return [
        {
            "subOff": {k: v for k, v in r["subOff"].items() if k != "stamina_colour"},
            "subOn": {k: v for k, v in r["subOn"].items() if k != "stamina_colour"},
            "stamina_pct": r["stamina_pct"],
            "impact_score": r["impact_score"],
            "position_valid": r["position_valid"],
            "reasoning": r["reasoning"],
        }
        for r in recs
    ]


@app.post("/api/scenarios")
async def scenarios(req: ScenarioRequest):
    """Run W/D/L scenario planning at a given minute."""
    xi = [p.model_dump() for p in req.starting_xi]
    bench = [p.model_dump() for p in req.bench]
    return plan_scenarios(
        starting_xi=xi,
        bench=bench,
        minute=req.minute,
        days_since_last_match=req.days_since_last_match,
    )


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "SubHub API"}
