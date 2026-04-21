import prisma from "./db";

const teamIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

function getRandomTeam(exclude: number, used: number[]): number {
  const available = teamIds.filter(id => id !== exclude && !used.includes(id));
  return available[Math.floor(Math.random() * available.length)];
}

async function seed() {
  const usedPairs: string[] = [];

  for (const homeTeamId of teamIds) {
    let matchesCreated = 0;
    const usedAway: number[] = [];

    while (matchesCreated < 5) {
      const awayTeamId = getRandomTeam(homeTeamId, usedAway);
      const pair = `${homeTeamId}-${awayTeamId}`;

      if (!usedPairs.includes(pair)) {
        const date = new Date();
        date.setDate(date.getDate() + Math.floor(Math.random() * 60) + 1);

        await prisma.match.create({
          data: {
            homeTeamId,
            awayTeamId,
            date,
            homeScore: null,
            awayScore: null,
          }
        });

        usedPairs.push(pair);
        usedAway.push(awayTeamId);
        matchesCreated++;
      }
    }
  }

  console.log("Seeding complete!");
  await prisma.$disconnect();
}

seed();