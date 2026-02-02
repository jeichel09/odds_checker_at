import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import Image from 'next/image'
import Link from 'next/link'

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

interface CompactMatchCardProps {
  match: Match
  bestOdds?: BestOdds
}

// Bookmaker logo mapping
const getBookmakerLogo = (bookmaker: string) => {
  const logoMap: { [key: string]: string } = {
    'win2day': '/assets/logos/bookmakers/win2day.svg',
    'tipp3': '/assets/logos/bookmakers/tipp3.svg',
    'bet365': '/assets/logos/bookmakers/bet365.svg',
    'bwin': '/assets/logos/bookmakers/bwin.svg',
    'interwetten': '/assets/logos/bookmakers/Interwetten.svg',
    'tipico': '/assets/logos/bookmakers/tipico.svg',
    'betway': '/assets/logos/bookmakers/betway.svg',
    'admiral': '/assets/logos/bookmakers/Admiral.png',
    'neo_bet': '/assets/logos/bookmakers/neo-bet.svg',
    'tipwin': '/assets/logos/bookmakers/tipwin.svg',
    'mozzart': '/assets/logos/bookmakers/mozzart.svg',
    'merkur_bets': '/assets/logos/bookmakers/merkur.svg',
    'rabona': '/assets/logos/bookmakers/rabona.svg',
    'bet_at_home': '/assets/logos/bookmakers/bet-at-home.svg',
    'lottoland': '/assets/logos/bookmakers/lottoland.svg',
  }
  return logoMap[bookmaker] || '/assets/logos/bookmakers/default.svg'
}

// Bookmaker background color mapping
const getBookmakerBackground = (bookmaker: string) => {
  const backgroundMap: { [key: string]: string } = {
    'win2day': 'bg-black',
    'tipp3': 'bg-[#006127]',
    'bet365': 'bg-[#005440]',
    'bwin': 'bg-black',
    'interwetten': 'bg-[#FFD200]',
    'tipico': 'bg-[#C8102E]',
    'betway': 'bg-[#272728]',
    'admiral': 'bg-[#002352]',
    'neo_bet': 'bg-black',
    'tipwin': 'bg-transparent',
    'mozzart': 'bg-[#0E1C42]',
    'merkur_bets': 'bg-[#022652]',
    'rabona': 'bg-[#D40035]',
    'bet_at_home': 'bg-transparent',
    'lottoland': 'bg-transparent',
  }
  return backgroundMap[bookmaker] || 'bg-white border border-gray-200'
}

export function CompactMatchCard({ match, bestOdds }: CompactMatchCardProps) {
  const kickoffDate = new Date(match.kickoffTime)
  const isFinished = match.status === 'FINISHED'
  const isLive = match.status === 'LIVE' || match.status === 'IN_PLAY'
  const now = new Date()
  const hasStarted = kickoffDate < now && !isFinished
  const shouldShowLive = isLive || hasStarted

  // Use real odds if provided, otherwise show fallback
  const displayOdds: BestOdds = bestOdds || {
    home: { odd: 2.15, bookmaker: 'bet365' },
    draw: { odd: 3.25, bookmaker: 'bwin' },
    away: { odd: 3.05, bookmaker: 'tipico' }
  }

  return (
    <div className="bg-white overflow-hidden hover:bg-gray-50 transition-all duration-300 hover:shadow-lg">
      <div className="flex">
        {/* Left Section - Match Details */}
        <div className="flex-[2] p-4">
          {/* Teams */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center space-x-3">
              {match.homeTeam.logoUrl ? (
                <img 
                  src={match.homeTeam.logoUrl} 
                  alt={match.homeTeam.name} 
                  className="h-5 w-5 object-contain"
                />
              ) : (
                <div className="h-5 w-5 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">
                    {match.homeTeam.shortName?.[0] || match.homeTeam.name[0]}
                  </span>
                </div>
              )}
              <span className="font-medium text-sm">{match.homeTeam.name}</span>
            </div>
            <div className="flex items-center space-x-3">
              {match.awayTeam.logoUrl ? (
                <img 
                  src={match.awayTeam.logoUrl} 
                  alt={match.awayTeam.name} 
                  className="h-5 w-5 object-contain"
                />
              ) : (
                <div className="h-5 w-5 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">
                    {match.awayTeam.shortName?.[0] || match.awayTeam.name[0]}
                  </span>
                </div>
              )}
              <span className="font-medium text-sm">{match.awayTeam.name}</span>
            </div>
          </div>

          {/* Time/Date or LIVE Status */}
          <div className="text-sm text-gray-600">
            {shouldShowLive ? (
              <span className="inline-flex items-center px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
                LIVE
              </span>
            ) : (
              <div className="text-xs">
                <div>{format(kickoffDate, 'dd.MMM yyyy - HH:mm', { locale: de })}</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Best Odds */}
        <div className="flex-[1] bg-gray-50 border-l-2 border-gray-300 shadow-inner hover:border-gray-400 transition-all duration-300">
          <div className="p-3">
            <div className="text-xs text-gray-500 mb-2 font-medium">Beste Quoten</div>
            
            {/* Odds Grid - More compact */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {/* Home Odds */}
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">1</div>
                <div className="bg-white border-2 border-gray-300 rounded px-1 py-2 flex items-center justify-center h-8 shadow-sm hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer">
                  <div className="font-bold text-sm">{displayOdds.home.odd.toFixed(2)}</div>
                </div>
                <div className={`mt-1 ${getBookmakerBackground(displayOdds.home.bookmaker)} rounded p-1 flex items-center justify-center h-8 hover:scale-105 transition-transform duration-200 cursor-pointer shadow-sm`}>
                  <Image
                    src={getBookmakerLogo(displayOdds.home.bookmaker)}
                    alt={displayOdds.home.bookmaker}
                    width={48}
                    height={24}
                    className="object-contain w-full h-full max-w-full max-h-full"
                  />
                </div>
              </div>

              {/* Draw Odds */}
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">X</div>
                <div className="bg-white border-2 border-gray-300 rounded px-1 py-2 flex items-center justify-center h-8 shadow-sm hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer">
                  <div className="font-bold text-sm">{displayOdds.draw.odd.toFixed(2)}</div>
                </div>
                <div className={`mt-1 ${getBookmakerBackground(displayOdds.draw.bookmaker)} rounded p-1 flex items-center justify-center h-8 hover:scale-105 transition-transform duration-200 cursor-pointer shadow-sm`}>
                  <Image
                    src={getBookmakerLogo(displayOdds.draw.bookmaker)}
                    alt={displayOdds.draw.bookmaker}
                    width={48}
                    height={24}
                    className="object-contain w-full h-full max-w-full max-h-full"
                  />
                </div>
              </div>

              {/* Away Odds */}
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">2</div>
                <div className="bg-white border-2 border-gray-300 rounded px-1 py-2 flex items-center justify-center h-8 shadow-sm hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer">
                  <div className="font-bold text-sm">{displayOdds.away.odd.toFixed(2)}</div>
                </div>
                <div className={`mt-1 ${getBookmakerBackground(displayOdds.away.bookmaker)} rounded p-1 flex items-center justify-center h-8 hover:scale-105 transition-transform duration-200 cursor-pointer shadow-sm`}>
                  <Image
                    src={getBookmakerLogo(displayOdds.away.bookmaker)}
                    alt={displayOdds.away.bookmaker}
                    width={48}
                    height={24}
                    className="object-contain w-full h-full max-w-full max-h-full"
                  />
                </div>
              </div>
            </div>

            {/* Separator Line */}
            <div className="border-t-2 border-gray-300 my-2 shadow-sm"></div>

            {/* See All Odds Link */}
            <Link 
              href={`/match/${match.id}`} 
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium block text-center"
            >
              Siehe alle Quoten →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}