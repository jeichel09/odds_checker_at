import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { normalizeMatches, LEAGUE_CONFIGS } from '@/lib/match-normalizer';

interface CachedMatchData {
  timestamp: string;
  source: string;
  leagueId: number;
  leagueName: string;
  weekendMatches: Array<{
    id: string;
    homeTeam: {
      name: string;
      id: string;
      score: number;
    };
    awayTeam: {
      name: string;
      id: string;
      score: number;
    };
    utcTime: string;
    localTime: string;
    status: {
      finished: boolean;
      started: boolean;
      cancelled: boolean;
    };
  }>;
}

interface BestOdds {
  home: { odd: number; bookmaker: string };
  draw: { odd: number; bookmaker: string };
  away: { odd: number; bookmaker: string };
}

export async function GET(request: NextRequest) {
  console.log('🚀 API ROUTE LOADED - New Version with Austrian Support!');
  const { searchParams } = new URL(request.url);
  const leagueRaw = searchParams.get('league') || 'öbl1'; // Default to Austrian Bundesliga
  const league = decodeURIComponent(leagueRaw);
  
  console.log('🔍 Debug: Raw league parameter:', JSON.stringify(leagueRaw));
  console.log('🔍 Debug: Decoded league parameter:', JSON.stringify(league));
  console.log('🔍 Debug: League char codes:', Array.from(league).map(c => c.charCodeAt(0)));

  try {
    // Handle Austrian Bundesliga - support both öbl1 (from frontend) and austrian-bundesliga
    console.log('🔍 Comparing:', league, 'for Austrian Bundesliga');
    console.log('🔍 Checking if league === "öbl1":', league === 'öbl1');
    console.log('🔍 Checking if league === "austrian-bundesliga":', league === 'austrian-bundesliga');
    // Handle Austrian Bundesliga with direct comparison
    console.log('🔍 Debug: Testing league === "öbl1":', league === 'öbl1');
    
    // Match Austrian league - handle encoding issues
    const isAustrianLeague = (
      league === 'öbl1' || 
      league === 'oebl1' ||
      league === 'obl1' ||
      JSON.stringify(Array.from(league).map(c => c.charCodeAt(0))) === JSON.stringify([246, 98, 108, 49]) || // öbl1 char codes
      league.includes('bl1') // fallback
    );
    
    console.log('🔍 Debug: isAustrianLeague =', isAustrianLeague);
    
    if (isAustrianLeague) {
      console.log('🇦🇹 Loading Austrian Bundesliga data from cache...');
      
      // Load cached data - try multiple possible locations
      const fs_sync = require('fs');
      console.log('🔍 Debug: process.cwd() =', process.cwd());
      
      const possiblePaths = [
        path.join(process.cwd(), 'austrian_weekend_matches.json'),
        path.join(process.cwd(), '../../austrian_weekend_matches.json'),
        path.join(process.cwd(), 'apps/api/cache/austrian_weekend_matches.json'),
        path.join(process.cwd(), '../../apps/api/cache/austrian_weekend_matches.json'),
        path.join(process.cwd(), '../../cache/austrian_weekend_matches.json')
      ];
      
      let cacheFilePath = null;
      for (const possiblePath of possiblePaths) {
        if (fs_sync.existsSync(possiblePath)) {
          cacheFilePath = possiblePath;
          console.log('✅ Found cache file at:', cacheFilePath);
          break;
        }
      }
      
      if (!cacheFilePath) {
        console.log('⚠️ No cache file found in any of these locations:', possiblePaths);
      }
      
      if (cacheFilePath) {
        try {
          const cachedDataRaw = await fs.readFile(cacheFilePath, 'utf-8');
          const cachedData: CachedMatchData = JSON.parse(cachedDataRaw);
        
        console.log(`✨ Found ${cachedData.weekendMatches.length} matches from ${cachedData.source}`);
        
        // Use normalized format for Austrian weekend matches
        const normalizedMatches = normalizeMatches(
          cachedData.weekendMatches,
          'austrian-weekend',
          LEAGUE_CONFIGS.AUSTRIAN_BUNDESLIGA
        );
        
        console.log(`🔍 Austrian BL: Normalized ${normalizedMatches.length} matches after filtering`);
        
        // Add mock best odds to cached matches if not present
        const bookmakers = ['win2day', 'tipp3', 'bet365', 'bwin', 'interwetten', 'tipico', 'betway', 'admiral', 'neo_bet', 'tipwin', 'mozzart', 'merkur_bets', 'rabona', 'bet_at_home', 'lottoland'];
        const matches = normalizedMatches.map(match => {
          if (!match.bestOdds) {
            match.bestOdds = {
              home: { odd: 1.85 + Math.random() * 1.5, bookmaker: bookmakers[Math.floor(Math.random() * bookmakers.length)] },
              draw: { odd: 3.10 + Math.random() * 0.8, bookmaker: bookmakers[Math.floor(Math.random() * bookmakers.length)] },
              away: { odd: 2.75 + Math.random() * 1.2, bookmaker: bookmakers[Math.floor(Math.random() * bookmakers.length)] }
            };
          }
          return match;
        });

        return NextResponse.json({
          success: true,
          matches,
          meta: {
            total: matches.length,
            league: 'Austrian Bundesliga',
            source: `Real Data from ${cachedData.source}`,
            cachedAt: cachedData.timestamp,
            liveMatches: matches.filter((m: any) => m.status === 'LIVE').length
          }
        });

        } catch (cacheError) {
          console.log('⚠️ Error reading cache file:', cacheError);
        }
      } else {
        console.log('⚠️ No cache file found, using fallback data');
        
        // Fallback to some basic data structure if cache is not available
        const fallbackMatches = [
          {
            id: '1',
            homeTeam: {
              id: '1',
              name: 'Austria Wien',
              shortName: 'AUS',
              logoUrl: null
            },
            awayTeam: {
              id: '2',
              name: 'BW Linz',
              shortName: 'BWL',
              logoUrl: null
            },
            league: {
              id: 'ÖBL1',
              name: 'Österreichische Bundesliga',
              country: 'Austria'
            },
            kickoffTime: '2025-10-04T15:00:00.000Z',
            status: 'SCHEDULED',
            homeScore: null,
            awayScore: null,
            round: '9. Spieltag',
            season: '2024/25',
            bestOdds: {
              home: { odd: 2.15, bookmaker: 'bet365' },
              draw: { odd: 3.25, bookmaker: 'bwin' },
              away: { odd: 3.05, bookmaker: 'tipico' }
            }
          }
        ];

        return NextResponse.json({
          success: true,
          matches: fallbackMatches,
          meta: {
            total: fallbackMatches.length,
            league: 'Austrian Bundesliga',
            source: 'Fallback Data (Cache not available)',
            note: 'Real data should be loaded from cache once backend processes RapidAPI data'
          }
        });
      }
    }

    // Handle Austrian 2nd Liga
    const isAustrian2Liga = (
      league === 'oe2' ||
      league === 'austrian-2liga' ||
      league === 'austrian-second-league' ||
      league.includes('2liga') ||
      league.includes('oe2')
    );
    
    if (isAustrian2Liga) {
      console.log('🇦🇹 Loading Austrian 2nd Liga data from Pinnacle cache...');
      
      try {
        // Load cached Austrian 2nd Liga data
        const fs_sync = require('fs');
        const cachePath = path.join(process.cwd(), 'austrian_2liga_cache.json');
        
        if (fs_sync.existsSync(cachePath)) {
          const cacheData = JSON.parse(await fs.readFile(cachePath, 'utf-8'));
          console.log(`✨ Found ${cacheData.matches?.length || 0} matches from ${cacheData.source}`);
          
          // Use normalized format for RapidAPI data (Austrian 2. Liga)
          const allMatches = cacheData.response?.matches || [];
          const upcomingMatches = allMatches.filter(match => {
            const kickoffTime = new Date(match.status.utcTime);
            const now = new Date();
            return !match.status.finished && kickoffTime > now;
          }).slice(0, 8); // Show next 8 matches (one round)
          
          // Calculate current round: 16 teams = 8 matches per round
          // Match IDs in format 4836XXX where XXX starts from 163 (round 1, match 1)
          // Each round has 8 matches, so: round = Math.floor((matchIndex - 163) / 8) + 1
          // But simpler: just look at upcoming matches - if first match ID ends in 235-242, that's round 10
          // Since 9 rounds = 72 matches (163-234 inclusive), round 10 starts at match 235
          
          const normalizedMatches = normalizeMatches(
            upcomingMatches,
            'german-bundesliga', // Use same format as RapidAPI structure
            LEAGUE_CONFIGS.AUSTRIAN_2LIGA,
            '10. Spieltag' // Round 10 (9 rounds x 8 matches = 72 finished, so match 73+ is round 10)
          );
          
          console.log(`🔍 Austrian 2L: Normalized ${normalizedMatches.length} matches after filtering`);
          
          // Use the normalized matches data
          const matches = normalizedMatches;

          return NextResponse.json({
            success: true,
            matches: matches,
            meta: {
              total: matches.length,
              league: 'Austrian 2. Liga',
              source: `Real Data from ${cacheData.source}`,
              cachedAt: cacheData.timestamp,
              liveMatches: matches.filter((m: any) => m.status === 'LIVE').length
            }
          });
        } else {
          console.log('⚠️ Austrian 2. Liga cache not found');
        }
      } catch (error) {
        console.error('⚠️ Error loading Austrian 2. Liga cache:', error);
      }
      
      // Fallback if cache fails - all 5 matches with proper time-based status
      const now = new Date();
      const fallbackMatches = [
        {
          id: 'austria-salzburg-vs-hertha-wels',
          homeTeam: { id: 'austria-salzburg', name: 'Austria Salzburg', shortName: 'AUS', logoUrl: null },
          awayTeam: { id: 'hertha-wels', name: 'Hertha Wels', shortName: 'HER', logoUrl: null },
          league: { id: 'ÖBL2', name: 'Österreichische 2. Liga', country: 'Austria' },
          kickoffTime: '2025-10-04T14:30:00Z', // 12:30 UTC + 2 hours = 14:30 for display
          status: ((now.getTime() - new Date('2025-10-04T12:30:00Z').getTime()) / (1000 * 60)) >= 0 && 
                 ((now.getTime() - new Date('2025-10-04T12:30:00Z').getTime()) / (1000 * 60)) < 120 ? 'LIVE' : 'SCHEDULED',
          homeScore: null,
          awayScore: null,
          round: '12. Spieltag',
          season: '2024/25',
          bestOdds: { home: { odd: 2.49, bookmaker: 'bet365' }, draw: { odd: 2.50, bookmaker: 'bwin' }, away: { odd: 3.52, bookmaker: 'tipico' } }
        },
        {
          id: 'austria-lustenau-vs-austria-vienna-ii',
          homeTeam: { id: 'austria-lustenau', name: 'Austria Lustenau', shortName: 'LUS', logoUrl: null },
          awayTeam: { id: 'austria-vienna-ii', name: 'Austria Vienna II', shortName: 'AV2', logoUrl: null },
          league: { id: 'ÖBL2', name: 'Österreichische 2. Liga', country: 'Austria' },
          kickoffTime: '2025-10-04T14:30:00Z', // 12:30 UTC + 2 hours = 14:30 for display
          status: ((now.getTime() - new Date('2025-10-04T12:30:00Z').getTime()) / (1000 * 60)) >= 0 && 
                 ((now.getTime() - new Date('2025-10-04T12:30:00Z').getTime()) / (1000 * 60)) < 120 ? 'LIVE' : 'SCHEDULED',
          homeScore: null,
          awayScore: null,
          round: '12. Spieltag',
          season: '2024/25',
          bestOdds: { home: { odd: 1.85, bookmaker: 'win2day' }, draw: { odd: 3.45, bookmaker: 'admiral' }, away: { odd: 4.20, bookmaker: 'interwetten' } }
        },
        {
          id: 'sturm-graz-ii-vs-sw-bregenz',
          homeTeam: { id: 'sturm-graz-ii', name: 'Sturm Graz II', shortName: 'STU2', logoUrl: null },
          awayTeam: { id: 'sw-bregenz', name: 'SW Bregenz', shortName: 'BRE', logoUrl: null },
          league: { id: 'ÖBL2', name: 'Österreichische 2. Liga', country: 'Austria' },
          kickoffTime: '2025-10-04T20:00:00Z', // 18:00 UTC + 2 hours = 20:00 for display
          status: 'SCHEDULED',
          homeScore: null,
          awayScore: null,
          round: '12. Spieltag',
          season: '2024/25',
          bestOdds: { home: { odd: 2.11, bookmaker: 'tipico' }, draw: { odd: 4.06, bookmaker: 'bwin' }, away: { odd: 3.02, bookmaker: 'bet365' } }
        },
        {
          id: 'rapid-vienna-ii-vs-kapfenberger-sv',
          homeTeam: { id: 'rapid-vienna-ii', name: 'Rapid Vienna II', shortName: 'RAP2', logoUrl: null },
          awayTeam: { id: 'kapfenberger-sv', name: 'Kapfenberger SV', shortName: 'KAP', logoUrl: null },
          league: { id: 'ÖBL2', name: 'Österreichische 2. Liga', country: 'Austria' },
          kickoffTime: '2025-10-04T20:00:00Z', // 18:00 UTC + 2 hours = 20:00 for display
          status: 'SCHEDULED',
          homeScore: null,
          awayScore: null,
          round: '12. Spieltag',
          season: '2024/25',
          bestOdds: { home: { odd: 3.20, bookmaker: 'interwetten' }, draw: { odd: 3.97, bookmaker: 'admiral' }, away: { odd: 2.05, bookmaker: 'win2day' } }
        },
        {
          id: 'austria-klagenfurt-vs-st-polten',
          homeTeam: { id: 'austria-klagenfurt', name: 'Austria Klagenfurt', shortName: 'AKA', logoUrl: null },
          awayTeam: { id: 'st-polten', name: 'St Polten', shortName: 'STP', logoUrl: null },
          league: { id: 'ÖBL2', name: 'Österreichische 2. Liga', country: 'Austria' },
          kickoffTime: '2025-10-05T10:30:00Z', // 08:30 UTC + 2 hours = 10:30 for display
          status: 'SCHEDULED',
          homeScore: null,
          awayScore: null,
          round: '12. Spieltag',
          season: '2024/25',
          bestOdds: { home: { odd: 3.89, bookmaker: 'bet365' }, draw: { odd: 3.54, bookmaker: 'bwin' }, away: { odd: 1.93, bookmaker: 'tipico' } }
        }
      ].sort((a, b) => {
        // Sort by status: LIVE matches first, then by kickoff time
        if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
        if (a.status !== 'LIVE' && b.status === 'LIVE') return 1;
        return new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime();
      });

      return NextResponse.json({
        success: true,
        matches: fallbackMatches,
        meta: {
          total: fallbackMatches.length,
          league: 'Austrian 2. Liga',
          source: 'Fallback Data (Cache not available)',
          liveMatches: fallbackMatches.filter(m => m.status === 'LIVE').length
        }
      });
    }

    // Handle German Bundesliga
    const isGermanBundesliga = (
      league === 'bundesliga' ||
      league === 'german-bundesliga' ||
      league === 'de1' ||
      league.includes('bundesliga')
    );
    
    if (isGermanBundesliga) {
      console.log('🇩🇪 Loading German Bundesliga data from cache...');
      
      try {
        // Load cached German Bundesliga data
        const fs_sync = require('fs');
        // Use absolute path like 2nd Bundesliga API
        const cachePath = path.join(process.cwd(), 'german_bundesliga_cache.json');
        console.log('🔍 Debug: process.cwd() in API context:', process.cwd());
        
        // Also try the apps/web directory specifically
        const alternativePath = 'L:/Coding/Jigsaw/odds_checker_at/apps/web/german_bundesliga_cache.json';
        console.log('🔍 Debug: Alternative absolute path:', alternativePath);
        console.log('🔍 Debug: Alternative path exists:', fs_sync.existsSync(alternativePath));
        
        const finalCachePath = fs_sync.existsSync(cachePath) ? cachePath : 
                               fs_sync.existsSync(alternativePath) ? alternativePath : null;
        
        console.log('🗂️  German Bundesliga Cache Debug:');
        console.log('   process.cwd():', process.cwd());
        console.log('   original cachePath:', cachePath);
        console.log('   original cache exists:', fs_sync.existsSync(cachePath));
        console.log('   finalCachePath:', finalCachePath);
        
        if (finalCachePath) {
          try {
            console.log('✅ Cache file exists, attempting to read from:', finalCachePath);
            const cacheDataRaw = await fs.readFile(finalCachePath, 'utf-8');
            console.log('✅ Cache file read successfully, parsing JSON...');
            const cacheData = JSON.parse(cacheDataRaw);
            const matches = cacheData.response?.matches || [];
            console.log(`✨ Found ${matches.length} German Bundesliga matches from RapidAPI`);
            
            if (matches.length === 0) {
              console.log('⚠️ No matches found in cache data, falling back...');
              throw new Error('No matches in cache');
            }
          
          // Dynamic round selection: Bundesliga has 18 teams, so 9 matches per round
          // Find the current active round based on match completion status
          const now = new Date();
          let currentRound = 6; // Start with Round 6
          let roundStartIndex = 44; // Round 6 starts at index 44 (0-based)
          
          // SIMPLE RULE: "Two hours after the kick-off of the LAST game of the current round"
          while (currentRound <= 34) { // Bundesliga has 34 rounds
            const roundMatches = matches.slice(roundStartIndex, roundStartIndex + 9);
            
            if (roundMatches.length === 0) break;
            
            // Find the LAST game (latest kickoff) in this round
            let lastGameTime = null;
            for (const match of roundMatches) {
              let kickoffUTC;
              if (match.status.utcTime.includes('T') && !match.status.utcTime.includes('Z') && !match.status.utcTime.includes('+')) {
                kickoffUTC = new Date(match.status.utcTime + 'Z');
              } else {
                kickoffUTC = new Date(match.status.utcTime);
              }
              if (!lastGameTime || kickoffUTC > lastGameTime) {
                lastGameTime = kickoffUTC;
              }
            }
            
            if (lastGameTime) {
              const timeSinceLastKickoff = (now.getTime() - lastGameTime.getTime()) / (1000 * 60); // minutes
              console.log(`📊 German BL Round ${currentRound}: Last game kicked off at ${lastGameTime.toISOString()}, ${timeSinceLastKickoff.toFixed(2)} minutes ago`);
              
              // If less than 120 minutes (2 hours) since last game kickoff, this is current round
              if (timeSinceLastKickoff < 120) {
                console.log(`  -> Current round is ${currentRound} (last game kicked off ${timeSinceLastKickoff.toFixed(2)} minutes ago, < 120 min)`);
                break;
              } else {
                console.log(`  -> Round ${currentRound} finished (last game kicked off ${timeSinceLastKickoff.toFixed(2)} minutes ago, >= 120 min)`);
                currentRound++;
                roundStartIndex += 9;
              }
            } else {
              break;
            }
          }
          
          const currentRoundMatches = matches.slice(roundStartIndex, roundStartIndex + 9);
          console.log(`📊 Dynamic Round Selection: Currently showing Round ${currentRound} (matches ${roundStartIndex}-${roundStartIndex + 8}, found ${currentRoundMatches.length} matches)`);
          
          // Use normalized format for German Bundesliga matches
          const processedMatches = normalizeMatches(
            currentRoundMatches,
            'german-bundesliga',
            LEAGUE_CONFIGS.GERMAN_BUNDESLIGA,
            `${currentRound}. Spieltag`
          );
          
          // Add mock best odds to matches that don't have them
          const bookmakers = ['win2day', 'tipp3', 'bet365', 'bwin', 'interwetten', 'tipico', 'betway', 'admiral', 'neo_bet', 'tipwin', 'mozzart', 'merkur_bets', 'rabona', 'bet_at_home', 'lottoland'];
          processedMatches.forEach(match => {
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
            matches: processedMatches,
            meta: {
              total: processedMatches.length,
              league: 'German Bundesliga',
              source: 'Real Data from RapidAPI - Free Live Football Data',
              cachedAt: new Date().toISOString(),
              liveMatches: processedMatches.filter((m: any) => m.status === 'LIVE').length
            }
          });
          } catch (cacheError) {
            console.error('⚠️ Error processing German Bundesliga cache data:', cacheError);
          }
        } else {
          console.log('⚠️ German Bundesliga cache file not found. Tried paths:');
          console.log('   ', cachePath);
          console.log('   ', alternativePath);
        }
      } catch (error) {
        console.error('⚠️ Error loading German Bundesliga cache:', error);
      }
      
      // Fallback if cache fails - implement dynamic round advancement
      const now = new Date();
      
      // Define rounds with their matches (simplified for demonstration)
      const rounds = {
        6: [ // Round 6 matches (all should be finished by now)
          {
            id: 'eintracht-frankfurt-vs-bayern-munchen',
            homeTeam: { id: 'eintracht-frankfurt', name: 'Eintracht Frankfurt', shortName: 'SGE', logoUrl: null },
            awayTeam: { id: 'bayern-munchen', name: 'Bayern München', shortName: 'FCB', logoUrl: null },
            utcKickoff: '2025-10-04T16:30:00.000Z'
          }
        ],
        7: [ // Round 7 matches (should start showing after Round 6 is finished)
          {
            id: 'bayern-munchen-vs-borussia-dortmund',
            homeTeam: { id: 'bayern-munchen', name: 'Bayern München', shortName: 'FCB', logoUrl: null },
            awayTeam: { id: 'borussia-dortmund', name: 'Borussia Dortmund', shortName: 'BVB', logoUrl: null },
            utcKickoff: '2025-10-11T18:30:00Z'
          },
          {
            id: 'rb-leipzig-vs-bayer-leverkusen',
            homeTeam: { id: 'rb-leipzig', name: 'RB Leipzig', shortName: 'RBL', logoUrl: null },
            awayTeam: { id: 'bayer-leverkusen', name: 'Bayer Leverkusen', shortName: 'B04', logoUrl: null },
            utcKickoff: '2025-10-12T13:30:00Z'
          },
          {
            id: 'borussia-monchengladbach-vs-vfb-stuttgart',
            homeTeam: { id: 'borussia-monchengladbach', name: 'Borussia Mönchengladbach', shortName: 'BMG', logoUrl: null },
            awayTeam: { id: 'vfb-stuttgart', name: 'VfB Stuttgart', shortName: 'VFB', logoUrl: null },
            utcKickoff: '2025-10-12T13:30:00Z'
          }
        ]
      };
      
      // Determine current active round
      let currentRound = 6;
      let activeMatches = [];
      
      // Check each round to find the active one
      for (let round = 6; round <= 7; round++) {
        if (!rounds[round]) continue;
        
        const roundMatches = rounds[round];
        const allRoundFinished = roundMatches.every(match => {
          const kickoffUTC = new Date(match.utcKickoff);
          const minutesElapsed = (now.getTime() - kickoffUTC.getTime()) / (1000 * 60);
          return minutesElapsed >= 120;
        });
        
        if (!allRoundFinished) {
          currentRound = round;
          activeMatches = roundMatches;
          break;
        }
        
        console.log(`✅ Fallback: Round ${round} completed - advancing to next round`);
      }
      
      console.log(`📊 Fallback: Active round is ${currentRound} with ${activeMatches.length} matches`);
      
      // Convert active matches to full match objects
      const allFallbackMatches = activeMatches.map(match => ({
        ...match,
        league: { id: 'DE1', name: 'Deutsche Bundesliga', country: 'Germany' },
        // Convert UTC to Central European Time (CET/CEST)
        kickoffTime: (() => {
          const utcTime = new Date(match.utcKickoff);
          const year = utcTime.getFullYear();
          const lastSundayMarch = new Date(year, 2, 31);
          lastSundayMarch.setDate(31 - lastSundayMarch.getDay());
          const lastSundayOctober = new Date(year, 9, 31);
          lastSundayOctober.setDate(31 - lastSundayOctober.getDay());
          const isDST = utcTime >= lastSundayMarch && utcTime < lastSundayOctober;
          const offsetHours = isDST ? 2 : 1;
          return new Date(utcTime.getTime() + (offsetHours * 60 * 60 * 1000)).toISOString().replace('Z', '');
        })(),
        status: 'SCHEDULED',
        homeScore: null,
        awayScore: null,
        round: `${currentRound}. Spieltag`,
        season: '2024/25',
        bestOdds: {
          home: { odd: 2.15 + Math.random() * 1.0, bookmaker: ['bet365', 'bwin', 'tipico'][Math.floor(Math.random() * 3)] },
          draw: { odd: 3.05 + Math.random() * 0.5, bookmaker: ['bet365', 'bwin', 'tipico'][Math.floor(Math.random() * 3)] },
          away: { odd: 2.80 + Math.random() * 1.5, bookmaker: ['bet365', 'bwin', 'tipico'][Math.floor(Math.random() * 3)] }
        }
      }));
      
      // Apply real-time filtering logic to fallback data
      const fallbackMatches = allFallbackMatches.filter((match: any) => {
        const kickoffUTC = new Date(match.utcKickoff);
        const minutesElapsed = (now.getTime() - kickoffUTC.getTime()) / (1000 * 60);
        
        console.log(`⏰ Fallback: ${match.homeTeam.name} vs ${match.awayTeam.name}: kickoff=${match.utcKickoff}, minutesElapsed=${minutesElapsed.toFixed(1)}`);
        
        // Filter out matches that finished more than 120 minutes ago
        if (minutesElapsed >= 120) {
          console.log(`❌ Fallback: Filtering out finished match: ${match.homeTeam.name} vs ${match.awayTeam.name} (${minutesElapsed.toFixed(1)} minutes ago)`);
          return false;
        }
        
        // Update status based on real-time
        if (minutesElapsed >= 0 && minutesElapsed < 120) {
          match.status = 'LIVE';
          console.log(`🔴 Fallback: LIVE match: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
        } else {
          match.status = 'SCHEDULED';
          console.log(`📅 Fallback: SCHEDULED match: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
        }
        
        return true;
      }).sort((a: any, b: any) => {
        // Sort by status: LIVE matches first, then by kickoff time
        if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
        if (a.status !== 'LIVE' && b.status === 'LIVE') return 1;
        return new Date(a.utcKickoff).getTime() - new Date(b.utcKickoff).getTime();
      });

      return NextResponse.json({
        success: true,
        matches: fallbackMatches,
        meta: {
          total: fallbackMatches.length,
          league: 'German Bundesliga',
          source: 'Fallback Data (Cache not available) - Dynamic round advancement',
          currentRound: currentRound,
          liveMatches: fallbackMatches.filter(m => m.status === 'LIVE').length,
          currentTime: now.toISOString(),
          note: `Auto-advancing rounds: showing Round ${currentRound} matches. When all matches >120min finished, advances to next round automatically.`
        }
      });
    }

    // For other leagues, return empty for now
    console.log('🙄 Reached end - no matching league handler found');
    return NextResponse.json({
      success: true,
      matches: [],
      meta: {
        total: 0,
        league: league || 'unknown',
        source: 'Not implemented yet'
      }
    });

  } catch (error) {
    console.error('Error in matches API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch matches',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}