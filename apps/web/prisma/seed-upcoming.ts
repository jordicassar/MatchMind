import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Circle method round-robin: fix first team, rotate the rest.
// Each round produces n/2 matches; every team appears exactly once per round.
function buildRounds(teams: { id: number }[], numRounds: number) {
  const fixed = teams[0];
  const rotating = [...teams.slice(1)];
  const rounds: { homeId: number; awayId: number }[][] = [];

  for (let r = 0; r < numRounds; r++) {
    const circle = [fixed, ...rotating];
    const n = circle.length;
    const round: { homeId: number; awayId: number }[] = [];
    for (let i = 0; i < n / 2; i++) {
      // Alternate home/away each round to balance
      const [a, b] = r % 2 === 0
        ? [circle[i], circle[n - 1 - i]]
        : [circle[n - 1 - i], circle[i]];
      round.push({ homeId: a.id, awayId: b.id });
    }
    rounds.push(round);
    // Rotate: last element moves to position 1 (after fixed)
    rotating.unshift(rotating.pop()!);
  }
  return rounds;
}

async function main() {
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });
  if (teams.length < 2) throw new Error("Not enough teams in the database. Run /api/sync first.");

  const rounds = buildRounds(teams, 4);
  const data: { homeTeamId: number; awayTeamId: number; date: Date }[] = [];
  let dayOffset = 7;

  for (const round of rounds) {
    for (const { homeId, awayId } of round) {
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      date.setHours(20, 0, 0, 0);
      data.push({ homeTeamId: homeId, awayTeamId: awayId, date });
      dayOffset += 3;
    }
  }

  await prisma.match.createMany({ data });
  console.log(`Created ${data.length} upcoming matches (4 per team)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
