// Team info sync — refreshes each current-season club's venue and manager from
// API-Sports. Venue (stadium name, city, capacity, image) comes from /teams?id=,
// the manager (name + photo) from /coachs?team=. Every club is refreshed on
// each run, so managerial changes and newly promoted clubs are picked up. If a
// request comes back empty (e.g. rate limited), that club is left unchanged and
// reported rather than blanked. Two requests per club and the free tier allows
// ~10 a minute, hence the delay — 20 clubs take about 5 minutes, so run it
// locally rather than through Vercel (see README).
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
      // Venue
      const teamRes = await fetch(`${API}/teams?id=${team.externalId}`, { headers });
      const teamData = (await teamRes.json()) as {
        response?: { venue?: { name?: string; city?: string; capacity?: number; image?: string } }[];
      };
      const venue = teamData.response?.[0]?.venue;

      // Current manager
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

      // Stay under the per-minute rate limit (2 requests per club)
      await new Promise((resolve) => setTimeout(resolve, 14000));
    }

    return NextResponse.json({ message: "Team info sync complete", updated, skipped });
  } catch (error) {
    console.error("sync teams failed:", error);
    return NextResponse.json({ message: "Failed to sync teams" }, { status: 500 });
  }
}
