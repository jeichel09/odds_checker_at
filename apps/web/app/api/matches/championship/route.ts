import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { normalizeMatches, LEAGUE_CONFIGS } from '@/lib/match-normalizer';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';

// Helper function to calculate the current round dynamically
function calculateCurrentRound(matches: any[]): string {
  if (matches.length === 0) return 'Matchweek 1';
  
  // Get the earliest upcoming match date
  const earliestMatch = matches.reduce((earliest, match) => {
    const matchDate = new Date(match.status.utcTime);
    const earliestDate = new Date(earliest.status.utcTime);
    return matchDate < earliestDate ? match : earliest;
  }, matches[0]);
  
  const matchDate = new Date(earliestMatch.status.utcTime);
  
  // Championship 2024/25 season started on August 16, 2024
  // Matchweeks are typically Friday-Saturday (occasionally Tuesday-Wednesday midweek)
  const seasonStart = new Date('2024-08-16');
  
  // Calculate days since season start
  const daysSinceStart = Math.floor((matchDate.getTime() - seasonStart.getTime()) / (24 * 60 * 60 * 1000));
  
  // Calculate which week this is (rounds are weekly)
  const weeksSinceStart = Math.floor(daysSinceStart / 7);
  
  // Add 1 because matchweek 1 started at week 0
  const currentRound = weeksSinceStart + 1;
  
  // Championship has 24 teams, so 46 matchweeks in total (home and away)
  // Fall back to month-based estimation if calculation seems wrong
  let roundNumber = currentRound;
  
  if (roundNumber > 46 || roundNumber < 1) {
    // October matches are typically matchweeks 10-13 depending on exact dates
    const month = matchDate.getMonth(); // 0-indexed, so Oct = 9
    const dayOfMonth = matchDate.getDate();
    
    if (month === 9) { // October
      if (dayOfMonth < 7) roundNumber = 9;
      else if (dayOfMonth < 21) roundNumber = 10; // Oct 7-20 is matchweek 10
      else if (dayOfMonth < 28) roundNumber = 11;
      else roundNumber = 12;
    }
  }
  
  // Final clamp
  roundNumber = Math.max(1, Math.min(46, roundNumber));
  
  console.log(`Calculated round: Matchweek ${roundNumber} (match date: ${matchDate.toISOString()}, days since start: ${daysSinceStart})`);
  
  return `Matchweek ${roundNumber}`;
}

export async function GET() {
  console.log('Championship API route called');
  
  try {
    // Path to cache file
    const cacheFilePath = path.join(process.cwd(), 'championship_cache.json');
    console.log('Cache file path:', cacheFilePath);
    console.log('Cache file exists:', fs.existsSync(cacheFilePath));
    
    if (!fs.existsSync(cacheFilePath)) {
      console.log('Cache file not found, returning fallback data');
      return NextResponse.json({
        success: false,
        matches: [],
        meta: {
          total: 0,
          league: 'English Championship',
          source: 'Cache file not found',
          liveMatches: 0
        }
      });
    }
    
    // Read and parse cache file
    const cacheContent = fs.readFileSync(cacheFilePath, 'utf8');
    console.log('Cache file content length:', cacheContent.length);
    
    const cacheData = JSON.parse(cacheContent);
    const allMatches = cacheData.weekendMatches || [];
    console.log('Total matches in cache:', allMatches.length);
    
    // Current time for filtering
    const now = new Date();
    console.log('Current time:', now.toISOString());
    
    // Group all matches by round
    const matchesByRound: { [round: string]: any[] } = {};
    allMatches.forEach(match => {
      const matchDate = new Date(match.status.utcTime);
      const seasonStart = new Date('2024-08-16');
      const daysSinceStart = Math.floor((matchDate.getTime() - seasonStart.getTime()) / (24 * 60 * 60 * 1000));
      const weeksSinceStart = Math.floor(daysSinceStart / 7);
      let roundNumber = weeksSinceStart + 1;
      
      if (roundNumber > 46 || roundNumber < 1) {
        const month = matchDate.getMonth();
        const dayOfMonth = matchDate.getDate();
        if (month === 9) {
          if (dayOfMonth < 7) roundNumber = 9;
          else if (dayOfMonth < 21) roundNumber = 10;
          else if (dayOfMonth < 28) roundNumber = 11;
          else roundNumber = 12;
        }
      }
      roundNumber = Math.max(1, Math.min(46, roundNumber));
      const round = `Matchweek ${roundNumber}`;
      
      if (!matchesByRound[round]) matchesByRound[round] = [];
      matchesByRound[round].push(match);
    });
    
    const sortedRounds = Object.keys(matchesByRound).sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      return numA - numB;
    });
    
    console.log('Available rounds:', sortedRounds);
    
    // Find active round with 120-minute grace period rule
    let activeRound: string | null = null;
    let matches: any[] = [];
    
    for (const round of sortedRounds) {
      const roundMatches = matchesByRound[round];
      
      // Check for live or upcoming matches
      const liveMatches = roundMatches.filter(m => m.status.started && !m.status.finished);
      const upcomingMatches = roundMatches.filter(m => !m.status.started && new Date(m.status.utcTime) > now);
      
      if (liveMatches.length > 0 || upcomingMatches.length > 0) {
        activeRound = round;
        matches = [...liveMatches, ...upcomingMatches];
        console.log(`Active round: ${round} (${liveMatches.length} live, ${upcomingMatches.length} upcoming)`);
        break;
      }
      
      // All matches finished - check 120-minute grace period
      const allFinished = roundMatches.every(m => m.status.finished);
      if (allFinished) {
        const latestKickoff = Math.max(...roundMatches.map(m => new Date(m.status.utcTime).getTime()));
        const graceEndTime = new Date(latestKickoff + 240 * 60 * 1000); // 120 min match + 120 min grace
        
        console.log(`Round ${round} finished. Grace ends: ${graceEndTime.toISOString()}`);
        
        if (now <= graceEndTime) {
          activeRound = round;
          matches = []; // Show empty - all finished but still in grace period
          console.log(`Round ${round} in grace period, showing empty`);
          break;
        }
      }
    }
    
    if (!activeRound && sortedRounds.length > 0) {
      activeRound = sortedRounds[0];
      matches = matchesByRound[activeRound].filter(m => 
        (m.status.started && !m.status.finished) || 
        (!m.status.started && new Date(m.status.utcTime) > now)
      );
      console.log(`Defaulting to earliest round: ${activeRound}`);
    }
    
    const currentRound = activeRound || 'Matchweek 1';
    console.log(`Using ${matches.length} matches from ${currentRound}`);
    
    // Normalize the matches using RapidAPI format
    const normalizedMatches = normalizeMatches(
      matches,
      'german-bundesliga',
      LEAGUE_CONFIGS.CHAMPIONSHIP,
      currentRound
    );
    
    // Add mock best odds - using only bookmakers from our assets
    const bookmakers = ['admiral', 'bet_at_home', 'bet365', 'betway', 'bwin', 'interwetten', 'lottoland', 'merkur_bets', 'mozzart', 'neo_bet', 'rabona', 'tipico', 'tipp3', 'tipwin', 'win2day'];
    normalizedMatches.forEach(match => {
      if (!match.bestOdds) {
        match.bestOdds = {
          home: { odd: 1.85 + Math.random() * 1.5, bookmaker: bookmakers[Math.floor(Math.random() * bookmakers.length)] },
          draw: { odd: 3.10 + Math.random() * 0.8, bookmaker: bookmakers[Math.floor(Math.random() * bookmakers.length)] },
          away: { odd: 2.75 + Math.random() * 1.2, bookmaker: bookmakers[Math.floor(Math.random() * bookmakers.length)] }
        };
      }
    });
    
    console.log(`Returning ${normalizedMatches.length} normalized Championship matches`);
    
    return NextResponse.json({
      success: true,
      matches: normalizedMatches,
      meta: {
        total: normalizedMatches.length,
        league: 'English Championship',
        source: 'Real Data from Cache - Normalized Format',
        cachedAt: cacheData.timestamp,
        liveMatches: normalizedMatches.filter(m => m.status === 'LIVE').length
      }
    });
    
  } catch (error) {
    console.error('Error in Championship API:', error);
    
    return NextResponse.json({
      success: false,
      matches: [],
      meta: {
        total: 0,
        league: 'English Championship',
        source: 'Error loading matches',
        error: error instanceof Error ? error.message : 'Unknown error',
        liveMatches: 0
      }
    });
  }
}
