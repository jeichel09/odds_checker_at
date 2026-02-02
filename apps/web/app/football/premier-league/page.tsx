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

export default function EnglishPremierLeaguePage() {
  const [matches, setMatches] = useState<NormalizedMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [currentRound, setCurrentRound] = useState<number>(7)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        // Fetch English Premier League matches from our custom API
        const response = await fetch('/api/matches/premier-league')
        const data: ApiResponse = await response.json()
        
        console.log('English Premier League API Response:', data)
        
        if (data.success && data.matches && Array.isArray(data.matches)) {
          // API already returns normalized matches, use them directly
          setMatches(data.matches)
          setCurrentRound(data.meta.currentRound)
        } else {
          console.error('API returned invalid data:', data)
          setMatches(mockMatches)
        }
      } catch (error) {
        console.error('Error fetching English Premier League matches:', error)
        // Fallback to mock data if API fails
        setMatches(mockMatches)
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [])

  // Function to get appropriate short names for Premier League teams
  const getTeamShortName = (teamName: string): string => {
    const shortNames: { [key: string]: string } = {
      'Arsenal': 'ARS',
      'Aston Villa': 'AVL',
      'Bournemouth': 'BOU',
      'Brentford': 'BRE',
      'Brighton': 'BRI',
      'Burnley': 'BUR',
      'Chelsea': 'CHE',
      'Crystal Palace': 'CRY',
      'Everton': 'EVE',
      'Fulham': 'FUL',
      'Leeds': 'LEE',
      'Liverpool': 'LIV',
      'Man City': 'MCI',
      'Man United': 'MUN',
      'Newcastle': 'NEW',
      'Nottm Forest': 'NFO',
      'Sheffield United': 'SHU',
      'Tottenham': 'TOT',
      'West Ham': 'WHU',
      'Wolves': 'WOL'
    };
    
    return shortNames[teamName] || teamName.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
  }

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
          {/* League Header - Maroon like other leagues */}
          <div className="bg-red-900 text-white rounded-lg mb-6 overflow-hidden shadow-2xl border-2 border-gray-700">
            <div className="px-6 py-4 flex items-center space-x-4">
              <Image
                src="/assets/logos/leagues/premier-league.svg"
                alt="English Premier League"
                width={48}
                height={48}
                className="object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/logos/leagues/england.svg'
                }}
              />
              <div>
                <h1 className="text-2xl font-bold">English Premier League</h1>
                <p className="text-red-200 text-sm">
                  Matchday {currentRound} • {matches.length} {matches.length === 1 ? 'Match' : 'Matches'} • {(() => {
                    const now = new Date();
                    const year = now.getFullYear();
                    const lastSundayMarch = new Date(year, 2, 31);
                    lastSundayMarch.setDate(31 - lastSundayMarch.getDay());
                    const lastSundayOctober = new Date(year, 9, 31);
                    lastSundayOctober.setDate(31 - lastSundayOctober.getDay());
                    const isDST = now >= lastSundayMarch && now < lastSundayOctober;
                    return isDST ? 'CEST' : 'CET';
                  })()} 
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
                <p>No upcoming matches found.</p>
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
    id: 'aston-villa-vs-burnley',
    homeTeam: { id: 'aston-villa', name: 'Aston Villa', shortName: 'AVL' },
    awayTeam: { id: 'burnley', name: 'Burnley', shortName: 'BUR' },
    league: { id: 'EPL', name: 'English Premier League', country: 'England' },
    kickoffTime: '2025-10-05T14:00:00',  // 13:00 UTC + 1 hour CET
    status: 'SCHEDULED',
    round: 'Matchday 7'
  },
  {
    id: 'everton-vs-crystal-palace',
    homeTeam: { id: 'everton', name: 'Everton', shortName: 'EVE' },
    awayTeam: { id: 'crystal-palace', name: 'Crystal Palace', shortName: 'CRY' },
    league: { id: 'EPL', name: 'English Premier League', country: 'England' },
    kickoffTime: '2025-10-05T14:00:00',  // 13:00 UTC + 1 hour CET
    status: 'SCHEDULED',
    round: 'Matchday 7'
  },
  {
    id: 'newcastle-vs-nottingham-forest',
    homeTeam: { id: 'newcastle', name: 'Newcastle', shortName: 'NEW' },
    awayTeam: { id: 'nottingham-forest', name: 'Nottm Forest', shortName: 'NFO' },
    league: { id: 'EPL', name: 'English Premier League', country: 'England' },
    kickoffTime: '2025-10-05T14:00:00',  // 13:00 UTC + 1 hour CET
    status: 'SCHEDULED',
    round: 'Matchday 7'
  },
  {
    id: 'wolves-vs-brighton',
    homeTeam: { id: 'wolves', name: 'Wolves', shortName: 'WOL' },
    awayTeam: { id: 'brighton', name: 'Brighton', shortName: 'BRI' },
    league: { id: 'EPL', name: 'English Premier League', country: 'England' },
    kickoffTime: '2025-10-05T14:00:00',  // 13:00 UTC + 1 hour CET
    status: 'SCHEDULED',
    round: 'Matchday 7'
  },
  {
    id: 'brentford-vs-man-city',
    homeTeam: { id: 'brentford', name: 'Brentford', shortName: 'BRE' },
    awayTeam: { id: 'man-city', name: 'Man City', shortName: 'MCI' },
    league: { id: 'EPL', name: 'English Premier League', country: 'England' },
    kickoffTime: '2025-10-05T16:30:00',  // 15:30 UTC + 1 hour CET
    status: 'SCHEDULED',
    round: 'Matchday 7'
  }
]