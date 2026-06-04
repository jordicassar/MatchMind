// Bulk prediction sync route — backfills predictions for every played match
// that doesn't have one yet. Runs the same form + H2H blending used by
// /api/predictions across all matches at once, so the accuracy page has data
// to measure against. Pure database work, so no rate-limit delay is needed.
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { weightedAverage } from "@/lib/predictions";

export async function POST() {

    try {
        const matches = await prisma.match.findMany({
            where: {
                homeScore: { not: null },
                prediction: null,
            },
        });

        for (const match of matches) {
        const[homeMatches, awayMatches, h2hMatches] = await Promise.all([
                prisma.match.findMany({
                    where: { homeTeamId: match.homeTeamId, homeScore: { not: null } },
                    orderBy: { date: "desc"},
                }),
                prisma.match.findMany({
                    where: { awayTeamId: match.awayTeamId, awayScore: { not: null } },
                    orderBy: { date: "desc"},
                }),
                prisma.match.findMany({
                    where: {
                        homeScore: { not: null},
                        OR: [
                            { homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId },
                            { homeTeamId: match.awayTeamId, awayTeamId: match.homeTeamId },
                        ],
                    },
                    include: { homeTeam: true, awayTeam: true },
                    orderBy: { date: "desc"},
                }),
            ]); 
            const formHome = weightedAverage(homeMatches.map((m) => m.homeScore ?? 0));
            const formAway = weightedAverage(awayMatches.map((m) => m.awayScore ?? 0));
                    
            const h2hHomeScores = h2hMatches.map((m) =>
                m.homeTeamId === match.homeTeamId ? (m.homeScore ?? 0) : (m.awayScore ?? 0)
            );
            const h2hAwayScores = h2hMatches.map((m) =>
                m.awayTeamId === match.awayTeamId ? (m.awayScore ?? 0) : (m.homeScore ?? 0)
            );

            const h2hHome = h2hMatches.length > 0 ? weightedAverage(h2hHomeScores) : 0;
            const h2hAway = h2hMatches.length > 0 ? weightedAverage(h2hAwayScores) : 0;

            const predictedHome = h2hMatches.length > 0 ? Math.round(formHome * 0.7 + h2hHome * 0.3) : formHome;
            const predictedAway = h2hMatches.length > 0 ? Math.round(formAway * 0.7 + h2hAway * 0.3) : formAway;

            await prisma.prediction.upsert({
                where: { matchId: match.id },
                create: { predictedHome, predictedAway, matchId: match.id },
                update: { predictedHome, predictedAway },
            })

        }
        return NextResponse.json({ message: `Synced ${matches.length} predictions` });
    } catch {
        return NextResponse.json({ message: "Failed to sync predictions" }, { status: 500 });
    }
}