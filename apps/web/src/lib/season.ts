export const BACKTEST_SEASON = 2024;

export function currentSeason(now: Date = new Date()): number {
    return now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

export const CURRENT_SEASON = currentSeason();

export function seasonLabel(season: number): string {
  return `${season}/${String((season + 1) % 100).padStart(2, "0")}`;
}

export const currentSeasonTeams = {
  OR: [
    { homeMatches: { some: { season: CURRENT_SEASON } } },
    { awayMatches: { some: { season: CURRENT_SEASON } } },
  ],
};
