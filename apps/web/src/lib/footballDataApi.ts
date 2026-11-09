const API = "https://api.football-data.org/v4";

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

export function finalScore(m: FdMatch): { homeScore: number | null; awayScore: number | null } {
  if (m.status !== "FINISHED") return { homeScore: null, awayScore: null };
  return { homeScore: m.score.fullTime.home, awayScore: m.score.fullTime.away };
}
