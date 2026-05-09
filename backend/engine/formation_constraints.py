"""
Formation Constraints Engine — VALID_COVER with risk ratings and tactical intent filters.
"""

# Risk levels: "direct" | "safe" | "risky" | "emergency"
VALID_COVER: dict[str, dict[str, str]] = {
    "ST":  {"ST": "direct", "SS": "direct", "CF": "direct", "W": "risky", "LW": "risky", "RW": "risky"},
    "CF":  {"CF": "direct", "ST": "direct", "SS": "direct", "CAM": "safe", "W": "risky"},
    "SS":  {"SS": "direct", "ST": "direct", "CF": "direct", "CAM": "safe", "W": "risky"},
    "LW":  {"LW": "direct", "W": "direct",  "RW": "safe",   "CAM": "safe", "ST": "risky", "LB": "emergency"},
    "RW":  {"RW": "direct", "W": "direct",  "LW": "safe",   "CAM": "safe", "ST": "risky", "RB": "emergency"},
    "W":   {"W": "direct",  "LW": "direct", "RW": "direct", "CAM": "safe", "ST": "risky", "FB": "emergency"},
    "CAM": {"CAM": "direct","AM": "direct",  "CM": "safe",   "LW": "risky", "RW": "risky"},
    "LAM": {"LAM": "direct","CAM": "direct", "CM": "safe",   "LW": "risky"},
    "RAM": {"RAM": "direct","CAM": "direct", "CM": "safe",   "RW": "risky"},
    "AM":  {"AM": "direct", "CAM": "direct", "CM": "safe",   "LW": "risky", "RW": "risky"},
    "CM":  {"CM": "direct", "LCM": "direct","RCM": "direct","DM": "safe",  "CAM": "safe", "CDM": "safe"},
    "LCM": {"LCM": "direct","CM": "direct", "DM": "safe",   "CAM": "risky"},
    "RCM": {"RCM": "direct","CM": "direct", "DM": "safe",   "CAM": "risky"},
    "LM":  {"LM": "direct", "CM": "safe",   "LW": "safe",   "RM": "risky"},
    "RM":  {"RM": "direct", "CM": "safe",   "RW": "safe",   "LM": "risky"},
    "DM":  {"DM": "direct", "CDM": "direct","CM": "safe",   "CB": "risky"},
    "CDM": {"CDM": "direct","DM": "direct", "CM": "safe",   "CB": "risky"},
    "LB":  {"LB": "direct", "FB": "direct", "LWB": "safe",  "DM": "safe",  "LW": "risky"},
    "RB":  {"RB": "direct", "FB": "direct", "RWB": "safe",  "DM": "safe",  "RW": "risky"},
    "FB":  {"FB": "direct", "LB": "direct", "RB": "direct", "LWB": "safe", "RWB": "safe", "DM": "safe"},
    "LWB": {"LWB": "direct","LB": "safe",   "FB": "safe",   "LM": "safe",  "DM": "risky"},
    "RWB": {"RWB": "direct","RB": "safe",   "FB": "safe",   "RM": "safe",  "DM": "risky"},
    "CB":  {"CB": "direct", "LCB": "direct","RCB": "direct","DM": "safe",  "CDM": "safe", "FB": "risky"},
    "LCB": {"LCB": "direct","CB": "direct", "DM": "safe",   "LB": "risky"},
    "RCB": {"RCB": "direct","CB": "direct", "DM": "safe",   "RB": "risky"},
    "GK":  {"GK": "direct"},
}

# Tactical intent: which positions to prioritise
TACTICAL_PRIORITY: dict[str, list[str]] = {
    "protect_lead":   ["CB","LCB","RCB","DM","CDM","GK","LB","RB","FB","LWB","RWB","CM","LM","RM","LW","RW","W","CAM","AM","ST"],
    "chase_game":     ["ST","CF","SS","LW","RW","W","CAM","LAM","RAM","AM","CM","LCM","RCM","LM","RM","DM","CDM","LB","RB","CB"],
    "tactical_change":["CM","LCM","RCM","DM","CDM","CAM","AM","LW","RW","W","ST","LB","RB","FB","CB"],
}

TACTICAL_BOOST_POSITIONS: dict[str, set[str]] = {
    "protect_lead":   {"CB","LCB","RCB","DM","CDM"},
    "chase_game":     {"ST","CF","SS","LW","RW","W","CAM","LAM","RAM"},
    "tactical_change": set(),
}

RISK_LABELS: dict[str, str] = {
    "direct":    "Direct replacement",
    "safe":      "Compatible cover",
    "risky":     "Positional mismatch",
    "emergency": "Emergency cover only",
}


def get_compatibility(pos_off: str, pos_on: str) -> tuple[str, str]:
    """
    Returns (risk_level, description).
    risk_level: 'direct' | 'safe' | 'risky' | 'emergency' | 'invalid'
    """
    cover = VALID_COVER.get(pos_off.upper(), {})
    risk  = cover.get(pos_on.upper())
    if risk is None:
        return "invalid", f"{pos_on} cannot cover {pos_off}"
    return risk, RISK_LABELS[risk]


def rank_bench_candidates(
    candidates: list[dict],
    position_off: str,
    intent: str = "tactical_change",
) -> list[dict]:
    """
    Rank bench candidates for sub-off position + intent.
    Each candidate needs 'position' and 'impact_score'.
    Returns sorted list with 'compatibility', 'risk_level', 'intent_boost' fields added.
    """
    prio   = TACTICAL_PRIORITY.get(intent, [])
    boosts = TACTICAL_BOOST_POSITIONS.get(intent, set())

    enriched = []
    for c in candidates:
        pos_on = (c.get("position") or "CM").upper()
        risk, desc = get_compatibility(position_off, pos_on)
        if risk == "invalid":
            continue  # filter out truly invalid

        risk_penalty = {"direct": 0, "safe": 5, "risky": 15, "emergency": 25}.get(risk, 30)
        prio_rank    = prio.index(pos_on) if pos_on in prio else len(prio)
        impact       = c.get("impact_score", 50)
        boost        = 1.15 if pos_on in boosts else 1.0

        score = (impact * boost) - risk_penalty - prio_rank * 0.5
        enriched.append({
            **c,
            "compatibility":       desc,
            "risk_level":          risk,
            "intent_boost":        boost > 1.0,
            "_rank_score":         score,
        })

    enriched.sort(key=lambda x: -x["_rank_score"])
    return enriched


def get_tactical_advice(
    intent: str,
    bench: list[dict],
    starting_xi: list[dict],
) -> str | None:
    """Generate one-line tactical advice based on intent and bench depth."""
    bench_positions = {(b.get("position") or "").upper() for b in bench}
    xi_positions    = [(p.get("position") or "").upper() for p in starting_xi]

    if intent == "chase_game":
        attacking = {"ST","CF","SS","LW","RW","W","CAM"}
        has_attacker = bool(attacking & bench_positions)
        if not has_attacker:
            wingers = [p for p in starting_xi if p.get("position","").upper() in {"LW","RW","W"}]
            dms     = [p for p in bench if p.get("position","").upper() in {"DM","CDM"}]
            if wingers:
                return f"Limited attacking bench — push {wingers[0]['name'].split()[-1]} to ST, widen shape"
            return "Consider 4-3-3 → 4-2-3-1 to create central overload"

    elif intent == "protect_lead":
        has_cb = bool({"CB","LCB","RCB"} & bench_positions)
        if not has_cb:
            dms = [p for p in starting_xi if p.get("position","").upper() in {"DM","CDM","CM"}]
            if dms:
                return f"No CB on bench — drop {dms[0]['name'].split()[-1]} to CB, bring on fresh DM"
        return "Maintain compact shape — delay ball wide to waste time"

    elif intent == "tactical_change":
        return "Balance pressing intensity and positional compactness"

    return None
