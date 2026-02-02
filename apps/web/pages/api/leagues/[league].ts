/**
 * Unified Dynamic API Route for All Leagues
 * Single endpoint that handles all leagues using configuration
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { getLeagueConfig } from '../../../lib/leagues/config';
import {
  calculateCurrentRound,
  filterCurrentRoundMatches,
  convertCachedMatch,
  filterRelevantMatches,
  sortMatches,
  generateMockOdds
} from '../../../lib/leagues/utils';
import type { CacheData, Match } from '../../../lib/leagues/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { league } = req.query;

  if (!league || typeof league !== 'string') {
    return res.status(400).json({ error: 'League parameter is required' });
  }

  // Get league configuration
  const config = getLeagueConfig(league);
  if (!config) {
    return res.status(404).json({ error: `League '${league}' not found` });
  }

  try {
    // Load cache file
    const cacheFilePath = path.join(process.cwd(), 'data', 'cache', config.cacheFile);
    
    if (!fs.existsSync(cacheFilePath)) {
      return res.status(404).json({ 
        error: `Cache file not found for ${config.name}`,
        hint: `Expected file at: data/cache/${config.cacheFile}`
      });
    }

    const cacheContent = fs.readFileSync(cacheFilePath, 'utf-8');
    const cacheData: CacheData = JSON.parse(cacheContent);

    if (!cacheData.matches || cacheData.matches.length === 0) {
      return res.status(200).json({
        league: {
          id: config.id,
          name: config.name
        },
        round: 0,
        matches: []
      });
    }

    // Calculate current round
    const currentRound = calculateCurrentRound(cacheData.matches, config);

    // Get matches for current round
    const roundMatches = filterCurrentRoundMatches(
      cacheData.matches,
      currentRound,
      config
    );

    // Convert to standardized format
    let matches: Match[] = roundMatches.map(cached =>
      convertCachedMatch(cached, config, currentRound)
    );

    // Add mock odds
    matches = matches.map(match => ({
      ...match,
      odds: generateMockOdds()
    }));

    // Filter out old finished matches
    matches = filterRelevantMatches(matches);

    // Sort matches (LIVE first, then by kickoff time)
    matches = sortMatches(matches);

    // Return response
    return res.status(200).json({
      league: {
        id: config.id,
        name: config.name,
        displayName: config.displayName,
        country: config.country,
        logoPath: config.logoPath
      },
      round: currentRound,
      matchesPerRound: config.matchesPerRound,
      matches,
      lastUpdated: cacheData.lastUpdated || new Date().toISOString()
    });

  } catch (error) {
    console.error(`Error processing ${config.name}:`, error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
