"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import PageWrapper from "@/components/layout/PageWrapper";
import MatchCard from "@/components/match/MatchCard";
import type { Team, Match, Prediction } from "@/lib/types";
import { CURRENT_SEASON, seasonLabel } from "@/lib/season";

function HomeContent() {
  const [isLoading, setIsLoading] = useState<number | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [storePrediction, setStorePrediction] = useState<Record<number, Prediction>>({});

  const router = useRouter();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get("status");
  const statusFilter: "all" | "upcoming" | "played" =
    statusParam === "upcoming" || statusParam === "played" ? statusParam : "all";
  const teamParam = Number(searchParams.get("team"));
  const selectedTeam = Number.isInteger(teamParam) && teamParam > 0 ? teamParam : null;

  function updateFilters(status: typeof statusFilter, team: number | null) {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (team !== null) params.set("team", String(team));
    const query = params.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
  }
  const setStatusFilter = (status: typeof statusFilter) => updateFilters(status, selectedTeam);
  const setSelectedTeam = (team: number | null) => updateFilters(statusFilter, team);

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
      <section className="relative mb-14 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-8 md:p-12">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary/8 to-transparent" />
        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">LaLiga {seasonLabel(CURRENT_SEASON)}</span>
          </div>
          <h1 className="mb-3 text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl">
            Data-Driven<br />
            <span className="text-primary">Match Predictions</span>
          </h1>
          <p className="mb-10 max-w-md text-sm text-muted-foreground">
            Leak-free statistical predictions for every {seasonLabel(CURRENT_SEASON)} LaLiga match, scored against the real results.
          </p>
          <div className="flex items-center gap-8">
            <HeroStat value={teams.length}   label="Teams" />
            {upcomingCount > 0 && (
              <>
                <div className="h-8 w-px bg-border" />
                <HeroStat value={upcomingCount}  label="Upcoming" />
              </>
            )}
            <div className="h-8 w-px bg-border" />
            <HeroStat value={playedCount}    label="Played" />
          </div>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="mb-5 text-2xl font-bold text-foreground">Teams</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
          {teams.map((team) => (
            <Link href={`/teams/${team.id}`} key={team.id}>
              <div className="group flex flex-col items-center rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                {team.crest && (
                  <Image
                    src={team.crest}
                    alt={team.name}
                    width={40}
                    height={40}
                    className="mb-2 h-10 w-10 object-contain transition-transform group-hover:scale-110"
                  />
                )}
                <p className="line-clamp-2 text-[11px] font-medium leading-tight text-muted-foreground transition-colors group-hover:text-foreground">
                  {team.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-foreground">Matches</h2>
            <div className="flex gap-1">
              <FilterPill active={statusFilter === "all"}      onClick={() => setStatusFilter("all")}>All</FilterPill>
              {upcomingCount > 0 && (
                <FilterPill active={statusFilter === "upcoming"} onClick={() => setStatusFilter("upcoming")}>Upcoming</FilterPill>
              )}
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
                {team.crest && <Image src={team.crest} alt={team.name} width={16} height={16} className="h-4 w-4 object-contain" />}
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

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
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
