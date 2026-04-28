# MatchMind — Web

Next.js frontend for MatchMind, an AI-powered football match prediction app.

## Pages

| Route | Description |
|---|---|
| `/` | Home — browse teams and upcoming matches, request AI predictions per match |
| `/teams/[id]` | Team detail — crest, stats (wins/losses/draws/goals), and match history |
| `/accuracy` | Prediction accuracy dashboard — total vs correct predictions |

## Getting Started

From the repo root, run both the API and web app together:

```bash
npm run dev
```

Or run the web app alone:

```bash
npm run dev --workspace=apps/web
```

The web app runs on **http://localhost:3000** and expects the API at **http://localhost:3001**.

## Stack

- [Next.js](https://nextjs.org) (App Router)
- [Tailwind CSS](https://tailwindcss.com)
- TypeScript
