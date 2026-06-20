// Single match routes — handles operations on a specific match identified by its ID.
// Covers updating a match's final score once the game has been played.
// For fetching or creating matches, see matches/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { predictFromHistory } from "@/lib/predictions";

// PUT /api/matches/:id
// Updates the final score of a match once it has been played.
// Expects { homeScore: number, awayScore: number } in the request body.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { homeScore, awayScore } = await req.json();

    const match = await prisma.match.update({
      where: { id: Number(id) },
      data: { homeScore, awayScore },
    });

    return NextResponse.json(match);
  } catch {
    return NextResponse.json({ message: "Failed to update match" }, { status: 500 });
  }
}

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
