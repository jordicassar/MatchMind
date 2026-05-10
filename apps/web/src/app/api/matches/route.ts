// Match collection routes — handles operations on the full set of matches.
// Covers fetching all matches and creating new ones.
// For updating a specific match, see matches/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/matches
// Returns all matches with their home and away team details included,
// ordered most recent first.
export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(matches);
  } catch {
    return NextResponse.json({ message: "Failed to fetch matches" }, { status: 500 });
  }
}

// POST /api/matches
// Creates a new match record.
// Expects { homeTeamId, awayTeamId, date, homeScore?, awayScore? } in the request body.
// homeScore and awayScore are optional — omit them for upcoming matches.
export async function POST(req: NextRequest) {
  try {
    const { homeTeamId, awayTeamId, date, homeScore, awayScore } = await req.json();

    const match = await prisma.match.create({
      // date is passed as a string from the client and converted to a Date object here
      data: { homeTeamId, awayTeamId, date: new Date(date), homeScore, awayScore },
    });

    return NextResponse.json(match, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Failed to create match" }, { status: 500 });
  }
}