# SubHub — Football Substitution Intelligence Engine
# Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
# Unauthorised copying, distribution, or use is strictly prohibited.
# See LICENSE file for full terms.
"""
Monte Carlo Confidence Engine — 200-simulation win-probability delta.
"""
import random


def simulate_sub_confidence(
    starter:          dict,
    bench_player:     dict,
    stamina_pct:      float,
    press_reliability: float,
    upgrade_delta:    dict,
    game_state:       dict,
    playstyle:        str,
    impact_score:     float,
) -> dict:
    N             = 200
    wins_with     = 0
    wins_without  = 0

    for _ in range(N):
        # Without sub — tired starter continues
        fatigue    = (100 - stamina_pct) / 100
        press_pen  = (100 - press_reliability) / 100
        base_eff   = float(starter.get("overall", 70)) / 100
        eff_no_sub = (
            base_eff
            * (1 - fatigue   * 0.5)
            * (1 - press_pen * 0.3)
        )
        score_no_sub = eff_no_sub + random.gauss(0, 0.08)

        # With sub — fresh bench player enters
        bench_eff   = float(bench_player.get("overall", 70)) / 100
        impact_mod  = float(impact_score) / 100
        upgrade_mod = upgrade_delta["upgrade_score"] / 100
        urgency     = game_state["urgency_multiplier"]

        score_sub = (
            bench_eff   * 0.40 +
            impact_mod  * 0.35 +
            upgrade_mod * 0.25
        ) * urgency + random.gauss(0, 0.08)

        if score_no_sub > 0.52:
            wins_without += 1
        if score_sub > 0.52:
            wins_with += 1

    wp_without = wins_without / N
    wp_with    = wins_with    / N
    delta      = wp_with - wp_without

    has_impact  = impact_score is not None and impact_score > 0
    has_fc26_b  = bench_player.get("fc26_matched", False)
    has_fc26_s  = starter.get("fc26_matched", False)

    if has_impact and has_fc26_b and has_fc26_s:
        conf_label, conf_color = "HIGH",   "green"
    elif has_fc26_b or has_impact:
        conf_label, conf_color = "MEDIUM", "amber"
    else:
        conf_label, conf_color = "LOW",    "grey"

    return {
        "win_probability_delta":  round(delta * 100, 1),
        "win_prob_with_sub":      round(wp_with    * 100, 1),
        "win_prob_without_sub":   round(wp_without * 100, 1),
        "confidence_label":       conf_label,
        "confidence_color":       conf_color,
        "simulations_run":        N,
    }
