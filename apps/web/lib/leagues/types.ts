/**
 * Shared Types for League Match Data
 */

export interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string; // ISO string
  status: 'LIVE' | 'SCHEDULED' | 'FINISHED';
  round: number;
  odds?: MatchOdds;
  league?: {
    id: string;
    name: string;
  };
}

export interface MatchOdds {
  homeWin?: number;
  draw?: number;
  awayWin?: number;
  btts?: {
    yes?: number;
    no?: number;
  };
  overUnder?: {
    over25?: number;
    under25?: number;
    over35?: number;
    under35?: number;
  };
  bookmaker?: string;
}

export interface RoundData {
  roundNumber: number;
  matches: Match[];
}

/**
 * Standardized cache file format
 */
export interface CacheData {
  league: {
    id: number;
    name: string;
  };
  lastUpdated: string;
  matches: CachedMatch[];
}

export interface CachedMatch {
  fixture: {
    id: number;
    date: string; // ISO string
    timestamp: number;
    status: {
      short: string; // NS, LIVE, FT, etc.
      elapsed?: number;
    };
  };
  teams: {
    home: {
      id: number;
      name: string;
    };
    away: {
      id: number;
      name: string;
    };
  };
  league: {
    round?: string;
  };
}
