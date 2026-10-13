import { describe, it, expect } from "vitest";
import { computeStandings } from "./standings";

const team = (id: number, name: string) => ({ id, name, crest: null });
const game = (
  homeTeam: ReturnType<typeof team>,
  awayTeam: ReturnType<typeof team>,
  homeScore: number | null,
  awayScore: number | null,
) => ({ homeTeam, awayTeam, homeScore, awayScore });

const A = team(1, "Athletic");
const B = team(2, "Betis");
const C = team(3, "Celta");
const D = team(4, "Deportivo");

describe("computeStandings", () => {
  it("returns an empty table when there are no matches", () => {
    expect(computeStandings([])).toEqual([]);
  });

  it("ignores matches that haven't been played", () => {
    expect(computeStandings([game(A, B, null, null)])).toEqual([]);
  });

  it("tallies wins, draws, losses, goals and points", () => {
    // A 2-1 B, B 1-1 C, C 0-3 A
    const [first, second, third] = computeStandings([
      game(A, B, 2, 1),
      game(B, C, 1, 1),
      game(C, A, 0, 3),
    ]);

    expect(first).toMatchObject({
      team: { name: "Athletic" }, played: 2, won: 2, drawn: 0, lost: 0, gf: 5, ga: 1, gd: 4, pts: 6,
    });
    expect(second).toMatchObject({
      team: { name: "Betis" }, played: 2, won: 0, drawn: 1, lost: 1, gf: 2, ga: 3, gd: -1, pts: 1,
    });
    expect(third).toMatchObject({
      team: { name: "Celta" }, played: 2, won: 0, drawn: 1, lost: 1, gf: 1, ga: 4, gd: -3, pts: 1,
    });
  });

  it("breaks ties on points and goal difference by goals scored", () => {
    // A and B both win by one goal, but B scores more; same for D over C
    const order = computeStandings([game(A, C, 1, 0), game(B, D, 3, 2)]).map((r) => r.team.name);
    expect(order).toEqual(["Betis", "Athletic", "Deportivo", "Celta"]);
  });

  it("falls back to alphabetical order when everything else is equal", () => {
    // Betis is the home side, but Athletic sorts first by name
    const order = computeStandings([game(B, A, 2, 2)]).map((r) => r.team.name);
    expect(order).toEqual(["Athletic", "Betis"]);
  });
});
