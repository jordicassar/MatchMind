export async function fetchMatches() {
  const response = await fetch("https://v3.football.api-sports.io/fixtures?league=140&season=2024", {
    headers: { "x-apisports-key": process.env.FOOTBALL_API_KEY! },
  });
  return response.json();
}

export interface ApiCoach {
  name: string;
  photo?: string;
  career?: { team?: { id?: number }; start?: string | null; end?: string | null }[];
}

export function pickCurrentCoach(coaches: ApiCoach[], teamId: number): ApiCoach | null {
  const current = coaches
    .map((coach) => ({ coach, job: coach.career?.find((j) => j.team?.id === teamId && !j.end) }))
    .filter((c) => c.job !== undefined);
  if (current.length === 0) return null;
  current.sort((a, b) => (b.job?.start ?? "").localeCompare(a.job?.start ?? ""));
  return current[0].coach;
}
