import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId);

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) return NextResponse.json({ message: "Team not found" }, { status: 404 });

    const [matches, homeMatches, awayMatches] = await Promise.all([
      prisma.match.findMany({
        include: { homeTeam: true, awayTeam: true },
        orderBy: { date: "desc" },
        where: { OR: [{ homeTeamId: id }, { awayTeamId: id }] },
      }),
      prisma.match.findMany({ where: { homeTeamId: id, homeScore: { not: null } } }),
      prisma.match.findMany({ where: { awayTeamId: id, awayScore: { not: null } } }),
    ]);

    const wins =
      homeMatches.filter((m) => (m.homeScore ?? 0) > (m.awayScore ?? 0)).length +
      awayMatches.filter((m) => (m.awayScore ?? 0) > (m.homeScore ?? 0)).length;

    const losses =
      homeMatches.filter((m) => (m.homeScore ?? 0) < (m.awayScore ?? 0)).length +
      awayMatches.filter((m) => (m.awayScore ?? 0) < (m.homeScore ?? 0)).length;

    const draws =
      homeMatches.filter((m) => m.homeScore !== null && m.homeScore === m.awayScore).length +
      awayMatches.filter((m) => m.awayScore !== null && m.awayScore === m.homeScore).length;

    const goalsScored =
      homeMatches.reduce((s, m) => s + (m.homeScore ?? 0), 0) +
      awayMatches.reduce((s, m) => s + (m.awayScore ?? 0), 0);

    const goalsConceded =
      homeMatches.reduce((s, m) => s + (m.awayScore ?? 0), 0) +
      awayMatches.reduce((s, m) => s + (m.homeScore ?? 0), 0);

    return NextResponse.json({
      team,
      stats: { wins, losses, draws, goalsScored, goalsConceded, matchesPlayed: wins + draws + losses },
      matches,
    });
  } catch {
    return NextResponse.json({ message: "Failed to fetch team" }, { status: 500 });
  }
}
