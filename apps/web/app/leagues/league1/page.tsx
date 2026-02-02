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

export default function LeagueOnePage() {
  const [matches, setMatches] = useState<NormalizedMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/matches/league1?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
        const data: ApiResponse = await response.json()
        
        console.log('🟢 League One API Response:', data);
        
        if (data.success && data.matches) {
          setMatches(data.matches || [])
        } else {
          setMatches([])
        }
      } catch (error) {
        console.error('Error fetching matches:', error)
        setMatches([])
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [])

  const getBestOddsForMatch = (match: NormalizedMatch): BestOdds | undefined => {
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
      <BookmakerCarousel />
      
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <LeagueHeader
            leagueName="English League One"
            logoPath="/assets/logos/leagues/efl_league1.svg"
            logoAlt="English League One"
            subtitle={matches.length > 0 ? `${matches[0].round} • ${matches.length} ${matches.length === 1 ? 'Spiel' : 'Spiele'}` : 'Keine Spiele'}
            backgroundColor="bg-red-900"
          />

          <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200">
            {matches.length > 0 ? (
              <>
                {matches.map((match, index) => {
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
