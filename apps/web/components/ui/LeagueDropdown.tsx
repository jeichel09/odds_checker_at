'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'

interface League {
  id: string
  name: string
  logo: string
  country: string
  tier?: string
}

// League IDs now match the unified config IDs
const leagues: League[] = [
  // Austrian Leagues (First) - Active with data
  { id: 'oesterreichische-bundesliga', name: 'Österr. Bundesliga', logo: '/assets/logos/leagues/oe-bl.svg', country: 'Österreich', tier: '1' },
  { id: 'oesterreichische-2-liga', name: '2. Liga', logo: '/assets/logos/leagues/oe2.svg', country: 'Österreich', tier: '2' },
  
  // German Leagues - Active with data
  { id: 'deutsche-bundesliga', name: 'Bundesliga', logo: '/assets/logos/leagues/bundesliga.svg', country: 'Deutschland', tier: '1' },
  { id: 'deutsche-2-bundesliga', name: '2. Bundesliga', logo: '/assets/logos/leagues/2bundesliga.svg', country: 'Deutschland', tier: '2' },
  
  // English Leagues - Active with data
  { id: 'english-championship', name: 'Championship', logo: '/assets/logos/leagues/efl_championship.svg', country: 'England', tier: '2' },
  { id: 'english-league-one', name: 'League One', logo: '/assets/logos/leagues/efl_league1.svg', country: 'England', tier: '3' },
]

interface LeagueDropdownProps {
  className?: string
  mobileClassName?: string
}

export function LeagueDropdown({ className, mobileClassName }: LeagueDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Group leagues by country in the specified order
  const countryOrder = ['Österreich', 'Deutschland', 'England', 'Spanien', 'Italien', 'Frankreich', 'Europa']
  const groupedLeagues = leagues.reduce((groups, league) => {
    if (league.country === 'Europa' && league.tier === 'Cup') {
      groups['Europäische Pokale'] = groups['Europäische Pokale'] || []
      groups['Europäische Pokale'].push(league)
    } else {
      groups[league.country] = groups[league.country] || []
      groups[league.country].push(league)
    }
    return groups
  }, {} as Record<string, League[]>)
  
  // Sort the groups by the specified country order
  const sortedGroupEntries = Object.entries(groupedLeagues).sort(([a], [b]) => {
    const aIndex = countryOrder.indexOf(a === 'Europäische Pokale' ? 'Europa' : a)
    const bIndex = countryOrder.indexOf(b === 'Europäische Pokale' ? 'Europa' : b)
    return aIndex - bIndex
  })

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${className} flex items-center gap-2 group`}
        onMouseEnter={() => setIsOpen(true)}
      >
        <span>⚽</span>
        <span>Fußball</span>
        <ChevronDown 
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-10 md:hidden" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div 
            className="absolute top-full left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden transition-all duration-200 ease-out md:left-0 sm:-left-16"
            style={{
              zIndex: 9999
            }}
            onMouseLeave={() => setIsOpen(false)}
          >
            <div className="max-h-96 overflow-y-auto">
              <div className="p-3 bg-gray-50 border-b">
                <h3 className="font-semibold text-gray-800 text-sm">Ligen & Wettbewerbe</h3>
              </div>
              
              {sortedGroupEntries.map(([country, countryLeagues]) => (
                <div key={country} className="border-b border-gray-100 last:border-b-0">
                  <div className="p-2 bg-gray-50">
                    <h4 className="font-medium text-xs text-gray-600 uppercase tracking-wide">
                      {country}
                    </h4>
                  </div>
                  <div className="space-y-1 p-1">
                    {countryLeagues.map((league) => (
                      <Link
                        key={league.id}
                        href={`/football/${league.id}`}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className={`w-6 h-6 flex-shrink-0 relative group-hover:scale-110 transition-transform duration-200 rounded-sm ${
                          league.country === 'Frankreich' ? 'bg-gray-800 p-0.5' : ''
                        }`}>
                          <Image
                            src={league.logo}
                            alt={`${league.name} Logo`}
                            fill
                            className={`object-contain ${
                              league.country === 'Frankreich' ? 'scale-125' : ''
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 group-hover:text-blue-700">
                            {league.name}
                          </div>
                          {league.tier && (
                            <div className="flex items-center gap-1">
                              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                league.tier === 'Cup' ? 'bg-blue-100 text-blue-700' :
                                league.tier === '1' ? 'bg-green-100 text-green-700' :
                                league.tier === '2' ? 'bg-orange-100 text-orange-700' :
                                league.tier === '3' ? 'bg-purple-100 text-purple-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {league.tier === 'Cup' ? 'Pokal' : `${league.tier}. Liga`}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Footer */}
              <div className="p-3 bg-gray-50 border-t">
                <Link
                  href="/football"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Alle Ligen anzeigen →
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}