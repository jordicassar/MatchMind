import { describe, it, expect } from "vitest";
import { weightedAverage, outcome, isPredictionCorrect, blendScore, pointsPerGame, predictScore } from "./predictions";

describe("weightedAverage", () => {
  it("returns 0 for an empty list", () => {
    expect(weightedAverage([])).toBe(0);
  });

  it("returns the value itself for a single entry", () => {
    expect(weightedAverage([3])).toBe(3);
  });

  it("weights recent values (first in the list) more heavily", () => {
    // [2, 0] => (2*2 + 0*1) / (2+1) = 4/3 ≈ 1.33 -> rounds to 1
    expect(weightedAverage([2, 0])).toBe(1);
    // Reversing makes the recent value 0, pulling the average down
    // [0, 2] => (0*2 + 2*1) / 3 = 2/3 ≈ 0.67 -> rounds to 1
    expect(weightedAverage([0, 2])).toBe(1);
    // A clearer asymmetry: recent high vs recent low
    // [4, 0, 0] => (4*3) / (3+2+1) = 12/6 = 2
    expect(weightedAverage([4, 0, 0])).toBe(2);
    // [0, 0, 4] => (4*1) / 6 ≈ 0.67 -> rounds to 1
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
    // Predicted a home win, home won (different scoreline still counts)
    expect(isPredictionCorrect(2, 1, 3, 0)).toBe(true);
  });

  it("is correct when both are draws regardless of scoreline", () => {
    expect(isPredictionCorrect(1, 1, 2, 2)).toBe(true);
  });

  it("is incorrect when the outcome differs", () => {
    // Predicted a home win, match was a draw
    expect(isPredictionCorrect(2, 1, 1, 1)).toBe(false);
    // Predicted a draw, away won
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
    // 3*0.7 + 1*0.3 = 2.4 -> rounds to 2
    expect(blendScore(3, 1, 0.7)).toBe(2);
  });

  it("rounds the blended result to an integer", () => {
    // 2*0.5 + 1*0.5 = 1.5 -> rounds to 2
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
      { homeTeamId: 1, awayTeamId: 2, homeScore: 2, awayScore: 0 }, // team 1 home win
      { homeTeamId: 3, awayTeamId: 1, homeScore: 1, awayScore: 1}, // team 1 away draw
    ];
    // (3 + 1) / 2 = 2.0
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
