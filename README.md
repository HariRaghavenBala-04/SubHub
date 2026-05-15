# SubHub — Football Substitution Intelligence Engine
> Built by Harishraghavendran Balaji

SubHub is a substitution intelligence tool for football managers. It takes a live match situation — scoreline, minute, current XI, bench, playstyle, opposition — and surfaces the right substitutions with confidence scores and reasoning, rather than a ranked list of player ratings. The goal is to replicate the information a top-level analyst would hand a manager at the touchline: who is fading, who on the bench upgrades them, what the game state demands, and how confident the engine is in that read.

---

## The Product

**Leagues** is the entry point. It surfaces the 7 supported European leagues and their full squads via the football-data.org API. Selecting a team loads their current 2025/26 squad and routes into the pre-match Planner.

**Planner** is the pre-match intelligence hub. A manager selects their next opponent from a competition-aware dropdown — only competitions and opponents actually relevant to the selected team appear. The engine derives a six-dimension tactical DNA profile from the opponent's FC26 squad attributes and identifies up to three key matchup players from your own squad who are most relevant to neutralising the specific threat. The Squad Readiness tab lets you assess the current squad against the upcoming fixture. The XI Builder tab is a drag-and-drop formation builder for confirming your starting lineup and bench before the match. Everything is saved to a match plan that the console reads on load.

**Match Console** is where the engine runs live. It renders the confirmed XI on a pitch and the bench as a draggable card row. Drag a bench player onto a pitch slot to make a substitution — the console enforces position compatibility, tracks the substitution count, and dims players who have been subbed off. The minute slider, scoreline, scenario pills (Chasing / Protecting / Level), competition, playstyle, and formation all feed the engine payload. Pressing Analyse Subs sends a full game-state snapshot to the backend, which returns ranked substitution recommendations, positional swap suggestions, or a hold verdict — with reasoning, confidence, and win probability delta for each.

---

## Intelligence Engine

**FC26 2025/26 squad data** is the attribute source of truth. Every attribute lookup — pace, finishing, composure, stamina, marking awareness, goalkeeping reflexes — reads directly from the FC26 CSV. The football-data.org API supplies who is in each squad; FC26 supplies what those players are capable of. Name matching uses difflib fuzzy matching plus a hand-built override map for the ~50 players whose API names diverge most from their FC26 entries (Vinicius Junior → Vini Jr., Trent Alexander-Arnold → Trent A.-Arnold, etc.).

**Opponent DNA profiling** derives a tactical identity from the opponent's squad rather than trusting a pre-labelled tag. Six dimensions are computed from outfield player attributes: press intensity (aggression × stamina × marking awareness), defensive line (marking awareness × positioning × stamina), width threat (dribbling × acceleration × crossing), physical dominance (strength × aggression × jumping), pace threat (sprint speed × acceleration averaged across attack and midfield), and creative threat (vision × short passing × long passing). These six scores are mapped to one of six tactical identities — Gegenpressing, Possession Play, Counter Attack, Low Block, High Line Press, Direct Play — with a combined label when the top two identities are within 3 points of each other.

**Key matchup player flagging** uses the opponent DNA dimensions as signals to identify which of your players matter most for the specific fixture. A pace threat above 65 flags your two fastest defenders and fastest attacker. High press intensity flags your players with the highest composure to beat a press. Physical dominance flags your strongest aerial players. High creative threat flags your defensive midfielders with the best marking awareness to nullify their playmakers. Up to three players are returned, deduplicated across signals, saved to the match plan, and shown on the bench as gold-marked cards in the console.

**Stamina decay** is modelled per position with separate decay rates for each role (GK 0.18, ST 0.58, LWB/RWB 0.35 with a 1.25× slot multiplier), modified by the player's FC26 stamina attribute, work rate, and match minute. In extra time the decay accelerates — 1.4× in the first period, 1.8× in the second — so legs that held through 90 minutes register genuine fatigue when it matters most.

**Monte Carlo confidence scoring** runs 200 simulations per recommendation. Each simulation models the tired starter continuing versus the fresh bench player entering, incorporating stamina state, pressing reliability, attribute upgrade score, and a game-state urgency multiplier. The result is a win probability delta and a confidence tier — HIGH, MEDIUM, or LOW — based on FC26 data availability and measured impact score.

**Pressing reliability** scores each on-pitch player from 0–100 based on pace, FC26 stamina, aggression, and work rate — then scales that by current stamina percentage. It outputs four statuses: RELIABLE (≥75), DEGRADING (≥55), UNRELIABLE (≥40), CRITICAL (<40). A player's pressing status is part of the engine's reasoning string, not just their rating.

**Attribute upgrade delta** compares a bench candidate against the starter they would replace across the five key attributes for that position: for a CB those are marking awareness, standing tackle, sliding tackle, jumping, and strength; for a CAM they are vision, ball control, short passing, long passing, and positioning. The engine returns a verdict — clear upgrade, marginal upgrade, sideways sub, or downgrade — and surfaces the single biggest attribute win as the key upgrade label.

**Urgency engine** classifies every game state into one of five modes — DESPERATION, CHASING, BALANCED, PROTECT, CONTROL — based on goal difference and minutes remaining. Each mode shifts the substitution threshold and amplifies the scoring weight of the right position profile (CHASING rewards attackers 1.8×, PROTECT rewards defenders 1.8×). The engine also applies knockout competition overrides: a draw with 20 minutes left in the Champions League triggers DESPERATION rather than BALANCED. Tier 1 competition (UCL) cuts the recommendation threshold by 25%; a Friendly raises it by 30%.

**Sub state memory** tracks which players have been substituted off via a `useRef` Set that survives re-renders without triggering them. Every substitution path — drag-and-drop and applied recommendation — writes to the same ref. The backend enforces the same constraint independently: eligible bench players are filtered by both name and ID against the current on-pitch set and the subbed-off set before any scoring runs.

**PK mode** has a separate recommendation path. It scores each goalkeeper on PK-save ability (reflexes 35%, diving 30%, positioning 20%, handling 15%) and recommends a specialist switch if any bench GK scores more than 3 points higher than the current one. It separately scores outfield players on PK-taking ability (finishing 40%, composure 35%, shooting 15%, long shots 10%) and recommends swapping the weakest pitch player for the strongest bench option if the delta exceeds 5 points. If neither threshold is met, it surfaces the top two bench penalty takers as bench alerts.

---

## Tech Stack

**Frontend:** React + Vite + Tailwind CSS + React Router + @dnd-kit (drag and drop)

**Backend:** FastAPI (Python)

**Data:** FC26 CSV — 7 leagues, 2025/26 squads (Premier League, Bundesliga, La Liga, Serie A, Ligue 1, Primeira Liga, Eredivisie); football-data.org API for live squad rosters

**Intelligence:** scipy, numpy, difflib

---

## Running Locally

**Backend** — run from the project root:
```bash
pip install -r backend/requirements.txt
python3 -m uvicorn backend.main:app --reload --port 8000
```

Add a `.env` file at the project root with:
```
FOOTBALL_DATA_KEY=your_key_here
```

**Frontend** — run from the project root:
```bash
npm install
npm run dev
```

The frontend dev server proxies `/api` to `localhost:8000` via the Vite config.

---

## What's Next

The most immediate addition is a post-match debrief panel — a structured view of every substitution made, when it was made, and what the engine's confidence was at that moment, exportable as a tactical briefing. Beyond that, integrating real match event data (goals, cards, injuries as they happen rather than entered manually) would close the gap between the current simulation model and live use. Expanding coverage past the current 7 leagues requires both API access and FC26 squad data for those competitions; MLS and the Brasileirão are the natural next targets given squad data availability.

---

> Copyright © 2025 Harishraghavendran Balaji. All Rights Reserved.  
> Unauthorised copying, distribution, or use is strictly prohibited. See LICENSE for full terms.  
> SubHub is not affiliated with EA Sports, football-data.org, or any football club or governing body.
