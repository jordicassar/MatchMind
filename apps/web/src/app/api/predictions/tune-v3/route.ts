import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPredictionCorrect } from "@/lib/predictions";
import { requireSyncSecret } from "@/lib/auth";

const HOME_ADV = 0.75;
const STRENGTH_K = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

type PlayedMatch = {
    date: Date,
    homeTeamId: number,
    awayTeamId: number,
    homeScore: number,
    awayScore: number,
};

function wavg(values: number[]): number {
    if (values.length === 0) return 0;
    const n = values.length;
    const total = values.reduce((sum, v, i) => sum + v * (n-i), 0);
    return total / ((n * ( n + 1)) / 2);
}

function ppg(teamId: number, before: Date, played: PlayedMatch[]): number {
    const games = played.filter(
        (g) => (g.homeTeamId == teamId || g.awayTeamId === teamId) && g.date < before
    );
    if (games.length === 0) return 0;
    let points = 0;
    for (const g of games) {
        const isHome = g.homeTeamId === teamId;
        const mine = isHome ? g.homeScore : g.awayScore;
        const theirs = isHome ? g.awayScore : g.homeScore;
        points += mine > theirs ? 3 : mine === theirs ? 1 : 0;
    }
    return points / games.length;
}

export async function GET(request: Request) {
    const denied = requireSyncSecret(request);
    if (denied) return denied;

    try {
        const played = (await prisma.match.findMany({
            where: { homeScore: { not: null}, awayScore: { not: null } },
            select: { date: true, homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
            orderBy: { date: "desc" },
        })) as PlayedMatch[];

        const correct: Record<number, number> = Object.fromEntries(STRENGTH_K.map((k) => [k, 0]));

        for (const m of played) {
            const homeGames = played.filter((g) => g.homeTeamId === m.homeTeamId && g.date < m.date);
            const homeAttack = wavg(homeGames.map((g) => g.homeScore));
            const homeDefense = wavg(homeGames.map((g) => g.awayScore));

            const awayGames = played.filter((g) => g.awayTeamId === m.awayTeamId && g.date < m.date);
            const awayAttack = wavg(awayGames.map((g) => g.awayScore));
            const awayDefense = wavg(awayGames.map((g) => g.homeScore));

            const expHome = (homeAttack + awayDefense) / 2;
            const expAway = (awayAttack + homeDefense) / 2;

            const strengthDiff = ppg(m.homeTeamId, m.date, played) - ppg(m.awayTeamId, m.date, played);

            for (const k of STRENGTH_K) {
                const predHome = Math.round(expHome + HOME_ADV + k * strengthDiff);
                const predAway = Math.round(expAway - k * strengthDiff);
                if (isPredictionCorrect(predHome, predAway, m.homeScore, m.awayScore)) correct[k]++;
            }
        }

        const total = played.length;
        const results = STRENGTH_K.map((k) => ({
            strengthWeight: k,
            correct: correct[k],
            total,
            accuracy: total > 0 ? Math.round((correct[k] / total) * 1000) / 10 : 0,
        })).sort((a, b) => b.accuracy - a.accuracy);

        return NextResponse.json(results);
    } catch (error) {
        console.error("GET /api/[rediction/tune-v3 failed", error);
        return NextResponse.json({ message : "Failed to run experiement "}, { status: 500 });
    }
}