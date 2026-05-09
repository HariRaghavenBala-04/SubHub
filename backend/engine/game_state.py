# SubHub — Football Substitution Intelligence Engine
# Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
# Unauthorised copying, distribution, or use is strictly prohibited.
# See LICENSE file for full terms.
"""
Game State Engine — reads scoreline + minute to derive tactical context.
"""


def analyse_game_state(
    home_score:     int,
    away_score:     int,
    is_home:        bool,
    minute:         int,
    playstyle:      str,
    manager_intent: str,
) -> dict:
    our   = home_score if is_home else away_score
    their = away_score if is_home else home_score
    diff  = our - their

    if diff > 1:    state = "comfortable_win"
    elif diff == 1: state = "narrow_win"
    elif diff == 0: state = "drawing"
    elif diff == -1:state = "narrow_loss"
    else:           state = "losing_badly"

    if minute >= 80:   urgency = "CRITICAL"
    elif minute >= 70: urgency = "HIGH"
    elif minute >= 60: urgency = "MEDIUM"
    else:              urgency = "LOW"

    urgency_mult = {
        "CRITICAL": 1.5, "HIGH": 1.3, "MEDIUM": 1.1, "LOW": 1.0
    }[urgency]

    need = _tactical_need(state, minute, playstyle, manager_intent)

    return {
        "state":                state,
        "goal_diff":            diff,
        "urgency":              urgency,
        "urgency_multiplier":   urgency_mult,
        "tactical_need":        need["need"],
        "tactical_description": need["description"],
        "preferred_positions":  need["preferred"],
        "avoid_positions":      need["avoid"],
    }


def _tactical_need(state: str, minute: int, playstyle: str, intent: str) -> dict:
    if state == "comfortable_win" and minute > 70:
        return {
            "need": "kill_game",
            "description": "Protect lead — bring fresh legs to retain possession",
            "preferred": ["CDM", "CM", "CB"],
            "avoid":     ["ST", "LW", "RW"],
        }
    if state == "narrow_win" and minute > 75:
        return {
            "need": "protect_lead",
            "description": "Defend the lead — add defensive cover now",
            "preferred": ["CB", "CDM", "LB", "RB"],
            "avoid":     ["ST", "CAM"],
        }
    if state == "narrow_win":
        return {
            "need": "maintain_control",
            "description": "Stay disciplined — maintain shape and tempo",
            "preferred": ["CM", "CDM"],
            "avoid":     [],
        }
    if state == "drawing" and minute > 70:
        return {
            "need": "chase_win",
            "description": "Push for winner — inject attacking threat",
            "preferred": ["ST", "LW", "RW", "CAM"],
            "avoid":     ["CB"],
        }
    if state == "drawing":
        return {
            "need": "break_deadlock",
            "description": "Find the breakthrough — creative sub needed",
            "preferred": ["CAM", "LW", "RW", "CM"],
            "avoid":     [],
        }
    if state == "narrow_loss":
        return {
            "need": "equalise",
            "description": "Chase the game — attacking reinforcement needed",
            "preferred": ["ST", "LW", "RW", "CAM"],
            "avoid":     ["CB", "CDM"],
        }
    if state == "losing_badly":
        return {
            "need": "change_game",
            "description": "Change everything — complete tactical reset",
            "preferred": ["ST", "LW", "RW", "CAM"],
            "avoid":     ["CB"],
        }
    return {
        "need": "tactical_change",
        "description": "Tactical adjustment",
        "preferred": [],
        "avoid":     [],
    }
