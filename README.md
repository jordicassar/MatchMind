# MatchMind

AI-powered La Liga match prediction app. Predicts scorelines from a tuned, leak-free model (attack/defense, home advantage, team strength) and tracks how accurate those predictions actually are.

**Live demo:** [matchmind-chi.vercel.app](https://matchmind-chi.vercel.app)

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, API routes)
- **Database:** PostgreSQL + Prisma ORM
- **Language:** TypeScript (full-stack)
- **Styling:** Tailwind CSS + shadcn/ui
- **Data:** API-Sports football API

---

## Features

- **Match predictions** — AI-generated scoreline predictions for every fixture from a tuned, leak-free model (attack/defense, home advantage, team strength)
- **Prediction accuracy tracker** — tracks correct vs incorrect predictions across all 380 played matches (~47% honest accuracy, beating the ~45% naive baseline)
- **League standings** — full La Liga 2024/25 table computed from match results
- **Team profiles** — stadium info, manager, upcoming fixtures, match history, and full squad by position
- **Match detail** — score, prediction breakdown showing form averages and H2H record
- **Head-to-head history** — past meetings between any two teams with results
- **Match filtering** — filter by team or status (upcoming / played)

---

## Prediction Model

Each fixture's scoreline is predicted from three signals, all computed **leak-free** (only matches played *before* the fixture):

- **Attack vs defense** — expected goals for each side blend its attacking form (weighted toward recent games) with the opponent's defensive record.
- **Home advantage** — a fixed nudge to the home side.
- **Team strength** — the gap in points-per-game pulls the score toward the stronger team, so a strong away side can override home advantage.

```
expHome = (homeAttack + awayDefense) / 2
expAway = (awayAttack + homeDefense) / 2
predictedHome = round(expHome + 0.75 + (homePPG − awayPPG))
predictedAway = round(expAway − (homePPG − awayPPG))
```

### How it was tuned

The model was built iteratively and measured against a **leak-free backtest** — each parameter was swept over a range and scored by outcome accuracy across 380 played matches (`/api/predictions/tune`, `tune-v2`, `tune-v3`). An early version looked like it scored 51%, but that was inflated by **data leakage** — each match's own result was leaking into its prediction inputs. Fixing the leak revealed the honest baseline and the real gains:

| Stage | Honest accuracy |
|---|:-:|
| Form + head-to-head (leak-free baseline) | 38.7% |
| + attack/defense + home advantage | 43.9% |
| + team strength (points per game) | **46.8%** |

For reference, a naive "always predict the home team" baseline scores ~45% in La Liga — so the tuned model beats it.

---

## Local Setup

**Prerequisites:** Node.js, PostgreSQL

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example apps/web/.env.local
# Add your FOOTBALL_API_KEY and DATABASE_URL

# Run database migrations
cd apps/web && npx prisma migrate dev

# Seed match data
curl -X POST http://localhost:3000/api/sync

# Generate predictions for all played matches
curl -X POST http://localhost:3000/api/sync/predictions

# Start the dev server (from project root)
npm run dev
```

---

## Project Structure

```
apps/
  web/
    src/
      app/              # Next.js pages and API routes
      components/       # Reusable UI components
      lib/              # Prisma client, prediction logic, football API wrapper
    prisma/             # Schema and migrations
```
