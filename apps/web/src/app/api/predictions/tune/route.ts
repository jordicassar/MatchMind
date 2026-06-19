// Model-tuning route - sweeps the form H2H blend weight to find the best one.
// For every played match it recomputes the same form and head-to-head inputs
// the production prediction uses, then measures outcome accuracy at a range of
// form weights. Returns an accuracy-per-weight table (highest first) so the
// 70/30 (initial split) can be replaced with whatever actually scores best.
// Read-only - does not write predictions. See api/predictions for the live blend.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { weightedAverage, blendScore, isPredictionCorrect } from "@/lib/predictions";

const WEIGHTS = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

type PlayedMatch = {
    id: number;
    date: Date;
    homeTeamId: number;
    awayTeamId: number;
    homeScore: number;
    awayScore: number;
};

export async function GET() {
    try {
        // One query: every played match, most recent first (matches production ordering).
        const played = (await prisma.match.findMany({
            where: { homeScore: { not: null }, awayScore: { not: null } },
            select: {
                id: true,
                date: true,
                homeTeamId: true,
                awayTeamId: true,
                homeScore: true,
                awayScore: true,
            },
            orderBy: { date: "desc" },
        })) as PlayedMatch[];

        // Tally correct predictions per candidate weight.
        const correct: Record<number, number> = Object.fromEntries(WEIGHTS.map((w) => [w, 0]));
        
        for (const m of played) {
            // Form: each team's goals in their own home/away games (same inputs as production).
            const formHome = weightedAverage(
                played.filter((g) => g.homeTeamId === m.homeTeamId && g.date < m.date).map((g) => g.homeScore) 
            );
            const formAway = weightedAverage(
                played.filter((g) => g.awayTeamId === m.awayTeamId && g.date < m.date).map((g) => g.awayScore)
            );

            // Head-to-head between the two teams, normalized to the home team's perspectives.
            const h2h = played.filter(
                (g) => ((g.homeTeamId === m.homeTeamId && g.awayTeamId === m.awayTeamId) ||
                (g.homeTeamId === m.awayTeamId && g.awayTeamId === m.homeTeamId)) && g.date < m.date
            );
            const hasH2H = h2h.length > 0;
            const h2hHome = hasH2H ? weightedAverage(h2h.map((g) => (g.homeTeamId === m.homeTeamId ? g.homeScore : g.awayScore)))
            : 0;
            const h2hAway = hasH2H ? weightedAverage(h2h.map((g) => (g.awayTeamId === m.awayTeamId ? g.awayScore : g.homeScore)))
            : 0;

            for (const w of WEIGHTS) {
                // No H2H -> form only identical across weights (mirrors production fallback).
                const predHome = hasH2H ? blendScore(formHome, h2hHome, w) : formHome;
                const predAway = hasH2H ? blendScore(formAway, h2hAway, w) : formAway;
                if (isPredictionCorrect(predHome, predAway, m.homeScore, m.awayScore)) correct[w]++;
            }
        }

        const total = played.length
        const results = WEIGHTS.map((w) => ({
            weight: w,
            correct: correct[w],
            total,
            accuracy: total > 0 ? Math.round((correct[w] / total) * 1000) / 10 : 0,
        })).sort((a, b) => b.accuracy - a.accuracy);

        return NextResponse.json(results);
    } catch (error) {
        console.error("GET /api/predictions/tune failed: ", error);
        return NextResponse.json({ message: "Failed to tune predictions"}, { status: 500 });
    }
}