"""
Formation Constraints Engine
Valid positional cover matrix with tactical intent modes.
"""

VALID_COVER: dict[str, list[str]] = {
    "ST":  ["ST", "SS", "W"],
    "W":   ["W", "AM", "ST", "FB"],
    "AM":  ["AM", "CM", "W"],
    "CM":  ["CM", "DM", "AM"],
    "DM":  ["DM", "CM", "CB"],
    "FB":  ["FB", "DM", "W"],
    "CB":  ["CB", "DM", "FB"],
    "GK":  ["GK"],
    # Aliases map to canonical
    "LW":  ["W", "AM", "ST", "FB"],
    "RW":  ["W", "AM", "ST", "FB"],
    "LB":  ["FB", "DM", "W"],
    "RB":  ["FB", "DM", "W"],
    "LWB": ["FB", "DM", "W"],
    "RWB": ["FB", "DM", "W"],
    "LCB": ["CB", "DM", "FB"],
    "RCB": ["CB", "DM", "FB"],
    "CAM": ["AM", "CM", "W"],
    "LAM": ["AM", "CM", "W"],
    "RAM": ["AM", "CM", "W"],
    "SS":  ["ST", "SS", "W"],
}

TACTICAL_PRIORITY: dict[str, list[str]] = {
    "protect_lead": ["CB", "DM", "GK", "FB", "CM", "W", "AM", "ST"],
    "chase_game":   ["ST", "W", "AM", "SS", "CM", "DM", "FB", "CB"],
    "tactical":     [],  # rank by impact_score only
}


def is_valid_cover(position_off: str, position_on: str) -> bool:
    """Check if position_on can cover for position_off."""
    valid = VALID_COVER.get(position_off.upper(), [])
    return position_on.upper() in [v.upper() for v in valid]


def rank_candidates(
    candidates: list[dict],
    position_off: str,
    intent: str = "tactical",
) -> list[dict]:
    """
    Rank bench candidates for a given position_off and tactical intent.
    candidates: list of dicts with at least 'position' and 'impact_score'.
    Returns sorted list, valid covers first.
    """
    priority = TACTICAL_PRIORITY.get(intent, [])

    def sort_key(c: dict) -> tuple:
        pos = c.get("position", "CM").upper()
        valid = 1 if is_valid_cover(position_off, pos) else 0
        if priority:
            try:
                # Map aliases to canonical for priority lookup
                canonical = _canonical(pos)
                prio_rank = priority.index(canonical)
            except ValueError:
                prio_rank = len(priority)
        else:
            prio_rank = 0
        impact = c.get("impact_score", 0)
        # Sort: valid first, then priority rank (asc), then impact desc
        return (-valid, prio_rank, -impact)

    return sorted(candidates, key=sort_key)


def _canonical(pos: str) -> str:
    aliases = {
        "LW": "W", "RW": "W",
        "LB": "FB", "RB": "FB",
        "LWB": "FB", "RWB": "FB",
        "LCB": "CB", "RCB": "CB",
        "CAM": "AM", "LAM": "AM", "RAM": "AM",
    }
    return aliases.get(pos.upper(), pos.upper())
