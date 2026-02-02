'use client'

import { useQuery } from '@tanstack/react-query'
import { MatchCard } from '@/components/matches/MatchCard'
import { OddsTable } from '@/components/odds/OddsTable'
import { BookmakerCarousel } from '@/components/ui/BookmakerCarousel'

const fetchMatches = async () => {
  try {
    // Fetch matches from multiple league endpoints in parallel
    const [austrianBL, austrian2L, germanBL, german2BL, premierLeague] = await Promise.allSettled([
      fetch('/api/matches?league=öbl1').then(res => res.ok ? res.json() : { matches: [] }),
      fetch('/api/matches?league=oe2').then(res => res.ok ? res.json() : { matches: [] }),
      fetch('/api/matches/bundesliga').then(res => res.ok ? res.json() : { matches: [] }),
      fetch('/api/matches/2bundesliga').then(res => res.ok ? res.json() : { matches: [] }),
      fetch('/api/matches/premier-league').then(res => res.ok ? res.json() : { matches: [] })
    ])
    
    // Combine all matches from successful requests
    const allMatches = []
    const sources = ['Austrian Bundesliga', 'Austrian 2. Liga', 'German Bundesliga', 'German 2. Bundesliga', 'Premier League']
    
    ;[austrianBL, austrian2L, germanBL, german2BL, premierLeague].forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value?.matches) {
        // Transform matches to ensure consistent structure for MatchCard component
        const transformedMatches = result.value.matches.map((match: any) => ({
          ...match,
          // Ensure league property exists with proper structure
          league: match.league || {
            id: sources[index].includes('Austrian Bundesliga') ? 'ÖBL1' :
                sources[index].includes('Austrian 2. Liga') ? 'ÖBL2' :
                sources[index].includes('German Bundesliga') ? 'DE1' :
                sources[index].includes('German 2. Bundesliga') ? 'DE2' :
                sources[index].includes('Premier League') ? 'EPL' : 'UNKNOWN',
            name: sources[index],
            country: sources[index].includes('Austrian') ? 'Austria' :
                     sources[index].includes('German') ? 'Germany' :
                     sources[index].includes('Premier') ? 'England' : 'Unknown'
          },
          // Ensure teams have proper structure
          homeTeam: {
            id: match.homeTeam?.id || match.home?.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
            name: match.homeTeam?.name || match.home?.name || 'Unknown Team',
            shortName: match.homeTeam?.shortName || match.home?.shortName || 'UNK',
            logoUrl: match.homeTeam?.logoUrl || null
          },
          awayTeam: {
            id: match.awayTeam?.id || match.away?.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
            name: match.awayTeam?.name || match.away?.name || 'Unknown Team',
            shortName: match.awayTeam?.shortName || match.away?.shortName || 'UNK',
            logoUrl: match.awayTeam?.logoUrl || null
          },
          // Ensure other required properties
          kickoffTime: match.kickoffTime || match.status?.utcTime || new Date().toISOString(),
          status: match.status || match.displayStatus || 'SCHEDULED',
          homeScore: match.homeScore || match.home?.score || null,
          awayScore: match.awayScore || match.away?.score || null
        }))
        
        allMatches.push(...transformedMatches)
        console.log(`✅ Fetched ${transformedMatches.length} matches from ${sources[index]}`)
      } else {
        console.warn(`❌ Failed to fetch matches from ${sources[index]}:`, result.status === 'rejected' ? result.reason : 'No matches')
      }
    })
    
    // Sort matches by kickoff time, with LIVE matches first
    const sortedMatches = allMatches.sort((a, b) => {
      if (a.status === 'LIVE' && b.status !== 'LIVE') return -1
      if (a.status !== 'LIVE' && b.status === 'LIVE') return 1
      return new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime()
    })
    
    console.log(`🏠 Home page: Combined ${sortedMatches.length} matches from all leagues`)
    
    return {
      matches: sortedMatches,
      meta: {
        total: sortedMatches.length,
        sources: sources.length,
        liveMatches: sortedMatches.filter(m => m.status === 'LIVE').length
      }
    }
  } catch (error) {
    console.error('Error fetching matches for home page:', error)
    throw error
  }
}

const fetchBookmakers = async () => {
  const response = await fetch('/api/bookmakers')
  if (!response.ok) throw new Error('Failed to fetch bookmakers')
  return response.json()
}

export default function HomePage() {
  const { data: matchesData, isLoading: matchesLoading, error: matchesError } = useQuery({
    queryKey: ['matches'],
    queryFn: fetchMatches,
  })

  const { data: bookmakersData } = useQuery({
    queryKey: ['bookmakers'],
    queryFn: fetchBookmakers,
  })

  if (matchesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Lade Spiele...</div>
      </div>
    )
  }

  if (matchesError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          Fehler beim Laden der Spiele. Bitte versuchen Sie es später erneut.
        </div>
      </div>
    )
  }

  const matches = matchesData?.matches || []
  
  // Ensure each match has the required structure for MatchCard
  const safeMatches = matches.map((match: any) => ({
    ...match,
    league: match.league || { id: 'UNKNOWN', name: 'Unknown League', country: 'Unknown' },
    homeTeam: match.homeTeam || { id: 'unknown', name: 'Unknown Team', shortName: 'UNK' },
    awayTeam: match.awayTeam || { id: 'unknown', name: 'Unknown Team', shortName: 'UNK' }
  }))
  const bookmakers = bookmakersData?.bookmakers || []

  return (
    <>
      {/* Bookmaker Carousel */}
      <BookmakerCarousel />
      
      <div className="container mx-auto px-4 py-8">
        {/* Main Content */}
        <div className="grid gap-8">
        {safeMatches.length > 0 ? (
          safeMatches.map((match: any) => (
            <div key={match.id} className="mb-6">
              <MatchCard match={match} bestOdds={match.bestOdds} />
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Keine Spiele gefunden</h3>
            <p className="text-muted-foreground">
              Es sind derzeit keine Spiele für heute verfügbar.
            </p>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="mt-12 premium-card rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 contrast-text">Überblick</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{safeMatches.length}</div>
            <div className="text-sm text-muted-foreground">Spiele gefunden</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{bookmakers.length}</div>
            <div className="text-sm text-muted-foreground">Österreichische Buchmacher</div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}