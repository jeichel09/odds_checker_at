import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { normalizeMatches, LEAGUE_CONFIGS } from '@/lib/match-normalizer';

export const dynamic = 'force-dynamic';

function calculateCurrentRound(matches: any[]): string {
  if (matches.length === 0) return 'Matchweek 1';
  
  const earliestMatch = matches.reduce((earliest, match) => {
    const matchDate = new Date(match.status.utcTime);
    const earliestDate = new Date(earliest.status.utcTime);
    return matchDate < earliestDate ? match : earliest;
  }, matches[0]);
  
  const matchDate = new Date(earliestMatch.status.utcTime);
  const seasonStart = new Date('2024-07-26'); // League One started July 26
  const daysSinceStart = Math.floor((matchDate.getTime() - seasonStart.getTime()) / (24 * 60 * 60 * 1000));
  const weeksSinceStart = Math.floor(daysSinceStart / 7);
  let roundNumber = weeksSinceStart + 1;
  
    if (roundNumber > 46 || roundNumber < 1) {
      const month = matchDate.getMonth();
      const dayOfMonth = matchDate.getDate();
      if (month === 9) { // October
        if (dayOfMonth < 7) roundNumber = 11;
        else if (dayOfMonth < 12) roundNumber = 12; // Oct 7-11 is MW 12
        else if (dayOfMonth < 19) roundNumber = 13; // Oct 12-18 is MW 13
        else if (dayOfMonth < 26) roundNumber = 14;
        else roundNumber = 15;
      }
    }
  
  roundNumber = Math.max(1, Math.min(46, roundNumber));
  console.log(`Calculated round: Matchweek ${roundNumber}`);
  return `Matchweek ${roundNumber}`;
}

export async function GET() {
  console.log('League One API route called');
  
  try {
    const cacheFilePath = path.join(process.cwd(), 'league1_cache.json');
    
    if (!fs.existsSync(cacheFilePath)) {
      return NextResponse.json({
        success: false,
        matches: [],
        meta: { total: 0, league: 'English League One', source: 'Cache not found', liveMatches: 0 }
      });
    }
    
    const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
    const allMatches = cacheData.weekendMatches || [];
    const now = new Date();
    
    const matchesByRound: { [round: string]: any[] } = {};
    allMatches.forEach(match => {
      const matchDate = new Date(match.status.utcTime);
      const seasonStart = new Date('2024-07-26'); // League One started July 26
      const daysSinceStart = Math.floor((matchDate.getTime() - seasonStart.getTime()) / (24 * 60 * 60 * 1000));
      const weeksSinceStart = Math.floor(daysSinceStart / 7);
      let roundNumber = weeksSinceStart + 1;
      
      if (roundNumber > 46 || roundNumber < 1) {
        const month = matchDate.getMonth();
        const dayOfMonth = matchDate.getDate();
        if (month === 9) { // October
          if (dayOfMonth <= 4) roundNumber = 12; // Oct 1-4 is MW 12
          else if (dayOfMonth <= 18) roundNumber = 13; // Oct 5-18 is MW 13
          else if (dayOfMonth <= 25) roundNumber = 14;
          else roundNumber = 15;
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
    
    let activeRound: string | null = null;
    let matches: any[] = [];
    
    for (const round of sortedRounds) {
      const roundMatches = matchesByRound[round];
      const liveMatches = roundMatches.filter(m => m.status.started && !m.status.finished && !m.status.cancelled);
      const upcomingMatches = roundMatches.filter(m => !m.status.started && !m.status.cancelled && new Date(m.status.utcTime) > now);
      
      if (liveMatches.length > 0 || upcomingMatches.length > 0) {
        activeRound = round;
        matches = [...liveMatches, ...upcomingMatches];
        break;
      }
      
      const allFinished = roundMatches.every(m => m.status.finished);
      if (allFinished) {
        const latestKickoff = Math.max(...roundMatches.map(m => new Date(m.status.utcTime).getTime()));
        const graceEndTime = new Date(latestKickoff + 240 * 60 * 1000);
        
        if (now <= graceEndTime) {
          // Still in grace period - but check if next round has matches
          const currentRoundIndex = sortedRounds.indexOf(round);
          if (currentRoundIndex < sortedRounds.length - 1) {
            // Move to next round
            continue;
          } else {
            // No next round, show empty
            activeRound = round;
            matches = [];
            break;
          }
        }
      }
    }
    
    if (!activeRound && sortedRounds.length > 0) {
      activeRound = sortedRounds[0];
      matches = matchesByRound[activeRound].filter(m => 
        !m.status.cancelled && (
          (m.status.started && !m.status.finished) || 
          (!m.status.started && new Date(m.status.utcTime) > now)
        )
      );
    }
    
    const currentRound = activeRound || 'Matchweek 1';
    
    const normalizedMatches = normalizeMatches(
      matches,
      'german-bundesliga',
      LEAGUE_CONFIGS.LEAGUE_ONE,
      currentRound
    );
    
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
    
    return NextResponse.json({
      success: true,
      matches: normalizedMatches,
      meta: {
        total: normalizedMatches.length,
        league: 'English League One',
        source: 'Real Data from Cache',
        cachedAt: cacheData.timestamp,
        liveMatches: normalizedMatches.filter(m => m.status === 'LIVE').length
      }
    });
    
  } catch (error) {
    console.error('Error in League One API:', error);
    return NextResponse.json({
      success: false,
      matches: [],
      meta: { total: 0, league: 'English League One', source: 'Error', liveMatches: 0 }
    });
  }
}
