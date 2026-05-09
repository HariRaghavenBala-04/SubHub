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
        "att_allowed":          need.get("att_allowed", True),
        "urgency_threshold":    need.get("urgency_threshold", 60),
    }


def _tactical_need(state: str, minute: int, playstyle: str, intent: str) -> dict:

    # ── WINNING COMFORTABLY (2+ goals) ────────────────────────────────────
    if state == "comfortable_win":
        if minute >= 80:
            return {
                "need": "kill_game",
                "description": "Kill the game — pure defensive cover now",
                "preferred": ["CB", "CDM", "LB", "RB"],
                "avoid": ["ST", "LW", "RW", "CAM"],
                "att_allowed": False,
                "urgency_threshold": 75,
            }
        elif minute >= 70:
            return {
                "need": "protect_comfortable",
                "description": "Protect lead — fresh defensive mid preferred",
                "preferred": ["CDM", "CM", "CB"],
                "avoid": ["ST", "LW", "RW"],
                "att_allowed": False,
                "urgency_threshold": 65,
            }
        else:
            return {
                "need": "maintain_advantage",
                "description": "Maintain advantage — tactical change or rest key players",
                "preferred": ["CM", "CDM", "LW", "RW"],
                "avoid": [],
                "att_allowed": True,
                "urgency_threshold": 55,
            }

    # ── WINNING NARROWLY (1 goal) ─────────────────────────────────────────
    if state == "narrow_win":
        if minute >= 85:
            return {
                "need": "defend_lead",
                "description": "Defend at all costs — CB or CDM only",
                "preferred": ["CB", "CDM", "LB", "RB"],
                "avoid": ["ST", "CAM", "LW", "RW"],
                "att_allowed": False,
                "urgency_threshold": 70,
            }
        elif minute >= 75:
            return {
                "need": "protect_narrow",
                "description": "Protect narrow lead — defensive reinforcement",
                "preferred": ["CDM", "CB", "CM"],
                "avoid": ["ST", "CAM"],
                "att_allowed": False,
                "urgency_threshold": 65,
            }
        elif minute >= 60:
            return {
                "need": "control_game",
                "description": "Control the game — midfield stability",
                "preferred": ["CM", "CDM"],
                "avoid": [],
                "att_allowed": True,
                "urgency_threshold": 55,
            }
        else:
            return {
                "need": "manage_lead",
                "description": "Manage the lead — balanced approach",
                "preferred": [],
                "avoid": [],
                "att_allowed": True,
                "urgency_threshold": 50,
            }

    # ── DRAWING ───────────────────────────────────────────────────────────
    if state == "drawing":
        if minute >= 75:
            return {
                "need": "chase_winner",
                "description": "Chase the winner — attacking sub urgently needed",
                "preferred": ["ST", "LW", "RW", "CAM"],
                "avoid": ["CB", "CDM"],
                "att_allowed": True,
                "urgency_threshold": 80,
            }
        elif minute >= 60:
            return {
                "need": "break_deadlock",
                "description": "Break the deadlock — creative attacking sub",
                "preferred": ["CAM", "LW", "RW", "ST"],
                "avoid": [],
                "att_allowed": True,
                "urgency_threshold": 65,
            }
        else:
            return {
                "need": "tactical_shift",
                "description": "Tactical shift — improve without risk",
                "preferred": ["CM", "CAM", "LW", "RW"],
                "avoid": [],
                "att_allowed": True,
                "urgency_threshold": 55,
            }

    # ── LOSING NARROWLY (1 goal down) ────────────────────────────────────
    if state == "narrow_loss":
        if minute >= 75:
            return {
                "need": "desperate_equaliser",
                "description": "Must equalise — maximum attacking threat",
                "preferred": ["ST", "LW", "RW", "CAM"],
                "avoid": ["CB", "LB", "RB"],
                "att_allowed": True,
                "urgency_threshold": 90,
            }
        elif minute >= 60:
            return {
                "need": "chase_game",
                "description": "Chase the game — attacking reinforcement",
                "preferred": ["ST", "LW", "RW", "CAM"],
                "avoid": ["CB"],
                "att_allowed": True,
                "urgency_threshold": 70,
            }
        else:
            return {
                "need": "tactical_response",
                "description": "Tactical response — quality attacking sub",
                "preferred": ["LW", "RW", "CAM", "ST"],
                "avoid": [],
                "att_allowed": True,
                "urgency_threshold": 60,
            }

    # ── LOSING BADLY (2+ goals down) ─────────────────────────────────────
    if state == "losing_badly":
        if minute >= 70:
            return {
                "need": "all_out_attack",
                "description": "All out attack — nothing to lose",
                "preferred": ["ST", "LW", "RW", "CAM"],
                "avoid": ["CB", "CDM", "LB", "RB"],
                "att_allowed": True,
                "urgency_threshold": 100,
            }
        else:
            return {
                "need": "tactical_reset",
                "description": "Tactical reset — need goals urgently",
                "preferred": ["ST", "CAM", "LW", "RW"],
                "avoid": ["CB"],
                "att_allowed": True,
                "urgency_threshold": 80,
            }

    return {
        "need": "tactical_change",
        "description": "Tactical adjustment",
        "preferred": [], "avoid": [],
        "att_allowed": True,
        "urgency_threshold": 60,
    }
