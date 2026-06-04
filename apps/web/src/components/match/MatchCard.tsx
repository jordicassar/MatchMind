// MatchCard — match card used on the home page.
// Displays a match with its status (Upcoming / Full Time), both team crests and names,
// and the final score if the match has been played.
// For upcoming matches, renders a prediction button that calls /api/predictions
// and displays the AI-generated score once returned.
// For the team detail page match card with result colour coding, see HistoryCard.tsx.
"use client";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import TeamSlot from "./TeamSlot";
import type { Match, Prediction } from "@/lib/types";

interface Props {
  match: Match;
  prediction?: Prediction | null;
  isLoading: boolean;
  onPredict: () => void;
}

export default function MatchCard({ match, prediction, isLoading, onPredict }: Props) {
  const isUpcoming = match.homeScore === null;

  return (
    <Link href={`/matches/${match.id}`} className="flex flex-col rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5">
      <div className="mb-3 flex justify-end">
        <Badge
          variant={isUpcoming ? "outline" : "secondary"}
          className={cn("text-[10px]", !isUpcoming && "border-primary/30 bg-primary/10 text-primary")}
        >
          {isUpcoming ? "Upcoming" : "Full Time"}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-2">
        <TeamSlot crest={match.homeTeam.crest} name={match.homeTeam.name} />
        <div className="flex flex-col items-center">
          {isUpcoming ? (
            <span className="text-xs font-semibold text-muted-foreground">vs</span>
          ) : (
            <span className="text-xl font-extrabold text-foreground tabular-nums">
              {match.homeScore}&nbsp;–&nbsp;{match.awayScore}
            </span>
          )}
        </div>
        <TeamSlot crest={match.awayTeam.crest} name={match.awayTeam.name} />
      </div>

      {isUpcoming && (
        <div className="mt-4">
          {prediction ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-center">
              <p className="mb-0.5 flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-primary/70">
                <Sparkles className="h-3 w-3" /> AI Prediction
              </p>
              <p className="text-base font-bold text-primary">
                {prediction.predictedHome} – {prediction.predictedAway}
              </p>
            </div>
          ) : (
            <button
              onClick={onPredict}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Predicting…
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  Get Prediction
                </>
              )}
            </button>
          )}
        </div>
      )}
    </Link>
  );
}
