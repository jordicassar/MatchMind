// Single match route — returns one match with a freshly computed prediction.
// Scores are written only by the protected /api/sync route.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { predictFromHistory } from "@/lib/predictions";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const match = await prisma.match.findUnique({
      where: { id: Number(id) },
      include: { homeTeam: true, awayTeam: true },
    });
    if (!match) return NextResponse.json({ message: "Match not found" }, { status: 404 });

    // History the model predicts from, then a freshly computed prediction.
    const played = await prisma.match.findMany({
      where: { homeScore: { not: null }, awayScore: { not: null } },
      orderBy: { date: "desc" },
    });
    const prediction = predictFromHistory(match, played);

    return NextResponse.json({ ...match, prediction });
  } catch {
    return NextResponse.json({ message: "Failed to fetch match" }, { status: 500 });
  }
}
