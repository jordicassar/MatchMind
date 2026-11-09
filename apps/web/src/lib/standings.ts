import type { StandingsRow } from "./types";

type StandingsTeam = { id: number; name: string; crest: string | null };

type StandingsMatch = {
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: StandingsTeam;
  awayTeam: StandingsTeam;
};

type Tally = Omit<StandingsRow, "gd" | "pts">;

export function computeStandings(matches: StandingsMatch[]): StandingsRow[] {
  const table = new Map<number, Tally>();

  function entry(team: StandingsTeam): Tally {
    if (!table.has(team.id)) {
      table.set(team.id, {
        team: { id: team.id, name: team.name, crest: team.crest },
        played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0,
      });
    }
    return table.get(team.id)!;
  }

  for (const m of matches) {
    if (m.homeScore === null || m.awayScore === null) continue;
    const h = m.homeScore;
    const a = m.awayScore;
    const home = entry(m.homeTeam);
    const away = entry(m.awayTeam);

    home.played++; home.gf += h; home.ga += a;
    away.played++; away.gf += a; away.ga += h;

    if (h > a) {
      home.won++;
      away.lost++;
    } else if (h < a) {
      away.won++;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
    }
  }

  return [...table.values()]
    .map((r) => ({ ...r, gd: r.gf - r.ga, pts: r.won * 3 + r.drawn }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.name.localeCompare(b.team.name));
}