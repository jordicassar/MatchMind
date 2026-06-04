// Match detail page — the full view for a single match (/matches/[id]).
// Fetches the match itself and, in parallel, its prediction breakdown.
// Renders the teams and score, the AI prediction (with a correct/incorrect
// marker on played matches), the form and H2H breakdown behind the
// prediction, and a list of past head-to-head meetings.
"use client";
import { useEffect, useState, use } from "react";
import { Calendar, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import PageWrapper from "@/components/layout/PageWrapper";
import TeamSlot from "@/components/match/TeamSlot";
import type { Match, Breakdown } from "@/lib/types";

export default function MatchDetail({ params }: { params: Promise<{ id: string }> }) {
  const [match, setMatch] = useState<Match | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const { id } = use(params);

  useEffect(() => {
    fetch(`/api/matches/${id}`).then((r) => r.json()).then(setMatch);
    fetch(`/api/matches/${id}/breakdown`).then((r) => r.json()).then(setBreakdown);
  }, [id]);

  if (!match) return (
    <PageWrapper>
      <div className="flex justify-center py-24">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </PageWrapper>
  );

  const isUpcoming = match.homeScore === null;
  const date = new Date(match.date);

  return (
    <PageWrapper>
      <div className="mx-auto max-w-lg">
        {/* Match card */}
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="mb-6 flex justify-center">
            <Badge
              variant={isUpcoming ? "outline" : "secondary"}
              className={cn("text-xs", !isUpcoming && "border-primary/30 bg-primary/10 text-primary")}
            >
              {isUpcoming ? "Upcoming" : "Full Time"}
            </Badge>
          </div>

          {/* Teams and score */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <TeamSlot crest={match.homeTeam.crest} name={match.homeTeam.name} />
            </div>
            <div className="flex flex-col items-center">
              {isUpcoming ? (
                <span className="text-2xl font-extrabold text-muted-foreground">vs</span>
              ) : (
                <span className="text-4xl font-extrabold tabular-nums text-foreground">
                  {match.homeScore}&nbsp;–&nbsp;{match.awayScore}
                </span>
              )}
            </div>
            <div className="flex-1">
              <TeamSlot crest={match.awayTeam.crest} name={match.awayTeam.name} />
            </div>
          </div>

          {/* Date */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{date.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          </div>

          {/* Prediction */}
          {match.prediction && (
            <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 text-center">
              <p className="mb-1 flex items-center justify-center gap-1 text-[11px] uppercase tracking-wider text-primary/70">
                <Sparkles className="h-3.5 w-3.5" /> AI Prediction
              </p>
              <p className="text-2xl font-bold text-primary">
                {match.prediction.predictedHome} – {match.prediction.predictedAway}
              </p>
              {!isUpcoming && (
                <p className={cn(
                  "mt-2 text-xs font-medium",
                  (() => {
                    const predHome = match.prediction.predictedHome > match.prediction.predictedAway;
                    const predAway = match.prediction.predictedHome < match.prediction.predictedAway;
                    const actualHome = (match.homeScore ?? 0) > (match.awayScore ?? 0);
                    const actualAway = (match.homeScore ?? 0) < (match.awayScore ?? 0);
                    const correct = (predHome && actualHome) || (predAway && actualAway) || (!predHome && !predAway && match.homeScore === match.awayScore);
                    return correct ? "text-chart-1" : "text-chart-2";
                  })()
                )}>
                  {(() => {
                    const predHome = match.prediction.predictedHome > match.prediction.predictedAway;
                    const predAway = match.prediction.predictedHome < match.prediction.predictedAway;
                    const actualHome = (match.homeScore ?? 0) > (match.awayScore ?? 0);
                    const actualAway = (match.homeScore ?? 0) < (match.awayScore ?? 0);
                    return (predHome && actualHome) || (predAway && actualAway) || (!predHome && !predAway && match.homeScore === match.awayScore)
                      ? "Correct prediction"
                      : "Incorrect prediction";
                  })()}
                </p>
              )}
            </div>
          )}

          {breakdown && (
            <div className="mt-6 space-y-4">
              {/* Form */}
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">Home Form (avg goals at home)</p>
                <div className="flex justify-between gap-3">
                  <div className="flex-1 rounded-lg border border-border bg-card p-3 text-center">
                    <p className="text-xl font-bold text-foreground">{breakdown.formHome}</p>
                    <p className="text-[11px] text-muted-foreground">{match.homeTeam.name}</p>
                  </div>
                  <div className="flex-1 rounded-lg border border-border bg-card p-3 text-center">
                    <p className="text-xl font-bold text-foreground">{breakdown.formAway}</p>
                    <p className="text-[11px] text-muted-foreground">{match.awayTeam.name}</p>
                  </div>
                </div>
              </div>

              {/* H2H */}
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                  Head-to-Head ({breakdown.h2hCount} matches)
                </p>
                {breakdown.h2hCount > 0 ? (
                  <div className="flex justify-between gap-3">
                    <div className="flex-1 rounded-lg border border-border bg-card p-3 text-center">
                      <p className="text-xl font-bold text-chart-1">{breakdown.h2hRecord.homeWins}</p>
                      <p className="text-[11px] text-muted-foreground">Home Wins</p>
                    </div>
                    <div className="flex-1 rounded-lg border border-border bg-card p-3 text-center">
                      <p className="text-xl font-bold text-muted-foreground">{breakdown.h2hRecord.draws}</p>
                      <p className="text-[11px] text-muted-foreground">Draws</p>
                    </div>
                    <div className="flex-1 rounded-lg border border-border bg-card p-3 text-center">
                      <p className="text-xl font-bold text-chart-2">{breakdown.h2hRecord.awayWins}</p>
                      <p className="text-[11px] text-muted-foreground">Away Wins</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No H2H data available.</p>
                )}
              </div>

              {/* Blend */}
              <p className="text-center text-[11px] text-muted-foreground">
                {breakdown.blendUsed === "form+h2h" ? "Weighted: 70% form · 30% H2H" : "Based on form only (no H2H data)"}
              </p>
            </div>
          )}

          {breakdown && breakdown.h2hCount > 0 && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-bold text-foreground">Head-to-Head</h2>
              
              {/* Record summary */}
              <div className="mb-6 flex justify-between gap-3">
                <div className="flex-1 rounded-lg border border-border bg-background p-3 text-center">
                  <p className="text-2xl font-bold text-chart-1">{breakdown.h2hRecord.homeWins}</p>
                  <p className="text-[11px] text-muted-foreground">{match.homeTeam.name}</p>
                </div>
                <div className="flex-1 rounded-lg border border-border bg-background p-3 text-center">
                  <p className="text-2xl font-bold text-muted-foreground">{breakdown.h2hRecord.draws}</p>
                  <p className="text-[11px] text-muted-foreground">Draws</p>
                </div>
                <div className="flex-1 rounded-lg border border-border bg-background p-3 text-center">
                  <p className="text-2xl font-bold text-chart-2">{breakdown.h2hRecord.awayWins}</p>
                  <p className="text-[11px] text-muted-foreground">{match.awayTeam.name}</p>
                </div>
              </div>

              {/* Past meetings */}
              {breakdown.h2hMatches?.length > 0 && (
                <div className="space-y-2">
                  <p className="mb-3 text-[11px] uppercase tracking-wider text-muted-foreground">Past Meetings</p>
                  {breakdown.h2hMatches.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-2 text-sm">
                      <span className="w-1/3 truncate text-muted-foreground">{m.homeTeam}</span>
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-foreground">{m.homeScore} - {m.awayScore}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <span className="w-1/3 truncate text-right text-muted-foreground">{m.awayTeam}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
