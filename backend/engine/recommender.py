# SubHub — Football Substitution Intelligence Engine
# Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
# Unauthorised copying, distribution, or use is strictly prohibited.
# See LICENSE file for full terms.
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


# ── Strict position group lock (FIX 2) ────────────────────────────────────

STRICT_POSITION_GROUPS: dict[str, list[str]] = {
    "GK":  ["GK"],
    "DEF": ["CB", "LB", "RB", "LWB", "RWB"],
    "MID": ["CDM", "CM", "LM", "RM", "LAM", "CAM", "RAM"],
    "ATT": ["ST", "CF", "LW", "RW", "SS"],
}


def _get_strict_group(pos: str) -> str:
    for g, slots in STRICT_POSITION_GROUPS.items():
        if pos in slots:
            return g
    return "MID"


def _is_position_compatible(
    bench_pos: str,
    candidate_slot: str,
    is_injured: bool,
) -> tuple[bool, str]:
    """
    Hard position group lock — returns (compatible, risk_label).
    DEF can never fill ATT slot. ATT can never fill DEF slot (unless injury).
    GK is absolute — only GK replaces GK.
    """
    bench_group = _get_strict_group(bench_pos)
    slot_group  = _get_strict_group(candidate_slot)

    # GK rule — absolute
    if candidate_slot == "GK":
        return (True, "direct") if bench_pos == "GK" else (False, "invalid")
    if bench_pos == "GK":
        return False, "invalid"

    # ATT slot — only ATT or MID, NEVER DEF
    if slot_group == "ATT":
        if bench_group == "DEF":
            return False, "invalid"
        if bench_group == "ATT":
            return True, "direct"
        if bench_group == "MID":
            return True, "safe"

    # DEF slot — only DEF or MID; ATT only on injury emergency
    if slot_group == "DEF":
        if bench_group == "ATT":
            return (True, "emergency") if is_injured else (False, "invalid")
        if bench_group == "DEF":
            return True, "direct"
        if bench_group == "MID":
            return True, "safe"

    # MID slot — any non-GK allowed
    if slot_group == "MID":
        if bench_group == "GK":
            return False, "invalid"
        if bench_group == "MID":
            return True, "direct"
        if bench_group == "DEF":
            return True, "safe"
        if bench_group == "ATT":
            return True, "safe"

    return False, "invalid"


def _should_consider_subbing_off(
    player: dict,
    game_state: dict,
    stamina_pct: float,
) -> bool:
    """
    Game-state-aware gate: should this player be considered for subbing off?
    Returns False for players the tactical situation says should stay on.
    """
    slot       = player.get("assigned_slot", "CM")
    slot_group = _get_strict_group(slot)
    need       = game_state["tactical_need"]

    # RULE 1 — Never sub GK
    if slot == "GK":
        return False

    # RULE 2 — Chasing: keep ATT players on unless stamina critical
    if need in ("chase_game", "equalise", "desperate_equaliser",
                "all_out_attack", "chase_winner", "break_deadlock"):
        if slot_group == "ATT" and stamina_pct > 40:
            return False

    # RULE 3 — Protecting lead: keep DEF players on unless stamina critical
    if need in ("kill_game", "protect_lead", "defend_lead",
                "protect_narrow", "protect_comfortable"):
        if slot_group == "DEF" and stamina_pct > 50:
            return False

    # RULE 4 — Drawing late: keep CAM on unless stamina critical
    if need in ("chase_winner", "break_deadlock"):
        if slot == "CAM" and stamina_pct > 45:
            return False

    return True


def _timing_advice(candidate: dict, minute: int, game_state: dict) -> str:
    """Per-candidate sub-timing hint — dynamic, based on urgency_threshold from game state."""
    urgency_threshold = game_state.get("urgency_threshold", 65)
    current_stamina   = candidate.get("stamina_pct", 100)
    decay_per_min     = 0.4

    if current_stamina > urgency_threshold:
        mins_until_urgent = (current_stamina - urgency_threshold) / decay_per_min
        urgent_at_minute  = minute + int(mins_until_urgent)
        if urgent_at_minute <= 90:
            return f"⏱ Can wait — urgency rises at ~{urgent_at_minute}'"
        return "⏱ Can hold for remainder of match"
    return "⚡ Sub now — urgency is high"


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
            stamina_pct    = max(0.0, 100.0 - minute * 0.45)
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

        # Game-state-aware gate: skip players that should stay on
        if not _should_consider_subbing_off(p, game_state, p["stamina_pct"]):
            if not p["is_injured"]:
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

    # Sort bench by tactical need — preferred positions first
    _need              = game_state["tactical_need"]
    _preferred_in_need = game_state["preferred_positions"]
    if _need in (
        "desperate_equaliser", "all_out_attack", "chase_game", "chase_winner",
        "break_deadlock", "kill_game", "defend_lead", "protect_narrow",
    ):
        bench = sorted(
            bench,
            key=lambda bp: (
                0 if bp.get("position", "CM") in _preferred_in_need else 1,
                -float(bp.get("overall", 70)),
            ),
        )

    for candidate in candidates[:3]:
        best       = None
        best_score = -9999.0

        cand_slot   = candidate.get("assigned_slot") or candidate.get("position", "CM")
        att_allowed = game_state.get("att_allowed", True)

        for bp in bench:
            if bp.get("name") in used_bench:
                continue

            bp_pos   = bp.get("position", "CM")
            bp_group = _get_strict_group(bp_pos)

            # ── Hard gate: scenario-based position filter ─────────────────────
            if not att_allowed and bp_group == "ATT":
                if not candidate["is_injured"]:
                    continue   # ATT hard-excluded for this game state

            if bp_group == "DEF" and game_state.get("tactical_need") in (
                "all_out_attack", "desperate_equaliser", "chase_game", "chase_winner"
            ):
                if not candidate["is_injured"]:
                    continue   # DEF excluded when chasing the game

            # Strict position group lock
            compatible, compat_risk = _is_position_compatible(
                bp_pos, cand_slot, candidate["is_injured"]
            )
            if not compatible:
                continue

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

        print(
            f"[Rec #{len(recommendations)+1}] "
            f"Bench {best['player'].get('name','')} "
            f"({best['player'].get('position','?')}/{_get_strict_group(best['player'].get('position','CM'))}) "
            f"→ slot {cand_slot} ({_get_strict_group(cand_slot)}): {best['compat_risk']}"
        )
        used_bench.add(best["player"].get("name"))

        sub_lang  = PLAYSTYLES[playstyle]["sub_language"]
        reasoning = _build_reasoning(
            candidate, best["player"],
            best["delta"], best["mc"],
            game_state, sub_lang,
        )

        timing = _timing_advice(candidate, minute, game_state)

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
            "timing_advice":  timing,
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
