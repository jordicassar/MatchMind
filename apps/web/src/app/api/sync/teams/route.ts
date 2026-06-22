// Team info sync — fills in each team's venue and coach from API-Sports.
// Venue (stadium name, city, capacity, image) comes from /teams?id=,
// the coach (manager name + photo) from /coachs?team=. Only updates teams
// that don't have a stadium yet, so it's safe to re-run if it stops partway
// (the free tier is rate limited — hence the delay between teams).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const API = "https://v3.football.api-sports.io";

export async function POST() {
  try {
    const teams = await prisma.team.findMany({
      where: { externalId: { not: null }, stadium: null },
    });

    for (const team of teams) {
      const headers = { "x-apisports-key": process.env.FOOTBALL_API_KEY! };

      // Venue
      const teamRes = await fetch(`${API}/teams?id=${team.externalId}`, { headers });
      const teamData = (await teamRes.json()) as {
        response?: { venue?: { name?: string; city?: string; capacity?: number; image?: string } }[];
      };
      const venue = teamData.response?.[0]?.venue ?? {};

      // Coach (current manager)
      const coachRes = await fetch(`${API}/coachs?team=${team.externalId}`, { headers });
      const coachData = (await coachRes.json()) as {
        response?: { name?: string; photo?: string }[];
      };
      const coach = coachData.response?.[0] ?? {};

      await prisma.team.update({
        where: { id: team.id },
        data: {
          stadium: venue.name ?? null,
          stadiumCity: venue.city ?? null,
          stadiumCapacity: venue.capacity ?? null,
          stadiumImage: venue.image ?? null,
          manager: coach.name ?? null,
          managerPhoto: coach.photo ?? null,
        },
      });

      // Stay under the per-minute rate limit (free tier ≈ 10 req/min, and this
      // route makes 2 calls per team — so keep it to ~4 teams/minute).
      await new Promise((resolve) => setTimeout(resolve, 14000));
    }

    return NextResponse.json({ message: `Synced ${teams.length} teams` });
  } catch (error) {
    console.error("sync teams failed:", error);
    return NextResponse.json({ message: "Failed to sync teams" }, { status: 500 });
  }
}