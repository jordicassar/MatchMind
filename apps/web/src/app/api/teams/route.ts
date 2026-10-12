// Team collection routes — operations on the full set of teams.
// GET returns all teams alphabetically. Teams are created by /api/sync.
// For a single team's full profile and stats, see teams/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(teams);
  } catch (error) {
    console.error("GET /api/teams failed:", error);
    return NextResponse.json({ message: "Failed to fetch teams" }, { status: 500 });
  }
}
