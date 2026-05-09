"""
Master Recommender — Sprint 5 Intelligence Layer.
Ties all 5 modules together: playstyle profiles, pressing reliability,
upgrade delta, game state context, and Monte Carlo confidence.
"""
from .stamina_decay         import compute_stamina
from .playstyle_profiles    import PLAYSTYLES, get_compatibility, get_player_playstyle_fit
from .pressing_reliability  import calculate_pressing_reliability
from .upgrade_delta         import calculate_upgrade_delta
from .game_state            import analyse_game_state
from .monte_carlo           import simulate_sub_confidence

# ── Position group helpers (for bench compatibility filtering) ─────────────

POSITION_GROUPS: dict[str, list[str]] = {
    "GK":  ["GK"],
    "DEF": ["CB", "LB", "RB", "LWB", "RWB"],
    "MID": ["CDM", "CM", "LM", "RM", "LAM", "CAM", "RAM"],
    "ATT": ["ST", "CF", "LW", "RW"],
}

ADJACENT: dict[str, list[str]] = {
    "GK":  ["GK"],
    "DEF": ["DEF", "MID"],
    "MID": ["MID", "DEF", "ATT"],
    "ATT": ["ATT", "MID"],
}


def _get_group(pos: str) -> str:
    for g, slots in POSITION_GROUPS.items():
        if pos in slots:
            return g
    return "MID"


# ── Main entry point ───────────────────────────────────────────────────────

def get_recommendations(
    starting_xi:     list,
    bench:           list,
    home_score:      int,
    away_score:      int,
    is_home:         bool,
    minute:          int,
    manager_intent:  str,
    playstyle:       str,
    formation:       str,
    injured_players: list | None = None,
) -> dict:
    """
    Returns a dict:
      recommendations  : list of up-to-3 recommendation cards
      game_state       : game context dict
      compatibility    : playstyle+formation compatibility dict
      conflict_warning : None or warning card dict
      playstyle        : echo of input
      formation        : echo of input
      minute           : echo of input
    """
    if playstyle not in PLAYSTYLES:
        playstyle = "high_press"

    injured_set = {n.lower() for n in (injured_players or [])}

    # ── STEP 1: Formation/playstyle compatibility ──────────────────────────
    compatibility = get_compatibility(playstyle, formation)

    # ── STEP 2: Game state ─────────────────────────────────────────────────
    game_state = analyse_game_state(
        home_score, away_score, is_home,
        minute, playstyle, manager_intent
    )

    # ── STEP 3: Enrich starting XI with live match state ───────────────────
    xi_state = []
    for player in starting_xi:
        # Use minutes_played if > 0, otherwise use the match minute
        mp = player.get("minutes_played") or minute
        try:
            stamina_result = compute_stamina(
                player_name=player.get("name", ""),
                position=player.get("position", "CM"),
                minutes_played=int(mp),
            )
            stamina_pct    = stamina_result["stamina_pct"]
            stamina_status = stamina_result["stamina_status"]
        except Exception:
            stamina_pct    = max(0.0, 100.0 - minute * 0.4)
            stamina_status = "UNKNOWN"

        press  = calculate_pressing_reliability(player, stamina_pct, playstyle)
        ps_fit = get_player_playstyle_fit(player, playstyle)

        xi_state.append({
            **player,
            "stamina_pct":       stamina_pct,
            "stamina_status":    stamina_status,
            "press_reliability": press["press_reliability"],
            "press_status":      press["status"],
            "press_flag":        press["flag"],
            "is_press_leader":   press["is_press_leader"],
            "playstyle_fit":     ps_fit,
            "is_injured":        player.get("name", "").lower() in injured_set,
        })

    # ── STEP 4: Identify sub candidates (who comes OFF) ───────────────────
    candidates = []
    for p in xi_state:
        # Never sub GK unless injured
        if p.get("assigned_slot") == "GK" and not p["is_injured"]:
            continue

        urgency = 0
        reasons = []

        if p["is_injured"]:
            urgency = 100
            reasons.append("INJURED — immediate sub required")

        if p["stamina_pct"] < 40:
            urgency = max(urgency, 90)
            reasons.append(f"Critical stamina {p['stamina_pct']:.0f}%")
        elif p["stamina_pct"] < 60:
            urgency = max(urgency, 65)
            reasons.append(f"Low stamina {p['stamina_pct']:.0f}%")
        elif p["stamina_pct"] < 75:
            urgency = max(urgency, 30)
            reasons.append(f"Stamina {p['stamina_pct']:.0f}% — monitoring")

        if playstyle in ("high_press", "structured_press"):
            if p["press_reliability"] < 50:
                urgency = max(urgency, 80)
                if p["press_flag"]:
                    reasons.append(p["press_flag"])
            elif p["press_reliability"] < 65:
                urgency = max(urgency, 50)
                reasons.append(f"Press reliability {p['press_reliability']:.0f}%")

        if urgency > 0:
            candidates.append({**p, "urgency_score": urgency, "sub_reasons": reasons})

    candidates.sort(key=lambda x: x["urgency_score"], reverse=True)

    # ── STEP 5: Find best bench player for each candidate ─────────────────
    recommendations = []
    used_bench: set = set()

    for candidate in candidates[:3]:
        best       = None
        best_score = -9999.0

        cand_slot  = candidate.get("assigned_slot") or candidate.get("position", "CM")
        cand_group = _get_group(cand_slot)
        allowed    = ADJACENT.get(cand_group, ["MID"])

        for bp in bench:
            if bp.get("name") in used_bench:
                continue

            bp_pos   = bp.get("position", "CM")
            bp_group = _get_group(bp_pos)

            # Filter by positional compatibility
            if bp_group not in allowed:
                if not candidate["is_injured"]:
                    continue
                compat_risk = "emergency"
            elif bp_group == cand_group:
                compat_risk = "direct"
            else:
                compat_risk = "safe"

            # Game state position preference bonus
            preferred = game_state["preferred_positions"]
            avoided   = game_state["avoid_positions"]
            if bp_pos in preferred:
                gs_bonus = 15
            elif bp_pos in avoided and not candidate["is_injured"]:
                gs_bonus = -20
            else:
                gs_bonus = 0

            # Attribute upgrade delta
            delta = calculate_upgrade_delta(candidate, bp, cand_slot)

            # Playstyle fit for bench player
            ps_fit = get_player_playstyle_fit(bp, playstyle)

            # Impact score with fallback (instruction #4)
            impact = bp.get("impact_score")
            if not impact:
                impact = float(bp.get("overall", 70)) * 0.85

            # Monte Carlo simulation
            mc = simulate_sub_confidence(
                starter=candidate,
                bench_player=bp,
                stamina_pct=candidate["stamina_pct"],
                press_reliability=candidate["press_reliability"],
                upgrade_delta=delta,
                game_state=game_state,
                playstyle=playstyle,
                impact_score=impact,
            )

            # Final score weighted by playstyle
            w = PLAYSTYLES[playstyle]["weights"]

            press_base = (
                float(bp.get("pace", 65))                * 0.30 +
                float(bp.get("power_stamina", 65))       * 0.35 +
                float(bp.get("mentality_aggression", 65))* 0.25 +
                65                                        * 0.10
            )

            final_score = (
                w.get("press_reliability",    0) * press_base +
                w.get("stamina_decay",        0) * (100 - candidate["stamina_pct"]) +
                w.get("attribute_upgrade",    0) * delta["upgrade_score"] +
                w.get("impact_score",         0) * impact +
                w.get("game_state",           0) * (50 + gs_bonus) +
                w.get("positional_integrity", 0) * ps_fit +
                w.get("passing_quality",      0) * float(bp.get("passing", 65)) +
                w.get("pace_injection",       0) * float(bp.get("pace", 65)) +
                w.get("aerial_presence",      0) * float(bp.get("attacking_heading_accuracy", 65)) +
                w.get("physical_strength",    0) * float(bp.get("power_strength", 65)) +
                w.get("defensive_solidity",   0) * float(bp.get("defending", 65)) +
                w.get("defensive_compactness",0) * float(bp.get("defending", 65)) +
                w.get("individual_quality",   0) * float(bp.get("overall", 70)) +
                w.get("counter_readiness",    0) * float(bp.get("pace", 65)) +
                w.get("ball_retention",       0) * float(bp.get("skill_ball_control", 65))
            )

            if final_score > best_score:
                best_score = final_score
                best = {
                    "player":      bp,
                    "delta":       delta,
                    "mc":          mc,
                    "compat_risk": compat_risk,
                    "ps_fit":      ps_fit,
                    "gs_bonus":    gs_bonus,
                    "final_score": round(final_score, 1),
                }

        if not best:
            continue

        used_bench.add(best["player"].get("name"))

        sub_lang  = PLAYSTYLES[playstyle]["sub_language"]
        reasoning = _build_reasoning(
            candidate, best["player"],
            best["delta"], best["mc"],
            game_state, sub_lang,
        )

        recommendations.append({
            "rank": len(recommendations) + 1,
            "sub_off": {
                "name":              candidate.get("name", ""),
                "slot":              cand_slot,
                "stamina_pct":       round(candidate["stamina_pct"], 1),
                "stamina_status":    candidate.get("stamina_status", ""),
                "press_reliability": round(candidate["press_reliability"], 1),
                "press_flag":        candidate["press_flag"],
                "reasons":           candidate["sub_reasons"],
            },
            "sub_on": {
                "name":             best["player"].get("name", ""),
                "slot":             cand_slot,
                "overall":          best["player"].get("overall", 70),
                "playstyle_fit":    round(best["ps_fit"], 1),
                "tactical_profile": best["player"].get("tactical_profile", "🔄 Balanced"),
                "key_upgrade":      best["delta"]["key_upgrade"],
                "impact_score":     best["player"].get("impact_score") or float(best["player"].get("overall", 70)) * 0.85,
                "fc26_found":       best["player"].get("fc26_matched", False),
            },
            "upgrade_delta":  best["delta"],
            "monte_carlo":    best["mc"],
            "compatibility":  best["compat_risk"],
            "reasoning":      reasoning,
            "game_context":   game_state["tactical_description"],
        })

    # ── STEP 6: Conflict warning ───────────────────────────────────────────
    conflict_warning = None
    if compatibility["is_conflict"]:
        ps_label = PLAYSTYLES[playstyle]["label"]
        conflict_warning = {
            "message": (
                f"{ps_label} + {formation} is a poor tactical match "
                f"({compatibility['score']}/100)"
            ),
            "reason":                compatibility["reason"],
            "recommended_formation": compatibility["recommended_formation"],
            "win_probability_modifier": compatibility["win_probability_modifier"],
        }

    return {
        "recommendations":  recommendations,
        "game_state":       game_state,
        "compatibility":    compatibility,
        "conflict_warning": conflict_warning,
        "playstyle":        playstyle,
        "formation":        formation,
        "minute":           minute,
    }


# ── Backwards-compatibility shim (used by scenario_planner) ───────────────

def recommend_subs(
    starting_xi:           list,
    bench:                 list,
    scoreline:             tuple = (0, 0),
    minute:                int   = 60,
    manager_intent:        str   = "tactical_change",
    days_since_last_match: int | None = None,
    injured_players:       list | None = None,
) -> list:
    """Legacy wrapper — returns the recommendations list for scenario_planner."""
    home, away = scoreline
    result = get_recommendations(
        starting_xi=starting_xi, bench=bench,
        home_score=home, away_score=away, is_home=True,
        minute=minute, manager_intent=manager_intent,
        playstyle="high_press", formation="4-3-3",
        injured_players=injured_players or [],
    )
    return result.get("recommendations", [])


def _build_reasoning(
    starter:      dict,
    bench_player: dict,
    delta:        dict,
    mc:           dict,
    game_state:   dict,
    sub_lang:     dict,
) -> str:
    trigger    = sub_lang["urgency_phrase"]
    sub_phrase = sub_lang["sub_on_phrase"]
    key_upg    = delta.get("key_upgrade", "")
    wp         = mc["win_probability_delta"]
    conf       = mc["confidence_label"]
    context    = game_state["tactical_description"]

    starter_last = starter.get("name", "").split()[-1] if starter.get("name") else "?"
    bench_last   = bench_player.get("name", "").split()[-1] if bench_player.get("name") else "?"

    if key_upg:
        return (
            f"{starter_last} showing {trigger}. "
            f"{bench_last} {sub_phrase} — {key_upg}. "
            f"{context}. "
            f"+{wp}% win probability ({conf} confidence)"
        )
    return (
        f"{starter_last} showing {trigger}. "
        f"{bench_last} {sub_phrase}. "
        f"{context}. "
        f"+{wp}% win probability ({conf} confidence)"
    )
