// HistoryCard — match card used on the team detail page.
// Displays both upcoming and played matches for a specific team.
// For played matches, derives the result (Win/Loss/Draw) relative to the
// team being viewed and applies colour-coded left border and badge accordingly:
// green = win, red = loss, amber = draw.
// For the home page match card with prediction functionality, see MatchCard.tsx.
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import TeamSlot from "./TeamSlot";

type Result = "W" | "L" | "D";

function getResult(match: any, teamId: number): Result | null {
  if (match.homeScore === null) return null;
  const isHome   = match.homeTeamId === teamId;
  const myScore  = isHome ? match.homeScore : match.awayScore;
  const oppScore = isHome ? match.awayScore : match.homeScore;
  if (myScore > oppScore) return "W";
  if (myScore < oppScore) return "L";
  return "D";
}

const borderStyle: Record<Result, string> = {
  W: "border-l-4 border-l-chart-1",
  L: "border-l-4 border-l-chart-2",
  D: "border-l-4 border-l-chart-3",
};

const badgeStyle: Record<Result, string> = {
  W: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  L: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  D: "bg-chart-3/10 text-chart-3 border-chart-3/20",
};

const resultLabel: Record<Result, string> = { W: "Win", L: "Loss", D: "Draw" };

interface Props {
  match: any;
  teamId: number;
}

export default function HistoryCard({ match, teamId }: Props) {
  const result   = getResult(match, teamId);
  const isPlayed = match.homeScore !== null;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5",
        result && borderStyle[result]
      )}
    >
      <div className="mb-3">
        {result ? (
          <Badge variant="outline" className={cn("text-[10px] font-bold", badgeStyle[result])}>
            {resultLabel[result]}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px]">Upcoming</Badge>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <TeamSlot crest={match.homeTeam.crest} name={match.homeTeam.name} />
        <div className="flex flex-col items-center px-1">
          {isPlayed ? (
            <span className="text-xl font-extrabold text-foreground tabular-nums">
              {match.homeScore}&nbsp;–&nbsp;{match.awayScore}
            </span>
          ) : (
            <span className="text-xs font-semibold text-muted-foreground">vs</span>
          )}
        </div>
        <TeamSlot crest={match.awayTeam.crest} name={match.awayTeam.name} />
      </div>
    </div>
  );
}
