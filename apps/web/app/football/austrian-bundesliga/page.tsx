'use client'

import { useState, useEffect } from 'react'
import { CompactMatchCard } from '@/components/matches/CompactMatchCard'
import { BookmakerCarousel } from '@/components/ui/BookmakerCarousel'
import { LeagueHeader } from '@/components/ui/LeagueHeader'

interface Team {
  id: string
  name: string
  shortName?: string
  logoUrl?: string
}

interface League {
  id: string
  name: string
  country: string
}

interface Match {
  id: string
  homeTeam: Team
  awayTeam: Team
  league: League
  kickoffTime: string
  status: string
  homeScore?: number
  awayScore?: number
  round?: string
  season?: string
}

interface BestOdds {
  home: { odd: number; bookmaker: string }
  draw: { odd: number; bookmaker: string }
  away: { odd: number; bookmaker: string }
}

interface NormalizedMatch {
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
  kickoffTime: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';
  round?: string;
  season?: string;
  bestOdds?: {
    home: { odd: number; bookmaker: string };
    draw: { odd: number; bookmaker: string };
    away: { odd: number; bookmaker: string };
  };
  pageUrl?: string;
}

interface ApiResponse {
  success: boolean;
  matches: NormalizedMatch[];
  meta: {
    total: number;
    league: string;
    source: string;
    cachedAt?: string;
    liveMatches: number;
  };
}

export default function AustrianBundesligaPage() {
  console.log('🔴 AustrianBundesligaPage component mounted!');
  
  const [matches, setMatches] = useState<NormalizedMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔵 useEffect triggered!');
    
    const fetchMatches = async () => {
      console.log('🟢 fetchMatches called!');
      try {
        // Fetch Austrian Bundesliga matches using dedicated API endpoint
        // Add cache busting with timestamp
        const timestamp = new Date().getTime();
        console.log('🟡 About to fetch:', `/api/matches/austrian-bundesliga?t=${timestamp}`);
        const response = await fetch(`/api/matches/austrian-bundesliga?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
        const data: ApiResponse = await response.json()
        
        console.log('=== AUSTRIAN BUNDESLIGA DEBUG ===')
        console.log('Response status:', response.status)
        console.log('API Response:', data)
        console.log('Success:', data.success)
        console.log('Matches count:', data.matches?.length || 0)
        console.log('First match:', data.matches?.[0])
        console.log('=================================')
        
        if (data.success && data.matches && Array.isArray(data.matches)) {
          console.log(`Setting ${data.matches.length} matches to state`)
          // API already returns normalized matches, use them directly
          setMatches(data.matches)
        } else {
          console.error('API returned invalid data:', data)
          setMatches([])
        }
      } catch (error) {
        console.error('Error fetching Austrian Bundesliga matches:', error)
        setMatches([])
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [])

  const getBestOddsForMatch = (match: NormalizedMatch): BestOdds | undefined => {
    // Return the real odds from the API if available
    return match.bestOdds
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Lade Spiele...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Bookmaker Carousel */}
      <BookmakerCarousel />
      
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          {/* League Header */}
          <LeagueHeader
            leagueName="Österreichische Bundesliga"
            logoPath="/assets/logos/leagues/austrian-bundesliga.svg"
            logoAlt="Österreichische Bundesliga"
            subtitle={`${matches.length} ${matches.length === 1 ? 'Spiel' : 'Spiele'}`}
            backgroundColor="bg-red-900"
          />

          {/* Matches */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200">
            {matches.length > 0 ? (
              <>
                {matches.map((match, index) => {
                  // Convert NormalizedMatch to CompactMatchCard's expected Match type
                  const compactMatch: Match = {
                    id: match.id,
                    homeTeam: {
                      id: match.homeTeam.id,
                      name: match.homeTeam.name,
                      shortName: match.homeTeam.shortName,
                      logoUrl: match.homeTeam.logoUrl || undefined
                    },
                    awayTeam: {
                      id: match.awayTeam.id,
                      name: match.awayTeam.name,
                      shortName: match.awayTeam.shortName,
                      logoUrl: match.awayTeam.logoUrl || undefined
                    },
                    league: {
                      id: match.league.id,
                      name: match.league.name,
                      country: match.league.country
                    },
                    kickoffTime: match.kickoffTime,
                    status: match.status,
                    homeScore: match.homeTeam.score || undefined,
                    awayScore: match.awayTeam.score || undefined,
                    round: match.round,
                    season: match.season
                  };

                  return (
                    <div key={match.id} className={index === 0 ? "border-t-2 border-gray-300" : ""}>
                      <CompactMatchCard 
                        match={compactMatch} 
                        bestOdds={getBestOddsForMatch(match)}
                      />
                      {index < matches.length - 1 && (
                        <div className="border-t-2 border-gray-300 shadow-sm"></div>
                      )}
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>Keine anstehenden Spiele gefunden.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}