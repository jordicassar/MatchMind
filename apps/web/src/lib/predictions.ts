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