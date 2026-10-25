// footballDataApi — wrapper for the football-data.org v4 API.
// Supplies the current La Liga season's fixtures and results, which the
// API-Sports free tier can't (it only serves fixtures up to the 2024 season).
// Used by /api/sync/fixtures. Requires FOOTBALL_DATA_API_KEY in .env.local.
// Free tier: 10 requests/minute — a whole season is a single request.
// These functions run server-side only — never called from the browser.
const API = "https://api.football-data.org/v4";

// Minimal shape of a football-data match — only the fields MatchMind uses.
export interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  score: { fullTime: { home: number | null; away: number | null } };
}

export async function fetchSeasonMatches(season: number): Promise<FdMatch[]> {
  const res = await fetch(`${API}/competitions/PD/matches?season=${season}`, {
    headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY! },
  });
  if (!res.ok) throw new Error(`football-data.org responded with ${res.status}`);
  const data = (await res.json()) as { matches: FdMatch[] };
  return data.matches;
}

// Only a FINISHED match has a final score. A match in progress (IN_PLAY or
// PAUSED) carries a partial score, which must not be stored as the result.
export function finalScore(m: FdMatch): { homeScore: number | null; awayScore: number | null } {
  if (m.status !== "FINISHED") return { homeScore: null, awayScore: null };
  return { homeScore: m.score.fullTime.home, awayScore: m.score.fullTime.away };
}
