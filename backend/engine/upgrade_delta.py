# SubHub — Football Substitution Intelligence Engine
# Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
# Unauthorised copying, distribution, or use is strictly prohibited.
# See LICENSE file for full terms.
"""
Upgrade Delta Engine — attribute-level comparison between starter and bench player.
"""

POSITION_KEY_ATTRS: dict[str, list[str]] = {
    "ST":  ["attacking_finishing", "mentality_positioning",
            "movement_sprint_speed", "attacking_heading_accuracy",
            "skill_dribbling"],
    "CF":  ["attacking_finishing", "mentality_positioning",
            "movement_sprint_speed", "skill_dribbling",
            "mentality_vision"],
    "LW":  ["movement_sprint_speed", "movement_acceleration",
            "skill_dribbling", "attacking_crossing",
            "attacking_finishing"],
    "RW":  ["movement_sprint_speed", "movement_acceleration",
            "skill_dribbling", "attacking_crossing",
            "attacking_finishing"],
    "CAM": ["mentality_vision", "skill_ball_control",
            "attacking_short_passing", "skill_long_passing",
            "mentality_positioning"],
    "CM":  ["skill_ball_control", "mentality_vision",
            "power_stamina", "attacking_short_passing",
            "mentality_interceptions"],
    "CDM": ["mentality_interceptions", "defending_marking_awareness",
            "defending_standing_tackle", "skill_ball_control",
            "power_stamina"],
    "LM":  ["movement_sprint_speed", "attacking_crossing",
            "skill_dribbling", "power_stamina",
            "attacking_short_passing"],
    "RM":  ["movement_sprint_speed", "attacking_crossing",
            "skill_dribbling", "power_stamina",
            "attacking_short_passing"],
    "LB":  ["movement_sprint_speed", "defending_standing_tackle",
            "defending_marking_awareness", "attacking_crossing",
            "power_stamina"],
    "RB":  ["movement_sprint_speed", "defending_standing_tackle",
            "defending_marking_awareness", "attacking_crossing",
            "power_stamina"],
    "CB":  ["defending_marking_awareness", "defending_standing_tackle",
            "defending_sliding_tackle", "power_jumping",
            "power_strength"],
    "GK":  ["goalkeeping_reflexes", "goalkeeping_positioning",
            "goalkeeping_handling", "goalkeeping_diving",
            "goalkeeping_kicking"],
    "LWB": ["movement_sprint_speed", "defending_standing_tackle",
            "attacking_crossing", "power_stamina", "skill_dribbling"],
    "RWB": ["movement_sprint_speed", "defending_standing_tackle",
            "attacking_crossing", "power_stamina", "skill_dribbling"],
    "LAM": ["mentality_vision", "skill_dribbling",
            "attacking_short_passing", "movement_sprint_speed",
            "attacking_finishing"],
    "RAM": ["mentality_vision", "skill_dribbling",
            "attacking_short_passing", "movement_sprint_speed",
            "attacking_finishing"],
}

_STRIP_PREFIXES = [
    "attacking_", "defending_", "mentality_", "movement_",
    "power_", "skill_", "goalkeeping_",
]


def _display_attr(attr: str) -> str:
    name = attr
    for prefix in _STRIP_PREFIXES:
        if name.startswith(prefix):
            name = name[len(prefix):]
            break
    return name.replace("_", " ").title()


def calculate_upgrade_delta(
    starter: dict,
    bench_player: dict,
    position: str
) -> dict:
    """
    Compare starter vs bench_player on the key attributes for `position`.
    Returns upgrade_score (0–100), verdict, comparisons list, and key_upgrade string.
    """
    key_attrs   = POSITION_KEY_ATTRS.get(position, POSITION_KEY_ATTRS["CM"])
    comparisons = []
    upgrade_count = 0
    total_delta   = 0.0

    for attr in key_attrs:
        sv    = float(starter.get(attr, 65))
        bv    = float(bench_player.get(attr, 65))
        delta = bv - sv
        is_up = delta > 0
        if is_up:
            upgrade_count += 1
        total_delta += delta

        comparisons.append({
            "attr":        _display_attr(attr),
            "starter_val": int(sv),
            "bench_val":   int(bv),
            "delta":       round(delta, 1),
            "is_upgrade":  is_up,
        })

    comparisons.sort(key=lambda x: -x["delta"])

    avg_delta     = total_delta / len(key_attrs)
    upgrade_score = min(100.0, max(0.0, 50.0 + avg_delta))
    n             = len(key_attrs)

    if upgrade_count == n:
        verdict, color = "Clear upgrade", "green"
    elif upgrade_count >= n * 0.6:
        verdict, color = "Marginal upgrade", "amber"
    elif upgrade_count >= n * 0.4:
        verdict, color = "Sideways sub", "amber"
    else:
        verdict, color = "Downgrade — tactical reason only", "red"

    key_upgrade = next(
        (f"{c['attr']}: {c['bench_val']} vs {c['starter_val']}"
         for c in comparisons if c["is_upgrade"]),
        None
    )

    return {
        "upgrade_score": round(upgrade_score, 1),
        "verdict":       verdict,
        "verdict_color": color,
        "upgrade_count": upgrade_count,
        "total_attrs":   n,
        "comparisons":   comparisons[:5],
        "key_upgrade":   key_upgrade,
    }
