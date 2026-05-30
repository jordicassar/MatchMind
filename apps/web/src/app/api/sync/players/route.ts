import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
    try {
       const teams = await prisma.team.findMany({
         where: { externalId: { not: null },
         players: { none: {} },
        },
       });

       for (const team of teams) {
         const res = await fetch(
            `https://v3.football.api-sports.io/players/squads?team=${team.externalId}`,
            { headers: {"x-apisports-key": process.env.FOOTBALL_API_KEY! } }
         );
         const data = await res.json() as any;
         const players = data.response?.[0]?.players ?? [];

         for (const p of players) {
            await prisma.player.upsert({
                where: { externalId: p.id },
                update: {
                    name: p.name,
                    nationality: p.nationality,
                    position: p.position,
                    photo: p.photo,
                    teamId: team.id,
                },
                create: {
                    externalId: p.id,
                    name: p.name,
                    nationality: p.nationality,
                    position: p.position,
                    photo: p.photo,
                    teamId: team.id,
                },
            });
         }
         await new Promise((resolve) => setTimeout(resolve, 1000));
       }
       return NextResponse.json({ message: "Players synced "}); 
    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Failed to sync players"}, { status: 500 });
    }
}
