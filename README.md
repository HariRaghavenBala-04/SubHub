<!--
Copyright (c) 2025 Harish Raghavendran Balaji. All rights reserved.
This project and its contents are proprietary and confidential.
Unauthorised copying, distribution, or use of this software,
via any medium, is strictly prohibited without express written
permission from the author.
-->

# SubHub ⚽ — Football Substitution Intelligence Engine

## Overview

SubHub is an AI-powered football substitution intelligence engine that helps managers and analysts make data-driven substitution decisions in real time. It combines stamina decay modelling, historical impact scoring, and formation constraints to surface the optimal substitutions at any given moment in a match.

## Features

- **Live Pitch View** — FIFA 15-inspired squad screen with player cards on a CSS football pitch
- **Stamina Decay Engine** — Position-aware fatigue modelling with fixture congestion modifiers
- **Expected Impact Scoring** — Historical win-rate weighting from last 20 matches per team
- **Formation Constraints** — Valid positional cover matrix with tactical intent modes
- **Scenario Planner** — Simulate winning/drawing/losing scenarios with win-probability delta
- **7 Top Leagues** — Premier League, Bundesliga, La Liga, Serie A, Ligue 1, Primeira Liga, Eredivisie
- **Real Squad Data** — Live rosters via football-data.org API

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, React Router v6, Tailwind CSS |
| Backend | FastAPI (Python 3.11+) |
| Fonts | Rajdhani (headings), DM Sans (body) via Google Fonts |
| APIs | football-data.org, sports.bzzoiro.com |

## Getting Started

```bash
# 1. Clone the repository
git clone <repo-url>
cd subhub

# 2. Set up environment variables
cp .env.example .env
# Fill in your API keys in .env

# 3. Install frontend dependencies
npm install

# 4. Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..

# 5. Start the backend
uvicorn backend.main:app --reload --port 8000

# 6. Start the frontend (in a new terminal)
npm run dev
```

Open http://localhost:5173 in your browser.

## API Keys

- **football-data.org** — https://www.football-data.org/ (Free tier available)
- **BSD Sports API** — https://sports.bzzoiro.com/ (Token authentication)

## Project Structure

```
subhub/
├── backend/
│   ├── main.py              # FastAPI app, CORS, routes
│   ├── requirements.txt
│   └── engine/
│       ├── expected_impact.py    # Historical impact scoring
│       ├── stamina_decay.py      # Position-aware fatigue model
│       ├── formation_constraints.py  # Positional cover matrix
│       ├── recommender.py        # Top-3 sub recommendation engine
│       └── scenario_planner.py   # W/D/L scenario simulation
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── pages/
│   │   ├── Home.jsx          # League selector (7 leagues)
│   │   ├── League.jsx        # Team badge grid
│   │   ├── Squad.jsx         # Player cards with stamina/impact
│   │   ├── Match.jsx         # FIFA 15 pitch view (hero feature)
│   │   └── Planner.jsx       # Drag-and-drop scenario planner
│   └── components/
│       ├── PlayerCard.jsx
│       ├── Pitch.jsx
│       ├── FormationLines.jsx
│       ├── RecommendPanel.jsx
│       └── BenchRow.jsx
├── .env.example
├── .gitignore
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Core Models

### Expected Impact Score
Calculated from the last 20 finished matches per team. Substitution incidents are extracted from match events and scored as:

```
impact_score = (wins + 0.5 * draws after sub) / appearances * 100
```

Time weighting: <15 mins remaining = 0.5x, 15–30 mins = 0.75x, 30+ mins = 1.0x

### Stamina Decay Model
Position-specific decay rates applied to minutes played with fixture congestion modifiers:

| Position | Decay Rate |
|----------|-----------|
| GK | 0.20 |
| CB | 0.30 |
| FB | 0.35 |
| DM | 0.40 |
| CM | 0.45 |
| W  | 0.55 |
| ST | 0.60 |

Fixture modifier: <4 days since last match = 1.3x, injury return = 1.6x

```
stamina_pct = max(0, 100 - (decay_rate × minutes_played × fixture_modifier))
```

### Formation Constraints
Valid positional coverage matrix ensures tactical coherence:

```
ST  → [ST, SS, W]
W   → [W, AM, ST, FB]
AM  → [AM, CM, W]
CM  → [CM, DM, AM]
DM  → [DM, CM, CB]
FB  → [FB, DM, W]
CB  → [CB, DM, FB]
GK  → [GK]
```

Tactical intent modes: **Protect Lead** (prioritise CB/DM), **Chase Game** (prioritise ST/W/AM), **Tactical** (rank by impact score only)

## Roadmap

- [ ] Real-time match data via WebSockets
- [ ] xG delta post-substitution analysis
- [ ] Opposition weak-spot targeting
- [ ] Export PDF match report
- [ ] Mobile app (React Native)
- [ ] Multi-language support

## License

All Rights Reserved. See [LICENSE](LICENSE).

## Author

Harish Raghavendran Balaji
