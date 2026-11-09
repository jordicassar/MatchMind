export function weightedAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const n = values.length;
  const total = values.reduce((sum, v, i) => sum + v * (n - i), 0);
  return Math.round(total / ((n * (n + 1)) / 2));
}

export function blendScore(form: number, h2h: number, w: number): number {
  return Math.round(form * w + h2h * (1 - w));
}

export type Outcome = "home" | "draw" | "away";

export function outcome(homeScore: number, awayScore: number): Outcome {
  if (homeScore > awayScore) return "home";
  if (homeScore < awayScore) return "away";
  return "draw";
}

export function isPredictionCorrect(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): boolean {
  return outcome(predictedHome, predictedAway) === outcome(actualHome, actualAway);
}
const HOME_ADVANTAGE = 0.75;
const STRENGTH_WEIGHT = 1.0;

type MatchRow = {
  homeTeamId: number,
  awayTeamId: number,
  homeScore: number | null,
  awayScore: number | null,
};

function weightedMean(values: number[]): number {
  if (values.length === 0) return 0;
  const n = values.length;
  const total = values.reduce((sum, v, i) => sum + v * (n - i), 0);
  return total / ((n * (n + 1)) / 2);
}

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

export function predictScore(input: {
  homeTeamId: number;
  awayTeamId: number;
  homeHomeGames: MatchRow[];
  awayAwayGames: MatchRow[];
  homeAllGames: MatchRow[];
  awayAllGames: MatchRow[];
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
  const prior = played.filter((g) => g.date < match.date);
  return predictScore({
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeHomeGames: prior.filter((g) => g.homeTeamId === match.homeTeamId),
    awayAwayGames: prior.filter((g) => g.awayTeamId === match.awayTeamId),
    homeAllGames: prior.filter((g) => g.homeTeamId === match.homeTeamId || g.awayTeamId === match.homeTeamId),
    awayAllGames: prior.filter((g) => g.homeTeamId === match.awayTeamId || g.awayTeamId === match.awayTeamId),
  });
}

export function predictionAccuracy(
  played: { homeTeamId: number; awayTeamId: number; homeScore: number | null; awayScore: number | null; date: Date }[],
  history: typeof played = played
) {
  let correctPredictions = 0;
  let exactScores = 0;
  for (const m of played) {
    const { predictedHome, predictedAway } = predictFromHistory(m, history);
    if (isPredictionCorrect(predictedHome, predictedAway, m.homeScore ?? 0, m.awayScore ?? 0)) correctPredictions++;
    if (predictedHome === m.homeScore && predictedAway === m.awayScore) exactScores++;
  }

  const percent = (n: number) => (played.length > 0 ? (n / played.length) * 100 : 0);

  return {
    totalPredictions: played.length,
    correctPredictions,
    accuracy: percent(correctPredictions),
    exactScores,
    exactScoreAccuracy: percent(exactScores),
  };
}
