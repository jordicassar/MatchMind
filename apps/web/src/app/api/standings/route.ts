// Standings route — computes the league table from played matches.
// Iterates every match with a score, accumulating played/won/drawn/lost
// and goals for/against per team in a Map keyed by team id, then derives
// goal difference and points (3 per win, 1 per draw). Rows are sorted by
// points, then goal difference, then goals scored, then name.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const matches = await prisma.match.findMany({
        where: { homeScore: {not: null}}, 
        include: { homeTeam: true, awayTeam: true },
    });

    const table = new Map<number, {
        team: { id: number; name: string; crest: string | null};
        played: number; won: number; drawn: number; lost: number;
        gf: number; ga: number;
    }>();

    function entry(team: { id: number; name: string; crest: string | null}){
        if(!table.has(team.id)){
            table.set(team.id, { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0});
        }
        return table.get(team.id)!;
    }

    for (const m of matches){
        const h = m.homeScore!;
        const a = m.awayScore!;
        const home = entry({ id: m.homeTeamId, name: m.homeTeam.name, crest: m.homeTeam.crest});
        const away = entry({ id: m.awayTeamId, name: m.awayTeam.name, crest: m.awayTeam.crest});

        home.played++; home.gf += h; home.ga += a;
        away.played++; away.gf += a; away.ga += h;

        if (h > a) {
            home.won++;
            away.lost++;
        }
        else if (h < a){
            away.won++;
            home.lost++;
        }
        else {
            home.drawn++;
            away.drawn++;
        }
    }
    const rows = [...table.values()]
        .map((r)=> ({ ...r, gd: r.gf - r.ga, pts: r.won * 3 + r.drawn}))
        .sort((a,b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.name.localeCompare(b.team.name));
    
    return NextResponse.json(rows);
}
