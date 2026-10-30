# MatchMind

[![CI](https://github.com/jordicassar/MatchMind/actions/workflows/ci.yml/badge.svg)](https://github.com/jordicassar/MatchMind/actions/workflows/ci.yml)

La Liga match prediction app. Predicts scorelines with a tuned, leak-free statistical model (attack/defense, home advantage, team strength) and tracks how accurate those predictions actually are.

**Live demo:** [matchmind-chi.vercel.app](https://matchmind-chi.vercel.app)

> **Data:** the current La Liga season, synced from football-data.org, plus the full 2024/25 season kept as model history and backtest. See [Data Sources](#data-sources).

---

## Tech Stack

- **Framework:** Next.js 16 + React 19 (App Router, API routes)
- **Language:** TypeScript (full-stack)
- **Runtime:** Node.js 24
- **Database:** PostgreSQL (hosted on Neon) + Prisma ORM
- **Styling:** Tailwind CSS + shadcn/ui
- **Testing:** Vitest
- **Deployment:** Vercel
- **Data:** football-data.org (fixtures and results) + API-Sports (teams, stadiums, squads), both free tier

---

## Features

- **Match predictions** — scoreline predictions for every current-season fixture from a tuned, leak-free statistical model (attack/defense, home advantage, team strength)
- **Prediction accuracy tracker** — scores this season's predictions against real results as matches are played, alongside the 2024/25 leak-free backtest (46.8%, beating the ~45% naive baseline)
- **League standings** — the live La Liga table for the current season, computed from match results
- **Team profiles** — stadium info, manager, upcoming fixtures, match history, and squad by position
- **Match detail** — score, plus a prediction breakdown showing expected goals (attack vs defense), home advantage, and team strength (points per game)
- **Head-to-head history** — past meetings between any two teams with results
- **Match filtering** — filter by team or status (upcoming / played)

---

## Prediction Model

Each fixture's scoreline is predicted from three signals, all computed **leak-free** (only matches played *before* the fixture):

- **Attack vs defense** — expected goals for each side blend its attacking form (weighted toward recent games) with the opponent's defensive record.
- **Home advantage** — a fixed nudge to the home side.
- **Team strength** — the gap in points-per-game pulls the score toward the stronger team, so a strong away side can override home advantage.

Predictions draw on every earlier match in the database, so current-season predictions also learn from 2024/25 — useful early in a season, and for promoted clubs with little recent history.

### How it was tuned

The model was built iteratively and measured against a **leak-free backtest** — each parameter was swept over a range and scored by outcome accuracy across the 380 matches of the 2024/25 season (`/api/predictions/tune`, `tune-v2`, `tune-v3`). An early version looked like it scored 51%, but that was inflated by **data leakage** — each match's own result was leaking into its prediction inputs. Fixing the leak revealed the honest baseline and the real gains:

| Stage | Honest accuracy |
|---|:-:|
| Form + head-to-head (leak-free baseline) | 38.7% |
| + attack/defense + home advantage | 43.9% |
| + team strength (points per game) | **46.8%** |

For reference, a naive "always predict the home team" baseline scores ~45% in La Liga — so the tuned model beats it.

The tuning routes re-run the full backtest on every request, so like the sync routes they require the `CRON_SECRET`:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/predictions/tune-v3
```

---

## Data Sources

MatchMind combines two free football APIs, because neither free tier covers everything on its own:

| Data | Source | Why |
|---|---|---|
| Current-season fixtures and results | [football-data.org](https://www.football-data.org) | Its free tier includes the current La Liga season; a whole season is one request |
| Stadiums, managers, current squads with photos | [API-Sports](https://www.api-football.com) | Richer team and player detail; these endpoints aren't season-restricted |
| 2024/25 results (model history and backtest) | API-Sports | Its free tier only serves fixtures for the 2022–2024 seasons, so the current season comes from football-data instead |

Clubs are linked across the two APIs by stored IDs (`externalId` for API-Sports, `fdId` for football-data), so a team's stadium, squad and matches belong to one record. Every match carries a `season`, and the site shows only the current one (worked out from the date in `lib/season.ts`); relegated clubs stay in the database as history but aren't shown.

**Free-tier limits:** API-Sports allows 100 requests a day, so squad and stadium syncs are spread across runs; football-data allows 10 requests a minute.

---

## Local Setup

**Prerequisites:** Node.js 24, PostgreSQL

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example apps/web/.env.local
# Add your DATABASE_URL, FOOTBALL_API_KEY, FOOTBALL_DATA_API_KEY and CRON_SECRET

# Run database migrations and generate the Prisma client
cd apps/web && npx prisma migrate dev && npx prisma generate

# Start the dev server (from the project root)
npm run dev
```

Then, in another terminal, seed the data. The sync routes require the `CRON_SECRET` from `.env.local` (generate one with `openssl rand -hex 32`):

```bash
set -a && source apps/web/.env.local && set +a
curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/sync           # 2024/25 teams + results (API-Sports)
curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/sync/fixtures  # current-season fixtures + results (football-data)
curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/sync/players   # squads (rate-limited — re-run to finish)
curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/sync/teams     # venue + manager (rate-limited — re-run to finish)
```

The `live_season_data` migration links the current season's clubs to football-data, so run the migrations before `/api/sync/fixtures`. Re-run `/api/sync/fixtures` to pick up new results and rescheduled matches.

Predictions and accuracy are computed on the fly from match history on each request — there's no prediction-generation step to run.

---

## CI/CD

Every push to `main` and every pull request runs the [CI workflow](.github/workflows/ci.yml) on GitHub Actions:

1. **Install** — `npm ci` on Node.js 24, read from `engines` in `package.json` (npm cache enabled)
2. **Lint** — ESLint across `apps/web`
3. **Test** — Vitest suite
4. **Build** — production `next build`

CI never touches a real database — a dummy `DATABASE_URL` is set so `prisma generate` and `next build` can run.

Deployment is handled by Vercel: pull requests get preview deployments, and merges to `main` deploy to the [live demo](https://matchmind-chi.vercel.app).

A [Vercel Cron job](apps/web/vercel.json) calls `/api/sync/fixtures` every night at 05:00 UTC, so new results and rescheduled matches are picked up automatically. Vercel sends the `CRON_SECRET` with each call, so the route stays protected.

---

## Security

- **Admin routes are locked.** The data-sync routes (`/api/sync`, `/api/sync/*`) and model-tuning routes (`/api/predictions/tune*`) require `Authorization: Bearer $CRON_SECRET`, checked in constant time. If the secret isn't set, they stay locked.
- **No public write routes.** Teams and matches are only written by the protected sync routes; the only public `POST` is on-demand prediction.
- **Dependencies are monitored.** Dependabot opens weekly update PRs and security fixes; secret scanning with push protection blocks committed credentials.
- **`main` is protected.** Changes land only through pull requests that pass CI.

---

## Project Structure

```
apps/
  web/
    src/
      app/              # Next.js pages and API routes
      components/       # Reusable UI components
      lib/              # Prisma client, prediction model, season logic, football API wrappers
    prisma/             # Schema and migrations
```

---

## License

[MIT](LICENSE)
