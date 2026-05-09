"""
Playstyle Profiles — 6 tactical identities with formation compatibility matrix.
"""

PLAYSTYLES: dict = {

    "high_press": {
        "label": "High Press",
        "icon": "⚡",
        "description": "Win the ball high, transition immediately",
        "weights": {
            "press_reliability": 0.35,
            "stamina_decay":     0.25,
            "attribute_upgrade": 0.20,
            "impact_score":      0.15,
            "game_state":        0.05
        },
        "player_fit_formula": {
            "pace":                  0.30,
            "power_stamina":         0.30,
            "mentality_aggression":  0.25,
            "work_rate_att":         0.15
        },
        "sub_language": {
            "urgency_phrase": "missing press triggers",
            "sub_on_phrase":  "restores pressing intensity",
        },
        "formation_scores": {
            "4-3-3":   {"score": 95, "verdict": "PERFECT",
                "reason": "3 forwards press simultaneously. Midfield trio supports immediately in transition."},
            "4-4-2":   {"score": 75, "verdict": "DECENT",
                "reason": "2 strikers press together but flat midfield bypassed too easily."},
            "4-2-3-1": {"score": 82, "verdict": "GOOD",
                "reason": "CAM presses from front, 2 pivots cover transitions effectively."},
            "3-5-2":   {"score": 55, "verdict": "RISKY",
                "reason": "Only 2 press leaders up top. Wingbacks caught high leaves CB exposed."},
            "5-3-2":   {"score": 25, "verdict": "TERRIBLE",
                "reason": "Back 5 kills transition numbers. 3 midfielders cannot sustain high press alone. Gegenpressing requires numerical superiority forward — this shape gives you the opposite."},
            "4-5-1":   {"score": 42, "verdict": "POOR",
                "reason": "Lone striker cannot initiate press. Too isolated to trigger coordinated press."}
        }
    },

    "positional": {
        "label": "Positional Play",
        "icon": "🔷",
        "description": "Control space, dominate possession",
        "weights": {
            "positional_integrity": 0.35,
            "passing_quality":      0.25,
            "attribute_upgrade":    0.20,
            "impact_score":         0.15,
            "stamina_decay":        0.05
        },
        "player_fit_formula": {
            "mentality_vision":        0.30,
            "attacking_short_passing": 0.30,
            "mentality_composure":     0.25,
            "mentality_positioning":   0.15
        },
        "sub_language": {
            "urgency_phrase": "losing positional structure",
            "sub_on_phrase":  "restores passing rhythm",
        },
        "formation_scores": {
            "4-3-3":   {"score": 88, "verdict": "GREAT",
                "reason": "Wide forwards create width. 3 mids control central zones effectively."},
            "4-4-2":   {"score": 62, "verdict": "DECENT",
                "reason": "Rigid and predictable. Lacks positional flexibility."},
            "4-2-3-1": {"score": 97, "verdict": "PERFECT",
                "reason": "2 pivots anchor structure. CAM links all zones. Width from fullbacks. The definitive positional play shape."},
            "3-5-2":   {"score": 80, "verdict": "GOOD",
                "reason": "5 mids dominate central zones. Works well with technical players."},
            "5-3-2":   {"score": 52, "verdict": "POOR",
                "reason": "Too defensive for positional play. Limits ball circulation and attacking overloads."},
            "4-5-1":   {"score": 75, "verdict": "DECENT",
                "reason": "Midfield overload controls possession but lone striker limits attacking options."}
        }
    },

    "low_block": {
        "label": "Low Block",
        "icon": "🛡",
        "description": "Defend deep, hit on the break",
        "weights": {
            "defensive_solidity": 0.40,
            "stamina_decay":      0.20,
            "attribute_upgrade":  0.20,
            "impact_score":       0.15,
            "game_state":         0.05
        },
        "player_fit_formula": {
            "defending":            0.35,
            "power_strength":       0.25,
            "power_stamina":        0.25,
            "mentality_aggression": 0.15
        },
        "sub_language": {
            "urgency_phrase": "defensive shape breaking down",
            "sub_on_phrase":  "reinforces defensive block",
        },
        "formation_scores": {
            "4-3-3":   {"score": 48, "verdict": "POOR",
                "reason": "Wide forwards too isolated when sitting deep. Counter needs compact support."},
            "4-4-2":   {"score": 78, "verdict": "GOOD",
                "reason": "Compact mid-block. Two banks of 4 very hard to break down."},
            "4-2-3-1": {"score": 65, "verdict": "DECENT",
                "reason": "2 pivots help defensively but CAM is wasted in deep block."},
            "3-5-2":   {"score": 85, "verdict": "GREAT",
                "reason": "Compact shape. Wingbacks tuck in to form back 5. Very hard to break down."},
            "5-3-2":   {"score": 96, "verdict": "PERFECT",
                "reason": "Maximum defensive cover. 2 strikers on counter. Back 5 nearly impenetrable. The definitive low block shape."},
            "4-5-1":   {"score": 88, "verdict": "GREAT",
                "reason": "Midfield wall of 5 nearly impossible to break down. Lone striker holds ball well."}
        }
    },

    "counter_attack": {
        "label": "Counter Attack",
        "icon": "⚔",
        "description": "Absorb pressure, explode in transition",
        "weights": {
            "pace_injection":    0.35,
            "stamina_decay":     0.20,
            "attribute_upgrade": 0.25,
            "impact_score":      0.15,
            "game_state":        0.05
        },
        "player_fit_formula": {
            "pace":                  0.35,
            "movement_sprint_speed": 0.30,
            "skill_dribbling":       0.20,
            "attacking_finishing":   0.15
        },
        "sub_language": {
            "urgency_phrase": "losing counter-attack threat",
            "sub_on_phrase":  "injects pace on the break",
        },
        "formation_scores": {
            "4-3-3":   {"score": 88, "verdict": "GREAT",
                "reason": "Pace on wings. Quick transitions. Midfield trio recycles fast."},
            "4-4-2":   {"score": 72, "verdict": "DECENT",
                "reason": "2 strikers for counter but midfield transition can be slow."},
            "4-2-3-1": {"score": 80, "verdict": "GOOD",
                "reason": "2 pivots absorb pressure. Quick outlet to CAM who plays in behind."},
            "3-5-2":   {"score": 78, "verdict": "GOOD",
                "reason": "Athletic wingbacks crucial. If fast, transitions become devastating."},
            "5-3-2":   {"score": 88, "verdict": "GREAT",
                "reason": "Defend deep, hit on counter with 2 quick strikers. The Atletico Madrid model."},
            "4-5-1":   {"score": 58, "verdict": "POOR",
                "reason": "Lone striker too isolated for effective counter-attack."}
        }
    },

    "direct_play": {
        "label": "Direct Play",
        "icon": "🎯",
        "description": "Win second balls, use target man",
        "weights": {
            "aerial_presence":   0.30,
            "physical_strength": 0.25,
            "attribute_upgrade": 0.25,
            "impact_score":      0.15,
            "stamina_decay":     0.05
        },
        "player_fit_formula": {
            "attacking_heading_accuracy": 0.30,
            "power_jumping":              0.25,
            "power_strength":             0.25,
            "attacking_finishing":        0.20
        },
        "sub_language": {
            "urgency_phrase": "losing aerial threat",
            "sub_on_phrase":  "adds target man presence",
        },
        "formation_scores": {
            "4-3-3":   {"score": 52, "verdict": "POOR",
                "reason": "Wide forwards waste direct balls. Need a target man partnership."},
            "4-4-2":   {"score": 92, "verdict": "PERFECT",
                "reason": "Classic direct play shape. 2 strikers win headers, flick-ons, second balls."},
            "4-2-3-1": {"score": 60, "verdict": "DECENT",
                "reason": "CAM can link with target ST but lone striker too isolated."},
            "3-5-2":   {"score": 78, "verdict": "GOOD",
                "reason": "2 strikers for direct balls. Wingbacks provide width and crosses."},
            "5-3-2":   {"score": 70, "verdict": "DECENT",
                "reason": "Workable but wingbacks underused in direct system."},
            "4-5-1":   {"score": 42, "verdict": "POOR",
                "reason": "Lone striker too isolated. Cannot win aerial battles alone."}
        }
    },

    "structured_press": {
        "label": "Structured Press",
        "icon": "🔄",
        "description": "Coordinated press with defensive shape",
        "weights": {
            "press_reliability":    0.25,
            "positional_integrity": 0.25,
            "attribute_upgrade":    0.25,
            "impact_score":         0.15,
            "stamina_decay":        0.10
        },
        "player_fit_formula": {
            "power_stamina":           0.25,
            "mentality_vision":        0.25,
            "pace":                    0.25,
            "attacking_short_passing": 0.25
        },
        "sub_language": {
            "urgency_phrase": "pressing structure losing coordination",
            "sub_on_phrase":  "restores press structure",
        },
        "formation_scores": {
            "4-3-3":   {"score": 85, "verdict": "GREAT",
                "reason": "Coordinated press triggers from front 3. Midfield covers second balls."},
            "4-4-2":   {"score": 78, "verdict": "GOOD",
                "reason": "2 strikers press in coordinated pairs. Effective and disciplined."},
            "4-2-3-1": {"score": 94, "verdict": "PERFECT",
                "reason": "Structured pressing lanes. 2 pivots clean up. CAM presses from front. The definitive structured press shape."},
            "3-5-2":   {"score": 65, "verdict": "DECENT",
                "reason": "Midfield press strong but back 3 exposed when press broken."},
            "5-3-2":   {"score": 38, "verdict": "TERRIBLE",
                "reason": "Too many defenders to press effectively. Shape too passive. Tactically incoherent combination."},
            "4-5-1":   {"score": 70, "verdict": "DECENT",
                "reason": "Midfield press decent but lone striker limits forward press triggers."}
        }
    }
}


def get_compatibility(playstyle: str, formation: str) -> dict:
    """Return compatibility score, verdict, and modifier for a playstyle+formation combo."""
    profile = PLAYSTYLES.get(playstyle, PLAYSTYLES["high_press"])
    compat = profile["formation_scores"].get(formation, {
        "score": 65, "verdict": "UNKNOWN", "reason": "No data for this formation."
    })
    score = compat["score"]

    if score >= 90:   modifier = 1.12
    elif score >= 80: modifier = 1.05
    elif score >= 70: modifier = 1.00
    elif score >= 55: modifier = 0.90
    elif score >= 40: modifier = 0.78
    else:             modifier = 0.65

    best_formation = max(
        profile["formation_scores"],
        key=lambda f: profile["formation_scores"][f]["score"]
    )

    return {
        "score":                    score,
        "verdict":                  compat["verdict"],
        "reason":                   compat["reason"],
        "win_probability_modifier": modifier,
        "is_conflict":              score < 50,
        "recommended_formation":    best_formation,
    }


def get_player_playstyle_fit(player: dict, playstyle: str) -> float:
    """Score 0–100: how well this player fits the playstyle's requirements."""
    profile = PLAYSTYLES.get(playstyle, PLAYSTYLES["high_press"])
    formula = profile["player_fit_formula"]
    score = 0.0
    for attr, weight in formula.items():
        if attr == "work_rate_att":
            wr = player.get("work_rate_att", "Medium")
            val = {"High": 90, "Medium": 65, "Low": 40}.get(wr, 65)
        else:
            val = float(player.get(attr, 65))
        score += val * weight
    return round(score, 1)
