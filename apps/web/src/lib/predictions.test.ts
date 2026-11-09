import { describe, it, expect } from "vitest";
import { weightedAverage, outcome, isPredictionCorrect, blendScore, pointsPerGame, predictScore, predictFromHistory, predictionAccuracy } from "./predictions";

describe("weightedAverage", () => {
  it("returns 0 for an empty list", () => {
    expect(weightedAverage([])).toBe(0);
  });

  it("returns the value itself for a single entry", () => {
    expect(weightedAverage([3])).toBe(3);
  });

  it("weights recent values (first in the list) more heavily", () => {
    expect(weightedAverage([2, 0])).toBe(1);
    expect(weightedAverage([0, 2])).toBe(1);
    expect(weightedAverage([4, 0, 0])).toBe(2);
    expect(weightedAverage([0, 0, 4])).toBe(1);
  });

  it("returns a rounded integer", () => {
    expect(Number.isInteger(weightedAverage([1, 2, 2]))).toBe(true);
  });

  it("handles a flat run of identical values", () => {
    expect(weightedAverage([2, 2, 2, 2])).toBe(2);
  });
});

describe("outcome", () => {
  it("identifies a home win", () => {
    expect(outcome(2, 1)).toBe("home");
  });

  it("identifies an away win", () => {
    expect(outcome(0, 3)).toBe("away");
  });

  it("identifies a draw", () => {
    expect(outcome(1, 1)).toBe("draw");
    expect(outcome(0, 0)).toBe("draw");
  });
});

describe("isPredictionCorrect", () => {
  it("is correct when the predicted outcome matches the actual outcome", () => {
    expect(isPredictionCorrect(2, 1, 3, 0)).toBe(true);
  });

  it("is correct when both are draws regardless of scoreline", () => {
    expect(isPredictionCorrect(1, 1, 2, 2)).toBe(true);
  });

  it("is incorrect when the outcome differs", () => {
    expect(isPredictionCorrect(2, 1, 1, 1)).toBe(false);
    expect(isPredictionCorrect(1, 1, 0, 2)).toBe(false);
  });
});

describe("blendScore", () => {
  it("returns form only when w = 1", () => {
    expect(blendScore(3, 0, 1)).toBe(3);
  });

  it("returns h2h only when w = 0", () => {
    expect(blendScore(3, 1, 0)).toBe(1);
  });

  it("weights form more heavily at w = 0.7", () => {
    expect(blendScore(3, 1, 0.7)).toBe(2);
  });

  it("rounds the blended result to an integer", () => {
    expect(blendScore(2, 1, 0.5)).toBe(2);
    expect(Number.isInteger(blendScore(3, 2, 0.7))).toBe(true);
  });
});

describe("pointsPerGame", () => {
  it("returns 0 for no games", () => {
    expect(pointsPerGame([], 1)).toBe(0);
  });

  it("awards 3 for a win, 1 for a draw, from the team's perspective", () => {
    const games = [
      { homeTeamId: 1, awayTeamId: 2, homeScore: 2, awayScore: 0 },
      { homeTeamId: 3, awayTeamId: 1, homeScore: 1, awayScore: 1},
    ];
    expect(pointsPerGame(games, 1)).toBe(2);
  });
});

describe("predictScore", () => {
  it("favors the home side via home advantage on equal teams", () => {
    const evenGame = { homeTeamId: 1, awayTeamId: 2, homeScore: 1, awayScore: 1 };
    const { predictedHome, predictedAway } = predictScore({
      homeTeamId: 1,
      awayTeamId: 2,
      homeHomeGames: [evenGame],
      awayAwayGames: [{ homeTeamId: 3, awayTeamId: 2, homeScore: 1, awayScore: 1 }],
      homeAllGames: [evenGame],
      awayAllGames: [{ homeTeamId: 3, awayTeamId: 2, homeScore: 1, awayScore: 1 }],
    });
    expect(predictedHome).toBeGreaterThanOrEqual(predictedAway);
  });
});

const played = (homeTeamId: number, awayTeamId: number, homeScore: number, awayScore: number, date: string) => ({
  homeTeamId, awayTeamId, homeScore, awayScore, date: new Date(date),
});

describe("predictFromHistory", () => {
  const fixture = { homeTeamId: 1, awayTeamId: 2, date: new Date("2024-10-01") };

  it("ignores the fixture's own result (leak-free)", () => {
    const asHomeWin = predictFromHistory(fixture, [played(1, 2, 5, 0, "2024-10-01")]);
    const asAwayWin = predictFromHistory(fixture, [played(1, 2, 0, 5, "2024-10-01")]);
    expect(asHomeWin.predictedHome).toBe(asAwayWin.predictedHome);
    expect(asHomeWin.predictedAway).toBe(asAwayWin.predictedAway);
  });

  it("ignores matches played after the fixture", () => {
    const withoutFuture = predictFromHistory(fixture, []);
    const withFuture = predictFromHistory(fixture, [played(1, 3, 6, 0, "2024-11-01")]);
    expect(withFuture).toEqual(withoutFuture);
  });

  it("uses matches played before the fixture", () => {
    const noHistory = predictFromHistory(fixture, []);
    const withHistory = predictFromHistory(fixture, [played(1, 3, 4, 0, "2024-09-01")]);
    expect(withHistory.predictedHome).toBeGreaterThan(noHistory.predictedHome);
  });
});

describe("predictionAccuracy", () => {
  it("returns zeros when no matches have been played", () => {
    expect(predictionAccuracy([])).toEqual({
      totalPredictions: 0, correctPredictions: 0, accuracy: 0, exactScores: 0, exactScoreAccuracy: 0,
    });
  });

  it("counts correct and incorrect outcome predictions", () => {
    const result = predictionAccuracy([
      played(1, 2, 2, 0, "2024-08-15"),
      played(3, 4, 0, 1, "2024-08-15"),
    ]);
    expect(result).toEqual({
      totalPredictions: 2, correctPredictions: 1, accuracy: 50, exactScores: 0, exactScoreAccuracy: 0,
    });
  });

  it("counts exact scorelines separately from correct outcomes", () => {
    const result = predictionAccuracy([
      played(1, 2, 1, 0, "2024-08-15"),
      played(3, 4, 3, 0, "2024-08-15"),
    ]);
    expect(result).toEqual({
      totalPredictions: 2, correctPredictions: 2, accuracy: 100, exactScores: 1, exactScoreAccuracy: 50,
    });
  });

  it("always returns a percentage between 0 and 100", () => {
    const { accuracy } = predictionAccuracy([
      played(1, 2, 1, 0, "2024-08-15"),
      played(2, 1, 2, 2, "2024-08-22"),
      played(1, 2, 0, 3, "2024-08-29"),
    ]);
    expect(accuracy).toBeGreaterThanOrEqual(0);
    expect(accuracy).toBeLessThanOrEqual(100);
  });

  it("scores only given matches but learns from the full history", () => {
    const earlier = played(3, 2, 0, 4, "2024-09-01");
    const scored = played(1, 2, 0, 1, "2024-10-01");

    expect(predictionAccuracy([scored])).toEqual({
      totalPredictions: 1, correctPredictions: 0, accuracy: 0, exactScores: 0, exactScoreAccuracy: 0,
    });
    expect(predictionAccuracy([scored], [scored, earlier])).toEqual({
      totalPredictions: 1, correctPredictions: 1, accuracy: 100, exactScores: 0, exactScoreAccuracy: 0,
    });
  });
});
