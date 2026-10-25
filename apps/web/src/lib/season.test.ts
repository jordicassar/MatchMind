import { describe, it, expect } from "vitest";
import { currentSeason, seasonLabel } from "./season";

describe("currentSeason", () => {
  it("is the new season from July onwards", () => {
    expect(currentSeason(new Date("2026-07-01"))).toBe(2026);
    expect(currentSeason(new Date("2026-10-25"))).toBe(2026);
  });

  it("is still last year's season from January to June", () => {
    expect(currentSeason(new Date("2027-01-15"))).toBe(2026);
    expect(currentSeason(new Date("2027-06-30"))).toBe(2026);
  });
});

describe("seasonLabel", () => {
  it("formats a season as start/end year", () => {
    expect(seasonLabel(2026)).toBe("2026/27");
    expect(seasonLabel(2024)).toBe("2024/25");
  });

  it("pads the end year across a century", () => {
    expect(seasonLabel(2099)).toBe("2099/00");
  });
});
