// Shared domain types — the shapes returned by the API routes and consumed
// by the pages and components. Mirrors the Prisma models plus the computed
// fields (stats, standings rows, prediction breakdowns) that the routes add
// on top. Kept in one place so the frontend and route handlers agree on shape.

export interface Team {
  id: number;
  externalId: number | null;
  name: string;
  createdAt: string;
  crest: string | null;
  stadium: string | null;
  stadiumCity: string | null;
  stadiumCapacity: number | null;
  stadiumImage: string | null;
  manager: string | null;
  managerPhoto: string | null;
}

export interface Prediction {
  id: number;
  predictedHome: number;
  predictedAway: number;
  createdAt: string;
  matchId: number;
}

export interface Match {
  id: number;
  externalId: number | null;
  date: string;
  homeScore: number | null;
  awayScore: number | null;
  createdAt: string;
  homeTeamId: number;
  awayTeamId: number;
  homeTeam: Team;
  awayTeam: Team;
  prediction: Prediction | null;
}

export interface Player {
  id: number;
  externalId: number | null;
  name: string | null;
  nationality: string | null;
  position: string | null;
  photo: string | null;
  teamId: number;
}

export interface TeamStats {
  wins: number;
  losses: number;
  draws: number;
  goalsScored: number;
  goalsConceded: number;
  matchesPlayed: number;
}

// Full profile returned by /api/teams/[id].
export interface TeamProfile {
  team: Team;
  stats: TeamStats;
  matches: Match[];
  players: Player[];
}

export interface H2HRecord {
  homeWins: number;
  draws: number;
  awayWins: number;
}

export interface H2HMatch {
  id: number;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
}

// Prediction breakdown returned by /api/matches/[id]/breakdown.
export interface Breakdown {
  formHome: number;
  formAway: number;
  h2hHome: number | null;
  h2hAway: number | null;
  h2hCount: number;
  h2hRecord: H2HRecord;
  blendUsed: string;
  h2hMatches: H2HMatch[];
}

// One row of the league table returned by /api/standings.
export interface StandingsRow {
  team: { id: number; name: string; crest: string | null };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

// Aggregate prediction performance returned by /api/predictions/accuracy.
export interface Accuracy {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
}