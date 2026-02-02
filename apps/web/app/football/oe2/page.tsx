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

export default function Austrian2LigaPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        // Fetch Austrian 2nd Liga matches using oe2 parameter
        const response = await fetch('/api/matches?league=oe2')
        const data = await response.json()
        
        console.log('Austrian 2nd Liga API Response:', data)
        if (data.success) {
          setMatches(data.matches || [])
        } else {
          console.error('API returned error:', data)
          setMatches(mockMatches.filter(m => getMatchStatus(m.kickoffTime) !== 'FINISHED'))
        }
      } catch (error) {
        console.error('Error fetching Austrian 2nd Liga matches:', error)
        // Fallback to filtered mock data if API fails
        setMatches(mockMatches.filter(m => getMatchStatus(m.kickoffTime) !== 'FINISHED'))
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [])

  const getBestOddsForMatch = (matchId: string): BestOdds => {
    const bookmakers = ['win2day', 'tipp3', 'bet365', 'bwin', 'interwetten', 'tipico', 'betway', 'admiral']
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
          <div className="bg-red-900 text-white rounded-lg mb-6 overflow-hidden shadow-2xl border-2 border-gray-700">
            <div className="px-6 py-4 flex items-center space-x-4">
              <Image
                src="/assets/logos/leagues/oe2.svg"
                alt="Österreichische 2. Liga"
                width={48}
                height={48}
                className="object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/logos/leagues/oe-bl.svg'
                }}
              />
              <div>
              <h1 className="text-2xl font-bold">Österreichische 2. Liga</h1>
              <p className="text-red-200 text-sm">
                {matches.length > 0 ? matches[0].round : 'Spieltag'} • {matches.length} anstehende Spiele
              </p>
              </div>
            </div>
          </div>

          {/* Matches */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200">
            {matches.map((match, index) => (
              <div key={match.id} className={index === 0 ? "border-t-2 border-gray-300" : ""}>
                <CompactMatchCard 
                  match={match} 
                  bestOdds={getBestOddsForMatch(match.id)}
                />
                {index < matches.length - 1 && (
                  <div className="border-t-2 border-gray-300 shadow-sm"></div>
                )}
              </div>
            ))}
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
  // Two games currently live (started at 12:30 UTC)
  {
    id: 'austria-salzburg-vs-hertha-wels',
    homeTeam: { id: 'austria-salzburg', name: 'Austria Salzburg', shortName: 'AUS' },
    awayTeam: { id: 'hertha-wels', name: 'Hertha Wels', shortName: 'HER' },
    league: { id: 'ÖBL2', name: 'Österreichische 2. Liga', country: 'Austria' },
    kickoffTime: '2025-10-04T12:30:00Z', // Started 67 minutes ago - LIVE
    status: 'LIVE',
    round: '12. Spieltag'
  },
  {
    id: 'austria-lustenau-vs-austria-vienna-ii',
    homeTeam: { id: 'austria-lustenau', name: 'Austria Lustenau', shortName: 'LUS' },
    awayTeam: { id: 'austria-vienna-ii', name: 'Austria Vienna II', shortName: 'AV2' },
    league: { id: 'ÖBL2', name: 'Österreichische 2. Liga', country: 'Austria' },
    kickoffTime: '2025-10-04T12:30:00Z', // Started 67 minutes ago - LIVE
    status: 'LIVE',
    round: '12. Spieltag'
  },
  {
    id: 'sturm-graz-ii-vs-sw-bregenz',
    homeTeam: { id: 'sturm-graz-ii', name: 'Sturm Graz II', shortName: 'STU2' },
    awayTeam: { id: 'sw-bregenz', name: 'SW Bregenz', shortName: 'BRE' },
    league: { id: 'ÖBL2', name: 'Österreichische 2. Liga', country: 'Austria' },
    kickoffTime: '2025-10-04T18:00:00Z',
    status: 'SCHEDULED',
    round: '12. Spieltag'
  },
  {
    id: 'rapid-vienna-ii-vs-kapfenberger-sv',
    homeTeam: { id: 'rapid-vienna-ii', name: 'Rapid Vienna II', shortName: 'RAP2' },
    awayTeam: { id: 'kapfenberger-sv', name: 'Kapfenberger SV', shortName: 'KAP' },
    league: { id: 'ÖBL2', name: 'Österreichische 2. Liga', country: 'Austria' },
    kickoffTime: '2025-10-04T18:00:00Z',
    status: 'SCHEDULED',
    round: '12. Spieltag'
  },
  {
    id: 'austria-klagenfurt-vs-st-polten',
    homeTeam: { id: 'austria-klagenfurt', name: 'Austria Klagenfurt', shortName: 'AKA' },
    awayTeam: { id: 'st-polten', name: 'St Polten', shortName: 'STP' },
    league: { id: 'ÖBL2', name: 'Österreichische 2. Liga', country: 'Austria' },
    kickoffTime: '2025-10-05T08:30:00Z',
    status: 'SCHEDULED',
    round: '12. Spieltag'
  }
].map(match => ({
  ...match,
  status: getMatchStatus(match.kickoffTime)
})).filter(match => match.status !== 'FINISHED') // Only show live and upcoming matches
