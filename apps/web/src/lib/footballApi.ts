// footballApi — wrapper for the API-Sports football data API.
// Used exclusively by the sync route (/api/sync) to seed the database
// with LaLiga 2024/25 fixtures and team data.
// Requires FOOTBALL_API_KEY to be set in .env.local.
// League 140 is the API-Sports identifier for LaLiga.
// These functions run server-side only — never called from the browser.
export async function fetchMatches() {
  const response = await fetch("https://v3.football.api-sports.io/fixtures?league=140&season=2024", {
    headers: { "x-apisports-key": process.env.FOOTBALL_API_KEY! },
  });
  return response.json();
}

export async function fetchTeam(id: number) {
  const response = await fetch(`https://v3.football.api-sports.io/teams?id=${id}`, {
    headers: { "x-apisports-key": process.env.FOOTBALL_API_KEY! },
  });
  return response.json();
}
