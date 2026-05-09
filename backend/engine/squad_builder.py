# SubHub — Football Substitution Intelligence Engine
# Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
# Unauthorised copying, distribution, or use is strictly prohibited.
# See LICENSE file for full terms.
"""
Squad Builder — builds Starting XI + bench from football-data.org API squad,
enriched with FC26 attributes via name-only lookup.

RULE: api_squad is the ONLY source of who is in the squad.
FC26 is a stats lookup table only — it NEVER adds or removes players.
Never filter or validate squad membership using FC26 club/league columns.
"""
from __future__ import annotations

import unicodedata
from collections import Counter, defaultdict
import numpy as np
import pandas as pd
from difflib import get_close_matches
from pathlib import Path
from scipy.optimize import linear_sum_assignment

from .formation_slots import FORMATION_SLOTS, SLOT_TO_FC26_COLUMN


def _norm(s: str) -> str:
    """Lowercase + strip diacritics (é→e, ü→u, etc.) + strip whitespace."""
    nfd = unicodedata.normalize("NFD", s)
    return "".join(c for c in nfd if unicodedata.category(c) != "Mn").lower().strip()


# Nickname / shortened-name overrides that can't be matched algorithmically.
# Key: normalised API name  →  Value: FC26 _name_lower  (or None to force no-match)
_MANUAL_MAP: dict[str, str | None] = {
    # Brazilian / single-name FC26 entries
    "vinicius junior":  "vini jr.",
    "brahim diaz":      "brahim",      # FC26 uses only the first name
    "alisson becker":   "alisson",
    "ederson moraes":   "ederson",
    "richarlison de andrade": "richarlison",
    "gabriel magalhaes":"gabriel",     # Arsenal CB — FC26 "Gabriel"
    "gabriel martinelli":"g. martinelli",
    "gabriel jesus":    "g. jesus",
    "rodrygo goes":     "rodrygo",
    "endrick felipe":   "endrick",
    "vitor roque":      "v. roque",
    "antony matheus":   "antony",
    # Abbreviated / compound-surname FC26 entries
    "trent alexander-arnold": "trent a.-arnold",
    "joe gomez":        "j. gomez",    # Prevent false match to lower-rated namesake
    "ruben dias":       "r. dias",
    "joao cancelo":     "j. cancelo",
    "joao pedro":       "j. pedro",
    "pedro neto":       "p. neto",
    "pedro":            "pedro",
    "bernardo silva":   "b. silva",
    "diogo jota":       "d. jota",
    "bruno fernandes":  "b. fernandes",
    "rafael leao":      "r. leao",
    "theo hernandez":   "t. hernandez",
    "lucas hernandez":  "l. hernandez",
    "ferran torres":    "f. torres",
    "ansu fati":        "ansu fati",
    "pedri gonzalez":   "pedri",
    "gavi paez":        "gavi",
    # Known by first name only in FC26
    "kaoru mitoma":     "mitoma",
    "leandro trossard": "trossard",
    "nicolas jackson":  "n. jackson",
    "mykhailo mudryk":  "mudryk",
    "moises caicedo":   "caicedo",
    "lautaro martinez": "l. martinez",
    "joaquin correa":   "j. correa",
    "victor osimhen":   "osimhen",
    "khvicha kvaratskhelia": "kvaratskhelia",
    "ademola lookman":  "lookman",
    "teun koopmeiners": "koopmeiners",
    # Accented names often dropped by API
    "inigo martinez":   "i. martinez",
    "alejandro grimaldo": "grimaldo",
    "alejandro baena":  "a. baena",
    "yerlan aiymbetov": None,          # no FC26 entry — prevent false match
}

# ── Load FC26 once at module level ─────────────────────────────────────────

_CSV = Path(__file__).resolve().parents[2] / "data" / "FC26_20250921.csv"

_POS_COLS = [
    "ls","st","rs","lw","lf","cf","rf","rw",
    "lam","cam","ram","lm","lcm","cm","rcm","rm",
    "lwb","ldm","cdm","rdm","rwb","lb","lcb","cb","rcb","rb","gk",
]

# All FC26 attributes needed by upgrade_delta, pressing_reliability, and scoring.
_FC26_ATTRS = [
    "pace", "shooting", "passing", "dribbling", "defending", "physic",
    "power_stamina", "power_strength", "power_jumping",
    "movement_sprint_speed", "movement_acceleration",
    "mentality_aggression", "mentality_vision", "mentality_positioning",
    "mentality_interceptions", "mentality_composure",
    "attacking_finishing", "attacking_crossing", "attacking_heading_accuracy",
    "attacking_short_passing",
    "skill_dribbling", "skill_ball_control", "skill_long_passing",
    "defending_marking_awareness", "defending_standing_tackle", "defending_sliding_tackle",
    "goalkeeping_reflexes", "goalkeeping_positioning", "goalkeeping_handling",
    "goalkeeping_diving", "goalkeeping_kicking",
]

# Load columns needed for stats plus league/club for filtering and lookup.
_LOAD_COLS = [
    "short_name", "long_name", "club_name", "league_name", "overall",
    "work_rate", "player_positions",
] + _FC26_ATTRS + _POS_COLS

# Filter to the 7 top leagues to prevent false-positive name matches.
# This does NOT restrict squad membership — API players outside these
# leagues still appear; they just fall back to default stats.
_TARGET_LEAGUES = {
    "Premier League", "Bundesliga", "La Liga", "Serie A",
    "Ligue 1", "Primeira Liga", "Eredivisie",
}

_FC26_NAMES: list[str] = []        # lowercased short_names (original) for fuzzy matching
_FC26_NAMES_NORM: list[str] = []   # accent-stripped names for normalised fuzzy matching
# Abbreviated-name index: (first_initial, norm_last) → _name_lower key in FC26_DF
# e.g. "F. Mendy" → ("f", "mendy") maps to "f. mendy"
_FC26_ABBREV: dict[tuple[str, str], str] = {}

try:
    _raw = pd.read_csv(_CSV, usecols=_LOAD_COLS, encoding="utf-8")
    FC26_DF = _raw[_raw["league_name"].isin(_TARGET_LEAGUES)].copy()
    FC26_DF["_name_lower"] = FC26_DF["short_name"].str.lower().str.strip()
    FC26_DF["_name_norm"]  = FC26_DF["_name_lower"].apply(_norm)
    # Where multiple rows share the same short_name, keep highest overall.
    FC26_DF = (
        FC26_DF.sort_values("overall", ascending=False)
               .drop_duplicates(subset=["_name_lower"], keep="first")
               .reset_index(drop=True)
    )
    _FC26_NAMES      = FC26_DF["_name_lower"].tolist()
    _FC26_NAMES_NORM = FC26_DF["_name_norm"].tolist()

    # Build abbreviation index for names matching pattern "X. Lastname"
    import re as _re
    _abbrev_pat = _re.compile(r'^([a-z])\.\s+(.+)$')
    for _, row in FC26_DF.iterrows():
        m = _abbrev_pat.match(row["_name_lower"])
        if m:
            key = (m.group(1), _norm(m.group(2)))
            # Only insert if unambiguous (first writer wins — already sorted by OVR DESC)
            if key not in _FC26_ABBREV:
                _FC26_ABBREV[key] = row["_name_lower"]

    print(f"[SquadBuilder] FC26 loaded: {len(FC26_DF)} players, "
          f"{len(_FC26_ABBREV)} abbreviated entries")
except Exception as e:
    print(f"[SquadBuilder] WARNING: could not load FC26 CSV — {e}")
    FC26_DF = pd.DataFrame()


# ── Position mapping ───────────────────────────────────────────────────────

_API_POS_MAP: dict[str, str] = {
    "Goalkeeper":         "GK",
    "Centre-Back":        "CB",
    "Left-Back":          "LB",
    "Right-Back":         "RB",
    "Left Midfield":      "LM",
    "Right Midfield":     "RM",
    "Defensive Midfield": "CDM",
    "Central Midfield":   "CM",
    "Attacking Midfield": "CAM",
    "Left Winger":        "LW",
    "Right Winger":       "RW",
    "Centre-Forward":     "ST",
    "Striker":            "ST",
    "Second Striker":     "SS",
    "Offence":            "ST",
    "Defence":            "CB",
    "Midfield":           "CM",
    "Attacker":           "ST",
    "Forward":            "ST",
    "Defender":           "CB",
}

def _map_pos(raw: str) -> str:
    return _API_POS_MAP.get(raw, "CM")


# ── Balanced XI selection constants ────────────────────────────────────────

# For each formation slot, ordered fallback groups of API positions.
# Defensive slots use STRICT ordering (first available group wins).
# Midfield/attack slots (CM, CDM, CAM, LW, RW, ST) compare best-OVR across groups.
SLOT_CANDIDATES: dict[str, list[list[str]]] = {
    "GK":  [["GK"]],
    "CB":  [["CB"], ["CDM"], ["CM"]],
    "LB":  [["LB"], ["LWB"], ["CB"], ["CM"]],
    "RB":  [["RB"], ["RWB"], ["CB"], ["CM"]],
    "LWB": [["LWB"], ["LB"], ["CB"]],
    "RWB": [["RWB"], ["RB"], ["CB"]],
    "CDM": [["CDM"], ["CM"], ["CB"]],
    "CM":  [["CM"], ["CDM"], ["CAM"], ["LM", "RM"]],
    "LM":  [["LM"], ["LW"], ["CM"]],
    "RM":  [["RM"], ["RW"], ["CM"]],
    "LAM": [["CAM"], ["LW", "CM"]],
    "CAM": [["CAM"], ["CM"], ["LW", "RW"]],
    "RAM": [["CAM"], ["RW", "CM"]],
    "LW":  [["LW"], ["LM"], ["ST", "CAM"]],
    "RW":  [["RW"], ["RM"], ["ST", "CAM"]],
    "ST":  [["ST"], ["LW", "RW"], ["CAM"]],
}

# Strict slots: always prefer natural position over a higher-OVR alternative.
# Only CM uses best-OVR across all midfield groups (CDM/CM/CAM compete freely).
_STRICT_SLOTS: frozenset[str] = frozenset({
    "GK",
    "LB", "RB", "LWB", "RWB", "CB",            # all defenders
    "LW", "RW", "ST",                            # attacking specialists
    "CDM", "LM", "RM", "LAM", "CAM", "RAM",     # midfield specialists (not CM)
})

# Slots where a CB should NEVER be placed (Rule 3 — enforced in cost matrix).
_NO_CB_SLOTS: frozenset[str] = frozenset({"CM", "CAM", "LAM", "RAM", "LM", "RM"})

# LB/RB can play LM/RM at a stretch but never central/attacking mid or wide-attacker wings.
# LWB/RWB are excluded — wing-backs legitimately play LW/RW.
_NO_FB_SLOTS: frozenset[str] = frozenset({"CM", "CAM", "LAM", "RAM", "LW", "RW"})
_FB_POSITIONS: frozenset[str] = frozenset({"LB", "RB"})

# Positions treated as "defenders" for bench balance check (Rule 6).
_DEF_POSITIONS: frozenset[str] = frozenset({"CB", "LB", "RB", "LWB", "RWB"})
_ATT_POSITIONS: frozenset[str] = frozenset({"ST", "LW", "RW", "LM", "RM", "CAM"})

# Order in which slot types are filled: specialists first, versatile CMs last.
_SELECTION_ORDER: list[str] = [
    "GK",
    "LB", "RB", "LWB", "RWB",
    "CB",
    "LW", "RW",
    "ST",
    "CDM",
    "LAM", "CAM", "RAM",
    "LM", "RM",
    "CM",
]


# ── FC26 stats lookup — name only, no club filtering ──────────────────────

# Exact API name → FC26 short_name overrides.
# Checked before any fuzzy logic; avoids wrong-player matches.
MANUAL_NAME_MAP: dict[str, str] = {
    "Joe Gomez":               "J. Gomez",
    "Alisson Becker":          "Alisson",
    "Virgil van Dijk":         "V. van Dijk",
    "Trent Alexander-Arnold":  "T. Alexander-Arnold",
    "Alexis Mac Allister":     "A. Mac Allister",
    "Mohamed Salah":           "M. Salah",
    "Ibrahima Konaté":         "I. Konaté",
    "Ryan Gravenberch":        "R. Gravenberch",
    "Andrew Robertson":        "A. Robertson",
    "Dominik Szoboszlai":      "D. Szoboszlai",
    "Cody Gakpo":              "C. Gakpo",
    "Conor Bradley":           "C. Bradley",
    "Curtis Jones":            "C. Jones",
    "Manuel Neuer":            "M. Neuer",
    "Harry Kane":              "H. Kane",
    "Jamal Musiala":           "J. Musiala",
    "Serge Gnabry":            "S. Gnabry",
    "Joshua Kimmich":          "J. Kimmich",
    "Leon Goretzka":           "L. Goretzka",
    "Dayot Upamecano":         "D. Upamecano",
    "Alphonso Davies":         "A. Davies",
    "Kingsley Coman":          "K. Coman",
    "Raphaël Guerreiro":       "R. Guerreiro",
    "João Palhinha":           "J. Palhinha",
    "Vinicius Junior":         "Vini Jr.",
    "Kylian Mbappé":           "K. Mbappé",
    "Jude Bellingham":         "J. Bellingham",
    "Federico Valverde":       "F. Valverde",
    "Aurélien Tchouaméni":     "A. Tchouaméni",
    "Eduardo Camavinga":       "E. Camavinga",
    "Éder Militão":            "É. Militão",
    "Antonio Rüdiger":         "A. Rüdiger",
    "David Alaba":             "D. Alaba",
    "Dani Carvajal":           "D. Carvajal",
    "Thibaut Courtois":        "T. Courtois",
    "Ferland Mendy":           "F. Mendy",
    "Rodrygo":                 "Rodrygo",
    "Robert Lewandowski":      "R. Lewandowski",
    "Frenkie de Jong":         "F. de Jong",
    "Marc-André ter Stegen":   "M. ter Stegen",
    "Ronald Araújo":           "R. Araújo",
    "Jules Koundé":            "J. Koundé",
    "Alejandro Balde":         "A. Balde",
    "Ilkay Gündogan":          "İ. Gündogan",
    "Raphinha":                "Raphinha",
    "Pedri":                   "Pedri",
    "Gavi":                    "Gavi",
    "Jan Oblak":               "J. Oblak",
    "Antoine Griezmann":       "A. Griezmann",
    "Koke":                    "Koke",
    "Thomas Lemar":            "T. Lemar",
    "Marcos Llorente":         "M. Llorente",
    "Stefan Savić":            "S. Savić",
    "José María Giménez":      "J.M. Giménez",
    "Casemiro":                "Casemiro",
    "Ederson":                 "Ederson",
    "Alisson":                 "Alisson",
}

_abbrev_re = __import__("re").compile(r"^[a-z]\.")

def _names_compatible(api_norm: str, fc26_norm: str) -> bool:
    """
    Return False if the names are clearly incompatible:
      - Both have full first names that differ significantly (ratio < 0.5), OR
      - Both have meaningful last names that differ significantly (ratio < 0.5).
    Abbreviated tokens (e.g. "j.") skip the relevant check.
    This prevents false matches like "David Alaba" → "David Raya"
    and "Íñigo Martínez" → "Toni Martínez".
    """
    from difflib import SequenceMatcher
    a = api_norm.split()
    f = fc26_norm.split()
    if len(a) < 2 or len(f) < 2:
        return True  # single-token names can't be judged

    # First-name check
    if not (_abbrev_re.match(a[0]) or _abbrev_re.match(f[0])):
        if SequenceMatcher(None, a[0], f[0]).ratio() < 0.5:
            return False

    # Last-name check (only for tokens of length ≥ 4)
    a_last, f_last = a[-1], f[-1]
    if (len(a_last) >= 4 and len(f_last) >= 4
            and not _abbrev_re.match(a_last) and not _abbrev_re.match(f_last)):
        if SequenceMatcher(None, a_last, f_last).ratio() < 0.5:
            return False

    return True


def _parse_rating(val) -> int:
    """Parse '86+3' → 86, NaN → 60."""
    try:
        return int(str(val).split("+")[0].split("-")[0].strip())
    except Exception:
        return 60


def _find_fc26(api_name: str) -> dict | None:
    """
    Look up FC26 stats for api_name using name-only matching.
    No club filtering — FC26 club columns are NEVER used.

    Strategy (in order):
      1. Manual map  — nickname overrides (e.g. "Vinicius Junior" → "Vini Jr.")
      2. Exact match — normalised lower-case
      3. Fuzzy match — cutoff 0.72 on normalised names
      4. Abbreviated-name match — "Ferland Mendy" → ("f","mendy") → "F. Mendy"
      5. Last-name fallback — single candidate or fuzzy sub-match at 0.72
    """
    if FC26_DF.empty:
        return None

    name_q      = api_name.lower().strip()
    name_q_norm = _norm(api_name)

    def _row(fc26_key: str) -> dict:
        return FC26_DF[FC26_DF["_name_lower"] == fc26_key].iloc[0].to_dict()

    # 0. MANUAL_NAME_MAP — exact API name → FC26 short_name (highest priority)
    mapped = MANUAL_NAME_MAP.get(api_name)
    if mapped:
        exact = FC26_DF[FC26_DF["short_name"] == mapped]
        if not exact.empty:
            print(f"[FC26] {api_name!r} → manual → {mapped!r}")
            return exact.iloc[0].to_dict()

    # 1. Legacy normalised manual map
    if name_q_norm in _MANUAL_MAP:
        target = _MANUAL_MAP[name_q_norm]
        if target is None:
            print(f"[FC26] {api_name!r} → manual no-match")
            return None
        matches = FC26_DF[FC26_DF["_name_lower"] == target]
        if not matches.empty:
            print(f"[FC26] {api_name!r} → manual map → {matches.iloc[0]['short_name']!r}")
            return matches.iloc[0].to_dict()

    # 2. Exact match (normalised)
    exact = FC26_DF[FC26_DF["_name_norm"] == name_q_norm]
    if not exact.empty:
        return exact.iloc[0].to_dict()

    # 3. Fuzzy match on normalised names (cutoff 0.72)
    #    Guard: reject if both sides have full first names that are clearly different
    #    (e.g. "Íñigo Martínez" must not match "Toni Martínez")
    hits = get_close_matches(name_q_norm, _FC26_NAMES_NORM, n=1, cutoff=0.72)
    if hits and _names_compatible(name_q_norm, hits[0]):
        row = FC26_DF[FC26_DF["_name_norm"] == hits[0]].iloc[0]
        print(f"[FC26] {api_name!r} → fuzzy → {row['short_name']!r}")
        return row.to_dict()

    # 4. Abbreviated-name match: "Ferland Mendy" → initial "f" + last "mendy"
    parts = name_q_norm.split()
    if len(parts) >= 2:
        key = (parts[0][0], parts[-1])   # (first_initial, norm_last)
        if key in _FC26_ABBREV:
            fc26_key = _FC26_ABBREV[key]
            row = FC26_DF[FC26_DF["_name_lower"] == fc26_key].iloc[0]
            print(f"[FC26] {api_name!r} → abbrev → {row['short_name']!r}")
            return row.to_dict()

    # 5. Last-name fallback — handles single-name players like "Alisson"
    last_norm = name_q_norm.split()[-1]
    ln_cands = [n for n in _FC26_NAMES_NORM if last_norm in n]
    if len(ln_cands) == 1:
        row = FC26_DF[FC26_DF["_name_norm"] == ln_cands[0]].iloc[0]
        print(f"[FC26] {api_name!r} → last-name → {row['short_name']!r}")
        return row.to_dict()
    if len(ln_cands) > 1:
        sub = get_close_matches(name_q_norm, ln_cands, n=1, cutoff=0.72)
        if sub and _names_compatible(name_q_norm, sub[0]):
            row = FC26_DF[FC26_DF["_name_norm"] == sub[0]].iloc[0]
            print(f"[FC26] {api_name!r} → last-name sub → {row['short_name']!r}")
            return row.to_dict()

    print(f"[FC26] No match: {api_name!r}")
    return None


# ── Balanced XI selection (Rules 1, 4, 5) ─────────────────────────────────

def _select_balanced_xi(enriched: list[dict], formation: str) -> list[dict]:
    """
    Select 11 players with positional balance enforced.

    Specialist defensive slots (GK, LB, RB, CB, LWB, RWB) are filled first
    using strict fallback — a natural player is always preferred even if a
    midfielder has a higher overall.  Midfield/attack slots then pick the
    best-OVR available across all their candidate groups so that, e.g.,
    a 90-rated CAM beats an 83-rated natural CM for a CM slot.
    """
    slots       = FORMATION_SLOTS.get(formation, FORMATION_SLOTS["4-3-3"])
    slot_counts = Counter(slots)

    # Group by API position, sorted by overall DESC
    by_pos: dict[str, list[dict]] = defaultdict(list)
    for p in enriched:
        by_pos[p["position"]].append(p)
    for pos in by_pos:
        by_pos[pos].sort(key=lambda x: x["overall"], reverse=True)

    used: set[str] = set()

    def _best_from(positions: list[str]) -> dict | None:
        """Best-OVR available player from the top of any listed position bucket."""
        best = None
        for pos in positions:
            for p in by_pos.get(pos, []):
                if p["name"] not in used:
                    if best is None or p["overall"] > best["overall"]:
                        best = p
                    break  # only compare the top-available from each bucket
        return best

    def _pick(slot: str) -> dict | None:
        groups = SLOT_CANDIDATES.get(slot, [["CM"]])

        if slot in _STRICT_SLOTS:
            # Strict: first group that has an available player wins.
            for group in groups:
                p = _best_from(group)
                if p:
                    used.add(p["name"])
                    return p
        else:
            # Best-OVR: collect top candidate from each group, return highest.
            candidates = [p for g in groups if (p := _best_from(g)) is not None]
            if candidates:
                best = max(candidates, key=lambda x: x["overall"])
                used.add(best["name"])
                return best

        # Emergency fallback: any remaining player
        remaining = sorted(
            (p for p in enriched if p["name"] not in used),
            key=lambda x: x["overall"], reverse=True,
        )
        if remaining:
            used.add(remaining[0]["name"])
            return remaining[0]
        return None

    selected: list[dict] = []
    for slot_type in _SELECTION_ORDER:
        for _ in range(slot_counts.get(slot_type, 0)):
            p = _pick(slot_type)
            if p:
                selected.append(p)

    return selected


# ── Bench balance (Rule 6) ─────────────────────────────────────────────────

def _balance_bench(
    bench: list[dict], reserves: list[dict]
) -> tuple[list[dict], list[dict]]:
    """
    Ensure the matchday bench has at least 1 GK, 1 defender, 1 attacker.
    If a category is missing, swap the lowest-OVR bench player for the best
    qualifying player from reserves.
    """
    checks = [
        (lambda b: any(p["position"] == "GK" for p in b),
         lambda p: p["position"] == "GK"),
        (lambda b: any(p["position"] in _DEF_POSITIONS for p in b),
         lambda p: p["position"] in _DEF_POSITIONS),
        (lambda b: any(p["position"] in _ATT_POSITIONS for p in b),
         lambda p: p["position"] in _ATT_POSITIONS),
    ]

    bench    = list(bench)
    reserves = list(reserves)

    for check, qualifies in checks:
        if not check(bench):
            best = next(
                (p for p in sorted(reserves, key=lambda x: x["overall"], reverse=True)
                 if qualifies(p)),
                None,
            )
            if best:
                bench_sorted = sorted(range(len(bench)), key=lambda i: bench[i]["overall"])
                swap_idx = bench_sorted[0]
                evicted  = bench[swap_idx]
                bench[swap_idx] = best
                reserves.remove(best)
                reserves.insert(0, evicted)
                reserves.sort(key=lambda x: x["overall"], reverse=True)
                print(f"[Bench] Added {best['name']} ({best['position']}) for balance; "
                      f"moved {evicted['name']} to reserves")

    return bench, reserves


# ── Main builder ───────────────────────────────────────────────────────────

def build_squad(api_squad: list[dict], team_name: str, formation: str = "4-3-3") -> dict:
    """
    api_squad : players from football-data.org — the ONLY source of squad membership.
    team_name : used only for logging.
    formation : formation key for slot assignment.

    Returns:
      starting_xi   : 11 players in SLOT ORDER (pitchPlayers[i] → slot i)
      bench         : matchday bench (top 7 remaining, ranks 12-18)
      reserves      : squad / reserves (ranks 19+)
      formation     : formation string
      total         : total squad size
    """
    # ── Squad verification log ────────────────────────────────────────────
    print(f"\n=== SQUAD BUILD: {team_name} ===")
    print(f"API returned {len(api_squad)} players:")
    for p in api_squad:
        print(f"  {p.get('name','?')} ({p.get('position','?')})")

    enriched: list[dict] = []
    unmatched = 0

    for p in api_squad:
        pos = _map_pos(p.get("position") or "")
        player: dict = {
            "id":               p.get("id"),
            "name":             p.get("name", ""),
            "position":         pos,
            "shirt_number":     p.get("shirtNumber"),
            "nationality":      p.get("nationality"),
            "minutes_played":   60,
            "is_injury_return": False,
            "fc26_matched":     False,
            "overall":          70,
            "work_rate_att":    "Medium",
            "work_rate_def":    "Medium",
            "pos_ratings":      {},
            # ── FC26 attribute defaults (all set to 65; overwritten on match) ──
            "pace": 65, "shooting": 65, "passing": 65,
            "dribbling": 65, "defending": 65, "physic": 65,
            "power_stamina": 65, "power_strength": 65, "power_jumping": 65,
            "movement_sprint_speed": 65, "movement_acceleration": 65,
            "mentality_aggression": 65, "mentality_vision": 65,
            "mentality_positioning": 65, "mentality_interceptions": 65,
            "mentality_composure": 65,
            "attacking_finishing": 65, "attacking_crossing": 65,
            "attacking_heading_accuracy": 65, "attacking_short_passing": 65,
            "skill_dribbling": 65, "skill_ball_control": 65, "skill_long_passing": 65,
            "defending_marking_awareness": 65, "defending_standing_tackle": 65,
            "defending_sliding_tackle": 65,
            "goalkeeping_reflexes": 65, "goalkeeping_positioning": 65,
            "goalkeeping_handling": 65, "goalkeeping_diving": 65,
            "goalkeeping_kicking": 65,
        }

        fc26 = _find_fc26(p.get("name", ""))
        if fc26:
            player["fc26_matched"] = True
            player["overall"]      = _parse_rating(fc26.get("overall", 70))

            # Copy ALL FC26 attributes into the player dict.
            # Use int(v) directly — numpy float64 values (e.g. 65.0) convert
            # cleanly; NaN raises ValueError which is caught and skipped.
            for attr in _FC26_ATTRS:
                v = fc26.get(attr)
                if v is not None:
                    try:
                        player[attr] = int(v)
                    except (ValueError, TypeError):
                        pass

            wr_raw = fc26.get("work_rate")
            wr = str(wr_raw) if (wr_raw and str(wr_raw).lower() != "nan") else "Medium/Medium"
            parts = wr.split("/", 1)
            player["work_rate_att"] = parts[0].strip() if parts else "Medium"
            player["work_rate_def"] = parts[1].strip() if len(parts) > 1 else "Medium"

            for col in _POS_COLS:
                player["pos_ratings"][col] = _parse_rating(fc26.get(col, 60))
        else:
            unmatched += 1

        # impact_score proxy (used by PlayerCard ring)
        player["impact_score"] = float(player["overall"])
        # stamina_pct default (frontend overrides with computeStamina)
        player["stamina_pct"]  = 80.0

        enriched.append(player)

    # ── Post-enrichment log ───────────────────────────────────────────────
    matched   = [p for p in enriched if p["fc26_matched"]]
    unmatched_names = [p["name"] for p in enriched if not p["fc26_matched"]]
    print(f"FC26 matched: {len(matched)}/{len(enriched)}")
    if unmatched_names:
        print(f"Unmatched (using defaults): {unmatched_names}")

    # ── Sort by overall DESC (stable ordering for tie-breaks) ────────────
    enriched.sort(key=lambda x: x["overall"], reverse=True)

    # ── Balanced XI selection (Rules 1, 4, 5) ────────────────────────────
    if not any(p["position"] == "GK" for p in enriched):
        print(f"[SquadBuilder] WARNING: no GK in squad ({team_name})")
    starting_xi_raw = _select_balanced_xi(enriched, formation)

    print(f"\n[Selection] Balanced XI for {team_name} ({formation}):")
    for p in starting_xi_raw:
        print(f"  {p['name']:<28} pos={p['position']:<5} ovr={p['overall']}")

    # ── Assign formation slots (returns in SLOT ORDER) ────────────────────
    starting_xi = _assign_slots(starting_xi_raw, formation)

    # ── Bench split ───────────────────────────────────────────────────────
    xi_names = {p["name"] for p in starting_xi}
    rest = sorted(
        [p for p in enriched if p["name"] not in xi_names],
        key=lambda x: x["overall"], reverse=True,
    )

    bench, reserves = _balance_bench(rest[:7], rest[7:])

    return {
        "starting_xi": starting_xi,
        "bench":        bench,
        "reserves":     reserves,
        "formation":    formation,
        "total":        len(enriched),
        "unmatched":    unmatched,
    }


# ── Position affinity fallback for unmatched players ──────────────────────

def _position_fallback_rating(api_pos: str, slot: str) -> int:
    """
    For players with no FC26 match (empty pos_ratings), compute a sensible
    slot rating from the API position using SLOT_CANDIDATES tiers.
    Natural position → 75, adjacent tier 1 → 65, tier 2 → 55, else → 50.
    """
    if api_pos == slot:
        return 75
    groups = SLOT_CANDIDATES.get(api_pos, [])
    for tier, group in enumerate(groups):
        if slot in group:
            return max(75 - (tier + 1) * 10, 50)
    return 50


# ── Slot assignment (Hungarian algorithm, returns in SLOT ORDER) ───────────

def _assign_slots(players: list[dict], formation: str) -> list[dict]:
    """
    Assign 11 players to formation slots using the Hungarian algorithm.
    Returns players in SLOT ORDER so pitchPlayers[i] maps to slot[i].

    Rule 2 — LW/RW never swap: post-assignment check swaps back any mirrored wingers.
    Rule 3 — CB never CM: cost=8000 for CB→midfield slot assignments.
    """
    slots = FORMATION_SLOTS.get(formation, FORMATION_SLOTS["4-3-3"])
    n = len(players)
    m = len(slots)

    if n != 11 or m != 11:
        for i, p in enumerate(players):
            p = dict(p)
            p["assigned_slot"] = slots[i] if i < m else p["position"]
            p["slot_rating"]   = p["overall"]
            p["position_fit"]  = "natural"
            players[i] = p
        return players

    # ── Build cost matrix ─────────────────────────────────────────────────
    cost = np.full((n, m), 100.0)
    for i, player in enumerate(players):
        pos          = player["position"]
        is_gk_player = pos == "GK"
        is_cb_player = pos == "CB"
        for j, slot in enumerate(slots):
            is_gk_slot = slot == "GK"
            if is_gk_player != is_gk_slot:
                cost[i][j] = 9999.0          # hard GK constraint
                continue
            if is_cb_player and slot in _NO_CB_SLOTS:
                cost[i][j] = 8000.0          # Rule 3: CB never plays midfield
                continue
            if pos in _FB_POSITIONS and slot in _NO_FB_SLOTS:
                cost[i][j] = 8000.0          # Rule 3 ext: LB/RB never plays central mid
                continue
            if player["pos_ratings"]:
                fc26_col = SLOT_TO_FC26_COLUMN.get(slot, "pos_rating_cm").replace("pos_rating_", "")
                rating   = player["pos_ratings"].get(fc26_col, 60)
            else:
                rating = _position_fallback_rating(pos, slot)
            cost[i][j] = 100.0 - rating

    row_ind, col_ind = linear_sum_assignment(cost)

    # ── Rule 2: LW/RW never swap ──────────────────────────────────────────
    lw_slot_indices = {j for j, s in enumerate(slots) if s == "LW"}
    rw_slot_indices = {j for j, s in enumerate(slots) if s == "RW"}

    if lw_slot_indices and rw_slot_indices:
        assignments = list(zip(row_ind.tolist(), col_ind.tolist()))
        # Find pairs where a LW player ended up in a RW slot (and vice versa)
        lw_in_rw = [(idx, i, j) for idx, (i, j) in enumerate(assignments)
                    if j in rw_slot_indices and players[i]["position"] == "LW"]
        rw_in_lw = [(idx, i, j) for idx, (i, j) in enumerate(assignments)
                    if j in lw_slot_indices and players[i]["position"] == "RW"]
        for (idx_a, i_a, j_a), (idx_b, i_b, j_b) in zip(lw_in_rw, rw_in_lw):
            assignments[idx_a] = (i_a, j_b)   # LW player → LW slot
            assignments[idx_b] = (i_b, j_a)   # RW player → RW slot
            print(f"[Rule2] Corrected: {players[i_a]['name']} → LW, "
                  f"{players[i_b]['name']} → RW")
        row_ind = np.array([a[0] for a in assignments])
        col_ind = np.array([a[1] for a in assignments])

    # ── Build result in SLOT ORDER ────────────────────────────────────────
    slot_to_player: dict[int, dict] = {}
    for i, j in zip(row_ind, col_ind):
        p           = dict(players[i])
        slot        = slots[j]
        slot_rating = int(100 - cost[i][j]) if cost[i][j] < 9000 else 60
        overall     = p.get("overall", 70)

        if slot_rating >= overall - 3:
            fit = "natural"
        elif slot_rating >= overall - 8:
            fit = "comfortable"
        else:
            fit = "stretched"

        p["assigned_slot"] = slot
        p["slot_rating"]   = slot_rating
        p["position_fit"]  = fit
        slot_to_player[j]  = p
        print(f"  {p['name']:<28} → {slot:<5} (rating: {slot_rating}, fit: {fit})")

    return [slot_to_player[j] for j in range(m)]


# ══════════════════════════════════════════════════════════════════════════════
#  FC26-FIRST SQUAD BUILDER — uses FC26 club roster directly
# ══════════════════════════════════════════════════════════════════════════════

_FC26_POS_MAP: dict[str, str] = {
    "GK": "GK", "CB": "CB", "LB": "LB", "RB": "RB",
    "LWB": "LWB", "RWB": "RWB", "CDM": "CDM", "CM": "CM",
    "LM": "LM", "RM": "RM", "CAM": "CAM", "LAM": "LAM", "RAM": "RAM",
    "LW": "LW", "RW": "RW", "ST": "ST", "CF": "CF",
    "LS": "ST", "RS": "ST", "LF": "LW", "RF": "RW", "SS": "ST",
}

_POSITION_GROUPS_FC26: dict[str, list[str]] = {
    "GK":  ["GK"],
    "DEF": ["CB", "LB", "RB", "LWB", "RWB"],
    "MID": ["CDM", "CM", "LM", "RM", "CAM", "LAM", "RAM"],
    "ATT": ["ST", "CF", "LW", "RW"],
}


# Hard overrides for API names that fuzzy matching can't resolve.
_CLUB_OVERRIDES: dict[str, str] = {
    "FC Internazionale Milano":       "Inter",
    "Internazionale":                 "Inter",
    "Wolverhampton Wanderers FC":     "Wolves",
    "Nottingham Forest FC":           "Nottingham Forest",
    "Brighton & Hove Albion FC":      "Brighton & Hove Albion",
    "Borussia Mönchengladbach":       "B. Mönchengladbach",
    "1. FSV Mainz 05":                "Mainz 05",
    "1. FC Heidenheim 1846":          "Heidenheim",
    "1. FC Köln":                     "1. FC Köln",
    "1. FC Union Berlin":             "Union Berlin",
    "TSG 1899 Hoffenheim":            "Hoffenheim",
    "RB Leipzig":                     "RB Leipzig",
    "SC Freiburg":                    "SC Freiburg",
    "SV Werder Bremen":               "Werder Bremen",
    "FC St. Pauli 1910":              "St. Pauli",
    "Athletic Club":                  "Athletic Club de Bilbao",
    "CA Osasuna":                     "Osasuna",
    "RCD Espanyol de Barcelona":      "Espanyol",
    "RCD Mallorca":                   "RCD Mallorca",
    "Deportivo Alavés":               "Deportivo Alavés",
    "RC Celta de Vigo":               "Celta de Vigo",
    "Real Betis Balompié":            "Real Betis",
    "Real Sociedad de Fútbol":        "Real Sociedad",
    "FC Internazionale Milano":       "Inter",
    "SS Lazio":                       "Lazio",
    "Bologna FC 1909":                "Bologna",
    "Hellas Verona FC":               "Hellas Verona",
    "Parma Calcio 1913":              "Parma",
    "Stade Brestois 29":              "Stade Brest",
    "Stade Rennais FC 1901":          "Rennes",
    "RC Strasbourg Alsace":           "Strasbourg",
    "Sport Lisboa e Benfica":         "Benfica",
    "Sporting Clube de Portugal":     "Sporting CP",
    "Sporting Clube de Braga":        "Braga",
    "AFC Ajax":                       "Ajax",
    "FC Twente '65":                  "Twente",
    "SC Heerenveen":                  "Heerenveen",
    "PEC Zwolle":                     "PEC Zwolle",
    "Go Ahead Eagles":                "Go Ahead Eagles",
    "Sparta Rotterdam":               "Sparta Rotterdam",
    "Fortuna Sittard":                "Fortuna Sittard",
    "AZ":                             "AZ Alkmaar",
    "NEC":                            "NEC Nijmegen",
    "NAC Breda":                      "NAC Breda",
}


def find_fc26_club_name(api_team_name: str) -> str | None:
    """
    Given a team name from football-data.org, find the matching club_name
    in the FC26 CSV via suffix-stripping + fuzzy matching.
    e.g. "Arsenal FC" → "Arsenal", "FC Bayern München" → "Bayern München"
    """
    if FC26_DF.empty:
        return None

    # Hard override first
    if api_team_name in _CLUB_OVERRIDES:
        target = _CLUB_OVERRIDES[api_team_name]
        fc26_clubs = FC26_DF["club_name"].dropna().unique().tolist()
        if target in fc26_clubs:
            print(f"[Club] {api_team_name!r} → override → {target!r}")
            return target

    clean = api_team_name.strip()
    for suffix in [" FC", " AFC", " CF", " SC", " AC", " BC", " FK", " SK",
                   "FC ", "AFC "]:
        clean = clean.replace(suffix, "").strip()

    fc26_clubs = FC26_DF["club_name"].dropna().unique().tolist()

    if clean in fc26_clubs:
        return clean
    if api_team_name in fc26_clubs:
        return api_team_name

    hits = get_close_matches(clean, fc26_clubs, n=1, cutoff=0.6)
    if hits:
        print(f"[Club] {api_team_name!r} → fuzzy(clean) → {hits[0]!r}")
        return hits[0]

    hits = get_close_matches(api_team_name, fc26_clubs, n=1, cutoff=0.6)
    if hits:
        print(f"[Club] {api_team_name!r} → fuzzy(raw) → {hits[0]!r}")
        return hits[0]

    print(f"[Club] NO MATCH for {api_team_name!r}")
    return None


def build_player_from_fc26_row(row) -> dict:
    """Convert a FC26 DataFrame row into the player dict format used by the app."""

    def _int(val, default: int = 65) -> int:
        try:
            return int(str(val).split("+")[0].split("-")[0].strip())
        except Exception:
            return default

    fc26_pos_str = str(row.get("player_positions", "CM"))
    primary_pos  = fc26_pos_str.split(",")[0].strip().upper()
    api_position = _FC26_POS_MAP.get(primary_pos, "CM")

    wr_raw  = row.get("work_rate", "Medium/Medium")
    wr_str  = str(wr_raw) if str(wr_raw).lower() != "nan" else "Medium/Medium"
    wr_parts = wr_str.split("/")
    work_rate_att = wr_parts[0].strip() if wr_parts else "Medium"
    work_rate_def = wr_parts[1].strip() if len(wr_parts) > 1 else "Medium"

    pos_ratings: dict[str, int] = {}
    for col in _POS_COLS:
        pos_ratings[col] = _int(row.get(col, 60))

    overall = _int(row.get("overall", 70))
    name    = str(row.get("long_name", row.get("short_name", "Unknown")))

    return {
        # Identity
        "id":            abs(hash(str(row.get("short_name", name)))) % (10 ** 9),
        "name":          name,
        "short_name":    str(row.get("short_name", "")),
        "api_position":  api_position,
        "position":      api_position,
        "shirt_number":  None,
        "nationality":   str(row.get("nationality_name", "")),
        "minutes_played": 0,
        "is_injury_return": False,
        "fc26_matched":  True,
        "fc26_club":     str(row.get("club_name", "")),
        "overall":       overall,
        "impact_score":  float(overall),
        "stamina_pct":   80.0,
        # Work rate
        "work_rate_att": work_rate_att,
        "work_rate_def": work_rate_def,
        # Position ratings
        "pos_ratings":   pos_ratings,
        # Base attributes
        "pace":       _int(row.get("pace", 65)),
        "shooting":   _int(row.get("shooting", 65)),
        "passing":    _int(row.get("passing", 65)),
        "dribbling":  _int(row.get("dribbling", 65)),
        "defending":  _int(row.get("defending", 65)),
        "physic":     _int(row.get("physic", 65)),
        # Detailed attributes
        "attacking_crossing":          _int(row.get("attacking_crossing", 65)),
        "attacking_finishing":         _int(row.get("attacking_finishing", 65)),
        "attacking_heading_accuracy":  _int(row.get("attacking_heading_accuracy", 65)),
        "attacking_short_passing":     _int(row.get("attacking_short_passing", 65)),
        "attacking_volleys":           _int(row.get("attacking_volleys", 65)),
        "skill_dribbling":             _int(row.get("skill_dribbling", 65)),
        "skill_curve":                 _int(row.get("skill_curve", 65)),
        "skill_fk_accuracy":           _int(row.get("skill_fk_accuracy", 65)),
        "skill_long_passing":          _int(row.get("skill_long_passing", 65)),
        "skill_ball_control":          _int(row.get("skill_ball_control", 65)),
        "movement_acceleration":       _int(row.get("movement_acceleration", 65)),
        "movement_sprint_speed":       _int(row.get("movement_sprint_speed", 65)),
        "movement_agility":            _int(row.get("movement_agility", 65)),
        "movement_reactions":          _int(row.get("movement_reactions", 65)),
        "movement_balance":            _int(row.get("movement_balance", 65)),
        "power_shot_power":            _int(row.get("power_shot_power", 65)),
        "power_jumping":               _int(row.get("power_jumping", 65)),
        "power_stamina":               _int(row.get("power_stamina", 65)),
        "power_strength":              _int(row.get("power_strength", 65)),
        "power_long_shots":            _int(row.get("power_long_shots", 65)),
        "mentality_aggression":        _int(row.get("mentality_aggression", 65)),
        "mentality_interceptions":     _int(row.get("mentality_interceptions", 65)),
        "mentality_positioning":       _int(row.get("mentality_positioning", 65)),
        "mentality_vision":            _int(row.get("mentality_vision", 65)),
        "mentality_composure":         _int(row.get("mentality_composure", 65)),
        "defending_marking_awareness": _int(row.get("defending_marking_awareness", 65)),
        "defending_standing_tackle":   _int(row.get("defending_standing_tackle", 65)),
        "defending_sliding_tackle":    _int(row.get("defending_sliding_tackle", 65)),
        "goalkeeping_diving":          _int(row.get("goalkeeping_diving", 65)),
        "goalkeeping_handling":        _int(row.get("goalkeeping_handling", 65)),
        "goalkeeping_kicking":         _int(row.get("goalkeeping_kicking", 65)),
        "goalkeeping_positioning":     _int(row.get("goalkeeping_positioning", 65)),
        "goalkeeping_reflexes":        _int(row.get("goalkeeping_reflexes", 65)),
    }


def select_balanced_xi(players: list[dict]) -> list[dict]:
    """
    Select 11 players from an FC26 club roster ensuring GK+DEF+MID+ATT balance.
    Uses api_position (derived from FC26 player_positions) for grouping.
    """
    def _grp(pos: str) -> str:
        for g, members in _POSITION_GROUPS_FC26.items():
            if pos in members:
                return g
        return "MID"

    selected: list[dict] = []
    used: set[str] = set()
    needs = {"GK": 1, "DEF": 4, "MID": 3, "ATT": 3}

    for group, count in needs.items():
        pool = sorted(
            [p for p in players if _grp(p["api_position"]) == group and p["name"] not in used],
            key=lambda x: x["overall"], reverse=True,
        )
        for p in pool[:count]:
            selected.append(p)
            used.add(p["name"])

    # Fill to 11 if any group was short
    for p in sorted(players, key=lambda x: x["overall"], reverse=True):
        if p["name"] not in used and len(selected) < 11:
            selected.append(p)
            used.add(p["name"])

    return selected[:11]


def build_squad_fc26(api_team_name: str, formation: str = "4-3-3") -> dict | None:
    """
    Build a complete squad using FC26 club data only.
    The football-data.org API is used only to resolve the team name → club lookup.

    Returns None if no matching FC26 club is found.
    """
    fc26_club = find_fc26_club_name(api_team_name)
    if not fc26_club:
        return None

    club_df = FC26_DF[FC26_DF["club_name"] == fc26_club].copy()
    print(f"[Squad] {api_team_name!r} → {fc26_club!r}: {len(club_df)} players in FC26")

    players = [build_player_from_fc26_row(row) for _, row in club_df.iterrows()]
    players.sort(key=lambda x: x["overall"], reverse=True)

    xi_raw = select_balanced_xi(players)
    xi     = _assign_slots(xi_raw, formation)

    xi_names = {p["name"] for p in xi}
    rest = sorted(
        [p for p in players if p["name"] not in xi_names],
        key=lambda x: x["overall"], reverse=True,
    )
    bench, reserves = _balance_bench(rest[:7], rest[7:])

    return {
        "fc26_club":   fc26_club,
        "starting_xi": xi,
        "bench":       bench,
        "reserves":    reserves,
        "formation":   formation,
        "total":       len(players),
        "unmatched":   0,
    }
