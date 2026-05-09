"""
FC26 Data Loader — loads FC26_20250921.csv once at startup, indexes by name.
All lookups are fuzzy-matched against short_name using difflib.
"""
import csv
import os
from difflib import get_close_matches
from functools import lru_cache
from pathlib import Path

CSV_PATH = Path(__file__).resolve().parents[2] / "data" / "FC26_20250921.csv"

TARGET_LEAGUES = {
    "Premier League", "Bundesliga", "La Liga", "Serie A",
    "Ligue 1", "Primeira Liga", "Eredivisie",
}

# Position rating columns (as they appear in CSV)
POS_RATING_COLS = [
    "ls","st","rs","lw","lf","cf","rf","rw",
    "lam","cam","ram","lm","lcm","cm","rcm","rm",
    "lwb","ldm","cdm","rdm","rwb","lb","lcb","cb","rcb","rb","gk",
]

# Attribute columns to load (numeric)
ATTR_COLS = [
    "overall","pace","shooting","passing","dribbling","defending","physic",
    "attacking_crossing","attacking_finishing","attacking_heading_accuracy",
    "attacking_short_passing","attacking_volleys","skill_dribbling",
    "mentality_positioning","movement_sprint_speed",
    "skill_ball_control","skill_long_passing","skill_curve",
    "mentality_vision","mentality_interceptions","movement_reactions",
    "skill_fk_accuracy","power_stamina",
    "defending_marking_awareness","defending_standing_tackle",
    "defending_sliding_tackle","mentality_aggression","power_strength",
    "power_jumping","movement_acceleration","movement_agility",
    "goalkeeping_diving","goalkeeping_handling","goalkeeping_kicking",
    "goalkeeping_positioning","goalkeeping_reflexes",
]

# Position profile definitions
POSITION_PROFILES: dict[str, dict] = {
    "ST":  {
        "key_attrs": ["attacking_finishing","mentality_positioning","movement_sprint_speed",
                      "attacking_heading_accuracy","skill_dribbling"],
        "pos_rating_col": "st", "label": "Attacking",
    },
    "CF":  {
        "key_attrs": ["attacking_finishing","mentality_positioning","skill_dribbling",
                      "movement_sprint_speed","attacking_volleys"],
        "pos_rating_col": "cf", "label": "Attacking",
    },
    "SS":  {
        "key_attrs": ["attacking_finishing","mentality_positioning","skill_dribbling",
                      "movement_sprint_speed","attacking_volleys"],
        "pos_rating_col": "st", "label": "Attacking",
    },
    "LW":  {
        "key_attrs": ["movement_sprint_speed","movement_acceleration","skill_dribbling",
                      "attacking_crossing","attacking_finishing"],
        "pos_rating_col": "lw", "label": "Wide Attack",
    },
    "RW":  {
        "key_attrs": ["movement_sprint_speed","movement_acceleration","skill_dribbling",
                      "attacking_crossing","attacking_finishing"],
        "pos_rating_col": "rw", "label": "Wide Attack",
    },
    "W":   {
        "key_attrs": ["movement_sprint_speed","movement_acceleration","skill_dribbling",
                      "attacking_crossing","attacking_finishing"],
        "pos_rating_col": "lw", "label": "Wide Attack",
    },
    "CAM": {
        "key_attrs": ["mentality_vision","skill_ball_control","attacking_short_passing",
                      "skill_long_passing","mentality_positioning"],
        "pos_rating_col": "cam", "label": "Creative",
    },
    "LAM": {
        "key_attrs": ["mentality_vision","skill_ball_control","attacking_short_passing",
                      "skill_long_passing","mentality_positioning"],
        "pos_rating_col": "lam", "label": "Creative",
    },
    "RAM": {
        "key_attrs": ["mentality_vision","skill_ball_control","attacking_short_passing",
                      "skill_long_passing","mentality_positioning"],
        "pos_rating_col": "ram", "label": "Creative",
    },
    "AM":  {
        "key_attrs": ["mentality_vision","skill_ball_control","attacking_short_passing",
                      "skill_long_passing","mentality_positioning"],
        "pos_rating_col": "cam", "label": "Creative",
    },
    "CM":  {
        "key_attrs": ["skill_ball_control","mentality_vision","power_stamina",
                      "attacking_short_passing","mentality_interceptions"],
        "pos_rating_col": "cm", "label": "Box-to-Box",
    },
    "LCM": {
        "key_attrs": ["skill_ball_control","mentality_vision","power_stamina",
                      "attacking_short_passing","mentality_interceptions"],
        "pos_rating_col": "lcm", "label": "Box-to-Box",
    },
    "RCM": {
        "key_attrs": ["skill_ball_control","mentality_vision","power_stamina",
                      "attacking_short_passing","mentality_interceptions"],
        "pos_rating_col": "rcm", "label": "Box-to-Box",
    },
    "DM":  {
        "key_attrs": ["mentality_interceptions","defending_marking_awareness",
                      "defending_standing_tackle","skill_ball_control","power_stamina"],
        "pos_rating_col": "cdm", "label": "Defensive",
    },
    "CDM": {
        "key_attrs": ["mentality_interceptions","defending_marking_awareness",
                      "defending_standing_tackle","skill_ball_control","power_stamina"],
        "pos_rating_col": "cdm", "label": "Defensive",
    },
    "LM":  {
        "key_attrs": ["movement_sprint_speed","attacking_crossing","skill_dribbling",
                      "power_stamina","attacking_short_passing"],
        "pos_rating_col": "lm", "label": "Wide Mid",
    },
    "RM":  {
        "key_attrs": ["movement_sprint_speed","attacking_crossing","skill_dribbling",
                      "power_stamina","attacking_short_passing"],
        "pos_rating_col": "rm", "label": "Wide Mid",
    },
    "LB":  {
        "key_attrs": ["movement_sprint_speed","defending_standing_tackle",
                      "defending_marking_awareness","attacking_crossing","power_stamina"],
        "pos_rating_col": "lb", "label": "Fullback",
    },
    "RB":  {
        "key_attrs": ["movement_sprint_speed","defending_standing_tackle",
                      "defending_marking_awareness","attacking_crossing","power_stamina"],
        "pos_rating_col": "rb", "label": "Fullback",
    },
    "FB":  {
        "key_attrs": ["movement_sprint_speed","defending_standing_tackle",
                      "defending_marking_awareness","attacking_crossing","power_stamina"],
        "pos_rating_col": "lb", "label": "Fullback",
    },
    "LWB": {
        "key_attrs": ["movement_sprint_speed","defending_standing_tackle",
                      "attacking_crossing","power_stamina","skill_dribbling"],
        "pos_rating_col": "lwb", "label": "Wing Back",
    },
    "RWB": {
        "key_attrs": ["movement_sprint_speed","defending_standing_tackle",
                      "attacking_crossing","power_stamina","skill_dribbling"],
        "pos_rating_col": "rwb", "label": "Wing Back",
    },
    "CB":  {
        "key_attrs": ["defending_marking_awareness","defending_standing_tackle",
                      "defending_sliding_tackle","power_jumping","power_strength"],
        "pos_rating_col": "cb", "label": "Defensive",
    },
    "LCB": {
        "key_attrs": ["defending_marking_awareness","defending_standing_tackle",
                      "defending_sliding_tackle","power_jumping","power_strength"],
        "pos_rating_col": "lcb", "label": "Defensive",
    },
    "RCB": {
        "key_attrs": ["defending_marking_awareness","defending_standing_tackle",
                      "defending_sliding_tackle","power_jumping","power_strength"],
        "pos_rating_col": "rcb", "label": "Defensive",
    },
    "GK":  {
        "key_attrs": ["goalkeeping_reflexes","goalkeeping_positioning",
                      "goalkeeping_handling","goalkeeping_diving","goalkeeping_kicking"],
        "pos_rating_col": "gk", "label": "Goalkeeper",
    },
}


def _parse_pos_rating(val: str) -> int | None:
    """Parse '86+3' or '79' → 86. Returns None if blank/invalid."""
    if not val or not val.strip():
        return None
    try:
        return int(str(val).split("+")[0].split("-")[0].strip())
    except (ValueError, IndexError):
        return None


def _safe_int(val: str) -> int | None:
    try:
        return int(str(val).strip())
    except (ValueError, TypeError):
        return None


def _tactical_tag(row: dict) -> str | None:
    pos  = (row.get("player_positions") or "").upper()
    def v(k): return row.get(k) or 0

    if v("power_strength") > 83 and v("power_jumping") > 80:
        return "💪 Physical Presence"
    if v("movement_sprint_speed") > 85:
        return "⚡ Pace Injection"
    if "ST" in pos or "CF" in pos:
        if v("attacking_finishing") > 82:
            return "🎯 Clinical Finishing"
    if "CAM" in pos or "CM" in pos:
        if v("mentality_vision") > 83:
            return "🧠 Creative Playmaker"
        if v("power_stamina") > 85:
            return "⚙️ Engine"
    if "CB" in pos or "CDM" in pos or "DM" in pos:
        if v("defending") and int(v("defending")) > 80:
            return "🔒 Defensive Solidity"
    return None


# Map every FC26 position-rating column to its canonical formation slot
FC26_COL_TO_CANONICAL: dict[str, str] = {
    "gk":  "GK",
    "lb":  "LB",  "rb":  "RB",
    "cb":  "CB",  "lcb": "CB",  "rcb": "CB",
    "lwb": "LWB", "rwb": "RWB",
    "ldm": "CDM", "cdm": "CDM", "rdm": "CDM",
    "lcm": "CM",  "cm":  "CM",  "rcm": "CM",
    "lm":  "LM",  "rm":  "RM",
    "lam": "LAM", "cam": "CAM", "ram": "RAM",
    "lw":  "LW",  "lf":  "LW",
    "rw":  "RW",  "rf":  "RW",
    "ls":  "ST",  "st":  "ST",  "rs":  "ST",  "cf": "ST",
}

# ── Module-level singleton ────────────────────────────────────────────────

_db: dict[str, dict] = {}          # short_name → row dict
_all_names: list[str] = []         # for fuzzy matching

MANUAL_MAP: dict[str, str] = {
    "Mohamed Salah":    "M. Salah",
    "Virgil van Dijk":  "V. van Dijk",
    "Sadio Mané":       "S. Mané",
    "Roberto Firmino":  "R. Firmino",
    "Alisson":          "Alisson",
    "Trent Alexander-Arnold": "T. Alexander-Arnold",
    "Kevin De Bruyne":  "K. De Bruyne",
    "Erling Haaland":   "E. Haaland",
    "Kylian Mbappé":    "K. Mbappé",
    "Robert Lewandowski": "R. Lewandowski",
    "Lamine Yamal":     "L. Yamal",
    "Pedri":            "Pedri",
    "Gavi":             "Gavi",
    "Pablo Gavira":     "Gavi",        # football-data.org uses full legal name
    "Jamal Musiala":    "J. Musiala",
    "Harry Kane":       "H. Kane",
    "Bukayo Saka":      "B. Saka",
    "Phil Foden":       "P. Foden",
    "Son Heung-min":    "Son Heung-min",
    "Jude Bellingham":  "J. Bellingham",
}


def _load():
    global _db, _all_names
    if _db:
        return  # already loaded

    if not CSV_PATH.exists():
        print(f"[FC26] WARNING: CSV not found at {CSV_PATH}")
        return

    count = 0
    with open(CSV_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            league = row.get("league_name", "")
            if league not in TARGET_LEAGUES:
                continue

            # Parse work rate ("High/Medium" → two fields)
            wr = row.get("work_rate", "")
            if "/" in wr:
                wr_parts = wr.split("/", 1)
                wr_att = wr_parts[0].strip()
                wr_def = wr_parts[1].strip()
            else:
                wr_att, wr_def = "Medium", "Medium"

            # Parse player_positions ("CAM, CM, LW" → list)
            pos_str  = row.get("player_positions", "")
            pos_list = [p.strip() for p in pos_str.split(",") if p.strip()]

            parsed: dict = {
                "short_name":            row.get("short_name", ""),
                "long_name":             row.get("long_name", ""),
                "club_name":             row.get("club_name", ""),
                "league_name":           league,
                "player_positions":      pos_str,
                "primary_position":      pos_list[0] if pos_list else "",
                "alternate_positions":   pos_list[1:] if len(pos_list) > 1 else [],
                "work_rate_attacking":   wr_att,
                "work_rate_defensive":   wr_def,
                "overall":               _safe_int(row.get("overall")),
            }

            # Numeric attributes
            for col in ATTR_COLS:
                parsed[col] = _safe_int(row.get(col))

            # Position ratings
            for col in POS_RATING_COLS:
                parsed[f"pos_rating_{col}"] = _parse_pos_rating(row.get(col))

            # Tactical tag
            parsed["tactical_profile"] = _tactical_tag(parsed)

            key = parsed["short_name"]
            if key:
                _db[key] = parsed
                count += 1

    _all_names = list(_db.keys())
    print(f"[FC26] Loaded {count} players from target leagues.")


# Load immediately on module import
_load()


# ── Public API ─────────────────────────────────────────────────────────────

def get_player_attributes(player_name: str) -> dict | None:
    """
    Fuzzy-match player_name against FC26 short_name.
    Returns full attribute dict or None.
    """
    if not player_name or not _db:
        return None

    # 1. Manual alias
    candidate = MANUAL_MAP.get(player_name)
    if candidate and candidate in _db:
        return _db[candidate]

    # 2. Exact match
    if player_name in _db:
        return _db[player_name]

    # 3. Fuzzy match
    matches = get_close_matches(player_name, _all_names, n=1, cutoff=0.6)
    if matches:
        return _db[matches[0]]

    # 4. Last-name match (handles "Salah" → "M. Salah")
    last = player_name.split()[-1] if player_name else ""
    if last:
        candidates = [n for n in _all_names if n.endswith(last)]
        if len(candidates) == 1:
            return _db[candidates[0]]
        # Multiple hits: fuzzy among them
        sub_match = get_close_matches(player_name, candidates, n=1, cutoff=0.4)
        if sub_match:
            return _db[sub_match[0]]

    print(f"[FC26] No match: {player_name!r}")
    return None


def get_position_profile(player_name: str, position: str) -> dict:
    """
    Return FC26 attributes scoped to a given position profile,
    with pos_rating and tactical_profile.
    """
    attrs   = get_player_attributes(player_name)
    profile = POSITION_PROFILES.get(position.upper(), POSITION_PROFILES["CM"])

    if attrs is None:
        return {
            "fc26_found":       False,
            "overall":          None,
            "pos_rating":       None,
            "tactical_profile": None,
            "key_attrs":        {},
            "label":            profile["label"],
        }

    key_vals = {k: attrs.get(k) for k in profile["key_attrs"]}
    pos_col  = profile["pos_rating_col"]
    pos_rating = attrs.get(f"pos_rating_{pos_col}")

    return {
        "fc26_found":        True,
        "overall":           attrs.get("overall"),
        "pos_rating":        pos_rating,
        "tactical_profile":  attrs.get("tactical_profile"),
        "key_attrs":         key_vals,
        "label":             profile["label"],
        "power_stamina":     attrs.get("power_stamina"),
        "movement_sprint_speed": attrs.get("movement_sprint_speed"),
    }


def get_player_versatility(player_name: str) -> list[tuple[str, int]]:
    """
    Return top 3 (canonical_slot, rating) tuples for player_name, sorted by rating DESC.
    Uses all FC26 position-rating columns, deduped to canonical slots (max per slot).

    Examples:
      Salah  → [("RW", 91), ("ST", 86), ("LW", 84)]
      Wirtz  → [("CAM", 88), ("LW", 85), ("CM", 82)]
      Kimmich→ [("CDM", 87), ("RB", 86), ("CM", 85)]
    """
    attrs = get_player_attributes(player_name)
    if not attrs:
        return []

    slot_max: dict[str, int] = {}
    for col in POS_RATING_COLS:
        canonical = FC26_COL_TO_CANONICAL.get(col)
        if not canonical:
            continue
        rating = attrs.get(f"pos_rating_{col}")
        if rating is not None:
            if canonical not in slot_max or rating > slot_max[canonical]:
                slot_max[canonical] = rating

    sorted_slots = sorted(slot_max.items(), key=lambda x: -x[1])
    return sorted_slots[:3]


def get_attribute_upgrade_delta(
    bench_name: str,
    starter_name: str,
    position: str,
) -> dict:
    """
    Compare bench player vs starter on key attrs for the given position.
    Returns upgrade_score (0-100) and per-attribute breakdown.
    """
    profile  = POSITION_PROFILES.get(position.upper(), POSITION_PROFILES["CM"])
    key_attrs = profile["key_attrs"]

    bench_attrs   = get_player_attributes(bench_name)
    starter_attrs = get_player_attributes(starter_name)

    if not bench_attrs or not starter_attrs:
        return {
            "upgrade_score": 50.0,
            "flag":          "unknown",
            "comparisons":   [],
        }

    comparisons = []
    positive_deltas = []
    for attr in key_attrs:
        bv = bench_attrs.get(attr) or 0
        sv = starter_attrs.get(attr) or 0
        delta = bv - sv
        comparisons.append({
            "attr":       attr.replace("_", " ").title(),
            "attr_key":   attr,
            "bench_val":  bv,
            "starter_val": sv,
            "delta":      delta,
            "is_upgrade": delta > 0,
        })
        positive_deltas.append(delta)

    if not positive_deltas:
        return {"upgrade_score": 50.0, "flag": "unknown", "comparisons": []}

    avg_delta = sum(positive_deltas) / len(positive_deltas)
    # Normalise: +10 delta ≈ 50 score, +20 ≈ 100, negative ≈ 0
    upgrade_score = max(0.0, min(100.0, 50.0 + avg_delta * 2.5))

    all_up   = all(d > 0 for d in positive_deltas)
    all_down = all(d < 0 for d in positive_deltas)
    flag = "Clear upgrade" if all_up else "Sideways sub" if all_down else "Mixed"

    return {
        "upgrade_score": round(upgrade_score, 1),
        "flag":          flag,
        "comparisons":   comparisons,
    }
