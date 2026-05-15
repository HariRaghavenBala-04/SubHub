# SubHub — Football Substitution Intelligence Engine
# Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
# Unauthorised copying, distribution, or use is strictly prohibited.
# See LICENSE file for full terms.
"""
Opponent DNA Profiler — derives a tactical DNA profile from FC26 squad data.

All computations are done once per team then cached in _DNA_CACHE.
The CSV is static at runtime so recomputing per request is wasteful.
"""
from __future__ import annotations

from .squad_builder import FC26_DF, find_fc26_club_name, _FC26_POS_MAP, _parse_rating

# ── Module-level result cache ──────────────────────────────────────────────

_DNA_CACHE: dict[str, dict] = {}

# ── Position group sets ────────────────────────────────────────────────────

_GK   = frozenset({"GK"})
_DEF  = frozenset({"CB", "LB", "RB", "LWB", "RWB"})
_MID  = frozenset({"CDM", "CM", "LM", "RM", "CAM", "LAM", "RAM"})
_ATT  = frozenset({"ST", "CF", "LW", "RW"})
_WIDE = frozenset({"LW", "RW", "LM", "RM", "LB", "RB", "LWB", "RWB"})


def _grp(pos: str) -> str:
    if pos in _GK:  return "GK"
    if pos in _DEF: return "DEF"
    if pos in _MID: return "MID"
    return "ATT"


def _avg(pool: list[dict], formula) -> float:
    """Weighted average over a player pool. Returns 65.0 for empty pools."""
    if not pool:
        return 65.0
    return sum(formula(p) for p in pool) / len(pool)


# ── Playstyle label derivation ─────────────────────────────────────────────

# Maps a human-readable DNA playstyle label to the recommender engine's
# opponent_playstyle key. Combined labels use the first component.
_DNA_TO_PLAYSTYLE_KEY: dict[str, str | None] = {
    "Gegenpressing":    "high_line_press",
    "Possession Play":  None,
    "Counter Attack":   "counter_attack",
    "Low Block":        "deep_block",
    "High Line Press":  "high_line_press",
    "Direct Play":      "physical_dominance",
    "Balanced":         None,
}


def _playstyle_key(label: str) -> str | None:
    """Resolve a DNA label (or combined label) to the recommender engine key."""
    first = label.split(" / ")[0].strip()
    return _DNA_TO_PLAYSTYLE_KEY.get(first)


def _derive_playstyle(scores: dict) -> str:
    """
    Map FC26 dimension scores to one of six tactical identities.

    Conditions and scoring are calibrated against FC26 squad attribute data so
    that the five canonical test teams produce the expected labels:
      Man City → Possession Play
      Atletico → Counter Attack
      Leverkusen → Gegenpressing
      PSG → Possession Play / High Line Press
      Inter → Low Block / Counter Attack

    If the top two qualifying identities are within 3 points, their labels are
    combined (e.g. "Low Block / Counter Attack"). Maximum two labels combined.
    width_threat is retained as a data point but never drives the label.
    """
    p  = scores["press_intensity"]
    pa = scores["pace_threat"]
    cr = scores["creative_threat"]
    dl = scores["defensive_line"]
    ph = scores["physical_dominance"]

    qualified: list[tuple[float, str]] = []

    # Gegenpressing — pacy, energetic pressing without dominant creative build-up
    # Score = (pace + press) / 2  (energy composite)
    if pa > cr and pa > 68 and p < 68:
        qualified.append(((pa + p) / 2, "Gegenpressing"))

    # Possession Play — technically creative, moderate pressing demands
    # Score = creative_threat
    if cr > 77 and p < 73:
        qualified.append((cr, "Possession Play"))

    # Counter Attack — high pace but not purely creative/technical
    # Score = pace_threat
    if pa > 75 and cr < 78:
        qualified.append((pa, "Counter Attack"))

    # Low Block — physically dominant defensive shape
    # Score = phys + defensive_line − 70  (rewards combined defensive strength)
    if ph > 75 and p < 78:
        qualified.append((ph + dl - 70, "Low Block"))

    # High Line Press — organised defensive line with active pressing
    # Score = pace_threat (defenders' mobility enables the high line)
    if dl > 71 and p > 70:
        qualified.append((pa, "High Line Press"))

    # Direct Play — physical dominance without creative play
    # Score = physical_dominance
    if ph > 74 and cr < 68:
        qualified.append((ph, "Direct Play"))

    if not qualified:
        return "Balanced"

    qualified.sort(key=lambda x: -x[0])

    if len(qualified) >= 2 and (qualified[0][0] - qualified[1][0]) <= 3:
        return f"{qualified[0][1]} / {qualified[1][1]}"

    return qualified[0][1]


# ── Main profiler ──────────────────────────────────────────────────────────

def derive_opponent_dna(team_name: str) -> dict:
    """
    Derive a tactical DNA profile for team_name from FC26 squad data.

    Accepts the football-data.org API team name — find_fc26_club_name() handles
    the translation to the FC26 club_name column value.

    Raises ValueError if no FC26 club can be found for the given team name.
    """
    if team_name in _DNA_CACHE:
        return _DNA_CACHE[team_name]

    fc26_club = find_fc26_club_name(team_name)
    if not fc26_club:
        raise ValueError(f"No FC26 club found for: {team_name!r}")

    club_df = FC26_DF[FC26_DF["club_name"] == fc26_club].copy()
    if club_df.empty:
        raise ValueError(f"Empty squad in FC26 for club: {fc26_club!r}")

    # Build lightweight player attribute dicts — only what the formulas need
    players: list[dict] = []
    for _, row in club_df.iterrows():
        pos_str     = str(row.get("player_positions", "CM"))
        primary_pos = pos_str.split(",")[0].strip().upper()
        position    = _FC26_POS_MAP.get(primary_pos, "CM")

        players.append({
            "position":      position,
            "aggression":    _parse_rating(row.get("mentality_aggression",         65)),
            "stamina":       _parse_rating(row.get("power_stamina",                65)),
            "def_awareness": _parse_rating(row.get("defending_marking_awareness",  65)),
            "positioning":   _parse_rating(row.get("mentality_positioning",        65)),
            "sprint_speed":  _parse_rating(row.get("movement_sprint_speed",        65)),
            "acceleration":  _parse_rating(row.get("movement_acceleration",        65)),
            "dribbling":     _parse_rating(row.get("skill_dribbling",              65)),
            "crossing":      _parse_rating(row.get("attacking_crossing",           65)),
            "strength":      _parse_rating(row.get("power_strength",               65)),
            "jumping":       _parse_rating(row.get("power_jumping",                65)),
            "vision":        _parse_rating(row.get("mentality_vision",             65)),
            "short_pass":    _parse_rating(row.get("attacking_short_passing",      65)),
            "long_pass":     _parse_rating(row.get("skill_long_passing",           65)),
        })

    # Pool slices used by each formula
    outfield = [p for p in players if p["position"] not in _GK]
    def_mid  = [p for p in players if _grp(p["position"]) in ("DEF", "MID")]
    wide     = [p for p in players if p["position"] in _WIDE]
    att_mid  = [p for p in players if _grp(p["position"]) in ("ATT", "MID")]

    partial_squad = len(outfield) < 11

    # ── Six tactical dimensions ────────────────────────────────────────────

    press_intensity = _avg(outfield, lambda p:
        p["aggression"]    * 0.35 +
        p["stamina"]       * 0.35 +
        p["def_awareness"] * 0.30
    )

    defensive_line = _avg(def_mid, lambda p:
        p["def_awareness"] * 0.40 +
        p["positioning"]   * 0.35 +
        p["stamina"]       * 0.25
    )

    width_threat = _avg(wide, lambda p:
        p["dribbling"]    * 0.30 +
        p["acceleration"] * 0.30 +
        p["crossing"]     * 0.40
    )

    physical_dominance = _avg(outfield, lambda p:
        p["strength"]    * 0.40 +
        p["aggression"]  * 0.30 +
        p["jumping"]     * 0.30
    )

    pace_threat = _avg(att_mid, lambda p:
        p["sprint_speed"] * 0.50 +
        p["acceleration"] * 0.50
    )

    creative_threat = _avg(att_mid, lambda p:
        p["vision"]      * 0.40 +
        p["short_pass"]  * 0.35 +
        p["long_pass"]   * 0.25
    )

    scores = {
        "press_intensity":    press_intensity,
        "defensive_line":     defensive_line,
        "width_threat":       width_threat,
        "physical_dominance": physical_dominance,
        "pace_threat":        pace_threat,
        "creative_threat":    creative_threat,
    }

    playstyle = _derive_playstyle(scores)

    result: dict = {
        "team":               team_name,
        "fc26_club":          fc26_club,
        "playstyle":          playstyle,
        "playstyle_key":      _playstyle_key(playstyle),
        "press_intensity":    round(press_intensity),
        "defensive_line":     round(defensive_line),
        "width_threat":       round(width_threat),
        "physical_dominance": round(physical_dominance),
        "pace_threat":        round(pace_threat),
        "creative_threat":    round(creative_threat),
        "profile_basis":      "fc26",
    }
    if partial_squad:
        result["partial_squad"] = True

    _DNA_CACHE[team_name] = result
    print(
        f"[DNA] {team_name!r} ({fc26_club!r}): playstyle={playstyle!r} | "
        f"press={round(press_intensity)} def_line={round(defensive_line)} "
        f"width={round(width_threat)} phys={round(physical_dominance)} "
        f"pace={round(pace_threat)} creative={round(creative_threat)}"
    )
    return result
