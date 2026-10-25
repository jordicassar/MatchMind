// season — which La Liga season the site shows, and how to label it.
// Seasons are identified by their starting year (2026 = 2026/27). La Liga
// starts in mid-August, so from July onwards the new season is current;
// January–June still belong to the season that started the previous year.

// The 2024/25 season — kept as model history and shown as the backtest.
export const BACKTEST_SEASON = 2024;

export function currentSeason(now: Date = new Date()): number {
    return now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

export const CURRENT_SEASON = currentSeason();

// 2026 -> "2026/27"
export function seasonLabel(season: number): string {
  return `${season}/${String((season + 1) % 100).padStart(2, "0")}`;
}
