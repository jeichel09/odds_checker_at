/**
 * Unified Match Utilities
 * Single implementation for all match-related logic
 */

import { LeagueConfig } from './config';
import { Match, CachedMatch } from './types';

const MINUTES_IN_MS = 60 * 1000;
const MATCH_DURATION_MS = 105 * MINUTES_IN_MS; // 90min + 15min buffer
const GRACE_PERIOD_MS = 120 * MINUTES_IN_MS; // 2 hours after kickoff

/**
 * Calculate match status based on kickoff time
 */
export function calculateMatchStatus(kickoffTime: string, cacheStatus?: string): 'LIVE' | 'SCHEDULED' | 'FINISHED' {
  const kickoff = new Date(kickoffTime).getTime();
  const now = Date.now();
  const timeSinceKickoff = now - kickoff;

  // If match hasn't started yet
  if (timeSinceKickoff < 0) {
    return 'SCHEDULED';
  }

  // Check cache status first if available
  if (cacheStatus) {
    const status = cacheStatus.toUpperCase();
    if (status === 'FT' || status === 'AET' || status === 'PEN') {
      return 'FINISHED';
    }
    if (status === 'LIVE' || status === '1H' || status === 'HT' || status === '2H') {
      return 'LIVE';
    }
  }

  // Time-based calculation
  if (timeSinceKickoff < MATCH_DURATION_MS) {
    return 'LIVE';
  }

  if (timeSinceKickoff < GRACE_PERIOD_MS) {
    return 'FINISHED';
  }

  // Match finished more than 2 hours ago
  return 'FINISHED';
}

/**
 * Calculate the current round based on match dates and league config
 */
export function calculateCurrentRound(matches: CachedMatch[], config: LeagueConfig): number {
  const now = Date.now();
  const seasonStart = new Date(config.seasonStartDate).getTime();
  
  // Group matches by round (based on match index)
  const rounds: CachedMatch[][] = [];
  for (let i = 0; i < matches.length; i += config.matchesPerRound) {
    rounds.push(matches.slice(i, i + config.matchesPerRound));
  }

  // Find the current round
  for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
    const roundMatches = rounds[roundIndex];
    if (roundMatches.length === 0) continue;

    // Get the last match of this round
    const lastMatch = roundMatches[roundMatches.length - 1];
    const lastKickoff = new Date(lastMatch.fixture.date).getTime();
    const timeSinceLastKickoff = now - lastKickoff;

    // If it's been less than 2 hours since the last match kicked off,
    // this is still the current round
    if (timeSinceLastKickoff < GRACE_PERIOD_MS) {
      return roundIndex + 1; // Rounds are 1-indexed
    }
  }

  // If all rounds are finished, return the last round
  return rounds.length;
}

/**
 * Filter matches for the current round
 */
export function filterCurrentRoundMatches(
  matches: CachedMatch[],
  currentRound: number,
  config: LeagueConfig
): CachedMatch[] {
  const startIndex = (currentRound - 1) * config.matchesPerRound;
  const endIndex = startIndex + config.matchesPerRound;
  return matches.slice(startIndex, endIndex);
}

/**
 * Filter out finished matches that are more than 2 hours old
 */
export function filterRelevantMatches(matches: Match[]): Match[] {
  const now = Date.now();
  return matches.filter(match => {
    const kickoff = new Date(match.kickoffTime).getTime();
    const timeSinceKickoff = now - kickoff;
    
    // Keep scheduled matches
    if (match.status === 'SCHEDULED') return true;
    
    // Keep live matches
    if (match.status === 'LIVE') return true;
    
    // Keep finished matches if within grace period
    if (match.status === 'FINISHED' && timeSinceKickoff < GRACE_PERIOD_MS) {
      return true;
    }
    
    return false;
  });
}

/**
 * Convert cached match to standardized match format
 */
export function convertCachedMatch(
  cached: CachedMatch,
  config: LeagueConfig,
  roundNumber: number
): Match {
  const status = calculateMatchStatus(
    cached.fixture.date,
    cached.fixture.status.short
  );

  return {
    id: cached.fixture.id,
    homeTeam: cached.teams.home.name,
    awayTeam: cached.teams.away.name,
    kickoffTime: cached.fixture.date,
    status,
    round: roundNumber,
    league: {
      id: config.id,
      name: config.name
    }
  };
}

/**
 * Format kickoff time to German locale
 */
export function formatKickoffTime(kickoffTime: string): string {
  const date = new Date(kickoffTime);
  
  const dayMonth = date.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Vienna'
  });
  
  const time = date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Vienna'
  });
  
  return `${dayMonth}, ${time}`;
}

/**
 * Sort matches: LIVE first, then SCHEDULED by kickoff time
 */
export function sortMatches(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    // Live matches always first
    if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
    if (b.status === 'LIVE' && a.status !== 'LIVE') return 1;
    
    // Then by kickoff time
    return new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime();
  });
}

/**
 * Generate mock odds for display
 */
export function generateMockOdds() {
  const bookmakers = ['bet365', 'bwin', 'tipp3', 'win2day', 'admiralbet'];
  const randomBookmaker = bookmakers[Math.floor(Math.random() * bookmakers.length)];
  
  return {
    homeWin: +(1.5 + Math.random() * 3).toFixed(2),
    draw: +(2.5 + Math.random() * 2).toFixed(2),
    awayWin: +(1.5 + Math.random() * 3).toFixed(2),
    btts: {
      yes: +(1.6 + Math.random() * 0.8).toFixed(2),
      no: +(1.6 + Math.random() * 0.8).toFixed(2)
    },
    overUnder: {
      over25: +(1.6 + Math.random() * 0.8).toFixed(2),
      under25: +(1.6 + Math.random() * 0.8).toFixed(2),
      over35: +(1.8 + Math.random() * 1.2).toFixed(2),
      under35: +(1.6 + Math.random() * 0.8).toFixed(2)
    },
    bookmaker: randomBookmaker
  };
}
