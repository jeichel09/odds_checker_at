'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { formatOdds, findBestOdds, cn } from '@/lib/utils'
import { getBookmakerLogo, assetMetadata } from '@/lib/assets'
import { Button } from '@/components/ui/Button'
import { ExternalLink, Star } from 'lucide-react'

interface Bookmaker {
  id: string
  name: string
  displayName: string
  logoUrl?: string
  websiteUrl?: string
}

interface OddsTableProps {
  matchId: string
  bookmakers: Bookmaker[]
}

type MarketType = 'ONE_X_TWO' | 'BOTH_TEAMS_SCORE' | 'OVER_UNDER_25'

const fetchMatchOdds = async (matchId: string, market: MarketType) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/odds/compare/${matchId}?market=${market}`)
  if (!response.ok) throw new Error('Failed to fetch odds')
  return response.json()
}

// Bookmaker-specific background colors
const getBookmakerBackground = (bookmakerName: string): string => {
  const backgrounds: Record<string, string> = {
    'win2day': '#000000',
    'tipp3': '#006127',
    'bet365': '#017B5B',
    'bwin': '#000000',
    'interwetten': '#FFD202',
    'tipico': '#C8102E',
    'betway': '#272728',
    'admiral': '#002352',
    'neo_bet': '#000000',  // Add exact backend name
    'neo-bet': '#000000',
    'neo.bet': '#000000',
    'neobet': '#000000',
    'tipwin': 'transparent',
    'mozzart': '#0E1C42',
    'merkur_bets': '#022652',  // Add exact backend name
    'merkur-bets': '#022652',
    'merkur': '#022652',
    'merkurbets': '#022652',
    'rabona': '#D40035',
    'bet_at_home': 'transparent',  // Add exact backend name
    'bet-at-home': 'transparent',
    'betathome': 'transparent',
    'lottoland': 'transparent',
  }
  
  
  const normalizedName = bookmakerName.toLowerCase().replace(/[^a-z0-9]/g, '-')
  return backgrounds[bookmakerName.toLowerCase()] || backgrounds[normalizedName] || 'transparent'
}

export function OddsTable({ matchId, bookmakers }: OddsTableProps) {
  const [selectedMarket, setSelectedMarket] = useState<MarketType>('ONE_X_TWO')

  const { data: oddsData, isLoading } = useQuery({
    queryKey: ['match-odds', matchId, selectedMarket],
    queryFn: () => fetchMatchOdds(matchId, selectedMarket),
    enabled: !!matchId,
  })

  const markets = [
    { id: 'ONE_X_TWO', label: '1X2', description: 'Sieg/Unentschieden/Niederlage' },
    { id: 'BOTH_TEAMS_SCORE', label: 'BTS', description: 'Beide Teams treffen' },
    { id: 'OVER_UNDER_25', label: 'Ü/U 2.5', description: 'Über/Unter 2.5 Tore' },
  ] as const

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-8 bg-muted rounded" />
        <div className="animate-pulse h-32 bg-muted rounded" />
      </div>
    )
  }

  const odds = oddsData?.data
  const bestOdds = odds?.bestOdds

  const getBestOddsClass = (bookmakerName: string, outcome: string, value: number) => {
    if (!bestOdds) return ''
    
    const bestValue = bestOdds[outcome as keyof typeof bestOdds]?.value
    if (bestValue && Math.abs(value - bestValue) < 0.01) {
      return 'best-odds'
    }
    return ''
  }

  return (
    <div className="space-y-6">
      {/* Market Selector */}
      <div className="border-b">
        <div className="flex space-x-1">
          {markets.map((market) => (
            <Button
              key={market.id}
              variant={selectedMarket === market.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedMarket(market.id as MarketType)}
              className="rounded-b-none"
            >
              {market.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Odds Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-center py-3 px-4 font-medium">Anbieter</th>
              {selectedMarket === 'ONE_X_TWO' ? (
                <>
                  <th className="text-center py-3 px-4 font-medium">1</th>
                  <th className="text-center py-3 px-4 font-medium">X</th>
                  <th className="text-center py-3 px-4 font-medium">2</th>
                </>
              ) : selectedMarket === 'BOTH_TEAMS_SCORE' ? (
                <>
                  <th className="text-center py-3 px-4 font-medium">Ja</th>
                  <th className="text-center py-3 px-4 font-medium">Nein</th>
                </>
              ) : (
                <>
                  <th className="text-center py-3 px-4 font-medium">Über 2.5</th>
                  <th className="text-center py-3 px-4 font-medium">Unter 2.5</th>
                </>
              )}
              <th className="text-center py-3 px-4 font-medium">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {odds?.bookmakers?.map((bookmaker: any) => (
              <tr key={bookmaker.id} className="border-b hover:bg-muted/50">
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center">
                    <div 
                      className="flex-shrink-0 w-20 h-10 flex items-center justify-center rounded-md border border-gray-200"
                      style={{
                        backgroundColor: getBookmakerBackground(bookmaker.name),
                      }}
                    >
                      <Image 
                        src={getBookmakerLogo(bookmaker.name)} 
                        alt={`${bookmaker.displayName} Logo`}
                        width={70}
                        height={35}
                        className="object-contain max-w-full max-h-full"
                        priority={false}
                        unoptimized={true} // Better for SVGs and PNGs
                      />
                    </div>
                  </div>
                </td>
                {/* Market-specific odds columns */}
                {selectedMarket === 'ONE_X_TWO' && (
                  <>
                    <td className="text-center py-3 px-4">
                      <div className={cn(
                        "inline-block px-3 py-2 rounded border odds-cell",
                        getBestOddsClass(bookmaker.name, 'home', bookmaker.odds.home)
                      )}>
                        {formatOdds(bookmaker.odds.home)}
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className={cn(
                        "inline-block px-3 py-2 rounded border odds-cell",
                        getBestOddsClass(bookmaker.name, 'draw', bookmaker.odds.draw)
                      )}>
                        {formatOdds(bookmaker.odds.draw)}
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className={cn(
                        "inline-block px-3 py-2 rounded border odds-cell",
                        getBestOddsClass(bookmaker.name, 'away', bookmaker.odds.away)
                      )}>
                        {formatOdds(bookmaker.odds.away)}
                      </div>
                    </td>
                  </>
                )}
                <td className="text-center py-3 px-4">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      const bookmakerData = bookmakers.find(b => b.name === bookmaker.name)
                      if (bookmakerData?.websiteUrl) {
                        window.open(bookmakerData.websiteUrl, '_blank', 'noopener,noreferrer')
                      }
                    }}
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Wetten
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Best Odds Summary */}
      {bestOdds && (
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="font-semibold text-sm">Beste Quoten</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {Object.entries(bestOdds).map(([outcome, data]: [string, any]) => {
              const outcomeLabels: Record<string, string> = {
                home: '1 (Heim)',
                draw: 'X (Unentschieden)', 
                away: '2 (Auswärts)',
                yes: 'Ja',
                no: 'Nein',
                over: 'Über 2.5',
                under: 'Unter 2.5'
              }
              return (
                <div key={outcome} className="flex justify-between">
                  <span className="text-muted-foreground">{outcomeLabels[outcome]}:</span>
                  <div className="font-semibold">
                    <span className="text-best-odds">{formatOdds(data.value)}</span>
                    <span className="text-xs text-muted-foreground ml-1">({data.bookmaker})</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
