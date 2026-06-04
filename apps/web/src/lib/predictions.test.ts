import { describe, it, expect } from "vitest";
import { weightedAverage, outcome, isPredictionCorrect } from "./predictions";

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