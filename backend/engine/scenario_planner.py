"""
Scenario Planner
At minute 60, simulate WINNING/DRAWING/LOSING scenarios and return top subs + win_probability_delta.
"""
from .recommender import recommend_subs

SCENARIO_INTENTS = {
    "WINNING": "protect_lead",
    "DRAWING": "tactical",
    "LOSING":  "chase_game",
}

WIN_PROB_DELTA = {
    "protect_lead": {"base": 0.05, "per_impact_point": 0.0008},
    "chase_game":   {"base": 0.08, "per_impact_point": 0.001},
    "tactical":     {"base": 0.04, "per_impact_point": 0.0006},
}


def plan_scenarios(
    starting_xi: list[dict],
    bench: list[dict],
    minute: int = 60,
    days_since_last_match: int | None = None,
) -> dict:
    """
    Returns a dict with keys WINNING, DRAWING, LOSING.
    Each value: { intent, top2_subs, win_probability_delta }
    """
    results = {}
    for scenario, intent in SCENARIO_INTENTS.items():
        # Deep-copy players to avoid stamina mutation across scenarios
        xi_copy = [dict(p) for p in starting_xi]
        bench_copy = [dict(b) for b in bench]

        scoreline_map = {
            "WINNING": (1, 0),
            "DRAWING": (0, 0),
            "LOSING":  (0, 1),
        }
        subs = recommend_subs(
            starting_xi=xi_copy,
            bench=bench_copy,
            scoreline=scoreline_map[scenario],
            minute=minute,
            manager_intent=intent,
            days_since_last_match=days_since_last_match,
        )
        top2 = subs[:2]

        # Win prob delta
        cfg = WIN_PROB_DELTA[intent]
        avg_impact = (
            sum(s["impact_score"] for s in top2) / len(top2) if top2 else 0
        )
        delta = cfg["base"] + cfg["per_impact_point"] * avg_impact
        delta = round(min(delta, 0.25), 4)

        results[scenario] = {
            "intent": intent,
            "top2_subs": top2,
            "win_probability_delta": delta,
        }

    return results
