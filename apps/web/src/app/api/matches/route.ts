import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CURRENT_SEASON } from "@/lib/season";

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      where: { season: CURRENT_SEASON },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(matches);
  } catch (error) {
    console.error("GET /api/matches failed:", error);
    return NextResponse.json({ message: "Failed to fetch matches" }, { status: 500 });
  }
}