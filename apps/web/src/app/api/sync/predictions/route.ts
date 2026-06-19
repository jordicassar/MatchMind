// Bulk prediction sync — regenerates a stored prediction for every played
// match using the tuned model (see lib/predictions predictScore). Loads all
// played matches once, then for each fixture builds its prior-games arrays in
// memory (leak-free: only matches played before it) and upserts the result.
// Re-runnable: existing predictions are overwritten with the current model.
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { predictScore } from "@/lib/predictions";

export async function POST() {
  try {
    // All played matches — both the fixtures to predict and the history to predict from.
    const played = await prisma.match.findMany({
      where: { homeScore: { not: null }, awayScore: { not: null } },
      orderBy: { date: "desc" },
    });

    for (const match of played) {
      // Only matches before this fixture (keeps it leak-free); still date-desc.
      const prior = played.filter((g) => g.date < match.date);

      const { predictedHome, predictedAway } = predictScore({
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        homeHomeGames: prior.filter((g) => g.homeTeamId === match.homeTeamId),
        awayAwayGames: prior.filter((g) => g.awayTeamId === match.awayTeamId),
        homeAllGames: prior.filter(
          (g) => g.homeTeamId === match.homeTeamId || g.awayTeamId === match.homeTeamId
        ),
        awayAllGames: prior.filter(
          (g) => g.homeTeamId === match.awayTeamId || g.awayTeamId === match.awayTeamId
        ),
      });

      await prisma.prediction.upsert({
        where: { matchId: match.id },
        create: { predictedHome, predictedAway, matchId: match.id },
        update: { predictedHome, predictedAway },
      });
    }

    return NextResponse.json({ message: `Synced ${played.length} predictions` });
  } catch (error) {
    console.error("sync predictions failed:", error);
    return NextResponse.json({ message: "Failed to sync predictions" }, { status: 500 });
  }
}
