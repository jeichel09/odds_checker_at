'use client'

import { useEffect, useState } from 'react'
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

export default function AustrianBundesligaPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        // Fetch Austrian Bundesliga matches using dedicated API endpoint
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/matches/austrian-bundesliga?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
        const data = await response.json()
        
        console.log('🔴 Austrian Bundesliga API Response:', data);
        console.log('🔴 Success:', data.success);
        console.log('🔴 Matches:', data.matches?.length || 0);
        
        if (data.success && data.matches) {
          setMatches(data.matches || [])
        } else {
          console.error('API returned invalid data:', data)
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

  // Filter for upcoming and live matches only
  const filteredMatches = matches.filter(match => {
    const now = new Date()
    const kickoffDate = new Date(match.kickoffTime)
    return match.status === 'LIVE' || 
           match.status === 'IN_PLAY' || 
           kickoffDate > now ||
           match.status === 'SCHEDULED'
  })

  // Group matches by round to show next complete round
  const groupedByRound = filteredMatches.reduce((acc, match) => {
    const round = match.round || 'Matchday 12' // Fallback from API response structure
    if (!acc[round]) {
      acc[round] = []
    }
    acc[round].push(match)
    return acc
  }, {} as Record<string, Match[]>)

  // Get the next round (check for both German "Spieltag" and English "Matchday")
  const sortedRounds = Object.keys(groupedByRound).sort((a, b) => {
    const extractNumber = (str: string) => {
      const match = str.match(/(\d+)/)
      return match ? parseInt(match[1]) : 0
    }
    return extractNumber(a) - extractNumber(b)
  })

  const nextRound = sortedRounds[0]
  const nextRoundMatches = nextRound ? groupedByRound[nextRound] : []
  
  // Convert round name to German format for display
  const displayRound = nextRound ? nextRound.replace('Matchday', 'Spieltag') : '9. Spieltag'

  // Mock best odds for each match with random bookmakers
  const getBestOddsForMatch = (matchId: string): BestOdds => {
    const bookmakers = ['win2day', 'tipp3', 'bet365', 'bwin', 'interwetten', 'tipico', 'betway', 'admiral', 'neo_bet', 'tipwin', 'mozzart', 'merkur_bets', 'rabona', 'bet_at_home', 'lottoland'];
    return {
      home: { odd: 1.85 + Math.random() * 1.5, bookmaker: bookmakers[Math.floor(Math.random() * bookmakers.length)] },
      draw: { odd: 3.10 + Math.random() * 0.8, bookmaker: bookmakers[Math.floor(Math.random() * bookmakers.length)] },
      away: { odd: 2.75 + Math.random() * 1.2, bookmaker: bookmakers[Math.floor(Math.random() * bookmakers.length)] }
    }
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
                src="/assets/logos/leagues/oe-bl.svg"
                alt="Österreichische Bundesliga"
                width={48}
                height={48}
                className="object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold">Österreichische Bundesliga</h1>
                <p className="text-red-200 text-sm">
                  {nextRoundMatches.length > 0 && `${displayRound} • ${nextRoundMatches.length} Spiele`}
                </p>
              </div>
            </div>
          </div>

          {/* Matches */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200">
            {nextRoundMatches.length > 0 ? (
              <>
                {nextRoundMatches.map((match, index) => (
                  <div key={match.id} className={index === 0 ? "border-t-2 border-gray-300" : ""}>
                    <CompactMatchCard 
                      match={match} 
                      bestOdds={getBestOddsForMatch(match.id)}
                    />
                    {index < nextRoundMatches.length - 1 && (
                      <div className="border-t-2 border-gray-300 shadow-sm"></div>
                    )}
                  </div>
                ))}
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

// Mock data fallback
function getMockAustrianMatches(): Match[] {
  const today = new Date()
  const nextFriday = new Date(today)
  nextFriday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7))
  
  return [
    {
      id: '1',
      homeTeam: { id: '1', name: 'RB Salzburg', shortName: 'RBS' },
      awayTeam: { id: '2', name: 'SK Rapid Wien', shortName: 'RAP' },
      league: { id: 'ÖBL1', name: 'Österreichische Bundesliga', country: 'Austria' },
      kickoffTime: new Date(nextFriday.getTime() + 17 * 60 * 60 * 1000).toISOString(),
      status: 'SCHEDULED',
      round: '9. Spieltag'
    },
    {
      id: '2',
      homeTeam: { id: '3', name: 'FK Austria Wien', shortName: 'AUS' },
      awayTeam: { id: '4', name: 'SK Sturm Graz', shortName: 'STU' },
      league: { id: 'ÖBL1', name: 'Österreichische Bundesliga', country: 'Austria' },
      kickoffTime: new Date(nextFriday.getTime() + 19.5 * 60 * 60 * 1000).toISOString(),
      status: 'SCHEDULED',
      round: '9. Spieltag'
    },
    {
      id: '3',
      homeTeam: { id: '5', name: 'Wolfsberger AC', shortName: 'WAC' },
      awayTeam: { id: '6', name: 'LASK', shortName: 'LASK' },
      league: { id: 'ÖBL1', name: 'Österreichische Bundesliga', country: 'Austria' },
      kickoffTime: new Date(nextFriday.getTime() + 24 * 60 * 60 * 1000 + 14.5 * 60 * 60 * 1000).toISOString(), // Saturday 14:30
      status: 'SCHEDULED',
      round: '9. Spieltag'
    },
    {
      id: '4',
      homeTeam: { id: '7', name: 'TSV Hartberg', shortName: 'HAR' },
      awayTeam: { id: '8', name: 'WSG Tirol', shortName: 'WSG' },
      league: { id: 'ÖBL1', name: 'Österreichische Bundesliga', country: 'Austria' },
      kickoffTime: new Date(nextFriday.getTime() + 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000).toISOString(), // Saturday 17:00
      status: 'SCHEDULED',
      round: '9. Spieltag'
    },
    {
      id: '5',
      homeTeam: { id: '9', name: 'Austria Klagenfurt', shortName: 'KLA' },
      awayTeam: { id: '10', name: 'SCR Altach', shortName: 'ALT' },
      league: { id: 'ÖBL1', name: 'Österreichische Bundesliga', country: 'Austria' },
      kickoffTime: new Date(nextFriday.getTime() + 48 * 60 * 60 * 1000 + 14.5 * 60 * 60 * 1000).toISOString(), // Sunday 14:30
      status: 'SCHEDULED',
      round: '9. Spieltag'
    },
    {
      id: '6',
      homeTeam: { id: '11', name: 'Grazer AK', shortName: 'GAK' },
      awayTeam: { id: '12', name: 'BW Linz', shortName: 'BWL' },
      league: { id: 'ÖBL1', name: 'Österreichische Bundesliga', country: 'Austria' },
      kickoffTime: new Date(nextFriday.getTime() + 48 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000).toISOString(), // Sunday 17:00
      status: 'SCHEDULED',
      round: '9. Spieltag'
    }
  ]
}
