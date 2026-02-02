import { NextResponse } from 'next/server'

export async function GET() {
  const bookmakers = [
    {
      id: 'win2day',
      name: 'win2day',
      displayName: 'win2day',
      country: 'Austria',
      isActive: true,
      logoUrl: '/assets/logos/bookmakers/win2day.svg'
    },
    {
      id: 'tipp3',
      name: 'tipp3',
      displayName: 'tipp3',
      country: 'Austria',
      isActive: true,
      logoUrl: '/assets/logos/bookmakers/tipp3.svg'
    },
    {
      id: 'bet365',
      name: 'bet365',
      displayName: 'bet365',
      country: 'International',
      isActive: true,
      logoUrl: '/assets/logos/bookmakers/bet365.svg'
    },
    {
      id: 'bwin',
      name: 'bwin',
      displayName: 'bwin',
      country: 'International',
      isActive: true,
      logoUrl: '/assets/logos/bookmakers/bwin.svg'
    },
    {
      id: 'interwetten',
      name: 'interwetten',
      displayName: 'Interwetten',
      country: 'Austria',
      isActive: true,
      logoUrl: '/assets/logos/bookmakers/interwetten.svg'
    },
    {
      id: 'tipico',
      name: 'tipico',
      displayName: 'Tipico',
      country: 'International',
      isActive: true,
      logoUrl: '/assets/logos/bookmakers/tipico.svg'
    },
    {
      id: 'admiral',
      name: 'admiral',
      displayName: 'Admiral',
      country: 'Austria',
      isActive: true,
      logoUrl: '/assets/logos/bookmakers/Admiral.png'
    }
  ]

  return NextResponse.json({
    success: true,
    bookmakers,
    meta: {
      total: bookmakers.length,
      activeCount: bookmakers.filter(b => b.isActive).length,
      source: 'Static Data'
    }
  })
}