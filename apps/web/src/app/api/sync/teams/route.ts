import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSyncSecret } from "@/lib/auth";
import { pickCurrentCoach, type ApiCoach } from "@/lib/footballApi";
import { currentSeasonTeams } from "@/lib/season";

const API = "https://v3.football.api-sports.io";

export async function POST(request: Request) {
  const denied = requireSyncSecret(request);
  if (denied) return denied;

  try {
    const teams = await prisma.team.findMany({
      where: { ...currentSeasonTeams, externalId: { not: null } },
      orderBy: { name: "asc" },
    });
    const headers = { "x-apisports-key": process.env.FOOTBALL_API_KEY! };
    const updated: string[] = [];
    const skipped: string[] = [];

    for (const team of teams) {
      const teamRes = await fetch(`${API}/teams?id=${team.externalId}`, { headers });
      const teamData = (await teamRes.json()) as {
        response?: { venue?: { name?: string; city?: string; capacity?: number; image?: string } }[];
      };
      const venue = teamData.response?.[0]?.venue;

      const coachRes = await fetch(`${API}/coachs?team=${team.externalId}`, { headers });
      const coachData = (await coachRes.json()) as { response?: ApiCoach[] };
      const coach = pickCurrentCoach(coachData.response ?? [], team.externalId!);

      if (!venue && !coach) {
        skipped.push(team.name);
      } else {
        await prisma.team.update({
          where: { id: team.id },
          data: {
            ...(venue && {
              stadium: venue.name ?? null,
              stadiumCity: venue.city ?? null,
              stadiumCapacity: venue.capacity ?? null,
              stadiumImage: venue.image ?? null,
            }),
            ...(coach && { manager: coach.name, managerPhoto: coach.photo ?? null }),
          },
        });
        updated.push(team.name);
      }

      await new Promise((resolve) => setTimeout(resolve, 14000));
    }

    return NextResponse.json({ message: "Team info sync complete", updated, skipped });
  } catch (error) {
    console.error("sync teams failed:", error);
    return NextResponse.json({ message: "Failed to sync teams" }, { status: 500 });
  }
}
