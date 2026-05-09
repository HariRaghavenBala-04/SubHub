# SubHub ⚽ — Football Substitution Intelligence Engine

> Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
> This is proprietary software. See LICENSE for full terms.

---

## Overview
SubHub is a football substitution intelligence engine that helps managers and coaches make smarter, data-driven substitution decisions. Built with a FIFA 15 Ultimate Team inspired Console interface and powered by a multi-signal intelligence engine covering 7 major European leagues.

## Features
- 🏟 Live squad data across 7 leagues (Premier League, Bundesliga, La Liga, Serie A, Ligue 1, Primeira Liga, Eredivisie)
- ⚽ FIFA 15 inspired pitch Console with formation toggle
- 🧠 6 Playstyle profiles (High Press, Positional Play, Low Block, Counter Attack, Direct Play, Structured Press)
- ⚡ Formation-Playstyle compatibility matrix with tactical conflict detection and win probability modifiers
- 📊 4-signal Intelligence Engine:
  - Pressing Reliability Score (physicality layer)
  - Attribute Upgrade Delta (position-specific comparison)
  - Game State Context Engine (match situation awareness)
  - Monte Carlo Confidence Scores (200 simulations per recommendation)
- 🎯 ANALYSE SUBS button with sliding recommendation panel
- 🚑 Injury Management tab with urgency tiers
- 📋 Scenario Planner (Winning / Drawing / Losing simulation)
- 🔒 Position group locking (GKs never play CM, CBs never play ST)
- ⚠ Tactical conflict warnings in real time

## Tech Stack
- Frontend: React + Vite + Tailwind CSS + React Router + @dnd-kit
- Backend: FastAPI (Python)
- Data: football-data.org API + FC26 dataset + BSD sports API
- Intelligence: scipy, numpy, difflib

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- API keys (see API Keys section below)

### Installation
```
git clone https://github.com/HariRaghavenBala-04/SubHub.git
cd SubHub
cp .env.example .env
# Add your API keys to .env
pip install -r requirements.txt
cd frontend && npm install
```

### Running
```
# Terminal 1 — Backend
python3 -m uvicorn backend.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend && npm run dev
```

### API Keys Required
- football-data.org — register free at https://www.football-data.org
- BSD API — register free at https://sports.bzzoiro.com
- Add both keys to your .env file (see .env.example for format)

## Project Structure
```
SubHub/
├── backend/
│   ├── engine/
│   │   ├── playstyle_profiles.py   — 6 tactical playstyles + compatibility matrix
│   │   ├── recommender.py          — Master intelligence engine
│   │   ├── monte_carlo.py          — 200-simulation confidence scoring
│   │   ├── pressing_reliability.py — Physicality and press scoring
│   │   ├── upgrade_delta.py        — Position-specific attribute comparison
│   │   ├── game_state.py           — Match context and tactical need analysis
│   │   ├── squad_builder.py        — API + FC26 data merger and XI builder
│   │   └── formation_slots.py      — Optimal position assignment engine
│   └── main.py                     — FastAPI routes
├── frontend/
│   └── src/
│       ├── pages/                  — League, Squad, Match Console, Planner
│       ├── components/             — Pitch, PlayerCard, RecommendPanel
│       └── context/                — TeamContext (squad state management)
├── data/                           — FC26 CSV (not committed — add manually)
├── .env.example                    — API key template
├── LICENSE                         — All Rights Reserved
└── README.md
```

## Core Intelligence Models

### Pressing Reliability Score
Calculates how reliably a player maintains pressing intensity at any given minute using FC26 pace, stamina, aggression and work rate attributes. Decays with fatigue. Flags tactical fatigue before physical fatigue is visible.

### Attribute Upgrade Delta
Compares bench player attributes vs the starter they would replace across 5 position-specific key attributes. Derived from original research on positional performance metrics. Returns clear upgrade, marginal upgrade, sideways sub, or downgrade verdict.

### Formation-Playstyle Compatibility
A 6x6 matrix scoring every playstyle-formation combination from 0-100. Scores below 50 trigger a tactical conflict warning with win probability modifier. Example: High Press + 5-3-2 scores 25/100 — the back 5 destroys the numerical superiority required for gegenpressing.

### Monte Carlo Confidence
Runs 200 simulated game outcomes for each potential substitution. Factors in stamina state, pressing reliability, attribute upgrade score, historical impact score and game state urgency multiplier. Returns win probability delta and confidence tier (HIGH / MEDIUM / LOW).

## Data Sources
- football-data.org: Current 2025/26 squad rosters
- FC26 dataset: Player positional ratings and attributes (not included in repo — download separately)
- BSD API: Match incidents and substitution history
- Note: Free tier API data may not reflect transfers after July 2025

## Roadmap
- [ ] Real-time match data integration
- [ ] xG and xT trend analysis per 10-minute window
- [ ] Export recommendations to PDF report
- [ ] Mobile responsive layout
- [ ] Manual player override for missing transfers
- [ ] Additional league support (MLS, Brasileirao)

## License
All Rights Reserved — This is proprietary software.
See LICENSE file for full terms.
Unauthorised use, copying, or distribution is strictly prohibited.

## Author
Harishraghavendran Balaji — 2026

## Acknowledgements
Vishal.M — for critiquing and shaping the original
project code named "Soccer Subbu" in 2023, which became the
foundation for SubHub.

---
SubHub is not affiliated with EA Sports, football-data.org, BSD, or any football club or governing body.
