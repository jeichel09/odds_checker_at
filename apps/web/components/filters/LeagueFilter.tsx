'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Filter } from 'lucide-react'

const fetchLeagues = async () => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues`)
  if (!response.ok) throw new Error('Failed to fetch leagues')
  return response.json()
}

export function LeagueFilter() {
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null)

  const { data: leaguesData } = useQuery({
    queryKey: ['leagues'],
    queryFn: fetchLeagues,
  })

  const leagues = leaguesData?.data || []

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Liga:</span>
      </div>
      
      <Button
        variant={selectedLeague === null ? 'default' : 'outline'}
        size="sm"
        onClick={() => setSelectedLeague(null)}
      >
        Alle
      </Button>
      
      {leagues.map((league: any) => (
        <Button
          key={league.id}
          variant={selectedLeague === league.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedLeague(league.id)}
        >
          {league.name}
        </Button>
      ))}
    </div>
  )
}