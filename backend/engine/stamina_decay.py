"""
Stamina Decay Engine — FC26 power_stamina modulates decay rate.
"""
from .fc26_loader import get_player_attributes

DECAY_BASE: dict[str, float] = {
    "GK":  0.18, "CB": 0.28, "LCB": 0.28, "RCB": 0.28,
    "LB":  0.33, "RB": 0.33, "LWB": 0.36, "RWB": 0.36, "FB": 0.33,
    "DM":  0.38, "CDM": 0.38, "LDM": 0.38, "RDM": 0.38,
    "CM":  0.43, "LCM": 0.43, "RCM": 0.43, "LM": 0.45, "RM": 0.45,
    "CAM": 0.50, "LAM": 0.50, "RAM": 0.50, "AM": 0.50,
    "LW":  0.52, "RW": 0.52, "W": 0.52,
    "ST":  0.58, "SS": 0.55, "CF": 0.58,
}

STAMINA_CRITICAL = 40
STAMINA_WARNING  = 60
STAMINA_MONITOR  = 75


def _stamina_mod(fc26_stamina: int | None) -> float:
    """
    FC26 stamina 50 → 1.0 modifier (baseline).
    90 stamina → 0.80 (decays 20% slower).
    40 stamina → 1.25 (decays 25% faster).
    """
    if fc26_stamina is None:
        return 1.0
    return round(1.0 - (fc26_stamina - 50) / 200.0, 4)


def compute_stamina(
    player_name: str,
    position: str,
    minutes_played: int,
    days_since_last_match: int | None = None,
    is_injury_return: bool = False,
) -> dict:
    """
    Returns:
      { stamina_pct, stamina_status, effective_decay,
        fc26_stamina, stamina_modifier, fixture_modifier }
    """
    base = DECAY_BASE.get(position.upper(), 0.43)

    # FC26 stamina modifier
    attrs         = get_player_attributes(player_name)
    fc26_stamina  = attrs.get("power_stamina") if attrs else None
    stam_mod      = _stamina_mod(fc26_stamina)

    # Fixture modifier
    if is_injury_return:
        fix_mod = 1.6
    elif days_since_last_match is not None and days_since_last_match < 4:
        fix_mod = 1.3
    else:
        fix_mod = 1.0

    effective = base * stam_mod * fix_mod
    pct = max(0.0, round(100.0 - effective * minutes_played, 1))

    if pct < STAMINA_CRITICAL:
        status = "CRITICAL"
    elif pct < STAMINA_WARNING:
        status = "WARNING"
    elif pct < STAMINA_MONITOR:
        status = "MONITOR"
    else:
        status = "FRESH"

    return {
        "stamina_pct":      pct,
        "stamina_status":   status,
        "effective_decay":  round(effective, 4),
        "fc26_stamina":     fc26_stamina,
        "stamina_modifier": stam_mod,
        "fixture_modifier": fix_mod,
    }


def compute_stamina_simple(
    position: str,
    minutes_played: int,
    fc26_stamina: int | None = None,
    days_since_last_match: int | None = None,
) -> float:
    """Lightweight version (no name lookup) for batch calculations."""
    base    = DECAY_BASE.get(position.upper(), 0.43)
    sm      = _stamina_mod(fc26_stamina)
    fm      = 1.3 if (days_since_last_match is not None and days_since_last_match < 4) else 1.0
    return max(0.0, round(100.0 - base * sm * fm * minutes_played, 1))


def compute_squad_stamina(
    players: list[dict],
    days_since_last_match: int | None = None,
) -> list[dict]:
    result = []
    for p in players:
        sd = compute_stamina(
            player_name=p.get("name", ""),
            position=p.get("position", "CM"),
            minutes_played=p.get("minutes_played", 0),
            days_since_last_match=days_since_last_match,
            is_injury_return=p.get("is_injury_return", False),
        )
        result.append({**p, **sd})
    return result
