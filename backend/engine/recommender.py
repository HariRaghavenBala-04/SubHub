"""
Sub Recommender Engine
Produces top-3 substitution recommendations given match state.
"""
from .stamina_decay import compute_stamina, stamina_colour
from .formation_constraints import is_valid_cover, rank_candidates, TACTICAL_PRIORITY


def recommend_subs(
    starting_xi: list[dict],
    bench: list[dict],
    scoreline: tuple[int, int],
    minute: int,
    manager_intent: str = "tactical",
    days_since_last_match: int | None = None,
) -> list[dict]:
    """
    Input:
      starting_xi: list of player dicts {id, name, position, minutes_played, impact_score, ...}
      bench: list of player dicts {id, name, position, impact_score, ...}
      scoreline: (home_goals, away_goals)
      minute: current match minute
      manager_intent: 'protect_lead' | 'chase_game' | 'tactical'

    Output: top 3 recommendations:
      [{subOff, subOn, stamina_pct, impact_score, position_valid, reasoning}, ...]
    """
    # Enrich starters with stamina
    for p in starting_xi:
        p["minutes_played"] = p.get("minutes_played", minute)
        p["stamina_pct"] = compute_stamina(
            position=p.get("position", "CM"),
            minutes_played=p["minutes_played"],
            days_since_last_match=days_since_last_match,
        )
        p["stamina_colour"] = stamina_colour(p["stamina_pct"])

    # Enrich bench with default impact if missing
    for b in bench:
        b.setdefault("impact_score", 50.0)
        b.setdefault("minutes_played", 0)

    # Score each (sub_off, sub_on) pair
    candidates = []
    priority_positions = TACTICAL_PRIORITY.get(manager_intent, [])

    for player_off in starting_xi:
        stamina = player_off["stamina_pct"]
        pos_off = player_off.get("position", "CM")

        ranked_bench = rank_candidates(bench, pos_off, manager_intent)
        for player_on in ranked_bench[:3]:
            pos_on = player_on.get("position", "CM")
            valid_cover = is_valid_cover(pos_off, pos_on)
            impact = player_on.get("impact_score", 50.0)

            # Composite score: lower stamina = higher urgency, higher impact = better
            urgency = max(0.0, 100.0 - stamina)
            composite = urgency * 0.6 + impact * 0.4
            if not valid_cover:
                composite *= 0.5  # penalise invalid coverage

            candidates.append({
                "subOff": player_off,
                "subOn": player_on,
                "stamina_pct": round(stamina, 1),
                "impact_score": round(impact, 1),
                "position_valid": valid_cover,
                "composite": round(composite, 2),
                "reasoning": _build_reasoning(player_off, player_on, stamina, impact, valid_cover, minute),
            })

    candidates.sort(key=lambda x: -x["composite"])
    # Deduplicate: each player should appear at most once as subOff or subOn
    seen_off, seen_on = set(), set()
    top3 = []
    for c in candidates:
        off_id = c["subOff"].get("id")
        on_id = c["subOn"].get("id")
        if off_id not in seen_off and on_id not in seen_on:
            seen_off.add(off_id)
            seen_on.add(on_id)
            top3.append(c)
        if len(top3) == 3:
            break

    return top3


def _build_reasoning(
    player_off: dict,
    player_on: dict,
    stamina: float,
    impact: float,
    valid_cover: bool,
    minute: int,
) -> str:
    off_name = player_off.get("name", "Player")
    on_name = player_on.get("name", "Sub")
    pos_off = player_off.get("position", "?")
    pos_on = player_on.get("position", "?")
    cover_str = f"{pos_off}→{pos_on} valid" if valid_cover else f"{pos_off}→{pos_on} mismatch"
    return (
        f"{off_name} ({stamina:.0f}% stamina) → {on_name} "
        f"(Impact: {impact:.0f}, {cover_str}) @ {minute}'"
    )
