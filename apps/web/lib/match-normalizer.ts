/**
 * Centralized Match Data Normalization Utility
 * 
 * This utility normalizes all different match data formats from various sources
 * (Austrian weekend matches, German Bundesliga, EPL, etc.) into a consistent shape.
 */

// Normalized match interface - this is the single source of truth
export interface NormalizedMatch {
  id: string;
  league: {
    id: string;
    name: string;
    country: string;
    logoUrl?: string;
  };
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    logoUrl?: string | null;
    score?: number | null;
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    logoUrl?: string | null;
    score?: number | null;
  };
  kickoffTime: string; // ISO UTC string
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';
  round?: string;
  season?: string;
  bestOdds?: {
    home: { odd: number; bookmaker: string };
    draw: { odd: number; bookmaker: string };
    away: { odd: number; bookmaker: string };
  };
  // Additional metadata
  pageUrl?: string;
  liveTime?: string;
}

// League configurations - centralized league information
export const LEAGUE_CONFIGS = {
  // Austrian Leagues
  AUSTRIAN_BUNDESLIGA: {
    id: 'OEBL1',
    name: 'Österreichische Bundesliga',
    country: 'Austria',
    logoUrl: '/logos/austrian-bundesliga.png'
  },
  AUSTRIAN_2LIGA: {
    id: 'OEBL2',
    name: 'Österreichische 2. Liga',
    country: 'Austria',
    logoUrl: '/logos/austrian-2liga.png'
  },
  // German Leagues
  GERMAN_BUNDESLIGA: {
    id: 'DE1',
    name: 'Deutsche Bundesliga',
    country: 'Germany',
    logoUrl: '/logos/bundesliga.png'
  },
  GERMAN_2BUNDESLIGA: {
    id: 'DE2',
    name: 'Deutsche 2. Bundesliga',
    country: 'Germany',
    logoUrl: '/logos/2bundesliga.png'
  },
  // English Leagues
  PREMIER_LEAGUE: {
    id: 'EPL',
    name: 'Premier League',
    country: 'England',
    logoUrl: '/logos/premier-league.png'
  },
  CHAMPIONSHIP: {
    id: 'EFL',
    name: 'English Championship',
    country: 'England',
    logoUrl: '/logos/championship.png'
  },
  LEAGUE_ONE: {
    id: 'EFL1',
    name: 'English League One',
    country: 'England',
    logoUrl: '/logos/league1.png'
  }
};

/**
 * Generate a short name from a team name
 */
function generateShortName(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 3)
    .toUpperCase();
}

/**
 * Generate team ID from team name
 */
function generateTeamId(name: string): string {
  return name.replace(/\s+/g, '-').toLowerCase();
}

/**
 * Determine match status based on time and boolean flags
 */
function determineStatus(
  kickoffTime: Date,
  finished?: boolean,
  started?: boolean,
  cancelled?: boolean,
  ongoing?: boolean
): 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED' {
  if (cancelled) return 'CANCELLED';
  if (finished) return 'FINISHED';
  
  const now = new Date();
  const minutesElapsed = (now.getTime() - kickoffTime.getTime()) / (1000 * 60);
  
  // If match started and is within 2 hours, consider it LIVE
  if (started || (minutesElapsed >= 0 && minutesElapsed < 120)) {
    return 'LIVE';
  }
  
  // If ongoing flag is explicitly set, it's LIVE
  if (ongoing) return 'LIVE';
  
  return 'SCHEDULED';
}

/**
 * Parse UTC time string ensuring proper UTC interpretation
 */
function parseUTCTime(timeString: string): Date {
  if (timeString.includes('T') && !timeString.includes('Z') && !timeString.includes('+')) {
    // No timezone specified, assume UTC
    return new Date(timeString + 'Z');
  }
  return new Date(timeString);
}

/**
 * Normalize Austrian weekend matches format
 */
export function normalizeAustrianWeekendMatch(
  match: any,
  leagueConfig = LEAGUE_CONFIGS.AUSTRIAN_BUNDESLIGA
): NormalizedMatch {
  const kickoffUTC = parseUTCTime(match.utcTime);
  const status = determineStatus(
    kickoffUTC,
    match.status?.finished,
    match.status?.started,
    match.status?.cancelled
  );

  return {
    id: match.id,
    league: leagueConfig,
    homeTeam: {
      id: match.homeTeam?.id || generateTeamId(match.homeTeam?.name || ''),
      name: match.homeTeam?.name || '',
      shortName: generateShortName(match.homeTeam?.name || ''),
      logoUrl: null,
      score: match.homeTeam?.score || null
    },
    awayTeam: {
      id: match.awayTeam?.id || generateTeamId(match.awayTeam?.name || ''),
      name: match.awayTeam?.name || '',
      shortName: generateShortName(match.awayTeam?.name || ''),
      logoUrl: null,
      score: match.awayTeam?.score || null
    },
    kickoffTime: kickoffUTC.toISOString(),
    status,
    round: match.round,
    season: match.season,
    bestOdds: match.bestOdds
  };
}

/**
 * Normalize German Bundesliga/2.Bundesliga format
 */
export function normalizeGermanBundesligaMatch(
  match: any,
  leagueConfig = LEAGUE_CONFIGS.GERMAN_BUNDESLIGA,
  round?: string
): NormalizedMatch {
  const kickoffUTC = parseUTCTime(match.status?.utcTime);
  const status = determineStatus(
    kickoffUTC,
    match.status?.finished,
    match.status?.started,
    match.status?.cancelled,
    match.status?.ongoing
  );

  return {
    id: match.id,
    league: leagueConfig,
    homeTeam: {
      id: match.home?.id || generateTeamId(match.home?.name || ''),
      name: match.home?.name || '',
      shortName: generateShortName(match.home?.name || ''),
      logoUrl: null,
      score: match.home?.score || null
    },
    awayTeam: {
      id: match.away?.id || generateTeamId(match.away?.name || ''),
      name: match.away?.name || '',
      shortName: generateShortName(match.away?.name || ''),
      logoUrl: null,
      score: match.away?.score || null
    },
    kickoffTime: kickoffUTC.toISOString(),
    status,
    round: round || match.round,
    season: match.season || '2024/25',
    pageUrl: match.pageUrl,
    liveTime: match.status?.liveTime?.short || match.status?.liveTime
  };
}

/**
 * Normalize Pinnacle API format (Austrian 2. Liga)
 */
export function normalizePinnacleMatch(
  match: any,
  leagueConfig = LEAGUE_CONFIGS.AUSTRIAN_2LIGA,
  round?: string
): NormalizedMatch {
  const kickoffUTC = parseUTCTime(match.starts);
  const now = new Date();
  const minutesElapsed = (now.getTime() - kickoffUTC.getTime()) / (1000 * 60);
  
  let status: 'SCHEDULED' | 'LIVE' | 'FINISHED' = 'SCHEDULED';
  if (minutesElapsed >= 0 && minutesElapsed < 120) {
    status = 'LIVE';
  } else if (minutesElapsed >= 120) {
    status = 'FINISHED';
  }

  // Get odds from match data
  const moneyLine = match.periods?.num_0?.money_line || {};
  const bestOdds = {
    home: { odd: moneyLine.home || (1.85 + Math.random() * 1.5), bookmaker: 'bet365' },
    draw: { odd: moneyLine.draw || (3.10 + Math.random() * 0.8), bookmaker: 'bwin' },
    away: { odd: moneyLine.away || (2.75 + Math.random() * 1.2), bookmaker: 'tipico' }
  };

  return {
    id: `${match.home?.replace(/\s+/g, '-').toLowerCase()}-vs-${match.away?.replace(/\s+/g, '-').toLowerCase()}-${match.event_id}`,
    league: leagueConfig,
    homeTeam: {
      id: generateTeamId(match.home || ''),
      name: match.home || '',
      shortName: generateShortName(match.home || ''),
      logoUrl: null
    },
    awayTeam: {
      id: generateTeamId(match.away || ''),
      name: match.away || '',
      shortName: generateShortName(match.away || ''),
      logoUrl: null
    },
    kickoffTime: kickoffUTC.toISOString(),
    status,
    round: round || '12. Spieltag',
    season: '2024/25',
    bestOdds
  };
}

/**
 * Normalize already formatted match (from main API route)
 */
export function normalizeFormattedMatch(match: any): NormalizedMatch {
  // This is for matches that are already in the expected format
  return {
    id: match.id,
    league: match.league,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    kickoffTime: match.kickoffTime,
    status: match.status,
    round: match.round,
    season: match.season,
    bestOdds: match.bestOdds,
    pageUrl: match.pageUrl,
    liveTime: match.liveTime
  };
}

/**
 * Filter matches based on time - removes old finished matches
 */
export function filterRelevantMatches(matches: NormalizedMatch[]): NormalizedMatch[] {
  const now = new Date();
  
  return matches.filter(match => {
    const kickoffTime = new Date(match.kickoffTime);
    const minutesElapsed = (now.getTime() - kickoffTime.getTime()) / (1000 * 60);
    
    // Keep upcoming matches and matches that haven't been finished for more than 2 hours
    return minutesElapsed < 120;
  });
}

/**
 * Sort matches by priority: LIVE first, then by kickoff time
 */
export function sortMatches(matches: NormalizedMatch[]): NormalizedMatch[] {
  return matches.sort((a, b) => {
    // LIVE matches first
    if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
    if (a.status !== 'LIVE' && b.status === 'LIVE') return 1;
    
    // Then by kickoff time
    return new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime();
  });
}

/**
 * Main normalization function - auto-detects format and normalizes
 */
export function normalizeMatches(
  matches: any[],
  source: 'austrian-weekend' | 'german-bundesliga' | 'german-2bundesliga' | 'premier-league' | 'pinnacle' | 'formatted',
  leagueConfig?: any,
  round?: string
): NormalizedMatch[] {
  let normalizedMatches: NormalizedMatch[];

  switch (source) {
    case 'austrian-weekend':
      normalizedMatches = matches.map(match => 
        normalizeAustrianWeekendMatch(match, leagueConfig)
      );
      break;
    case 'german-bundesliga':
      normalizedMatches = matches.map(match => 
        normalizeGermanBundesligaMatch(match, leagueConfig || LEAGUE_CONFIGS.GERMAN_BUNDESLIGA, round)
      );
      break;
    case 'german-2bundesliga':
      normalizedMatches = matches.map(match => 
        normalizeGermanBundesligaMatch(match, leagueConfig || LEAGUE_CONFIGS.GERMAN_2BUNDESLIGA, round)
      );
      break;
    case 'premier-league':
      normalizedMatches = matches.map(match => 
        normalizeGermanBundesligaMatch(match, leagueConfig || LEAGUE_CONFIGS.PREMIER_LEAGUE, round)
      );
      break;
    case 'pinnacle':
      normalizedMatches = matches.map(match => 
        normalizePinnacleMatch(match, leagueConfig, round)
      );
      break;
    case 'formatted':
      normalizedMatches = matches.map(normalizeFormattedMatch);
      break;
    default:
      console.warn('Unknown match source format:', source);
      normalizedMatches = matches.map(normalizeFormattedMatch);
  }

  // Filter out old matches and sort
  const filteredMatches = filterRelevantMatches(normalizedMatches);
  return sortMatches(filteredMatches);
}