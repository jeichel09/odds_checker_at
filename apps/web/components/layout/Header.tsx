'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Search, Menu } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LeagueDropdown } from '@/components/ui/LeagueDropdown'
import { mainLogo } from '@/lib/assets'

export function Header() {
  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b bg-[#FFBD59] backdrop-blur supports-[backdrop-filter]:bg-[#FFBD59]/95">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center -ml-4">
            <Image
              src={mainLogo}
              alt="Wettquoten24 Logo"
              width={200}
              height={50}
              className="object-contain"
              priority
            />
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/bookmakers"
              className="transition-colors hover:text-black/80 text-black/70 font-semibold"
            >
              Buchmacher
            </Link>
            <Link
              href="/bonuses"
              className="transition-colors hover:text-black/80 text-black/70 font-semibold text-black/50"
              title="Kommt bald"
            >
              Boni
            </Link>
            <Link
              href="/insights"
              className="transition-colors hover:text-black/80 text-black/70 font-semibold text-black/50"
              title="Kommt bald"
            >
              Einblicke
            </Link>
            <Link
              href="/safe-betting"
              className="transition-colors hover:text-black/80 text-black/70 font-semibold text-black/50"
              title="Kommt bald"
            >
              Sicheres Wetten
            </Link>
          </nav>
        </div>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-black/10 focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden text-black"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <div className="flex items-center md:hidden">
          <Link href="/" className="flex items-center -ml-2">
            <Image
              src={mainLogo}
              alt="Wettquoten24 Logo"
              width={150}
              height={38}
              className="object-contain"
              priority
            />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-600" />
              <Input
                placeholder="Suchen..."
                className="pl-8 md:w-[300px] lg:w-[400px]"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
    
    {/* Sports Sub-Header */}
    <div className="sticky top-16 z-40 w-full border-b bg-gray-100/80 backdrop-blur supports-[backdrop-filter]:bg-gray-100/90 overflow-visible">
      <div className="container flex h-12 items-center overflow-visible">
        <nav className="flex items-center space-x-4 sm:space-x-6 md:space-x-8 text-sm font-medium">
          <LeagueDropdown
            className="transition-colors hover:text-blue-600 text-gray-700 font-medium whitespace-nowrap"
          />
          <Link
            href="/ice-hockey"
            className="transition-colors hover:text-blue-600 text-gray-500 font-medium whitespace-nowrap flex items-center gap-2"
            title="Kommt bald"
          >
            <span>🏒</span>
            <span className="hidden sm:inline">Eishockey</span>
            <span className="sm:hidden">Eishockey</span>
          </Link>
          <Link
            href="/basketball"
            className="transition-colors hover:text-blue-600 text-gray-500 font-medium whitespace-nowrap flex items-center gap-2"
            title="Kommt bald"
          >
            <span>🏀</span>
            <span className="hidden sm:inline">Basketball</span>
            <span className="sm:hidden">Basketball</span>
          </Link>
        </nav>
      </div>
    </div>
  </>
  )
}
