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

export default function GermanBundesligaPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [currentRound, setCurrentRound] = useState<number>(7)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        // Fetch German Bundesliga matches using dedicated API endpoint
        const response = await fetch('/api/matches/bundesliga')
        const data = await response.json()
        
        console.log('German Bundesliga API Response:', data)
        if (data.matches && Array.isArray(data.matches)) {
          // Set current round from API response
          if (data.meta && data.meta.currentRound) {
            setCurrentRound(data.meta.currentRound)
          }
          
          // API now returns normalized format, use directly
          setMatches(data.matches);
        } else {
          console.error('API returned invalid data:', data)
          setMatches(mockMatches.filter(m => getMatchStatus(m.kickoffTime) !== 'FINISHED'))
        }
      } catch (error) {
        console.error('Error fetching German Bundesliga matches:', error)
        // Fallback to filtered mock data if API fails
        setMatches(mockMatches.filter(m => getMatchStatus(m.kickoffTime) !== 'FINISHED'))
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [])

  const getBestOddsForMatch = (matchId: string): BestOdds => {
    const bookmakers = ['win2day', 'tipp3', 'bet365', 'bwin', 'interwetten', 'tipico', 'betway', 'admiral', 'neo_bet', 'tipwin', 'mozzart', 'merkur_bets', 'rabona', 'bet_at_home', 'lottoland']
    return {
      home: { odd: parseFloat((1.85 + Math.random() * 1.5).toFixed(2)), bookmaker: bookmakers[Math.floor(Math.random() * bookmakers.length)] },
      draw: { odd: parseFloat((3.10 + Math.random() * 0.8).toFixed(2)), bookmaker: bookmakers[Math.floor(Math.random() * bookmakers.length)] },
      away: { odd: parseFloat((2.75 + Math.random() * 1.2).toFixed(2)), bookmaker: bookmakers[Math.floor(Math.random() * bookmakers.length)] }
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
          <LeagueHeader
            leagueName="Deutsche Bundesliga"
            logoPath="/assets/logos/leagues/bundesliga.svg"
            logoAlt="Deutsche Bundesliga"
            subtitle={`${currentRound}. Spieltag • ${matches.length} anstehende Spiele`}
            backgroundColor="bg-red-900"
          />

          {/* Matches */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200">
            {matches.length > 0 ? (
              <>
                {matches.map((match, index) => (
                  <div key={match.id} className={index === 0 ? "border-t-2 border-gray-300" : ""}>
                    <CompactMatchCard 
                      match={match} 
                      bestOdds={match.bestOdds || getBestOddsForMatch(match.id)}
                    />
                    {index < matches.length - 1 && (
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

// Function to determine match status based on current time
const getMatchStatus = (kickoffTime: string): string => {
  const now = new Date()
  const kickoff = new Date(kickoffTime)
  const timeDiff = now.getTime() - kickoff.getTime()
  const minutesElapsed = timeDiff / (1000 * 60)
  
  // If match started less than 120 minutes ago (90 min + injury time), it might be live
  if (minutesElapsed > 0 && minutesElapsed < 120) {
    return 'LIVE'
  }
  // If match is in the future
  else if (minutesElapsed < 0) {
    return 'SCHEDULED'
  }
  // Match finished
  else {
    return 'FINISHED'
  }
}

const mockMatches: Match[] = [
  {
    id: 'eintracht-frankfurt-vs-bayern-munchen',
    homeTeam: { id: 'eintracht-frankfurt', name: 'Eintracht Frankfurt', shortName: 'SGE' },
    awayTeam: { id: 'bayern-munchen', name: 'Bayern München', shortName: 'FCB' },
    league: { id: 'DE1', name: 'Deutsche Bundesliga', country: 'Germany' },
    kickoffTime: '2025-10-04T18:30:00Z',
    status: 'LIVE',
    round: '7. Spieltag'
  },
  {
    id: 'vfb-stuttgart-vs-fc-heidenheim',
    homeTeam: { id: 'vfb-stuttgart', name: 'VfB Stuttgart', shortName: 'VFB' },
    awayTeam: { id: 'fc-heidenheim', name: 'FC Heidenheim', shortName: 'HDH' },
    league: { id: 'DE1', name: 'Deutsche Bundesliga', country: 'Germany' },
    kickoffTime: '2025-10-05T15:30:00Z',
    status: 'SCHEDULED',
    round: '7. Spieltag'
  },
  {
    id: 'hamburger-sv-vs-mainz-05',
    homeTeam: { id: 'hamburger-sv', name: 'Hamburger SV', shortName: 'HSV' },
    awayTeam: { id: 'mainz-05', name: 'Mainz 05', shortName: 'M05' },
    league: { id: 'DE1', name: 'Deutsche Bundesliga', country: 'Germany' },
    kickoffTime: '2025-10-05T17:30:00Z',
    status: 'SCHEDULED',
    round: '7. Spieltag'
  },
  {
    id: 'freiburg-vs-monchengladbach',
    homeTeam: { id: 'freiburg', name: 'SC Freiburg', shortName: 'SCF' },
    awayTeam: { id: 'monchengladbach', name: 'Borussia Mönchengladbach', shortName: 'BMG' },
    league: { id: 'DE1', name: 'Deutsche Bundesliga', country: 'Germany' },
    kickoffTime: '2025-10-05T19:30:00Z',
    status: 'SCHEDULED',
    round: '7. Spieltag'
  }
]