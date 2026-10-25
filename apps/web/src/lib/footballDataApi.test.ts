import { describe, it, expect } from "vitest";
import { finalScore, type FdMatch } from "./footballDataApi";

const match = (status: string, home: number | null, away: number | null): FdMatch => ({
  id: 1,
  utcDate: "2026-10-17T12:00:00Z",
  status,
  homeTeam: { id: 86, name: "Real Madrid CF" },
  awayTeam: { id: 81, name: "FC Barcelona" },
  score: { fullTime: { home, away } },
});

describe("finalScore", () => {
  it("returns the full-time score of a finished match", () => {
    expect(finalScore(match("FINISHED", 2, 1))).toEqual({ homeScore: 2, awayScore: 1 });
  });

  it("returns no score for a match that hasn't started", () => {
    expect(finalScore(match("TIMED", null, null))).toEqual({ homeScore: null, awayScore: null });
  });

  it("ignores the partial score of a match in progress", () => {
    expect(finalScore(match("IN_PLAY", 1, 0))).toEqual({ homeScore: null, awayScore: null });
  });

  it("returns no score for a postponed match", () => {
    expect(finalScore(match("POSTPONED", null, null))).toEqual({ homeScore: null, awayScore: null });
  });
});
