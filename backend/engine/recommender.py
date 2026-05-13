# SubHub — Football Substitution Intelligence Engine
# Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
# Unauthorised copying, distribution, or use is strictly prohibited.
# See LICENSE file for full terms.
"""
Master Recommender — Full Tactical Intelligence Rewrite.

Every call is a fresh Crisis Meeting on the touchline.
No opinion memory — only physical constraints (who is off, how many subs remain).
Reasons like a top manager weighing every factor simultaneously.
"""
from .stamina_decay      import compute_stamina
from .playstyle_profiles import get_compatibility

# ── Position groups ────────────────────────────────────────────────────────────

STRICT_POSITION_GROUPS: dict[str, list[str]] = {
    "GK":  ["GK"],
    "DEF": ["CB", "LCB", "RCB", "LB", "RB", "LWB", "RWB"],
    "MID": ["CDM", "LDM", "RDM", "CM", "LCM", "RCM", "LM", "RM", "CAM", "LAM", "RAM"],
    "ATT": ["ST", "CF", "SS", "LW", "RW", "LS", "RS", "LF", "RF"],
}

# Kept for external callers that reference it
POSITION_GROUPS = STRICT_POSITION_GROUPS
ADJACENT: dict[str, list[str]] = {
    "GK":  ["GK"],
    "DEF": ["DEF", "MID"],
    "MID": ["MID", "DEF", "ATT"],
    "ATT": ["ATT", "MID"],
}


def _get_strict_group(pos: str) -> str:
    for g, slots in STRICT_POSITION_GROUPS.items():
        if pos in slots:
            return g
    return "MID"


# ── Position attribute weights ─────────────────────────────────────────────────

POSITION_ATTR_WEIGHTS: dict[str, list[tuple[str, float]]] = {
    # Attackers
    "ST":  [("shooting", 0.35), ("pace", 0.25), ("dribbling", 0.25), ("physic", 0.15)],
    "LS":  [("shooting", 0.35), ("pace", 0.25), ("dribbling", 0.25), ("physic", 0.15)],
    "RS":  [("shooting", 0.35), ("pace", 0.25), ("dribbling", 0.25), ("physic", 0.15)],
    "CF":  [("shooting", 0.30), ("dribbling", 0.30), ("pace", 0.25), ("physic", 0.15)],
    "SS":  [("shooting", 0.30), ("dribbling", 0.30), ("pace", 0.25), ("physic", 0.15)],
    "LW":  [("pace", 0.30), ("dribbling", 0.30), ("shooting", 0.25), ("passing", 0.15)],
    "RW":  [("pace", 0.30), ("dribbling", 0.30), ("shooting", 0.25), ("passing", 0.15)],
    "LF":  [("pace", 0.30), ("dribbling", 0.30), ("shooting", 0.25), ("passing", 0.15)],
    "RF":  [("pace", 0.30), ("dribbling", 0.30), ("shooting", 0.25), ("passing", 0.15)],
    # Attacking / central midfield
    "CAM": [("passing", 0.35), ("dribbling", 0.30), ("shooting", 0.20), ("pace", 0.15)],
    "LAM": [("passing", 0.35), ("dribbling", 0.30), ("shooting", 0.20), ("pace", 0.15)],
    "RAM": [("passing", 0.35), ("dribbling", 0.30), ("shooting", 0.20), ("pace", 0.15)],
    "CM":  [("passing", 0.35), ("dribbling", 0.25), ("physic", 0.20), ("defending", 0.20)],
    "LCM": [("passing", 0.35), ("dribbling", 0.25), ("physic", 0.20), ("defending", 0.20)],
    "RCM": [("passing", 0.35), ("dribbling", 0.25), ("physic", 0.20), ("defending", 0.20)],
    "LM":  [("pace", 0.25), ("passing", 0.30), ("dribbling", 0.30), ("physic", 0.15)],
    "RM":  [("pace", 0.25), ("passing", 0.30), ("dribbling", 0.30), ("physic", 0.15)],
    # Defensive midfield
    "CDM": [("defending", 0.40), ("physic", 0.25), ("passing", 0.25), ("pace", 0.10)],
    "LDM": [("defending", 0.40), ("physic", 0.25), ("passing", 0.25), ("pace", 0.10)],
    "RDM": [("defending", 0.40), ("physic", 0.25), ("passing", 0.25), ("pace", 0.10)],
    # Defenders
    "LWB": [("pace", 0.30), ("defending", 0.25), ("dribbling", 0.25), ("passing", 0.20)],
    "RWB": [("pace", 0.30), ("defending", 0.25), ("dribbling", 0.25), ("passing", 0.20)],
    "LB":  [("pace", 0.25), ("defending", 0.35), ("physic", 0.20), ("passing", 0.20)],
    "RB":  [("pace", 0.25), ("defending", 0.35), ("physic", 0.20), ("passing", 0.20)],
    "CB":  [("defending", 0.45), ("physic", 0.30), ("pace", 0.15), ("passing", 0.10)],
    "LCB": [("defending", 0.45), ("physic", 0.30), ("pace", 0.15), ("passing", 0.10)],
    "RCB": [("defending", 0.45), ("physic", 0.30), ("pace", 0.15), ("passing", 0.10)],
    # Goalkeeper
    "GK":  [
        ("goalkeeping_diving",      0.30),
        ("goalkeeping_handling",    0.25),
        ("goalkeeping_reflexes",    0.30),
        ("goalkeeping_positioning", 0.15),
    ],
}
_DEFAULT_WEIGHTS: list[tuple[str, float]] = [
    ("passing", 0.25), ("dribbling", 0.25), ("physic", 0.25), ("defending", 0.25),
]

# ── Playstyle attribute modifiers ──────────────────────────────────────────────

PLAYSTYLE_ATTR_MODS: dict[str, dict[str, float]] = {
    "high_press":       {"pace": 1.15, "physic": 1.10},
    "positional_play":  {"passing": 1.15, "dribbling": 1.10},
    "low_block":        {"defending": 1.15, "physic": 1.10},
    "counter_attack":   {"pace": 1.20, "shooting": 1.10},
    "direct_play":      {"physic": 1.15, "shooting": 1.10},
    "structured_press": {"physic": 1.15, "passing": 1.10},
}

# ── Playstyle fit attribute weights ────────────────────────────────────────────

PLAYSTYLE_FIT_WEIGHTS: dict[str, list[tuple[str, float]]] = {
    "high_press":       [("pace", 0.35), ("physic", 0.35), ("power_stamina", 0.30)],
    "positional_play":  [("passing", 0.40), ("dribbling", 0.35), ("mentality_composure", 0.25)],
    "low_block":        [("defending", 0.45), ("physic", 0.35), ("power_stamina", 0.20)],
    "counter_attack":   [("pace", 0.50), ("shooting", 0.30), ("dribbling", 0.20)],
    "direct_play":      [("physic", 0.40), ("shooting", 0.35), ("attacking_heading_accuracy", 0.25)],
    "structured_press": [("physic", 0.30), ("passing", 0.30), ("defending", 0.25), ("power_stamina", 0.15)],
}

# ── Delta thresholds by urgency mode ──────────────────────────────────────────

DELTA_THRESHOLDS: dict[str, float] = {
    "DESPERATION": 4.0,
    "CHASING":     7.0,
    "BALANCED":    8.0,
    "PROTECT":     7.0,
    "CONTROL":     9.0,
}

# ── FC26 positional column mapping ────────────────────────────────────────────

_SLOT_TO_FC26_COL: dict[str, str] = {
    "GK":  "gk",  "CB":  "cb",  "LCB": "lcb", "RCB": "rcb",
    "LB":  "lb",  "RB":  "rb",  "LWB": "lwb", "RWB": "rwb",
    "CDM": "cdm", "LDM": "ldm", "RDM": "rdm",
    "CM":  "cm",  "LCM": "lcm", "RCM": "rcm",
    "LM":  "lm",  "RM":  "rm",
    "CAM": "cam", "LAM": "lam", "RAM": "ram",
    "LW":  "lw",  "RW":  "rw",
    "ST":  "st",  "CF":  "cf",  "SS":  "ss",  "LS":  "ls",  "RS":  "rs",
}

# ── Playstyle name normalisation ───────────────────────────────────────────────

_PLAYSTYLE_ALIASES: dict[str, str] = {
    "high press":        "high_press",
    "high_press":        "high_press",
    "positional play":   "positional_play",
    "positional_play":   "positional_play",
    "low block":         "low_block",
    "low_block":         "low_block",
    "counter attack":    "counter_attack",
    "counter_attack":    "counter_attack",
    "direct play":       "direct_play",
    "direct_play":       "direct_play",
    "structured press":  "structured_press",
    "structured_press":  "structured_press",
}


def _normalize_playstyle(raw: str) -> str:
    return _PLAYSTYLE_ALIASES.get(raw.lower().strip(), "high_press")


# ── Knockout competition context ───────────────────────────────────────────────

KNOCKOUT_COMPETITIONS = [
    # Full display strings — must match what the frontend sends in the payload
    "Champions League", "Europa League", "Conference League",
    "FA Cup", "Carabao Cup", "Copa del Rey", "DFB Pokal", "Coppa Italia",
    "Coupe de France", "KNVB Cup", "Taça de Portugal",
    # Short codes kept for backwards compatibility with any direct API calls
    "UCL", "UEL", "UECL",
]

COMPETITION_TIER = {
    # Tier 1 — elite knockout, maximum aggression
    "UCL":                    1, "Champions League":       1,
    "UEFA Super Cup":         1,
    # Tier 2 — knockout cups, moderately aggressive
    "UEL":                    2, "Europa League":          2,
    "UECL":                   2, "Conference League":      2,
    "FA Cup":                 2, "Copa del Rey":           2,
    "DFB Pokal":              2, "Coppa Italia":           2,
    "Carabao Cup":            2, "Coupe de France":        2,
    "KNVB Cup":               2, "Taça de Portugal":       2,
    # Tier 3 — league and domestic super cups, baseline behaviour
    "Community Shield":       3, "Trophée des Champions":  3,
    "Supercopa de España":    3, "Supercoppa Italiana":    3,
    "DFL Super Cup":          3, "Johan Cruyff Shield":    3,
    "Supertaça":              3,
    "Premier League":         3, "La Liga":                3,
    "Bundesliga":             3, "Serie A":                3,
    "Ligue 1":                3, "Eredivisie":             3,
    "Primeira Liga":          3,
    # Tier 4 — friendly, most conservative
    "Friendly":               4,
}


# ── Core helpers ───────────────────────────────────────────────────────────────

def _attr(player: dict, key: str) -> float:
    """Safely extract a numeric FC26 attribute, defaulting to 65."""
    v = player.get(key)
    try:
        return float(v) if v is not None else 65.0
    except (TypeError, ValueError):
        return 65.0


def _get_slot(player: dict) -> str:
    """Resolve a player's current pitch slot."""
    return (
        player.get("assigned_slot")
        or player.get("position")
        or player.get("api_position")
        or "CM"
    )


def _availability_modifier(stamina_pct: float, minute: int) -> float:
    """
    Maps stamina 0-100 → availability modifier 0.70-1.0.
    Acts as a scaling multiplier on effective_rating — not the primary sub driver.
    After minute 75, fatigue is amplified (decay × 1.3): legs matter late.
    """
    decay       = 1.0 - (stamina_pct / 100.0)
    late_factor = 1.3 if minute >= 75 else 1.0
    return round(max(0.70, 1.0 - decay * late_factor * 0.30), 4)


def _base_positional_score(player: dict, position: str, playstyle: str) -> float:
    """
    Weighted FC26 attribute score for the given position + playstyle.
    A 95-rated player at 80% stamina is still worth more than a fresh 74-rated player.
    """
    weights = POSITION_ATTR_WEIGHTS.get(position, _DEFAULT_WEIGHTS)
    ps_mods = PLAYSTYLE_ATTR_MODS.get(playstyle, {})
    total   = 0.0
    for attr, w in weights:
        val    = _attr(player, attr) * ps_mods.get(attr, 1.0)
        total += val * w
    return round(total, 2)


def _playstyle_fit_score(player: dict, playstyle: str) -> float:
    """0-100 score for how well a player fits the playstyle."""
    weights = PLAYSTYLE_FIT_WEIGHTS.get(playstyle, [("physic", 0.5), ("passing", 0.5)])
    total   = sum(_attr(player, a) * w for a, w in weights)
    return round(min(100.0, total), 1)


def _urgency_fit(position: str, urgency_mode: str) -> float:
    """
    Position multiplier based on urgency — amplifies candidate_score for the right profiles.
    CHASING/DESPERATION rewards attackers; PROTECT/CONTROL rewards defenders.
    """
    group = _get_strict_group(position)
    if urgency_mode in ("DESPERATION", "CHASING"):
        if group == "ATT":
            return 1.8
        if position in ("CAM", "LAM", "RAM"):
            return 1.4
        if group == "DEF":
            return 0.6
    elif urgency_mode in ("PROTECT", "CONTROL"):
        if group == "DEF":
            return 1.8
        if position in ("CDM", "LDM", "RDM"):
            return 1.5
        if group == "ATT":
            return 0.7
    # BALANCED: reward clear quality upgrades regardless of position
    if urgency_mode == "BALANCED":
        if group == "ATT":
            return 1.2
        if group == "MID":
            return 1.15
        if group == "DEF":
            return 1.1
    return 1.0


def _position_compat_mult(
    player_pos: str, target_pos: str, urgency_mode: str
) -> float:
    """
    Returns a compatibility multiplier for a bench player filling a given slot.
      Direct match:   1.0
      Same group:     0.85
      Adjacent group: 0.65
      Incompatible:   0.3 (DESPERATION only) else 0.0
    GK is absolute — only GK covers GK, no other position ever.
    """
    if target_pos == "GK":
        return 1.0 if player_pos == "GK" else 0.0
    if player_pos == "GK":
        return 0.0

    pg = _get_strict_group(player_pos)
    tg = _get_strict_group(target_pos)

    if player_pos == target_pos:
        return 1.0
    if pg == tg:
        return 0.85
    if frozenset({pg, tg}) in (frozenset({"DEF", "MID"}), frozenset({"MID", "ATT"})):
        return 0.65
    # Completely incompatible (DEF ↔ ATT)
    return 0.3 if urgency_mode == "DESPERATION" else 0.0


# ── Urgency mode ───────────────────────────────────────────────────────────────

def _compute_urgency(team_score: int, opp_score: int, minute: int) -> str:
    """
    DESPERATION:  goal_diff <= -2 and <= 35 mins remaining
    CHASING:      goal_diff == -1, or <= -2 with time to recover,
                  OR level in the final 15' (must win = functionally behind)
    BALANCED:     level with time remaining
    PROTECT:      +1 and <= 20 mins remaining
    CONTROL:      +2 or more, or +1 with time to kill
    """
    goal_diff      = team_score - opp_score
    mins_remaining = 90 - minute

    if goal_diff <= -2 and mins_remaining <= 45:
        return "DESPERATION"
    if goal_diff < 0:
        return "CHASING"
    # draw from 60' onwards — a point is worthless if you need a win
    if goal_diff == 0 and mins_remaining <= 30:
        return "CHASING"
    if goal_diff == 0:
        return "BALANCED"
    if goal_diff == 1 and mins_remaining <= 20:
        return "PROTECT"
    return "CONTROL"


# ── Positional swap detection ──────────────────────────────────────────────────

def _detect_positional_swaps(
    on_pitch: list, urgency_mode: str, minute: int
) -> list:
    """
    Scan XI for beneficial FC26 positional swaps using per-position rating columns.
    Surfaces up to 2 swaps where combined effectiveness gain > 8%
    and both players rate >= 60 in the new position.
    Never swaps GK or moves CB to ST, etc.
    """
    players = [p for p in on_pitch if _get_slot(p) != "GK"]
    swaps: list[dict] = []

    for i in range(len(players)):
        for j in range(i + 1, len(players)):
            a      = players[i]
            b      = players[j]
            slot_a = _get_slot(a)
            slot_b = _get_slot(b)
            col_a  = _SLOT_TO_FC26_COL.get(slot_a)
            col_b  = _SLOT_TO_FC26_COL.get(slot_b)

            if not col_a or not col_b or col_a == col_b:
                continue

            # Suppress swaps that don't make footballing sense
            ga = _get_strict_group(slot_a)
            gb = _get_strict_group(slot_b)
            if frozenset({ga, gb}) == frozenset({"DEF", "ATT"}):
                continue  # never CB ↔ ST

            a_in_a = float(a.get(col_a) or 0)
            a_in_b = float(a.get(col_b) or 0)
            b_in_b = float(b.get(col_b) or 0)
            b_in_a = float(b.get(col_a) or 0)

            if a_in_a == 0 and b_in_b == 0:
                continue

            current = a_in_a + b_in_b
            swapped = a_in_b + b_in_a
            if current == 0:
                continue

            gain_pct = (swapped - current) / current * 100.0

            if gain_pct > 8.0 and a_in_b >= 60.0 and b_in_a >= 60.0:
                a_name = a.get("name", "?")
                b_name = b.get("name", "?")
                swaps.append({
                    "type": "positional_swap",
                    "player_a": {
                        "name":             a_name,
                        "current_position": slot_a,
                        "swap_to":          slot_b,
                        "rating_now":       int(a_in_a),
                        "rating_after":     int(a_in_b),
                        # legacy aliases
                        "current_slot":     slot_a,
                        "new_slot":         slot_b,
                    },
                    "player_b": {
                        "name":             b_name,
                        "current_position": slot_b,
                        "swap_to":          slot_a,
                        "rating_now":       int(b_in_b),
                        "rating_after":     int(b_in_a),
                        "current_slot":     slot_b,
                        "new_slot":         slot_a,
                    },
                    "gain_pct":   round(gain_pct, 1),
                    "gain":       int(swapped - current),
                    "confidence": "HIGH" if gain_pct >= 12.0 else "MEDIUM",
                    "reasoning":  (
                        f"{a_name.split()[-1]} ({slot_a}→{slot_b}, "
                        f"{'+' if a_in_b >= a_in_a else ''}{int(a_in_b - a_in_a)}) & "
                        f"{b_name.split()[-1]} ({slot_b}→{slot_a}, "
                        f"{'+' if b_in_a >= b_in_b else ''}{int(b_in_a - b_in_b)}) "
                        f"— combined positional gain {gain_pct:+.1f}%"
                    ),
                })

    swaps.sort(key=lambda s: s["gain_pct"], reverse=True)
    return swaps[:2]


# ── Reasoning builder ──────────────────────────────────────────────────────────

def _build_reasoning(
    starter:         dict,
    starter_eff:     float,
    bench_player:    dict,
    candidate_score: float,
    delta:           float,
    playstyle_fit:   float,
    urgency_mode:    str,
    minute:          int,
    playstyle:       str,
    below_threshold: bool,
) -> str:
    starter_last = (starter.get("name") or "?").split()[-1]
    bench_last   = (bench_player.get("name") or "?").split()[-1]
    slot         = _get_slot(starter)
    stamina      = starter.get("stamina_pct", 100)
    ps_display   = playstyle.replace("_", " ").title()

    urgency_phrases = {
        "DESPERATION": "DESPERATE — urgency demands action",
        "CHASING":     "chasing — need an upgrade now",
        "BALANCED":    "level — tactical upgrade available",
        "PROTECT":     "protecting lead — reinforcing the block",
        "CONTROL":     "in control — optimising quality",
    }
    phrase = urgency_phrases.get(urgency_mode, urgency_mode)

    # Stamina is supporting context only — include it if below 70%
    stamina_note = (
        f" {starter_last} also at {stamina:.0f}% stamina — fresh legs reinforce the case."
        if stamina < 70 else ""
    )

    if below_threshold:
        return (
            f"{minute}' | {urgency_mode} | {phrase.upper()} — best available despite thin margin. "
            f"{bench_last} scores {candidate_score:.1f} vs {starter_last}'s {starter_eff:.1f} "
            f"({delta:+.1f} delta). Playstyle fit: {playstyle_fit:.0f}/100 for {ps_display}. "
            f"Below normal threshold but {urgency_mode} demands action.{stamina_note}"
        )

    closing = (
        "Urgency demands the upgrade."
        if urgency_mode in ("DESPERATION", "CHASING")
        else "Tactical upgrade is clear."
    )
    return (
        f"{minute}' | {phrase.upper()} | "
        f"{bench_last} scores {candidate_score:.1f} vs {starter_last} ({slot}) "
        f"at {starter_eff:.1f} — {delta:+.1f} delta. "
        f"Playstyle fit: {playstyle_fit:.0f}/100 for {ps_display}. "
        f"{closing}{stamina_note}"
    )


# ── PK recommendations ────────────────────────────────────────────────────────

def _generate_pk_recommendations(
    on_pitch:        list,
    bench_available: list,
    playstyle:       str,
    subs_remaining:  int = 5,
) -> list:
    """
    Penalty-shootout substitution intelligence.
    1. Check if a specialist GK on the bench outscores the current GK on PK-save metrics.
    2. Check if any bench outfield player is a stronger PK taker than the weakest on-pitch outfielder.
    3. Fall back to bench_alert when no swap clears the threshold.
    """
    recommendations: list[dict] = []

    # ── GK PK-save score ─────────────────────────────────────────────────
    def gk_pk_score(gk: dict) -> float:
        return (
            _attr(gk, "goalkeeping_reflexes")    * 0.35 +
            _attr(gk, "goalkeeping_diving")      * 0.30 +
            _attr(gk, "goalkeeping_positioning") * 0.20 +
            _attr(gk, "goalkeeping_handling")    * 0.15
        )

    current_gk = next(
        (p for p in on_pitch if (_get_slot(p) or "").upper() == "GK"), None
    )
    bench_gks  = [
        bp for bp in bench_available
        if (bp.get("position") or bp.get("api_position") or "").upper() == "GK"
    ]

    if current_gk and bench_gks:
        curr_score = gk_pk_score(current_gk)
        best_gk    = max(bench_gks, key=gk_pk_score)
        best_score = gk_pk_score(best_gk)
        if best_score > curr_score + 3.0:
            delta = round(best_score - curr_score, 1)
            recommendations.append({
                "type": "substitution",
                "rank": 1,
                "sub_off": {
                    "id":               current_gk.get("id") or current_gk.get("name"),
                    "name":             current_gk.get("name", ""),
                    "position":         "GK",
                    "effective_rating": round(curr_score, 1),
                    "stamina_pct":      current_gk.get("stamina_pct", 100),
                    "slot":             "GK",
                    "stamina_status":   "OK",
                    "press_reliability": 0,
                    "press_flag":       None,
                    "reasons":          ["PK save score upgrade available"],
                },
                "sub_on": {
                    "id":              best_gk.get("id") or best_gk.get("name"),
                    "name":            best_gk.get("name", ""),
                    "position":        "GK",
                    "candidate_score": round(best_score, 1),
                    "delta":           delta,
                    "playstyle_fit":   0,
                    "slot":            "GK",
                    "overall":         best_gk.get("overall", 70),
                    "tactical_profile": "PK specialist",
                    "key_upgrade":     f"+{delta} PK save score",
                    "impact_score":    round(best_score * 0.85, 1),
                    "fc26_found":      bool(best_gk.get("goalkeeping_reflexes")),
                },
                "confidence":       min(99, int(50 + delta * 4)),
                "below_threshold":  False,
                "stamina_override": False,
                "best_available":   False,
                "reasoning": (
                    f"PENALTIES | {best_gk.get('name','?').split()[-1]} PK save score "
                    f"{best_score:.1f} vs {current_gk.get('name','?').split()[-1]} "
                    f"{curr_score:.1f} — stronger shot-stopper for the shootout (+{delta})."
                ),
                "compatibility":  "direct",
                "upgrade_delta":  {
                    "upgrade_score": delta, "key_upgrade": "PK save ability",
                    "verdict": "PK upgrade", "verdict_color": "green",
                    "upgrade_count": 1, "total_attrs": 1, "comparisons": [],
                },
                "monte_carlo": {
                    "confidence_label":      "HIGH",
                    "win_probability_delta": round(delta * 0.8, 1),
                },
                "timing_advice": "⚡ Sub GK before PKs start",
                "game_context":  "PENALTIES",
            })

    # ── Penalty taker swap ────────────────────────────────────────────────
    def pk_taker_score(p: dict) -> float:
        return (
            _attr(p, "attacking_finishing") * 0.40 +
            _attr(p, "mentality_composure") * 0.35 +
            _attr(p, "shooting")            * 0.15 +
            _attr(p, "power_long_shots")    * 0.10
        )

    already_flagged_names = {r["sub_on"]["name"] for r in recommendations if r["type"] == "substitution"}
    # subs consumed by GK rec (if any)
    gk_sub_used = 1 if any(r["type"] == "substitution" for r in recommendations) else 0
    subs_for_taker = subs_remaining - gk_sub_used

    pitch_outfield = [p for p in on_pitch if (_get_slot(p) or "").upper() != "GK"]
    bench_outfield = [bp for bp in bench_available
                      if bp.get("name") not in already_flagged_names
                      and (bp.get("position") or bp.get("api_position") or "").upper() != "GK"]

    taker_sub_emitted = False
    if subs_for_taker > 0 and pitch_outfield and bench_outfield:
        worst_pitch  = min(pitch_outfield, key=pk_taker_score)
        best_bench   = max(bench_outfield, key=pk_taker_score)
        pitch_score  = pk_taker_score(worst_pitch)
        bench_score  = pk_taker_score(best_bench)
        delta        = round(bench_score - pitch_score, 1)

        if delta > 5.0:
            taker_sub_emitted = True
            wp_name = worst_pitch.get("name", "?")
            bb_name = best_bench.get("name", "?")
            recommendations.append({
                "type": "substitution",
                "rank": len(recommendations) + 1,
                "sub_off": {
                    "id":               worst_pitch.get("id") or wp_name,
                    "name":             wp_name,
                    "position":         worst_pitch.get("position") or worst_pitch.get("api_position", ""),
                    "effective_rating": round(pitch_score, 1),
                    "stamina_pct":      worst_pitch.get("stamina_pct", 100),
                    "slot":             _get_slot(worst_pitch),
                    "stamina_status":   "OK",
                    "press_reliability": 0,
                    "press_flag":       None,
                    "reasons":          ["Weaker PK taker"],
                },
                "sub_on": {
                    "id":              best_bench.get("id") or bb_name,
                    "name":            bb_name,
                    "position":        best_bench.get("position") or best_bench.get("api_position", ""),
                    "candidate_score": round(bench_score, 1),
                    "delta":           delta,
                    "playstyle_fit":   0,
                    "slot":            _get_slot(worst_pitch),
                    "overall":         best_bench.get("overall", 70),
                    "tactical_profile": "PK specialist",
                    "key_upgrade":     f"+{delta} PK taker score",
                    "impact_score":    round(bench_score * 0.85, 1),
                    "fc26_found":      bool(best_bench.get("attacking_finishing")),
                },
                "confidence":       min(99, int(50 + delta * 3)),
                "below_threshold":  False,
                "stamina_override": False,
                "best_available":   False,
                "reasoning": (
                    f"PENALTIES | {bb_name.split()[-1]} PK score {bench_score:.0f} vs "
                    f"{wp_name.split()[-1]} {pitch_score:.0f} — stronger penalty taker (+{delta})"
                ),
                "compatibility":  "direct",
                "upgrade_delta":  {
                    "upgrade_score": delta, "key_upgrade": "PK taker ability",
                    "verdict": "PK upgrade", "verdict_color": "green",
                    "upgrade_count": 1, "total_attrs": 1, "comparisons": [],
                },
                "monte_carlo": {
                    "confidence_label":      "HIGH" if delta > 10 else "MEDIUM",
                    "win_probability_delta": round(delta * 0.5, 1),
                },
                "timing_advice": "⚡ Sub before shootout begins",
                "game_context":  "PENALTIES",
            })

    # ── Bench alert fallback — heads-up even when no swap fires ──────────
    if not taker_sub_emitted and bench_outfield:
        alert_pool = sorted(bench_outfield, key=pk_taker_score, reverse=True)[:2]
        for bp in alert_pool:
            score = pk_taker_score(bp)
            if score >= 72.0:
                recommendations.append({
                    "type": "bench_alert",
                    "player": {
                        "name":     bp.get("name", ""),
                        "position": bp.get("position") or bp.get("api_position", ""),
                        "overall":  bp.get("overall", 70),
                    },
                    "reasoning": (
                        f"PENALTIES | {bp.get('name','?').split()[-1]} is a strong penalty taker "
                        f"(score {score:.0f}). Consider deploying before the shootout."
                    ),
                })

    if not recommendations:
        recommendations.append({
            "type":                 "hold",
            "best_delta_available": None,
            "reasoning": (
                "PENALTIES | No clear upgrades on the bench. "
                "Hold lineup — focus on penalty order from existing squad."
            ),
        })

    return recommendations


# ── Main entry point ───────────────────────────────────────────────────────────

def get_recommendations(
    # ── New canonical params ───────────────────────────────────────────────
    on_pitch:            list | None = None,
    bench_available:     list | None = None,
    subbed_off:          list | None = None,
    current_minute:      int         = 60,
    current_score_home:  int         = 0,
    current_score_away:  int         = 0,
    is_home:             bool        = True,
    subs_remaining:      int         = 5,
    formation:           str         = "4-3-3",
    playstyle:           str         = "high_press",
    competition:         str         = "",
    pk_mode:             bool        = False,
    straight_to_pks:     bool        = False,
    # ── Legacy params (backwards compat with old callers) ─────────────────
    starting_xi:         list | None = None,
    bench:               list | None = None,
    home_score:          int         = 0,
    away_score:          int         = 0,
    minute:              int         = 0,
    manager_intent:      str         = "",
    injured_players:     list | None = None,
    applied_subs:        list | None = None,
    **_,
) -> dict:
    """
    Crisis Meeting engine. Every call is a fresh absolute-state read.
    Returns urgency_mode + mixed recommendations (substitution / positional_swap / hold).

    Accepts both new (on_pitch/bench_available) and legacy (starting_xi/bench) keys.
    """
    # ── Resolve new vs legacy params ──────────────────────────────────────
    on_pitch        = on_pitch   or starting_xi  or []
    bench_available = bench_available or bench   or []
    subbed_off      = subbed_off or applied_subs or []
    current_minute  = current_minute or minute   or 60
    if not current_score_home and home_score:
        current_score_home = home_score
    if not current_score_away and away_score:
        current_score_away = away_score
    if subs_remaining <= 0 and not applied_subs:
        subs_remaining = 5

    playstyle = _normalize_playstyle(str(playstyle))

    # ── PK mode: bypass normal engine, return PK-specific recommendations ─
    if pk_mode:
        pk_recs = _generate_pk_recommendations(
            on_pitch        = on_pitch or [],
            bench_available = bench_available or [],
            playstyle       = playstyle,
            subs_remaining  = subs_remaining,
        )
        ps_compat = get_compatibility(playstyle, formation)
        return {
            "urgency_mode":    "PENALTIES",
            "recommendations": pk_recs,
            "grouped_window":  None,
            "game_state":      _legacy_game_state("DESPERATION", 0.0),
            "compatibility":   ps_compat,
            "conflict_warning": None,
            "playstyle":       playstyle,
            "formation":       formation,
            "minute":          current_minute,
        }

    # ── STEP 1: Hard constraints ──────────────────────────────────────────
    subbed_off_set = {str(s).lower() for s in (subbed_off or [])}

    team_score = current_score_home if is_home else current_score_away
    opp_score  = current_score_away if is_home else current_score_home

    if subs_remaining <= 0:
        urgency = _compute_urgency(team_score, opp_score, current_minute)
        return {
            "urgency_mode":    urgency,
            "recommendations": [{
                "type":                 "hold",
                "best_delta_available": None,
                "reasoning":            "No subs remaining — hold all positions.",
            }],
            "game_state":   _legacy_game_state(urgency, 0.0),
            "compatibility": get_compatibility(playstyle, formation),
            "conflict_warning": None,
            "playstyle":    playstyle,
            "formation":    formation,
            "minute":       current_minute,
        }

    # ── STEP 2: Urgency mode + delta threshold ────────────────────────────
    urgency_mode = _compute_urgency(team_score, opp_score, current_minute)

    goal_diff      = team_score - opp_score
    mins_remaining = 90 - current_minute
    knockout_override_note = ""

    # ET urgency override — in extra time every goal changes fate
    if current_minute > 90:
        if goal_diff <= 0:
            urgency_mode = "DESPERATION"  # Losing or level in ET = must score
            knockout_override_note = "Extra time — must score or face penalties."
        else:
            urgency_mode = "PROTECT"      # Winning in ET = hold the lead
            knockout_override_note = "Extra time — protect the lead to survive."
    # straight-to-PKs urgency — regular time but PKs loom at the end
    elif straight_to_pks and goal_diff == 0:
        if mins_remaining <= 20:
            urgency_mode = "DESPERATION"
            knockout_override_note = "Straight to PKs — level with ≤20 mins left, must find a goal."
        elif mins_remaining <= 35:
            urgency_mode = "CHASING"
            knockout_override_note = "Straight to PKs — level game, push for a winner before the shootout."
    # Standard knockout competition context (draw near end of 90 mins)
    elif competition in KNOCKOUT_COMPETITIONS and goal_diff == 0 and mins_remaining <= 20:
        urgency_mode = "DESPERATION"
        knockout_override_note = (
            "Knockout competition — draw leads to extra time. Must find a winner."
        )
    # Override 4 — losing in a knockout competition, late in the game
    if competition in KNOCKOUT_COMPETITIONS and goal_diff < 0:
        if mins_remaining <= 20:
            urgency_mode = "DESPERATION"
            knockout_override_note = "Knockout — losing with ≤20 mins left. Must score."
        elif mins_remaining <= 35:
            if urgency_mode != "DESPERATION":
                urgency_mode = "CHASING"
                knockout_override_note = "Knockout — losing, push for an equaliser."

    threshold = DELTA_THRESHOLDS[urgency_mode]
    # Before 55': hard skip for non-emergency urgency modes — no sub at all
    # (threshold raise alone is insufficient; a 45' CB recommendation must never fire)
    # NOTE: applied per-starter inside the loop via early_sub_block flag below
    early_sub_block = current_minute < 55 and urgency_mode not in ("DESPERATION", "CHASING")
    # Before 60': raise bar by 5 (don't waste subs early) unless desperate
    if current_minute < 60 and urgency_mode != "DESPERATION":
        threshold += 5.0

    # FIX 2: Threshold decay by minute — late game lowers bar, legs matter
    if current_minute >= 75:
        threshold *= 0.70
    elif current_minute >= 60:
        threshold *= 0.85

    # FIX 4: Unused subs pressure — manager with 3 unused at 75' is wasting resources
    if current_minute >= 80 and subs_remaining >= 2:
        threshold *= 0.70
    elif current_minute >= 70 and subs_remaining >= 3:
        threshold *= 0.75

    # Competition tier multiplier — higher stakes = lower bar to recommend
    tier = COMPETITION_TIER.get(competition, 3)
    if tier == 1:
        threshold *= 0.75   # UCL/Super Cup — most aggressive
    elif tier == 2:
        threshold *= 0.85   # domestic cups/UEL/UECL — moderately aggressive
    elif tier == 4:
        threshold *= 1.30   # Friendly — most conservative
    # tier 3 (league + domestic super cups) = no change, baseline behaviour

    # ── STEP 3 + 4: Enrich on-pitch players ──────────────────────────────
    enriched_xi: list[dict] = []
    for p in on_pitch:
        name_key = (p.get("name") or "").lower()
        if name_key in subbed_off_set:
            continue

        minutes_played = max(0, current_minute - int(p.get("minute_entered", 0)))
        stamina_pct = p.get("stamina_pct")
        if stamina_pct is None:
            try:
                res = compute_stamina(
                    player_name=p.get("name", ""),
                    position=_get_slot(p),
                    minutes_played=minutes_played,
                )
                stamina_pct = res["stamina_pct"]
            except Exception:
                stamina_pct = max(0.0, 100.0 - minutes_played * 0.45)

        stamina_pct = float(stamina_pct)
        slot        = _get_slot(p)
        avail       = _availability_modifier(stamina_pct, minutes_played)
        base_ps     = _base_positional_score(p, slot, playstyle)
        eff_rat     = round(base_ps * avail, 2)

        enriched_xi.append({
            **p,
            "stamina_pct":      round(stamina_pct, 1),
            "availability_mod": avail,
            "effective_rating": eff_rat,
            "_slot":            slot,
        })

    # ── STEP 5: Eligible bench ────────────────────────────────────────────
    eligible_bench = [
        bp for bp in bench_available
        if (bp.get("name") or "").lower() not in subbed_off_set
    ]

    # ── STEP 6 + 7: Find best sub per starter ─────────────────────────────
    # Worst effective_rating first → most likely candidates for sub-off
    sorted_xi = sorted(enriched_xi, key=lambda p: p["effective_rating"])

    # Top 3 by effective_rating = starters we protect (need delta >= 20 to touch)
    top3_names = {
        p["name"]
        for p in sorted(enriched_xi, key=lambda p: p["effective_rating"], reverse=True)[:3]
    }

    recommendations: list[dict] = []
    used_bench_names: set[str]  = set()

    for starter in sorted_xi:
        if len([r for r in recommendations if r["type"] == "substitution"]) >= 3:
            break

        slot  = starter["_slot"]
        group = _get_strict_group(slot)

        # Never sub GK
        if slot == "GK":
            continue

        # Hard early-sub block: skip entirely before 55' unless DESPERATION or CHASING
        if early_sub_block:
            continue

        # Threshold per starter: top-3 need delta >= 20 to touch
        effective_threshold = 20.0 if starter.get("name") in top3_names else threshold

        # Attacking subs while chasing: deprioritise subbing defenders
        # unless they are the clear weakest link by > 15 pts
        if urgency_mode in ("CHASING", "DESPERATION") and group == "DEF":
            worst_non_def = min(
                (p["effective_rating"]
                 for p in enriched_xi
                 if _get_strict_group(p["_slot"]) not in ("DEF", "GK")),
                default=9999.0,
            )
            if starter["effective_rating"] > (worst_non_def - 15):
                continue

        # Protecting lead: deprioritise subbing defenders while winning
        # unless they are the clear weakest player AND running on fumes
        if urgency_mode in ("PROTECT", "CONTROL") and group == "DEF":
            worst_non_def = min(
                (p["effective_rating"]
                 for p in enriched_xi
                 if _get_strict_group(p["_slot"]) not in ("DEF", "GK")),
                default=9999.0,
            )
            if starter["effective_rating"] > (worst_non_def - 15):
                continue
            if starter["stamina_pct"] >= 55:
                continue

        # Find best bench candidate for this starter's slot
        best_candidate = None
        best_score     = -9999.0

        for bp in eligible_bench:
            if (bp.get("name") or "") in used_bench_names:
                continue

            bp_pos  = bp.get("position") or bp.get("api_position") or "CM"
            compat  = _position_compat_mult(bp_pos, slot, urgency_mode)
            if compat == 0.0:
                continue

            base       = _base_positional_score(bp, slot, playstyle)
            urg_fit    = _urgency_fit(bp_pos, urgency_mode)
            cand_score = base * compat * urg_fit

            if cand_score > best_score:
                best_score     = cand_score
                best_candidate = {
                    "player":      bp,
                    "cand_score":  round(cand_score, 2),
                    "ps_fit":      round(_playstyle_fit_score(bp, playstyle), 1),
                    "compat_mult": compat,
                    "delta":       round(cand_score - starter["effective_rating"], 2),
                }

        if not best_candidate:
            continue

        delta             = best_candidate["delta"]
        below_threshold   = False
        stamina_override  = False

        if delta < effective_threshold:
            # FIX 3: Stamina floor override — player must be genuinely exhausted AND
            # a real quality upgrade must exist. Tired with no upgrade = hold.
            if starter["stamina_pct"] < 55 and delta >= 8:
                stamina_override = True
            elif urgency_mode == "DESPERATION" and delta >= 0:
                below_threshold = True
            else:
                continue

        # Don't sub a very fresh, high-quality player for marginal gain
        # (stamina_override bypasses this — the player is NOT fresh)
        if not stamina_override and starter["availability_mod"] > 0.92 and delta < 15 and urgency_mode != "DESPERATION":
            continue

        bp       = best_candidate["player"]
        bp_pos   = bp.get("position") or bp.get("api_position") or "CM"
        ps_fit   = best_candidate["ps_fit"]
        cand_s   = best_candidate["cand_score"]

        used_bench_names.add(bp.get("name", ""))

        # Confidence: starts at 50, +delta contribution, +ps_fit contribution
        confidence = int(min(99, max(10, 50 + delta * 2.0 + (ps_fit - 65) * 0.5)))
        conf_label = "HIGH" if confidence >= 70 else "MEDIUM" if confidence >= 50 else "LOW"

        reasoning = _build_reasoning(
            starter         = starter,
            starter_eff     = starter["effective_rating"],
            bench_player    = bp,
            candidate_score = cand_s,
            delta           = delta,
            playstyle_fit   = ps_fit,
            urgency_mode    = urgency_mode,
            minute          = current_minute,
            playstyle       = playstyle,
            below_threshold = below_threshold,
        )
        if stamina_override:
            ps_display_local = playstyle.replace("_", " ").title()
            reasoning = (
                f"{current_minute}' | {urgency_mode} | "
                f"{bp.get('name', '?').split()[-1]} scores {cand_s:.1f} vs "
                f"{starter.get('name', '?').split()[-1]} at {starter['effective_rating']:.1f} "
                f"({delta:+.1f} delta). "
                f"Playstyle fit: {ps_fit:.0f}/100 for {ps_display_local}. "
                f"{starter.get('name', '?').split()[-1]} at {starter['stamina_pct']:.0f}% stamina "
                f"— fresh legs reinforce the case."
            )
        if knockout_override_note:
            reasoning += f" {knockout_override_note}"

        sub_rank = len([r for r in recommendations if r["type"] == "substitution"]) + 1

        recommendations.append({
            "type": "substitution",
            "rank": sub_rank,
            # ── Core fields ────────────────────────────────────────────
            "sub_off": {
                "id":               starter.get("id") or starter.get("name"),
                "name":             starter.get("name", ""),
                "position":         slot,
                "effective_rating": starter["effective_rating"],
                "stamina_pct":      starter["stamina_pct"],
                # Legacy compat
                "slot":             slot,
                "stamina_status":   "LOW" if starter["stamina_pct"] < 60 else "OK",
                "press_reliability": round(ps_fit, 1),
                "press_flag":       None,
                "reasons":          [f"Effective rating {starter['effective_rating']:.1f}"],
            },
            "sub_on": {
                "id":              bp.get("id") or bp.get("name"),
                "name":            bp.get("name", ""),
                "position":        bp_pos,
                "candidate_score": cand_s,
                "delta":           round(delta, 2),
                "playstyle_fit":   ps_fit,
                # Legacy compat
                "slot":            slot,
                "overall":         bp.get("overall", 70),
                "tactical_profile": bp.get("tactical_profile", ""),
                "key_upgrade":     f"{delta:+.1f} effective rating at {slot}",
                "impact_score":    float(bp.get("overall", 70)) * 0.85,
                "fc26_found":      bool(bp.get("pace") or bp.get("goalkeeping_diving")),
            },
            "confidence":       confidence,
            "below_threshold":  below_threshold,
            "stamina_override": stamina_override,
            "best_available":   below_threshold,
            "reasoning":        reasoning,
            # Legacy compat
            "compatibility": "direct" if best_candidate["compat_mult"] >= 1.0 else "safe",
            "upgrade_delta": {
                "upgrade_score": round(delta, 2),
                "key_upgrade":   f"{delta:+.1f} pts",
                "verdict":       "Clear upgrade" if delta >= threshold else "Marginal",
                "verdict_color": "green" if delta >= threshold else "amber",
                "upgrade_count": 1 if delta > 0 else 0,
                "total_attrs":   1,
                "comparisons":   [],
            },
            "monte_carlo": {
                "confidence_label":    conf_label,
                "win_probability_delta": round(delta * 0.4, 1),
            },
            "timing_advice": (
                "⚡ Sub now — urgency is high"
                if urgency_mode in ("DESPERATION", "CHASING")
                else "⏱ Consider sub soon"
            ),
            "game_context": urgency_mode,
        })

    # ── FIX 5: Bench quality flag — surface idle high-impact players ──────
    recommended_on_names = {
        r["sub_on"]["name"] for r in recommendations if r["type"] == "substitution"
    }
    for bp in eligible_bench:
        bp_name = bp.get("name") or ""
        if bp_name in used_bench_names or bp_name in recommended_on_names:
            continue
        bp_pos     = bp.get("position") or bp.get("api_position") or "CM"
        nat_score  = _base_positional_score(bp, bp_pos, playstyle)
        if nat_score > 82:
            recommendations.append({
                "type": "bench_alert",
                "player": {
                    "name":     bp_name,
                    "position": bp_pos,
                    "overall":  bp.get("overall", 70),
                },
                "reasoning": (
                    f"High-impact player unused (score {nat_score:.1f}). "
                    f"Consider deploying before 85'."
                ),
            })

    # ── FIX 7: Grouped sub window ──────────────────────────────────────────
    clear_subs = [
        r for r in recommendations
        if r["type"] == "substitution"
        and not r.get("below_threshold")
        and not r.get("stamina_override")
    ]
    grouped_window: dict | None = None
    if urgency_mode in ("CHASING", "DESPERATION") and subs_remaining >= 2 and len(clear_subs) >= 2:
        count = min(len(clear_subs), 3)
        grouped_window = {
            "suggested_count": count,
            "reasoning": (
                "Make both changes simultaneously to maximise impact "
                "and minimise disruption."
            ),
            "player_ids": [r["sub_off"]["id"] for r in clear_subs[:count]],
        }

    # ── STEP 8: Positional swap check ─────────────────────────────────────
    swaps = _detect_positional_swaps(enriched_xi, urgency_mode, current_minute)
    slots_addressed = {r["sub_off"]["position"] for r in recommendations if r["type"] == "substitution"}
    for swap in swaps:
        if swap["player_a"]["current_position"] not in slots_addressed:
            recommendations.append(swap)

    # ── STEP 9: Hold logic ─────────────────────────────────────────────────
    has_subs = any(r["type"] == "substitution" for r in recommendations)
    if not has_subs:
        best_delta_overall: float | None = None
        for starter in enriched_xi:
            if _get_slot(starter) == "GK":
                continue
            for bp in eligible_bench:
                compat = _position_compat_mult(
                    bp.get("position") or bp.get("api_position") or "CM",
                    _get_slot(starter),
                    urgency_mode,
                )
                if compat == 0.0:
                    continue
                base = _base_positional_score(bp, _get_slot(starter), playstyle)
                d    = base * compat - starter["effective_rating"]
                if best_delta_overall is None or d > best_delta_overall:
                    best_delta_overall = d

        bd  = best_delta_overall
        msg = (
            f"Best available delta {bd:.1f} pts does not clear "
            f"the {threshold:.0f}-pt threshold."
            if bd is not None
            else "No compatible bench players available."
        )
        if urgency_mode == "BALANCED" and team_score <= opp_score:
            msg += " Going behind would trigger CHASING urgency override."

        recommendations.append({
            "type":                 "hold",
            "best_delta_available": round(bd, 2) if bd is not None else None,
            "reasoning":            (
                f"{current_minute}' | {urgency_mode} | No sub clears the quality bar. "
                f"{msg} Hold and reassess."
            ),
        })

    # ── STEP 10: Assemble response ─────────────────────────────────────────
    ps_compat = get_compatibility(playstyle, formation)

    return {
        "urgency_mode":    urgency_mode,
        "recommendations": recommendations,
        "grouped_window":  grouped_window,
        # Legacy fields — kept for any callers that still read them
        "game_state":      _legacy_game_state(urgency_mode, threshold),
        "compatibility":   ps_compat,
        "conflict_warning": (
            {
                "message":                  f"{playstyle} + {formation} is a poor tactical match ({ps_compat['score']}/100)",
                "reason":                   ps_compat["reason"],
                "recommended_formation":    ps_compat["recommended_formation"],
                "win_probability_modifier": ps_compat["win_probability_modifier"],
            }
            if ps_compat.get("is_conflict") else None
        ),
        "playstyle":  playstyle,
        "formation":  formation,
        "minute":     current_minute,
    }


def _legacy_game_state(urgency_mode: str, threshold: float) -> dict:
    """Synthesise a legacy game_state dict for callers that still read it."""
    preferred = {
        "CHASING":     ["ST", "LW", "RW", "CAM"],
        "DESPERATION": ["ST", "LW", "RW", "CAM", "CF"],
        "PROTECT":     ["CB", "CDM", "LB", "RB"],
        "CONTROL":     ["CB", "CDM"],
        "BALANCED":    [],
    }.get(urgency_mode, [])
    avoided = {
        "PROTECT":  ["LW", "RW", "ST"],
        "CONTROL":  ["LW", "RW"],
    }.get(urgency_mode, [])
    return {
        "tactical_need":        urgency_mode.lower(),
        "tactical_description": urgency_mode,
        "preferred_positions":  preferred,
        "avoid_positions":      avoided,
        "urgency_threshold":    threshold,
        "att_allowed":          urgency_mode not in ("PROTECT", "CONTROL"),
    }


# ── Backwards-compatibility shim (used by scenario_planner) ───────────────────

def recommend_subs(
    starting_xi:           list,
    bench:                 list,
    scoreline:             tuple = (0, 0),
    minute:                int   = 60,
    manager_intent:        str   = "tactical_change",
    days_since_last_match: int | None = None,
    injured_players:       list | None = None,
) -> list:
    """Legacy wrapper — returns recommendations list for scenario_planner."""
    home, away = scoreline
    result = get_recommendations(
        on_pitch           = starting_xi,
        bench_available    = bench,
        subbed_off         = [],
        current_minute     = minute,
        current_score_home = home,
        current_score_away = away,
        is_home            = True,
        subs_remaining     = 5,
        formation          = "4-3-3",
        playstyle          = "high_press",
        competition        = "",
    )
    return result.get("recommendations", [])
