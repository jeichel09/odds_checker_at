/**
 * Centralized League Configuration
 * Single source of truth for all league data
 */

export interface LeagueConfig {
  id: string; // URL-friendly slug
  name: string; // Display name in German
  displayName: string; // Short display name
  apiId: number; // RapidAPI league ID
  teamCount: number;
  matchesPerRound: number;
  cacheFile: string; // Path relative to data/cache/
  seasonStartDate: string; // ISO date string
  country: string;
  logoPath: string; // Path to league logo
}

/**
 * All supported leagues
 */
export const LEAGUES: Record<string, LeagueConfig> = {
  'oesterreichische-bundesliga': {
    id: 'oesterreichische-bundesliga',
    name: 'Österreichische Bundesliga',
    displayName: 'Österreich Bundesliga',
    apiId: 218,
    teamCount: 12,
    matchesPerRound: 6,
    cacheFile: 'austrian-bundesliga.json',
    seasonStartDate: '2024-08-02',
    country: 'Austria',
    logoPath: '/assets/leagues/austrian-bundesliga.png'
  },
  'oesterreichische-2-liga': {
    id: 'oesterreichische-2-liga',
    name: 'Österreichische 2. Liga',
    displayName: 'Österreich 2. Liga',
    apiId: 219,
    teamCount: 16,
    matchesPerRound: 8,
    cacheFile: 'austrian-2liga.json',
    seasonStartDate: '2024-08-02',
    country: 'Austria',
    logoPath: '/assets/leagues/austrian-2liga.png'
  },
  'deutsche-bundesliga': {
    id: 'deutsche-bundesliga',
    name: 'Deutsche Bundesliga',
    displayName: 'Deutschland Bundesliga',
    apiId: 78,
    teamCount: 18,
    matchesPerRound: 9,
    cacheFile: 'german-bundesliga.json',
    seasonStartDate: '2024-08-23',
    country: 'Germany',
    logoPath: '/assets/leagues/german-bundesliga.png'
  },
  'deutsche-2-bundesliga': {
    id: 'deutsche-2-bundesliga',
    name: 'Deutsche 2. Bundesliga',
    displayName: 'Deutschland 2. Bundesliga',
    apiId: 79,
    teamCount: 18,
    matchesPerRound: 9,
    cacheFile: 'german-2bundesliga.json',
    seasonStartDate: '2024-08-02',
    country: 'Germany',
    logoPath: '/assets/leagues/german-2bundesliga.png'
  },
  'english-championship': {
    id: 'english-championship',
    name: 'English Championship',
    displayName: 'England Championship',
    apiId: 40,
    teamCount: 24,
    matchesPerRound: 12,
    cacheFile: 'english-championship.json',
    seasonStartDate: '2024-08-16',
    country: 'England',
    logoPath: '/assets/leagues/english-championship.png'
  },
  'english-league-one': {
    id: 'english-league-one',
    name: 'English League One',
    displayName: 'England League One',
    apiId: 41,
    teamCount: 24,
    matchesPerRound: 12,
    cacheFile: 'english-league-one.json',
    seasonStartDate: '2024-08-10',
    country: 'England',
    logoPath: '/assets/leagues/english-league-one.png'
  }
};

/**
 * Get league config by ID or alias
 */
export function getLeagueConfig(idOrAlias: string): LeagueConfig | null {
  // Normalize input
  const normalized = idOrAlias.toLowerCase().trim();
  
  // Direct match
  if (LEAGUES[normalized]) {
    return LEAGUES[normalized];
  }
  
  // Handle legacy aliases
  const aliases: Record<string, string> = {
    'öbl1': 'oesterreichische-bundesliga',
    'oebl1': 'oesterreichische-bundesliga',
    'oe2': 'oesterreichische-2-liga',
    'bundesliga': 'deutsche-bundesliga',
    '2bundesliga': 'deutsche-2-bundesliga',
    'championship': 'english-championship',
    'leagueone': 'english-league-one'
  };
  
  if (aliases[normalized]) {
    return LEAGUES[aliases[normalized]];
  }
  
  return null;
}

/**
 * Get all leagues as array
 */
export function getAllLeagues(): LeagueConfig[] {
  return Object.values(LEAGUES);
}
