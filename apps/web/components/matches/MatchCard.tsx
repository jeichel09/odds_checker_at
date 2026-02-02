import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import { NormalizedMatch } from '@/lib/match-normalizer'

interface BestOdds {
  home: { odd: number; bookmaker: string }
  draw: { odd: number; bookmaker: string }
  away: { odd: number; bookmaker: string }
}

interface MatchCardProps {
  match: NormalizedMatch
  bestOdds?: BestOdds
}

// League logo mapping
const getLeagueLogo = (leagueId: string) => {
  const logoMap: { [key: string]: string } = {
    // Austrian Leagues
    '1': '/assets/logos/leagues/oe-bl.svg',
    'ÖBL1': '/assets/logos/leagues/oe-bl.svg',
    'ÖBL2': '/assets/logos/leagues/oe2.svg',
    // German Leagues  
    'BL1': '/assets/logos/leagues/bundesliga.svg',
    'DE1': '/assets/logos/leagues/bundesliga.svg',
    'DE2': '/assets/logos/leagues/2bundesliga.svg',
    // English Leagues
    'PL': '/assets/logos/leagues/epl.svg',
    'EPL': '/assets/logos/leagues/epl.svg',
    // Spanish Leagues
    'PD': '/assets/logos/leagues/laliga.svg',
    // Italian Leagues
    'SA': '/assets/logos/leagues/seriea.svg',
    // French Leagues
    'FL1': '/assets/logos/leagues/ligue1.webp',
  }
  return logoMap[leagueId] || '/assets/logos/leagues/oe-bl.svg'
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

export function MatchCard({ match, bestOdds }: MatchCardProps) {
  const kickoffDate = new Date(match.kickoffTime)
  const isFinished = match.status === 'FINISHED'
  const isLive = match.status === 'LIVE'
  const shouldShowLive = isLive
  
  // Use bestOdds from match if available, otherwise use prop, otherwise use mock
  const effectiveBestOdds: BestOdds = match.bestOdds || bestOdds || {
    home: { odd: 2.15, bookmaker: 'bet365' },
    draw: { odd: 3.25, bookmaker: 'bwin' },
    away: { odd: 3.05, bookmaker: 'tipico' }
  }


  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex">
        {/* Left Section - League Info & Match Details */}
        <div className="flex-[2]">
          {/* League Header - Maroon Background */}
          <div className="bg-red-900 text-white px-4 py-2 flex items-center space-x-3">
            <Image
              src={getLeagueLogo(match.league?.id || 'UNKNOWN')}
              alt={match.league?.name || 'Unknown League'}
              width={24}
              height={24}
              className="object-contain"
              onError={(e) => {
                // Fallback to a default league logo on error
                e.currentTarget.src = '/assets/logos/leagues/oe-bl.svg'
              }}
            />
            <span className="font-semibold text-sm">{match.league?.name || 'Unknown League'}</span>
          </div>

          {/* Match Info */}
          <div className="p-4">
            {/* Teams */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center space-x-3">
                {match.homeTeam.logoUrl ? (
                  <img 
                    src={match.homeTeam.logoUrl} 
                    alt={match.homeTeam.name} 
                    className="h-6 w-6 object-contain"
                  />
                ) : (
                  <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600">
                      {match.homeTeam.shortName?.[0] || match.homeTeam.name[0]}
                    </span>
                  </div>
                )}
                <span className="font-medium">{match.homeTeam.name}</span>
              </div>
              <div className="flex items-center space-x-3">
                {match.awayTeam.logoUrl ? (
                  <img 
                    src={match.awayTeam.logoUrl} 
                    alt={match.awayTeam.name} 
                    className="h-6 w-6 object-contain"
                  />
                ) : (
                  <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600">
                      {match.awayTeam.shortName?.[0] || match.awayTeam.name[0]}
                    </span>
                  </div>
                )}
                <span className="font-medium">{match.awayTeam.name}</span>
              </div>
            </div>

            {/* Time/Date or LIVE Status */}
            <div className="text-sm text-gray-600">
              {shouldShowLive ? (
                <span className="inline-flex items-center px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
                  LIVE
                </span>
              ) : (
                <div>
                  <div>{format(kickoffDate, 'dd.MM.yyyy')}</div>
                  <div>{format(kickoffDate, 'HH:mm')} Uhr</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Best Odds */}
        <div className="flex-[1] bg-gray-50 border-l border-gray-200">
          <div className="p-4">
            <div className="text-xs text-gray-500 mb-3 font-medium">Beste Quoten</div>
            
            {/* Odds Grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {/* Home Odds */}
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">1</div>
                <div className="bg-white border border-gray-200 rounded p-2 flex items-center justify-center h-10">
                  <div className="font-bold text-base">{effectiveBestOdds.home.odd.toFixed(2)}</div>
                </div>
                <div className={`mt-1 ${getBookmakerBackground(effectiveBestOdds.home.bookmaker)} rounded p-1 flex items-center justify-center h-10`}>
                  <Image
                    src={getBookmakerLogo(effectiveBestOdds.home.bookmaker)}
                    alt={effectiveBestOdds.home.bookmaker}
                    width={60}
                    height={32}
                    className="object-contain w-full h-full max-w-full max-h-full"
                  />
                </div>
              </div>

              {/* Draw Odds */}
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">X</div>
                <div className="bg-white border border-gray-200 rounded p-2 flex items-center justify-center h-10">
                  <div className="font-bold text-base">{effectiveBestOdds.draw.odd.toFixed(2)}</div>
                </div>
                <div className={`mt-1 ${getBookmakerBackground(effectiveBestOdds.draw.bookmaker)} rounded p-1 flex items-center justify-center h-10`}>
                  <Image
                    src={getBookmakerLogo(effectiveBestOdds.draw.bookmaker)}
                    alt={effectiveBestOdds.draw.bookmaker}
                    width={60}
                    height={32}
                    className="object-contain w-full h-full max-w-full max-h-full"
                  />
                </div>
              </div>

              {/* Away Odds */}
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">2</div>
                <div className="bg-white border border-gray-200 rounded p-2 flex items-center justify-center h-10">
                  <div className="font-bold text-base">{effectiveBestOdds.away.odd.toFixed(2)}</div>
                </div>
                <div className={`mt-1 ${getBookmakerBackground(effectiveBestOdds.away.bookmaker)} rounded p-1 flex items-center justify-center h-10`}>
                  <Image
                    src={getBookmakerLogo(effectiveBestOdds.away.bookmaker)}
                    alt={effectiveBestOdds.away.bookmaker}
                    width={60}
                    height={32}
                    className="object-contain w-full h-full max-w-full max-h-full"
                  />
                </div>
              </div>
            </div>

            {/* Separator Line */}
            <div className="border-t border-gray-300 my-3"></div>

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
