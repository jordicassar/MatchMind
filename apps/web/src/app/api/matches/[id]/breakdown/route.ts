// Prediction breakdown route — explains how a match prediction is derived.
// Returns the intermediate values behind a prediction: each team's recent
// form (weighted average of goals), their head-to-head record and scores,
// and which blend was used (form-only or 70% form + 30% H2H).
// Read-only — unlike /api/predictions it never writes to the database.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { weightedAverage } from "@/lib/predictions";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }>}){
    try{
        const { id } = await params;
        const match = await prisma.match.findUnique({ where: { id: parseInt(id) } });
        if (!match) return NextResponse.json({ message: "Match not found"}, { status: 404 });

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


        const h2hHome = h2hMatches.length > 0 ? weightedAverage(h2hHomeScores) : null;
        const h2hAway = h2hMatches.length > 0 ? weightedAverage(h2hAwayScores) : null;

        const h2hRecord = h2hMatches.reduce(
            (acc, m) => {
                const homeWon = m.homeTeamId === match.homeTeamId
                    ? (m.homeScore ?? 0) > (m.awayScore ?? 0)
                    : (m.awayScore ?? 0) > (m.homeScore ?? 0);
                const draw = m.homeScore === m.awayScore;
                if (draw) acc.draws++;
                else if (homeWon) acc.homeWins++;
                else acc.awayWins++;
                return acc;
            },
            { homeWins: 0, draws: 0, awayWins: 0 }
        );

        return NextResponse.json({ 
            formHome, 
            formAway,
            h2hHome,
            h2hAway,
            h2hCount: h2hMatches.length,
            h2hRecord,
            blendUsed: h2hMatches.length > 0 ? "form+h2h" : "form-only",
            h2hMatches: h2hMatches.map((m) => ({
                id: m.id,
                date: m.date,
                homeTeam: m.homeTeam.name,
                awayTeam: m.awayTeam.name,
                homeScore: m.homeScore,
                awayScore: m.awayScore,
            })),
        });


    } catch {
        return NextResponse.json({ message: "Failed to compute breakdown"}, { status: 500 });
        
    }
}