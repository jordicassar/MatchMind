// Home page — the main entry point of the application.
// Fetches all teams and matches from the API on load and renders three sections:
//   1. Hero banner — league label and high-level stats (teams, upcoming, played)
//   2. Teams grid — clickable cards linking to each team's detail page
//   3. Matches grid — filterable by team, with an AI prediction button on upcoming matches
// HeroStat and FilterPill are small single-use components kept inline here
// since they are only relevant to this page.
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import PageWrapper from "@/components/layout/PageWrapper";
import MatchCard from "@/components/match/MatchCard";
import type { Team, Match, Prediction } from "@/lib/types";

export default function Home() {
  const [isLoading, setIsLoading] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [storePrediction, setStorePrediction] = useState<Record<number, Prediction>>({});
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "played">("all");

  useEffect(() => {
    fetch("/api/teams").then((r) => r.json()).then(setTeams);
  }, []);

  useEffect(() => {
    fetch("/api/matches").then((r) => r.json()).then(setMatches);
  }, []);

  const filteredMatches = matches 
    .filter((m) => selectedTeam === null || m.homeTeamId === selectedTeam || m.awayTeamId === selectedTeam)
    .filter((m) => {
      if (statusFilter === "upcoming") return m.homeScore === null;
      if (statusFilter === "played") return m.homeScore !== null;
      return true;
    }).sort((a, b) => {
      const aUp = a.homeScore === null;
      const bUp = b.homeScore === null;
      if (aUp && !bUp) return -1;
      if (!aUp && bUp) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

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

  const upcomingCount = matches.filter((m) => m.homeScore === null).length;
  const playedCount   = matches.filter((m) => m.homeScore !== null).length;

  return (
    <PageWrapper>
      {/* Hero */}
      <section className="relative mb-14 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-8 md:p-12">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary/8 to-transparent" />
        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">LaLiga 2024/25</span>
          </div>
          <h1 className="mb-3 text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl">
            AI-Powered<br />
            <span className="text-primary">Match Predictions</span>
          </h1>
          <p className="mb-10 max-w-md text-sm text-muted-foreground">
            Intelligent predictions for upcoming fixtures powered by historical performance data.
          </p>
          <div className="flex items-center gap-8">
            <HeroStat value={teams.length}   label="Teams" />
            <div className="h-8 w-px bg-border" />
            <HeroStat value={upcomingCount}  label="Upcoming" />
            <div className="h-8 w-px bg-border" />
            <HeroStat value={playedCount}    label="Played" />
          </div>
        </div>
      </section>

      {/* Teams */}
      <section className="mb-14">
        <h2 className="mb-5 text-2xl font-bold text-foreground">Teams</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
          {teams.map((team) => (
            <Link href={`/teams/${team.id}`} key={team.id}>
              <div className="group flex flex-col items-center rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                <img
                  src={team.crest ?? undefined}
                  alt={team.name}
                  className="mb-2 h-10 w-10 object-contain transition-transform group-hover:scale-110"
                />
                <p className="line-clamp-2 text-[11px] font-medium leading-tight text-muted-foreground transition-colors group-hover:text-foreground">
                  {team.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Matches */}
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-foreground">Matches</h2>
            <div className="flex gap-1">
              <FilterPill active={statusFilter === "all"}      onClick={() => setStatusFilter("all")}>All</FilterPill>
              <FilterPill active={statusFilter === "upcoming"} onClick={() => setStatusFilter("upcoming")}>Upcoming</FilterPill>
              <FilterPill active={statusFilter === "played"}   onClick={() => setStatusFilter("played")}>Played</FilterPill>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterPill active={selectedTeam === null} onClick={() => setSelectedTeam(null)}>
              All
            </FilterPill>
            {teams.map((team) => (
              <FilterPill
                key={team.id}
                active={selectedTeam === team.id}
                onClick={() => setSelectedTeam(selectedTeam === team.id ? null : team.id)}
              >
                <img src={team.crest ?? undefined} alt={team.name} className="h-4 w-4 object-contain" />
                {team.name.startsWith("Real ") ? team.name.slice(5) : team.name.split(" ")[0]}
              </FilterPill>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={storePrediction[match.id]}
              isLoading={isLoading === match.id}
              onPredict={() => fetchPrediction(match.id)}
            />
          ))}
        </div>
      </section>
    </PageWrapper>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
