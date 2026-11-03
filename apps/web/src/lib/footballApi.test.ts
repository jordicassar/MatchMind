import { describe, it, expect } from "vitest";
import { pickCurrentCoach, type ApiCoach } from "./footballApi";

const BARCA = 529;
const coach = (name: string, teamId: number, start: string, end: string | null): ApiCoach => ({
  name,
  career: [{ team: { id: teamId }, start, end }],
});

describe("pickCurrentCoach", () => {
  it("ignores former coaches and picks the most recent current one", () => {
    // Real API-Sports data for Barcelona: Xavi has left, and R. Sanchez is
    // listed as current but started before Flick
    const coaches = [
      coach("Xavi", BARCA, "2021-11-01", "2024-05-01"),
      coach("H. Flick", BARCA, "2024-05-01", null),
      coach("R. Sanchez", BARCA, "2023-07-01", null),
    ];
    expect(pickCurrentCoach(coaches, BARCA)?.name).toBe("H. Flick");
  });

  it("ignores current jobs at other clubs", () => {
    expect(pickCurrentCoach([coach("Someone", 541, "2025-01-01", null)], BARCA)).toBeNull();
  });

  it("returns null when nobody is currently in charge", () => {
    expect(pickCurrentCoach([coach("Xavi", BARCA, "2021-11-01", "2024-05-01")], BARCA)).toBeNull();
  });
});
