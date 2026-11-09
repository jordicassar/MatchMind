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

export interface Breakdown {
  predictedHome: number;
  predictedAway: number;
  homeAttack: number;
  homeDefense: number;
  awayAttack: number;
  awayDefense: number;
  expHome: number;
  expAway: number;
  homeAdvantage: number;
  homePPG: number;
  awayPPG: number;
  h2hCount: number;
  h2hRecord: H2HRecord;
  h2hMatches: H2HMatch[];
}

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

export interface Accuracy {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  exactScores: number;
  exactScoreAccuracy: number;
  season: string;
  backtest: {
    season: string;
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    exactScores: number;
    exactScoreAccuracy: number;
  };
}