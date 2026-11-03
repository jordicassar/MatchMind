// footballApi — wrapper for the API-Sports football data API.
// Used by the sync routes: /api/sync seeds the database with LaLiga 2024/25
// fixtures and team data (the free API tier covers 2022–2024), and
// /api/sync/teams uses pickCurrentCoach to choose each club's manager.
// Requires FOOTBALL_API_KEY to be set in .env.local.
// League 140 is the API-Sports identifier for LaLiga.
// These functions run server-side only — never called from the browser.
export async function fetchMatches() {
  const response = await fetch("https://v3.football.api-sports.io/fixtures?league=140&season=2024", {
    headers: { "x-apisports-key": process.env.FOOTBALL_API_KEY! },
  });
  return response.json();
}

// Minimal shape of an API-Sports coach — only the fields used to pick the
// current manager. `career` lists every job; a current job has no end date.
export interface ApiCoach {
  name: string;
  photo?: string;
  career?: { team?: { id?: number }; start?: string | null; end?: string | null }[];
}

// /coachs?team= returns past and present coaches (e.g. Xavi and Flick for
// Barcelona), so pick the one whose job at this club has no end date — the
// most recently started, if there are several. Null if none is current.
export function pickCurrentCoach(coaches: ApiCoach[], teamId: number): ApiCoach | null {
  const current = coaches
    .map((coach) => ({ coach, job: coach.career?.find((j) => j.team?.id === teamId && !j.end) }))
    .filter((c) => c.job !== undefined);
  if (current.length === 0) return null;
  current.sort((a, b) => (b.job?.start ?? "").localeCompare(a.job?.start ?? ""));
  return current[0].coach;
}
