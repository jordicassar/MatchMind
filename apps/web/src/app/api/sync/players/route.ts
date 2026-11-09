import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSyncSecret } from "@/lib/auth";
import { currentSeasonTeams } from "@/lib/season";

interface ApiSquadPlayer {
  id: number;
  name: string;
  nationality: string;
  position: string;
  photo: string;
}
interface SquadResponse {
  response?: { players: ApiSquadPlayer[] }[];
}

export async function POST(request: Request) {
  const denied = requireSyncSecret(request);
  if (denied) return denied;

  try {
    const teams = await prisma.team.findMany({
      where: { ...currentSeasonTeams, externalId: { not: null } },
      orderBy: { name: "asc" },
    });
    const updated: string[] = [];
    const skipped: string[] = [];
    let removed = 0;

    for (const team of teams) {
      const res = await fetch(`https://v3.football.api-sports.io/players/squads?team=${team.externalId}`, {
        headers: { "x-apisports-key": process.env.FOOTBALL_API_KEY! },
      });
      const data = (await res.json()) as SquadResponse;
      const players = data.response?.[0]?.players ?? [];

      if (players.length === 0) {
        skipped.push(team.name);
      } else {
        for (const p of players) {
          const fields = { name: p.name, nationality: p.nationality, position: p.position, photo: p.photo, teamId: team.id };
          await prisma.player.upsert({
            where: { externalId: p.id },
            update: fields,
            create: { externalId: p.id, ...fields },
          });
        }

        const left = await prisma.player.deleteMany({
          where: { teamId: team.id, externalId: { notIn: players.map((p) => p.id) } },
        });
        removed += left.count;
        updated.push(`${team.name} (${players.length})`);
      }

      await new Promise((resolve) => setTimeout(resolve, 7000));
    }

    return NextResponse.json({ message: "Players synced", updated, skipped, removed });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to sync players" }, { status: 500 });
  }
}
