
// Team detail page — displays a full profile for a single team.
// The team ID comes from the dynamic URL segment (/teams/[id]) and is used
// to fetch that team's stats and match history from /api/teams/:id.
// Renders a hero header, seven stat tiles, an upcoming matches section,
// and a colour-coded match history (green = win, red = loss, amber = draw).
"use client";
import { useEffect, useState, use } from "react";
import { Trophy, XCircle, Minus, Calendar, BarChart3, TrendingUp, TrendingDown, User, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import PageWrapper from "@/components/layout/PageWrapper";
import HistoryCard from "@/components/match/HistoryCard";
import MatchCard from "@/components/match/MatchCard";
import type { TeamProfile, Prediction } from "@/lib/types";

export default function TeamDetail({ params }: { params: Promise<{ id: string }> }) {
  const [team, setTeam] = useState<TeamProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history" | "squad">("upcoming");
  const [isLoading, setIsLoading] = useState<number | null>(null);
  const [storePrediction, setStorePrediction] = useState<Record<number, Prediction>>({});
  const { id } = use(params);

  useEffect(() => {
    fetch(`/api/teams/${id}`).then((r) => r.json()).then(setTeam);
  }, [id]);

  if (!team) return (
      <PageWrapper>
        <div className="flex justify-center py-24">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </PageWrapper>
    );

  const upcomingMatches = team.matches.filter((m) => m.homeScore === null);
  const playedMatches   = team.matches.filter((m) => m.homeScore !== null);
  const teamId          = parseInt(id);
  const winRate         = team.stats.matchesPlayed > 0
    ? Math.round((team.stats.wins / team.stats.matchesPlayed) * 100)
    : 0;

  const statTiles = [
    { label: "Wins",           value: team.stats.wins,          icon: Trophy,       color: "text-chart-1" },
    { label: "Draws",          value: team.stats.draws,         icon: Minus,        color: "text-chart-3" },
    { label: "Losses",         value: team.stats.losses,        icon: XCircle,      color: "text-chart-2" },
    { label: "Upcoming",       value: upcomingMatches.length,   icon: Calendar,     color: "text-chart-4" },
    { label: "Played",         value: team.stats.matchesPlayed, icon: BarChart3,    color: "text-muted-foreground" },
    { label: "Goals Scored",   value: team.stats.goalsScored,   icon: TrendingUp,   color: "text-chart-1" },
    { label: "Goals Conceded", value: team.stats.goalsConceded, icon: TrendingDown, color: "text-chart-2" },
  ];

  async function fetchPrediction(matchId: number) {
    setIsLoading(matchId);
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId }),
    });
    if (res.ok) {
      const data = await res.json();
      setStorePrediction((prev) => ({ ...prev, [matchId]: data }));
    }
    setIsLoading(null);
  }

  return (
    <PageWrapper>
      {/* Team hero */}
      <section className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/8 to-transparent" />
        <div className="relative z-10 flex items-center gap-6">
          <img src={team.team.crest ?? undefined} alt={team.team.name} className="h-20 w-20 object-contain drop-shadow-lg" />
          <div>
            <h1 className="text-3xl font-extrabold text-foreground md:text-4xl">{team.team.name}</h1>
            <div className="mt-2 flex items-center gap-3">
              <Badge className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">
                LaLiga 2024/25
              </Badge>
              <span className="text-sm text-muted-foreground">{winRate}% win rate</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {team.team.manager && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />{team.team.manager}
                </span>
              )}
              {team.team.stadium && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />{team.team.stadium}{team.team.stadiumCity ? `, ${team.team.stadiumCity}` : ""}{team.team.stadiumCapacity ? ` · ${team.team.stadiumCapacity.toLocaleString()}` : ""}
                </span>
              )}
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

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-border bg-card p-1">
        {[
          { key: "upcoming", label: "Upcoming Matches" },
          { key: "history", label: "Past Matches"} ,
          { key: "squad", label: "Squad" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as "upcoming" | "history" | "squad")}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
              activeTab === key 
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground" 
            )}
          >
          {label}
          </button>
        ))} 
      </div>
      {/* Tab content */}

      {/* Upcoming Matches Tab */}
      {activeTab === "upcoming" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingMatches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming matches.</p>
          ) : (
            upcomingMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={storePrediction[match.id]}
                isLoading={isLoading === match.id}
                onPredict={() => fetchPrediction(match.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Match History Tab */}
      {activeTab === "history" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {playedMatches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches played yet.</p>
          ) : (
            playedMatches.map((match) => (
              <HistoryCard key={match.id} match={match} teamId={teamId} />
            ))
          )}
        </div>
      )}

      {/* Squad Tab */}
      {activeTab === "squad" && (
        <div>
          {["Goalkeeper", "Defender", "Midfielder", "Attacker"].map((pos) => {
            const group = team.players.filter((p) => p.position === pos);
            if (group.length === 0) return null;
            return (
              <div key={pos} className="mb-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{pos}s</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {group.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                      {p.photo && <img src={p.photo} alt={p.name ?? undefined} className="h-10 w-10 rounded-full object-cover" />}
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">{p.nationality}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}
