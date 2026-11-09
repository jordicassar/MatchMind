import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSeasonTeams } from "@/lib/season";

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      where: currentSeasonTeams,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(teams);
  } catch (error) {
    console.error("GET /api/teams failed:", error);
    return NextResponse.json({ message: "Failed to fetch teams" }, { status: 500 });
  }
}
