# MatchMind

AI-powered La Liga match prediction app. Uses historical match data and a weighted recency algorithm blended with head-to-head records to predict scorelines — and tracks how accurate those predictions actually are.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, API routes)
- **Database:** PostgreSQL + Prisma ORM
- **Language:** TypeScript (full-stack)
- **Styling:** Tailwind CSS + shadcn/ui
- **Data:** API-Sports football API

---

## Features

- **Match predictions** — AI-generated scoreline predictions for every fixture using form and H2H data
- **Prediction accuracy tracker** — tracks correct vs incorrect predictions across all 380 played matches (currently ~51% accuracy)
- **League standings** — full La Liga 2024/25 table computed from match results
- **Team profiles** — stadium info, manager, upcoming fixtures, match history, and full squad by position
- **Match detail** — score, prediction breakdown showing form averages and H2H record
- **Head-to-head history** — past meetings between any two teams with results
- **Match filtering** — filter by team or status (upcoming / played)

---

## Prediction Algorithm

Predictions are generated using a **weighted recency average** — recent matches carry more weight than older ones. This is blended with head-to-head history using a **70% form / 30% H2H** split:

```
predictedHome = round(formHome × 0.7 + h2hHome × 0.3)
predictedAway = round(formAway × 0.7 + h2hAway × 0.3)
```

Form is calculated from each team's home/away goals scored in recent matches. If no H2H data exists, the prediction falls back to form only. Accuracy is measured by comparing predicted outcomes (home win / draw / away win) against actual results.

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