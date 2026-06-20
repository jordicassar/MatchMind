// Shared prediction maths used by the prediction and breakdown routes.
// weightedAverage favours recent results: values are expected most-recent
// first, and each is weighted by its position so the latest match counts the
// most. Returns a rounded integer (0 for an empty list).
export function weightedAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const n = values.length;
  const total = values.reduce((sum, v, i) => sum + v * (n - i), 0);
  return Math.round(total / ((n * (n + 1)) / 2));
}

// Blend a form figure with an H2H figure. w is the form weight (0–1);
// H2H gets the remaining (1 - w). Returns a rounded integer.
export function blendScore(form: number, h2h: number, w: number): number {
  return Math.round(form * w + h2h * (1 - w));
}

export type Outcome = "home" | "draw" | "away";

// Reduces a scoreline to its result. Used both to read a prediction's
// implied outcome and the actual result, so the two can be compared.
export function outcome(homeScore: number, awayScore: number): Outcome {
  if (homeScore > awayScore) return "home";
  if (homeScore < awayScore) return "away";
  return "draw";
}

// A prediction is correct when its implied outcome (win/draw/away) matches
// the actual outcome, regardless of whether the exact scoreline was right.
export function isPredictionCorrect(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): boolean {
  return outcome(predictedHome, predictedAway) === outcome(actualHome, actualAway);
}
// ── Tuned prediction model ────────────────────────────────────────────────
// Tuned via the /api/predictions/tune* experiments. Predict a scoreline from
// three signals, all computed leak-free (only a team's matches played BEFORE 
// the fixture):
//    - attack vs defense: expected goals = a team's attacking from blended with
//      the opponent's defensive weakness (goals they concede)
//    - home advantage: a fixed goal nudge to the home side
//    - team strength: the gap in points-per-game pulls the score toward the
//      stronger team, so a strong away side can override home advantage
const HOME_ADVANTAGE = 0.75;
const STRENGTH_WEIGHT = 1.0;

type MatchRow = {
  homeTeamId: number,
  awayTeamId: number,
  homeScore: number | null,
  awayScore: number | null,
};

// Unrounded weighted average, most-recent first (recent games weigh more).
// Seperate from weightedAverage, which rounds - we need precision here.
function weightedMean(values: number[]): number {
  if (values.length === 0) return 0;
  const n = values.length;
  const total = values.reduce((sum, v, i) => sum + v * (n - i), 0);
  return total / ((n * (n + 1)) / 2);
}

// Points per game (3 win / 1 draw / 0 loss) for a team across the given games.
export function pointsPerGame(games: MatchRow[], teamId: number): number {
  if (games.length === 0) return 0;
  let points = 0;
  for (const g of games) {
    const isHome = g.homeTeamId === teamId;
    const mine = (isHome ? g.homeScore : g.awayScore) ?? 0;
    const theirs = (isHome ? g.awayScore : g.homeScore) ?? 0;
    points += mine > theirs ? 3 : mine === theirs ? 1 : 0;
  }
  return points/ games.length;
}

// Predict a scoreline. Every array must be the team's games played BEFORE the
// fixture (leak-free), most recent first. Returns the final score plus the
// intermediate signals, so the breakdown view can explain the prediction.
export function predictScore(input: {
  homeTeamId: number;
  awayTeamId: number;
  homeHomeGames: MatchRow[]; // home team's prior HOME games
  awayAwayGames: MatchRow[]; // away team's prior AWAY games
  homeAllGames: MatchRow[]; // home team's prior games (any venue)
  awayAllGames: MatchRow[]; // away team's prior games (any venue)
}): {
  predictedHome: number;
  predictedAway: number;
  homeAttack: number;
  homeDefense: number;
  awayAttack: number;
  awayDefense: number;
  homeAdvantage: number;
  homePPG: number;
  awayPPG: number;
} {
  const homeAttack = weightedMean(input.homeHomeGames.map((g) => g.homeScore ?? 0));
  const homeDefense = weightedMean(input.homeHomeGames.map((g) => g.awayScore ?? 0));
  const awayAttack = weightedMean(input.awayAwayGames.map((g) => g.awayScore ?? 0));
  const awayDefense = weightedMean(input.awayAwayGames.map((g) => g.homeScore ?? 0));

  const expHome = (homeAttack + awayDefense) / 2;
  const expAway = (awayAttack + homeDefense) / 2;

  const homePPG = pointsPerGame(input.homeAllGames, input.homeTeamId);
  const awayPPG = pointsPerGame(input.awayAllGames, input.awayTeamId);
  const strengthDiff = homePPG - awayPPG;

  // Clamp at 0 — a scoreline can't be negative.
  return {
    predictedHome: Math.max(0, Math.round(expHome + HOME_ADVANTAGE + STRENGTH_WEIGHT * strengthDiff)),
    predictedAway: Math.max(0, Math.round(expAway - STRENGTH_WEIGHT * strengthDiff)),
    homeAttack,
    homeDefense,
    awayAttack,
    awayDefense,
    homeAdvantage: HOME_ADVANTAGE,
    homePPG,
    awayPPG,
  };
}

export function predictFromHistory(
  match: { homeTeamId: number, awayTeamId: number, date: Date },
  played: { homeTeamId: number, awayTeamId: number, homeScore: number | null; awayScore: number | null; date: Date}[]
) {
  const prior = played.filter((g) => g.date < match.date); // leak-free, still date-desc
  return predictScore({
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeHomeGames: prior.filter((g) => g.homeTeamId === match.homeTeamId),
    awayAwayGames: prior.filter((g) => g.awayTeamId === match.awayTeamId),
    homeAllGames: prior.filter((g) => g.homeTeamId === match.homeTeamId || g.awayTeamId === match.homeTeamId),
    awayAllGames: prior.filter((g) => g.homeTeamId === match.awayTeamId || g.awayTeamId === match.awayTeamId),
  });
}