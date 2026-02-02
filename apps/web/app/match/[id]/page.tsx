'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const fetchMatchDetails = async (id: string) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${id}`)
  if (!response.ok) throw new Error('Failed to fetch match details')
  return response.json()
}

export default function MatchDetailPage() {
  const params = useParams()
  const matchId = params?.id as string

  const { data: matchData, isLoading, error } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => fetchMatchDetails(matchId),
    enabled: !!matchId,
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Lade Spiel-Details...</div>
      </div>
    )
  }

  if (error || !matchData?.success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          Fehler beim Laden der Spiel-Details. Bitte versuchen Sie es später erneut.
        </div>
      </div>
    )
  }

  const match = matchData.data
  const kickoffDate = new Date(match.kickoffTime)
  const isFinished = match.status === 'FINISHED'
  const isLive = match.status === 'LIVE' || match.status === 'IN_PLAY'

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Navigation */}
      <Link 
        href="/" 
        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Zurück zur Übersicht</span>
      </Link>

      {/* Match Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">{match.league.name}</span>
            {isLive && (
              <span className="inline-flex items-center px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
                LIVE
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {format(kickoffDate, 'dd.MM.yyyy HH:mm')} Uhr
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-gray-600">
                {match.homeTeam.shortName?.[0] || match.homeTeam.name[0]}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold">{match.homeTeam.name}</h1>
            </div>
          </div>

          <div className="text-center px-6">
            {isFinished ? (
              <div className="text-3xl font-bold">
                {match.homeScore} - {match.awayScore}
              </div>
            ) : (
              <div className="text-3xl font-bold text-gray-400">vs</div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <h1 className="text-xl font-bold">{match.awayTeam.name}</h1>
            </div>
            <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-gray-600">
                {match.awayTeam.shortName?.[0] || match.awayTeam.name[0]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Odds Tables */}
      <div className="space-y-6">
        {/* 1X2 Odds */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">1X2 Wetten</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4">Buchmacher</th>
                  <th className="text-center py-2 px-4">1</th>
                  <th className="text-center py-2 px-4">X</th>
                  <th className="text-center py-2 px-4">2</th>
                </tr>
              </thead>
              <tbody>
                {match.odds?.oneXTwo?.map((odd: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 pr-4">
                      <div className="flex items-center space-x-2">
                        <span className="capitalize font-medium">
                          {odd.bookmaker.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">
                        {odd.home}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="bg-gray-50 text-gray-700 px-2 py-1 rounded font-medium">
                        {odd.draw}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="bg-red-50 text-red-700 px-2 py-1 rounded font-medium">
                        {odd.away}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Both Teams to Score */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Beide Teams treffen</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4">Buchmacher</th>
                  <th className="text-center py-2 px-4">Ja</th>
                  <th className="text-center py-2 px-4">Nein</th>
                </tr>
              </thead>
              <tbody>
                {match.odds?.bothTeamsScore?.map((odd: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 pr-4">
                      <span className="capitalize font-medium">
                        {odd.bookmaker.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded font-medium">
                        {odd.yes}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="bg-red-50 text-red-700 px-2 py-1 rounded font-medium">
                        {odd.no}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Over/Under 2.5 Goals */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Über/Unter 2,5 Tore</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4">Buchmacher</th>
                  <th className="text-center py-2 px-4">Über 2,5</th>
                  <th className="text-center py-2 px-4">Unter 2,5</th>
                </tr>
              </thead>
              <tbody>
                {match.odds?.overUnder25?.map((odd: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 pr-4">
                      <span className="capitalize font-medium">
                        {odd.bookmaker.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded font-medium">
                        {odd.over}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">
                        {odd.under}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}