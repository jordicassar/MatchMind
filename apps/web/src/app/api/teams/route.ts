import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const teams = await prisma.team.findMany();
    return NextResponse.json(teams);
  } catch {
    return NextResponse.json({ message: "Failed to fetch teams" }, { status: 500 });
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
