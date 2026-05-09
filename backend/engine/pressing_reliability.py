"""
Pressing Reliability Engine — calculates a player's current press output.
"""


def calculate_pressing_reliability(
    player: dict,
    stamina_pct: float,
    playstyle: str
) -> dict:
    """
    Returns press_reliability (0–100), status, flag string, and press_leader flag.
    """
    pace          = float(player.get("pace", 65))
    stamina_attr  = float(player.get("power_stamina", 65))
    aggression    = float(player.get("mentality_aggression", 65))
    work_rate_att = player.get("work_rate_att", "Medium")

    wr_modifier = {"High": 1.15, "Medium": 1.0, "Low": 0.80}.get(work_rate_att, 1.0)

    base_press_score = (
        pace         * 0.30 +
        stamina_attr * 0.35 +
        aggression   * 0.25 +
        85           * 0.10
    ) * wr_modifier

    stamina_factor    = 0.4 + (stamina_pct / 100) * 0.6
    current_press     = base_press_score * stamina_factor
    press_reliability = min(100.0, (current_press / 90) * 100)

    if press_reliability >= 75:
        status = "RELIABLE"
        flag   = None
    elif press_reliability >= 55:
        status = "DEGRADING"
        flag   = (
            f"Pressing output declining — "
            f"{100 - int(press_reliability)}% below peak"
        )
    elif press_reliability >= 40:
        status = "UNRELIABLE"
        flag   = "Missing press triggers — tactically fatigued"
    else:
        status = "CRITICAL"
        flag   = "Press completely broken down — urgent sub needed"

    is_press_leader = (
        work_rate_att == "High"
        and pace >= 78
        and stamina_attr >= 75
    )

    return {
        "press_reliability": round(press_reliability, 1),
        "status":            status,
        "flag":              flag,
        "is_press_leader":   is_press_leader,
    }
