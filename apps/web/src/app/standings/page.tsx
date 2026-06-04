// Standings page — renders the full La Liga table from /api/standings.
// Each row shows played/won/drawn/lost, goals for/against, goal difference
// and points, with team names linking to their detail page. The top four
// rows get a green left border to mark the Champions League places.
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import PageWrapper from "@/components/layout/PageWrapper";
import { cn } from "@/lib/utils";
import type { StandingsRow } from "@/lib/types";

export default function StandingsPage() {
  const [rows, setRows] = useState<StandingsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/standings")
      .then((r) => r.json())
      .then((data => { setRows(data); setLoading(false); }));
  }, []);

  return (
    <PageWrapper>
      <div className="mb-8 flex items-center gap-3">
        <Trophy className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-extrabold text-foreground">Standings</h1>
        <span className="ml-auto text-xs font-semibold uppercase tracking-widest text-primary">LaLiga 2024/25</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="py-3 pl-4 pr-2 text-left w-8">#</th>
              <th className="py-3 px-2 text-left">Team</th>
              <th className="py-3 px-2 text-center">P</th>
              <th className="py-3 px-2 text-center">W</th>
              <th className="py-3 px-2 text-center">D</th>
              <th className="py-3 px-2 text-center">L</th>
              <th className="py-3 px-2 text-center">GF</th>
              <th className="py-3 px-2 text-center">GA</th>
              <th className="py-3 px-2 text-center">GD</th>
              <th className="py-3 pl-2 pr-4 text-center font-bold text-foreground">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.team.id}
                className={cn(
                  "border-b border-border/50 transition-colors hover:bg-accent/30 last:border-0",
                  i < 4 && "border-l-2 border-l-primary"
                )}
              >
                <td className="py-3 pl-4 pr-2 text-center text-muted-foreground">{i + 1}</td>
                <td className="py-3 px-2">
                  <Link href={`/teams/${row.team.id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                    {row.team.crest && <img src={row.team.crest} alt={row.team.name} className="h-6 w-6 object-contain" />}
                    <span className="font-medium text-foreground">{row.team.name}</span>
                  </Link>
                </td>
                <td className="py-3 px-2 text-center text-muted-foreground">{row.played}</td>
                <td className="py-3 px-2 text-center text-chart-1">{row.won}</td>
                <td className="py-3 px-2 text-center text-muted-foreground">{row.drawn}</td>
                <td className="py-3 px-2 text-center text-chart-2">{row.lost}</td>
                <td className="py-3 px-2 text-center text-muted-foreground">{row.gf}</td>
                <td className="py-3 px-2 text-center text-muted-foreground">{row.ga}</td>
                <td className={cn("py-3 px-2 text-center", row.gd > 0 ? "text-chart-1" : row.gd < 0 ? "text-chart-2" : "text-muted-foreground")}>
                  {row.gd > 0 ? `+${row.gd}` : row.gd}
                </td>
                <td className="py-3 pl-2 pr-4 text-center font-bold text-foreground">{row.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">Loading</p>
      ) : rows.length == 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">No results yet.</p>
      ) : null}
    </PageWrapper>
  );
}
