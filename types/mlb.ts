
export interface MLBTeam {
  id: number;
  name: string;
  abbreviation: string;
  teamName: string;
}

export interface MLBPlayer {
  id: number;
  fullName: string;
  position: {
    code: string;
    name: string;
    type: string;
  };
  battingOrder?: number;
}

export interface MLBGame {
  gamePk: number;
  gameDate: string;
  status: {
    abstractGameState: string;
    detailedState: string;
  };
  teams: {
    away: {
      team: MLBTeam;
      score?: number;
    };
    home: {
      team: MLBTeam;
      score?: number;
    };
  };
  venue: {
    name: string;
  };
}

export interface MLBLineup {
  teamId: number;
  players: MLBPlayer[];
}

export interface ParlayBet {
  id: string;
  type: '1+ Hit' | '2+ Hits' | '3+ Hits' | '4+ Hits' | '1+ Bases' | '2+ Bases' | '3+ Bases' | 'HR';
  players: MLBPlayer[];
  gameId: number;
  created: string;
  odds?: string;
}
