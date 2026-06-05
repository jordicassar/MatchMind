// Team collection routes — operations on the full set of teams.
// GET returns all teams alphabetically; POST creates a new team by name.
// For a single team's full profile and stats, see teams/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(teams);
  } catch (error) {
    console.error("GET /api/teams failed:", error);
    return NextResponse.json(
      { message: "Failed to fetch teams", error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    const team = await prisma.team.create({ data: { name } });
    return NextResponse.json(team, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Unable to create team" }, { status: 500 });
  }
}
