# SubHub — Football Substitution Intelligence Engine
# Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
# Unauthorised copying, distribution, or use is strictly prohibited.
# See LICENSE file for full terms.
"""
Formation Slots — optimal player-to-slot assignment using Hungarian algorithm.

Exports:
  FORMATION_SLOTS      : dict of formation → list of 11 slot labels
  SLOT_TO_FC26_COLUMN  : slot label → FC26 pos_rating column name
  POSITION_GROUPS      : group label → list of slot labels
  assign_players_to_slots(players, formation) → annotated list of 11 players
  reassign_for_formation(players, new_formation) → same players, new slots
"""
import numpy as np
from scipy.optimize import linear_sum_assignment
from .fc26_loader import get_player_attributes, get_player_versatility

# ── Formation definitions ──────────────────────────────────────────────────

FORMATION_SLOTS: dict[str, list[str]] = {
    "4-3-3":   ["GK","LB","CB","CB","RB",
                 "CM","CM","CM",
                 "LW","ST","RW"],

    "4-4-2":   ["GK","LB","CB","CB","RB",
                 "LM","CM","CM","RM",
                 "ST","ST"],

    "4-2-3-1": ["GK","LB","CB","CB","RB",
                 "CDM","CDM",
                 "LAM","CAM","RAM",
                 "ST"],

    "3-5-2":   ["GK","CB","CB","CB",
                 "LM","CM","CM","CM","RM",
                 "ST","ST"],

    "5-3-2":   ["GK","LWB","CB","CB","CB","RWB",
                 "CM","CM","CM",
                 "ST","ST"],

    "4-5-1":   ["GK","LB","CB","CB","RB",
                 "LM","CM","CM","CM","RM",
                 "ST"],

    "4-2-3-1 Wide":     ["GK","LB","LCB","RCB","RB",
                          "LDM","RDM",
                          "LM","CAM","RM",
                          "ST"],

    "4-2-3-1 Narrow":   ["GK","LB","LCB","RCB","RB",
                          "LDM","RDM",
                          "LCAM","CAM","RCAM",
                          "ST"],

    "4-1-2-1-2 Wide":   ["GK","LB","LCB","RCB","RB",
                          "CDM",
                          "LM","RM",
                          "CAM",
                          "LST","RST"],

    "4-1-2-1-2 Narrow": ["GK","LB","LCB","RCB","RB",
                          "CDM",
                          "LCM","RCM",
                          "CAM",
                          "LST","RST"],

    "4-4-1-1":          ["GK","LB","LCB","RCB","RB",
                          "LM","LCM","RCM","RM",
                          "CF","ST"],

    "4-2-2-2":          ["GK","LB","LCB","RCB","RB",
                          "LCDM","RCDM",
                          "LCAM","RCAM",
                          "LST","RST"],

    "4-3-1-2":          ["GK","LB","LCB","RCB","RB",
                          "LCM","CM","RCM",
                          "CAM",
                          "LST","RST"],

    "4-3-2-1":          ["GK","LB","LCB","RCB","RB",
                          "LCM","CM","RCM",
                          "LCF","RCF",
                          "ST"],

    "3-4-1-2":          ["GK","LCB","CB","RCB",
                          "LM","LCM","RCM","RM",
                          "CAM",
                          "LST","RST"],

    "3-4-2-1":          ["GK","LCB","CB","RCB",
                          "LM","LCM","RCM","RM",
                          "LCF","RCF",
                          "ST"],

    "3-1-4-2":          ["GK","LCB","CB","RCB",
                          "CDM",
                          "LM","LCM","RCM","RM",
                          "LST","RST"],

    "3-4-3":            ["GK","LCB","CB","RCB",
                          "LM","LCM","RCM","RM",
                          "LW","ST","RW"],

    "5-2-1-2":          ["GK","LWB","LCB","CB","RCB","RWB",
                          "LCM","RCM",
                          "CAM",
                          "LST","RST"],

    "5-2-2-1":          ["GK","LWB","LCB","CB","RCB","RWB",
                          "LCM","RCM",
                          "LCF","RCF",
                          "ST"],

    "5-4-1 Flat":       ["GK","LWB","LCB","CB","RCB","RWB",
                          "LM","LCM","RCM","RM",
                          "ST"],

    "5-4-1 Diamond":    ["GK","LWB","LCB","CB","RCB","RWB",
                          "CDM",
                          "LM","RM",
                          "CAM",
                          "ST"],
}

SLOT_TO_FC26_COLUMN: dict[str, str] = {
    "GK":  "pos_rating_gk",
    "LB":  "pos_rating_lb",
    "RB":  "pos_rating_rb",
    "CB":  "pos_rating_cb",
    "LWB": "pos_rating_lwb",
    "RWB": "pos_rating_rwb",
    "CDM": "pos_rating_cdm",
    "CM":  "pos_rating_cm",
    "LM":  "pos_rating_lm",
    "RM":  "pos_rating_rm",
    "LAM": "pos_rating_lam",
    "CAM": "pos_rating_cam",
    "RAM": "pos_rating_ram",
    "LW":  "pos_rating_lw",
    "RW":  "pos_rating_rw",
    "ST":  "pos_rating_st",
}

POSITION_GROUPS: dict[str, list[str]] = {
    "defensive": ["GK","CB","LB","RB","LWB","RWB"],
    "midfield":  ["CDM","CM","LM","RM","LAM","CAM","RAM"],
    "attacking": ["LW","RW","ST"],
}

# ── Position group helpers ─────────────────────────────────────────────────

# Maps football-data.org position code → broad group
_PLAYER_POS_GROUP: dict[str, str] = {
    "GK":  "defensive",
    "CB":  "defensive", "LCB": "defensive", "RCB": "defensive",
    "LB":  "defensive", "RB":  "defensive",
    "LWB": "defensive", "RWB": "defensive",
    "DM":  "midfield",  "CDM": "midfield",
    "CM":  "midfield",  "LCM": "midfield", "RCM": "midfield",
    "LM":  "midfield",  "RM":  "midfield",
    "CAM": "midfield",  "LAM": "midfield", "RAM": "midfield",
    "AM":  "midfield",
    "LW":  "attacking", "RW":  "attacking", "W":   "attacking",
    "ST":  "attacking", "CF":  "attacking", "SS":  "attacking",
}

# Maps formation slot → broad group
_SLOT_GROUP: dict[str, str] = {
    "GK":  "defensive",
    "LB":  "defensive", "RB":  "defensive", "CB":  "defensive",
    "LWB": "defensive", "RWB": "defensive",
    "CDM": "midfield",  "CM":  "midfield",
    "LM":  "midfield",  "RM":  "midfield",
    "LAM": "midfield",  "CAM": "midfield", "RAM": "midfield",
    "LW":  "attacking", "RW":  "attacking", "ST":  "attacking",
}


# ── Core helpers ───────────────────────────────────────────────────────────

def _slot_rating(attrs: dict | None, slot: str, player_pos: str) -> int:
    """
    Return the FC26 positional rating for this player in this formation slot.
    Falls back to group-based estimates when the specific column is absent.
    """
    player_grp = _PLAYER_POS_GROUP.get(player_pos.upper(), "midfield")
    slot_grp   = _SLOT_GROUP.get(slot, "midfield")
    col        = SLOT_TO_FC26_COLUMN.get(slot)

    if attrs and col:
        rating = attrs.get(col)
        if rating is not None:
            return int(rating)
        # FC26 matched but no rating for this specific slot (rare)
        overall = attrs.get("overall") or 70
        return max(50, overall - 10) if player_grp == slot_grp else max(30, overall - 20)

    # No FC26 data — use position-group defaults
    if slot == "GK":
        return 70 if player_pos.upper() == "GK" else 30
    return 70 if player_grp == slot_grp else 40


def _pressing_profile(attrs: dict | None) -> dict:
    if not attrs:
        return {
            "work_rate_attacking":   "Medium",
            "work_rate_defensive":   "Medium",
            "is_press_leader":       False,
            "press_reliability_score": 50.0,
        }
    pace       = attrs.get("pace") or 0
    stamina    = attrs.get("power_stamina") or 0
    aggression = attrs.get("mentality_aggression") or 0
    wr_att     = attrs.get("work_rate_attacking", "Medium")
    wr_def     = attrs.get("work_rate_defensive", "Medium")

    return {
        "work_rate_attacking":   wr_att,
        "work_rate_defensive":   wr_def,
        "is_press_leader":       (wr_att == "High" and pace >= 78 and stamina >= 75),
        "press_reliability_score": round(pace * 0.3 + stamina * 0.4 + aggression * 0.3, 1),
    }


# ── Formation balance lookup (for sanity checks) ──────────────────────────

_FORMATION_BALANCE: dict[str, dict[str, int]] = {
    "4-3-3":   {"gk": 1, "def": 4, "mid": 3, "att": 3},
    "4-4-2":   {"gk": 1, "def": 4, "mid": 4, "att": 2},
    "4-2-3-1": {"gk": 1, "def": 4, "mid": 5, "att": 1},
    "3-5-2":   {"gk": 1, "def": 3, "mid": 5, "att": 2},
    "5-3-2":   {"gk": 1, "def": 5, "mid": 3, "att": 2},
    "4-5-1":   {"gk": 1, "def": 4, "mid": 5, "att": 1},
}

_DEF_SLOTS = {"LB","CB","RB","LWB","RWB"}
_MID_SLOTS = {"CDM","CM","LM","RM","LAM","CAM","RAM"}
_ATT_SLOTS = {"LW","RW","ST"}


def _sanity_check(result: list[dict], formation: str) -> None:
    """Log any formation balance or constraint violations."""
    # RULE 1 & 2: exactly 1 GK, only a GK player in GK slot
    gk_slots   = [p for p in result if p.get("assigned_slot") == "GK"]
    gk_players = [p for p in result if p.get("position","").upper() == "GK"]
    if len(gk_slots) != 1:
        print(f"[SANITY] GK slot count = {len(gk_slots)} ≠ 1")
    for p in gk_slots:
        if p.get("position","").upper() != "GK":
            print(f"[SANITY] Non-GK player {p['name']} assigned to GK slot!")

    # RULE 3: formation balance
    expected = _FORMATION_BALANCE.get(formation)
    if expected:
        actual = {
            "gk":  sum(1 for p in result if p.get("assigned_slot") == "GK"),
            "def": sum(1 for p in result if p.get("assigned_slot") in _DEF_SLOTS),
            "mid": sum(1 for p in result if p.get("assigned_slot") in _MID_SLOTS),
            "att": sum(1 for p in result if p.get("assigned_slot") in _ATT_SLOTS),
        }
        for grp, exp in expected.items():
            if actual[grp] != exp:
                print(f"[SANITY] {formation} balance fail: {grp} expected {exp}, got {actual[grp]}")


# ── Assignment engine ──────────────────────────────────────────────────────

def assign_players_to_slots(players: list[dict], formation: str = "4-3-3") -> list[dict]:
    """
    Optimally assign 11 players to the 11 slots of a formation using the
    Hungarian algorithm (minimise total positional-rating cost).

    Returns 11 player dicts in SLOT ORDER (index 0 = slot 0 of the formation),
    each annotated with:
      assigned_slot, slot_rating, position_fit,
      is_natural, versatility, pressing_profile
    """
    slots = FORMATION_SLOTS.get(formation, FORMATION_SLOTS["4-3-3"])
    n, m  = len(players), len(slots)

    if n != 11 or m != 11:
        return _fallback_annotate(players, slots)

    # Pre-fetch all FC26 attrs once
    all_attrs = [get_player_attributes(p["name"]) for p in players]

    # Build 11×11 cost matrix
    cost = np.full((n, m), 100.0)
    for i, (player, attrs) in enumerate(zip(players, all_attrs)):
        pos   = player.get("position", "CM").upper()
        is_gk = pos == "GK"
        for j, slot in enumerate(slots):
            slot_is_gk = slot == "GK"
            if slot_is_gk != is_gk:          # hard GK constraint
                cost[i][j] = 9999.0
                continue
            cost[i][j] = 100.0 - _slot_rating(attrs, slot, pos)

    # Solve: Hungarian algorithm
    row_ind, col_ind = linear_sum_assignment(cost)

    # ── DEBUG: assignment report ──────────────────────────────────────────
    print(f"=== FORMATION ASSIGNMENT REPORT ===")
    print(f"Formation: {formation}")
    for i, j in zip(row_ind, col_ind):
        p   = players[i]
        sl  = slots[j]
        sr  = _slot_rating(all_attrs[i], sl, p.get("position","CM").upper())
        print(f"  {p['name']:<26} → {sl:<5} (rating: {sr})")
    print(f"===================================")

    # Build result in slot order
    slot_to_player: dict[int, dict] = {}
    for i, j in zip(row_ind, col_ind):
        player  = dict(players[i])
        attrs   = all_attrs[i]
        slot    = slots[j]
        pos     = player.get("position", "CM").upper()
        overall = player.get("overall", 70)
        sr      = _slot_rating(attrs, slot, pos)

        # Base fit from rating delta
        if sr >= overall - 3:
            fit = "natural"
        elif sr >= overall - 8:
            fit = "comfortable"
        else:
            fit = "stretched"

        # RULE 4: cross-group assignment → always "stretched"
        fc26_pos   = (attrs.get("primary_position") if attrs else None) or pos
        player_grp = _PLAYER_POS_GROUP.get(fc26_pos.upper(), "midfield")
        slot_grp   = _SLOT_GROUP.get(slot, "midfield")
        if player_grp != slot_grp and pos != "GK":
            fit = "stretched"
            print(f"[INFO] Cross-group: {player['name']} ({player_grp}) → {slot} ({slot_grp})")

        player["assigned_slot"]    = slot
        player["slot_rating"]      = sr
        player["is_natural"]       = fit == "natural"
        player["position_fit"]     = fit
        player["versatility"]      = get_player_versatility(player["name"])
        player["pressing_profile"] = _pressing_profile(attrs)

        slot_to_player[j] = player

    result = [slot_to_player[j] for j in range(m)]

    # RULE 1-3 sanity checks
    _sanity_check(result, formation)

    return result


def reassign_for_formation(players: list[dict], new_formation: str) -> list[dict]:
    """
    Re-run slot assignment for the SAME set of players under a different formation.
    Players do not change; only assigned_slot values shift.
    """
    return assign_players_to_slots(players, new_formation)


# ── Bench enrichment ───────────────────────────────────────────────────────

def enrich_bench_player(player: dict) -> dict:
    """Add versatility, pressing_profile, best_slot, best_slot_rating to a bench player."""
    player = dict(player)
    attrs  = get_player_attributes(player["name"])
    vers   = get_player_versatility(player["name"])

    player["versatility"]      = vers
    player["pressing_profile"] = _pressing_profile(attrs)
    player["best_slot"]        = vers[0][0] if vers else player.get("position", "CM")
    player["best_slot_rating"] = vers[0][1] if vers else player.get("overall", 70)

    return player


# ── Fallback (< 11 players edge case) ─────────────────────────────────────

def _fallback_annotate(players: list[dict], slots: list[str]) -> list[dict]:
    """Simple in-order annotation when we don't have exactly 11 players."""
    result = []
    for i, player in enumerate(players):
        player = dict(player)
        slot   = slots[i] if i < len(slots) else player.get("position", "CM")
        attrs  = get_player_attributes(player["name"])
        pos    = player.get("position", "CM").upper()
        sr     = _slot_rating(attrs, slot, pos)
        overall = player.get("overall", 70)

        fit = ("natural" if sr >= overall - 3 else
               "comfortable" if sr >= overall - 8 else "stretched")

        player["assigned_slot"]    = slot
        player["slot_rating"]      = sr
        player["is_natural"]       = fit == "natural"
        player["position_fit"]     = fit
        player["versatility"]      = get_player_versatility(player["name"])
        player["pressing_profile"] = _pressing_profile(attrs)
        result.append(player)
    return result
