"""
Stamina Decay Engine
Position-aware fatigue modelling with fixture congestion modifiers.
"""
from datetime import date

DECAY_RATES: dict[str, float] = {
    "GK": 0.20,
    "CB": 0.30,
    "FB": 0.35,
    "DM": 0.40,
    "CM": 0.45,
    "W":  0.55,
    "ST": 0.60,
    # Aliases
    "LB": 0.35,
    "RB": 0.35,
    "LW": 0.55,
    "RW": 0.55,
    "AM": 0.50,
    "SS": 0.55,
    "LWB": 0.40,
    "RWB": 0.40,
    "LCB": 0.30,
    "RCB": 0.30,
    "CAM": 0.50,
    "LAM": 0.50,
    "RAM": 0.50,
}

STAMINA_GREEN = 70
STAMINA_AMBER = 40


def fixture_modifier(days_since_last_match: int | None, is_injury_return: bool = False) -> float:
    if is_injury_return:
        return 1.6
    if days_since_last_match is not None and days_since_last_match < 4:
        return 1.3
    return 1.0


def compute_stamina(
    position: str,
    minutes_played: int,
    days_since_last_match: int | None = None,
    is_injury_return: bool = False,
) -> float:
    """
    Returns stamina percentage (0–100).
    green ≥70, amber 40–69, red <40
    """
    decay = DECAY_RATES.get(position.upper(), 0.45)
    mod = fixture_modifier(days_since_last_match, is_injury_return)
    stamina = max(0.0, 100.0 - (decay * minutes_played * mod))
    return round(stamina, 1)


def stamina_colour(stamina_pct: float) -> str:
    if stamina_pct >= STAMINA_GREEN:
        return "green"
    elif stamina_pct >= STAMINA_AMBER:
        return "amber"
    return "red"


def compute_squad_stamina(
    players: list[dict],
    days_since_last_match: int | None = None,
) -> list[dict]:
    """
    Given a list of player dicts with 'position' and 'minutes_played',
    returns the same list enriched with 'stamina_pct' and 'stamina_colour'.
    """
    result = []
    for p in players:
        pct = compute_stamina(
            position=p.get("position", "CM"),
            minutes_played=p.get("minutes_played", 0),
            days_since_last_match=days_since_last_match,
            is_injury_return=p.get("is_injury_return", False),
        )
        result.append({**p, "stamina_pct": pct, "stamina_colour": stamina_colour(pct)})
    return result
