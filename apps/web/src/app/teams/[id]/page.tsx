// Team detail page — displays a full profile for a single team.
// The team ID comes from the dynamic URL segment (/teams/[id]) and is used
// to fetch that team's stats and match history from /api/teams/:id.
// Renders a hero header, seven stat tiles, an upcoming matches section,
// and a colour-coded match history (green = win, red = loss, amber = draw).
"use client";
import { useEffect, useState, use } from "react";
import { Trophy, XCircle, Minus, Calendar, BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import PageWrapper from "@/components/layout/PageWrapper";
import HistoryCard from "@/components/match/HistoryCard";

export default function TeamDetail({ params }: { params: Promise<{ id: string }> }) {
  const [team, setTeam] = useState<any>(null);
  const { id } = use(params);

  useEffect(() => {
    fetch(`/api/teams/${id}`).then((r) => r.json()).then(setTeam);
  }, [id]);

  if (!team) return null;

  const upcomingMatches = team.matches.filter((m: any) => m.homeScore === null);
  const playedMatches   = team.matches.filter((m: any) => m.homeScore !== null);
  const teamId          = parseInt(id);
  const winRate         = team.stats.matchesPlayed > 0
    ? Math.round((team.stats.wins / team.stats.matchesPlayed) * 100)
    : 0;

  const statTiles = [
    { label: "Wins",           value: team.stats.wins,          icon: Trophy,       color: "text-chart-1" },
    { label: "Losses",         value: team.stats.losses,        icon: XCircle,      color: "text-chart-2" },
    { label: "Draws",          value: team.stats.draws,         icon: Minus,        color: "text-chart-3" },
    { label: "Upcoming",       value: upcomingMatches.length,   icon: Calendar,     color: "text-chart-4" },
    { label: "Played",         value: team.stats.matchesPlayed, icon: BarChart3,    color: "text-muted-foreground" },
    { label: "Goals Scored",   value: team.stats.goalsScored,   icon: TrendingUp,   color: "text-chart-1" },
    { label: "Goals Conceded", value: team.stats.goalsConceded, icon: TrendingDown, color: "text-chart-2" },
  ];

  return (
    <PageWrapper>
      {/* Team hero */}
      <section className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/8 to-transparent" />
        <div className="relative z-10 flex items-center gap-6">
          <img src={team.team.crest} alt={team.team.name} className="h-20 w-20 object-contain drop-shadow-lg" />
          <div>
            <h1 className="text-3xl font-extrabold text-foreground md:text-4xl">{team.team.name}</h1>
            <div className="mt-2 flex items-center gap-3">
              <Badge className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">
                LaLiga 2024/25
              </Badge>
              <span className="text-sm text-muted-foreground">{winRate}% win rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stat tiles */}
      <div className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {statTiles.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex flex-col items-center rounded-xl border border-border bg-card p-4 text-center">
            <Icon className={cn("mb-2 h-5 w-5", color)} />
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming matches */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-foreground">Upcoming Matches</h2>
        {upcomingMatches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming matches.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingMatches.map((match: any) => (
              <HistoryCard key={match.id} match={match} teamId={teamId} />
            ))}
          </div>
        )}
      </section>

      {/* Match history */}
      <section>
        <h2 className="mb-4 text-2xl font-bold text-foreground">Match History</h2>
        {playedMatches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matches played yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {playedMatches.map((match: any) => (
              <HistoryCard key={match.id} match={match} teamId={teamId} />
            ))}
          </div>
        )}
      </section>
    </PageWrapper>
  );
}
