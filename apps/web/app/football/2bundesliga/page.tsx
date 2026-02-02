'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { CompactMatchCard } from '@/components/matches/CompactMatchCard'
import { BookmakerCarousel } from '@/components/ui/BookmakerCarousel'

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
    currentRound: number;
    liveMatches: number;
  };
}

export default function German2BundesligaPage() {
  const [matches, setMatches] = useState<NormalizedMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [currentRound, setCurrentRound] = useState<number>(8)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        // Fetch German 2nd Bundesliga matches from our custom API
        const response = await fetch('/api/matches/2bundesliga')
        const data: ApiResponse = await response.json()
        
        console.log('German 2nd Bundesliga API Response:', data)
        
        if (data.success && data.matches && Array.isArray(data.matches)) {
          // API already returns normalized matches, use them directly
          setMatches(data.matches)
          setCurrentRound(data.meta.currentRound)
        } else {
          console.error('API returned invalid data:', data)
          setMatches(mockMatches)
        }
      } catch (error) {
        console.error('Error fetching German 2nd Bundesliga matches:', error)
        // Fallback to mock data if API fails
        setMatches(mockMatches)
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
          <div className="bg-red-900 text-white rounded-lg mb-6 overflow-hidden shadow-2xl border-2 border-gray-700">
            <div className="px-6 py-4 flex items-center space-x-4">
              <Image
                src="/assets/logos/leagues/2bundesliga.svg"
                alt="Deutsche 2. Bundesliga"
                width={48}
                height={48}
                className="object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/logos/leagues/bundesliga.svg'
                }}
              />
              <div>
                <h1 className="text-2xl font-bold">Deutsche 2. Bundesliga</h1>
                <p className="text-red-200 text-sm">
                  {currentRound}. Spieltag • {matches.length} {matches.length === 1 ? 'Spiel' : 'Spiele'}
                </p>
              </div>
            </div>
          </div>

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

const mockMatches: Match[] = [
  {
    id: 'karlsruher-sc-vs-dynamo-dresden',
    homeTeam: { id: 'karlsruher-sc', name: 'Karlsruher SC', shortName: 'KSC' },
    awayTeam: { id: 'dynamo-dresden', name: 'Dynamo Dresden', shortName: 'SGD' },
    league: { id: 'DE2', name: 'Deutsche 2. Bundesliga', country: 'Germany' },
    kickoffTime: '2025-10-04T18:30:00Z',
    status: 'LIVE',
    homeScore: 1,
    awayScore: 1,
    round: '8. Spieltag'
  },
  {
    id: 'arminia-bielefeld-vs-schalke-04',
    homeTeam: { id: 'arminia-bielefeld', name: 'Arminia Bielefeld', shortName: 'DSC' },
    awayTeam: { id: 'schalke-04', name: 'Schalke 04', shortName: 'S04' },
    league: { id: 'DE2', name: 'Deutsche 2. Bundesliga', country: 'Germany' },
    kickoffTime: '2025-10-05T11:30:00Z',
    status: 'SCHEDULED',
    round: '8. Spieltag'
  },
  {
    id: 'greuther-furth-vs-hannover-96',
    homeTeam: { id: 'greuther-furth', name: 'Greuther Fürth', shortName: 'SGF' },
    awayTeam: { id: 'hannover-96', name: 'Hannover 96', shortName: 'H96' },
    league: { id: 'DE2', name: 'Deutsche 2. Bundesliga', country: 'Germany' },
    kickoffTime: '2025-10-05T11:30:00Z',
    status: 'SCHEDULED',
    round: '8. Spieltag'
  },
  {
    id: 'magdeburg-vs-elversberg',
    homeTeam: { id: 'magdeburg', name: 'Magdeburg', shortName: 'FCM' },
    awayTeam: { id: 'elversberg', name: 'Elversberg', shortName: 'SVE' },
    league: { id: 'DE2', name: 'Deutsche 2. Bundesliga', country: 'Germany' },
    kickoffTime: '2025-10-05T11:30:00Z',
    status: 'SCHEDULED',
    round: '8. Spieltag'
  }
]