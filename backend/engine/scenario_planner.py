"""
Scenario Planner — Injury Response + 3-scenario planning with FC26 data.
"""
from .recommender import recommend_subs
from .stamina_decay import compute_stamina
from .formation_constraints import get_compatibility, rank_bench_candidates, TACTICAL_BOOST_POSITIONS
from .expected_impact import compute_impact_sync
from .fc26_loader import get_position_profile

SCENARIO_INTENTS = {
    "WINNING": "protect_lead",
    "DRAWING": "tactical_change",
    "LOSING":  "chase_game",
}

URGENCY_BY_POSITION: dict[str, dict] = {
    "GK":  {"level": "CRITICAL", "label": "Must substitute immediately", "colour": "#ff3d3d"},
    "CB":  {"level": "HIGH",     "label": "Sub within 5 mins, consider 5-3-2", "colour": "#ff8c00"},
    "LCB": {"level": "HIGH",     "label": "Sub within 5 mins, consider 5-3-2", "colour": "#ff8c00"},
    "RCB": {"level": "HIGH",     "label": "Sub within 5 mins, consider 5-3-2", "colour": "#ff8c00"},
    "LB":  {"level": "MEDIUM",   "label": "Can hold 10 mins", "colour": "#ffb800"},
    "RB":  {"level": "MEDIUM",   "label": "Can hold 10 mins", "colour": "#ffb800"},
    "LWB": {"level": "MEDIUM",   "label": "Can hold 10 mins", "colour": "#ffb800"},
    "RWB": {"level": "MEDIUM",   "label": "Can hold 10 mins", "colour": "#ffb800"},
    "DM":  {"level": "MEDIUM",   "label": "Can hold 10 mins", "colour": "#ffb800"},
    "CDM": {"level": "MEDIUM",   "label": "Can hold 10 mins", "colour": "#ffb800"},
    "CM":  {"level": "LOW",      "label": "Can hold shape for now", "colour": "#6b7a8d"},
    "LM":  {"level": "LOW",      "label": "Can hold shape for now", "colour": "#6b7a8d"},
    "RM":  {"level": "LOW",      "label": "Can hold shape for now", "colour": "#6b7a8d"},
    "LW":  {"level": "LOW",      "label": "Tactical opportunity to reshape", "colour": "#6b7a8d"},
    "RW":  {"level": "LOW",      "label": "Tactical opportunity to reshape", "colour": "#6b7a8d"},
    "W":   {"level": "LOW",      "label": "Tactical opportunity to reshape", "colour": "#6b7a8d"},
    "ST":  {"level": "LOW",      "label": "Tactical opportunity to reshape", "colour": "#6b7a8d"},
    "CAM": {"level": "LOW",      "label": "Can hold shape for now", "colour": "#6b7a8d"},
    "AM":  {"level": "LOW",      "label": "Can hold shape for now", "colour": "#6b7a8d"},
    "SS":  {"level": "LOW",      "label": "Tactical opportunity to reshape", "colour": "#6b7a8d"},
    "CF":  {"level": "LOW",      "label": "Tactical opportunity to reshape", "colour": "#6b7a8d"},
}

FORMATION_ADVICE: dict[str, str] = {
    "GK":  "Mandatory sub — use second GK from bench",
    "CB":  "No CB on bench? → Switch to 5-3-2 temporarily, drop FB inside",
    "LCB": "No LCB on bench? → Use DM as emergency CB or switch to 3-5-2",
    "RCB": "No RCB on bench? → Use DM as emergency CB or switch to 3-5-2",
    "LB":  "No LB? → Move DM/CM to LB, switch to 5-3-2 with LWB",
    "RB":  "No RB? → Move DM/CM to RB, switch to 5-3-2 with RWB",
    "DM":  "No DM? → Drop a CM to holding role, tighten midfield block",
    "CDM": "No CDM? → Drop a CM to holding role, tighten midfield block",
    "CM":  "No CM? → Play 4-4-2 or push an AM deeper",
    "LW":  "No winger? → Push CAM wide, play 4-2-3-1 inverted",
    "RW":  "No winger? → Push CAM wide, play 4-2-3-1 inverted",
    "ST":  "No ST? → False 9 with CAM, or push widest player central",
    "CAM": "No CAM? → Use best CM in advanced role, play 4-3-3",
}


def plan_scenarios(
    starting_xi: list[dict],
    bench: list[dict],
    minute: int = 60,
    days_since_last_match: int | None = None,
) -> dict:
    """Returns WINNING / DRAWING / LOSING scenario objects."""
    results = {}
    scorelines = {"WINNING": (1, 0), "DRAWING": (0, 0), "LOSING": (0, 1)}

    for scenario, intent in SCENARIO_INTENTS.items():
        xi_copy    = [dict(p) for p in starting_xi]
        bench_copy = [dict(b) for b in bench]

        # Enrich XI stamina at this minute
        for p in xi_copy:
            sd = compute_stamina(
                player_name=p.get("name", ""),
                position=p.get("position", "CM"),
                minutes_played=p.get("minutes_played", minute),
                days_since_last_match=days_since_last_match,
            )
            p.update(sd)

        subs = recommend_subs(
            starting_xi=xi_copy,
            bench=bench_copy,
            scoreline=scorelines[scenario],
            minute=minute,
            manager_intent=intent,
            days_since_last_match=days_since_last_match,
        )

        stamina_risks = [
            {"name": p["name"], "position": p.get("position",""), "stamina_pct": p.get("stamina_pct", 80)}
            for p in xi_copy if p.get("stamina_pct", 80) < 60
        ]

        avg_impact = sum(s.get("sub_on", {}).get("impact_score", 50) for s in subs[:2]) / max(1, min(2, len(subs)))
        base_delta = {"protect_lead": 0.04, "chase_game": 0.08, "tactical_change": 0.05}
        delta = round(min(0.20, base_delta.get(intent, 0.05) + 0.001 * avg_impact), 4)

        tactical_advice = {
            "protect_lead":   "Sit deep, protect the width, delay from set-pieces",
            "chase_game":     "Push high line, overload wide areas, commit runners",
            "tactical_change": "Maintain shape, recycle possession, probe for space",
        }.get(intent, "")

        results[scenario] = {
            "intent":              intent,
            "intent_label":        intent.replace("_", " ").title(),
            "top2_subs":           subs[:2],
            "stamina_risks":       stamina_risks,
            "win_probability_delta": delta,
            "tactical_advice":     tactical_advice,
        }

    return results


def injury_response(
    injured_player: dict,
    bench: list[dict],
    current_xi: list[dict],
    minute: int,
) -> dict:
    """
    Given an injured player, return top-3 replacement options with FC26 context.
    """
    pos = (injured_player.get("position") or "CM").upper()
    urgency = URGENCY_BY_POSITION.get(pos, URGENCY_BY_POSITION["CM"])

    candidates = rank_bench_candidates(bench, pos, "tactical_change")

    replacements = []
    for b in candidates[:5]:
        impact_data = compute_impact_sync(
            bench_name=b.get("name", ""),
            bench_position=b.get("position", "CM"),
            starter_name=injured_player.get("name"),
        )
        risk, compat = get_compatibility(pos, b.get("position", "CM").upper())
        direct = b.get("position", "").upper() == pos

        replacements.append({
            "name":              b.get("name", ""),
            "position":          b.get("position", ""),
            "impact_score":      impact_data["impact_score"],
            "confidence":        impact_data["confidence"],
            "pos_rating":        impact_data.get("pos_rating"),
            "overall":           impact_data.get("overall"),
            "tactical_profile":  impact_data.get("tactical_profile"),
            "compatibility":     risk,
            "compatibility_desc": compat,
            "is_direct_match":   direct,
            "tactical_impact":   "Maintains defensive shape" if direct else f"Forces shape adjustment ({pos}→{b.get('position','')})",
            "attribute_comparison": impact_data.get("key_attrs_comparison", [])[:3],
            "reasoning": (
                f"{b.get('name','').split()[-1]} ({b.get('position','')}) → replaces "
                f"{injured_player.get('name','').split()[-1]} ({pos}) — "
                + ("direct position match" if direct else compat)
            ),
        })

    has_direct = any(r["is_direct_match"] for r in replacements)
    formation_advice = None if has_direct else FORMATION_ADVICE.get(pos)

    return {
        "injured_player": injured_player,
        "urgency":        urgency,
        "replacements":   replacements[:3],
        "formation_advice": formation_advice,
    }
