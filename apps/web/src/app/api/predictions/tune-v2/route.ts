import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPredictionCorrect } from "@/lib/predictions";
import { requireSyncSecret } from "@/lib/auth";

const HOME_ADV = [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5];

type PlayedMatch = {
    date: Date,
    homeTeamId: number,
    awayTeamId: number,
    homeScore: number,
    awayScore: number,
}

function wavg(values: number[]): number {
    if (values.length === 0) return 0;
    const n = values.length;
    const total = values.reduce((sum, v, i) => sum + v * (n - i), 0);
    return total / ((n * (n + 1)) / 2);
}

export async function GET(request: Request) {
    const denied = requireSyncSecret(request);
    if (denied) return denied;

    try {
        const played = (await prisma.match.findMany({
            where: { homeScore: { not: null }, awayScore: { not: null } },
            select: { date: true, homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
            orderBy: { date: "desc" },
        })) as PlayedMatch[];

        const correct: Record<number, number> = Object.fromEntries(HOME_ADV.map((h) => [h, 0]));

        for (const m of played) {
            const homeGames = played.filter((g) => g.homeTeamId === m.homeTeamId && g.date < m.date);
            const homeAttack = wavg(homeGames.map((g) => g.homeScore));
            const homeDefense = wavg(homeGames.map((g) => g.awayScore));

            const awayGames = played.filter((g) => g.awayTeamId === m.awayTeamId && g.date < m.date);
            const awayAttack = wavg(awayGames.map((g) => g.awayScore));
            const awayDefense = wavg(awayGames.map((g) => g.homeScore));

            for (const h of HOME_ADV) {
                const expHome = (homeAttack + awayDefense) / 2;
                const expAway = (awayAttack + homeDefense) / 2;

                const predHome = Math.round(expHome + h);
                const predAway = Math.round(expAway);
                if (isPredictionCorrect(predHome, predAway, m.homeScore, m.awayScore)) correct[h]++;
            }
        }

        const total = played.length
        const results = HOME_ADV.map((h) => ({
            homeAdvantage: h,
            correct: correct[h],
            total,
            accuracy: total > 0 ? Math.round((correct[h] / total) * 1000) / 10 : 0,
        })).sort((a, b) => b.accuracy - a.accuracy);

        return NextResponse.json(results);
    } catch (error) {
        console.error("GET /api/predictions/tune-v2 failed:", error);
        return NextResponse.json({ message: "Failed to run experiment" }, { status: 500 });
    }
}