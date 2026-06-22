# MatchMind

AI-powered La Liga match prediction app. Predicts scorelines from a tuned, leak-free model (attack/defense, home advantage, team strength) and tracks how accurate those predictions actually are.

**Live demo:** [matchmind-chi.vercel.app](https://matchmind-chi.vercel.app)

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, API routes)
- **Language:** TypeScript (full-stack)
- **Database:** PostgreSQL (hosted on Neon) + Prisma ORM
- **Styling:** Tailwind CSS + shadcn/ui
- **Testing:** Vitest
- **Deployment:** Vercel
- **Data:** API-Sports football API

---

## Features

- **Match predictions** — AI-generated scoreline predictions for every fixture from a tuned, leak-free model (attack/defense, home advantage, team strength)
- **Prediction accuracy tracker** — tracks correct vs incorrect predictions across all 380 played matches (~47% honest accuracy, beating the ~45% naive baseline)
- **League standings** — full La Liga 2024/25 table computed from match results
- **Team profiles** — stadium info, manager, upcoming fixtures, match history, and full squad by position
- **Match detail** — score, plus a prediction breakdown showing expected goals (attack vs defense), home advantage, and team strength (points per game)
- **Head-to-head history** — past meetings between any two teams with results
- **Match filtering** — filter by team or status (upcoming / played)

---

## Prediction Model

Each fixture's scoreline is predicted from three signals, all computed **leak-free** (only matches played *before* the fixture):

- **Attack vs defense** — expected goals for each side blend its attacking form (weighted toward recent games) with the opponent's defensive record.
- **Home advantage** — a fixed nudge to the home side.
- **Team strength** — the gap in points-per-game pulls the score toward the stronger team, so a strong away side can override home advantage.

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

# Start the dev server (from the project root)
npm run dev
```

Then, in another terminal, seed the data from API-Sports:

```bash
curl -X POST http://localhost:3000/api/sync          # teams + fixtures
curl -X POST http://localhost:3000/api/sync/players  # squads (rate-limited — re-run to finish)
curl -X POST http://localhost:3000/api/sync/teams    # venue + manager (rate-limited — re-run to finish)
```

Predictions and accuracy are computed on the fly from match history on each request — there's no prediction-generation step to run.

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
