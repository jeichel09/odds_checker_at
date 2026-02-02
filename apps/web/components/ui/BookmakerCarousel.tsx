'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface BannerData {
  id: string
  bookmaker: string
  logo: string
  backgroundColor: string
  title: string
  subtitle: string
  ctaText: string
  link: string
}

const banners: BannerData[] = [
  {
    id: '1',
    bookmaker: 'bet365',
    logo: '/assets/logos/bookmakers/bet365.svg',
    backgroundColor: '#017B5B',
    title: 'bet365',
    subtitle: 'Jetzt registrieren',
    ctaText: 'Bonus sichern',
    link: 'https://www.bet365.com'
  },
  {
    id: '2',
    bookmaker: 'bwin',
    logo: '/assets/logos/bookmakers/bwin.svg',
    backgroundColor: '#FF6B00',
    title: 'bwin',
    subtitle: '100€ Willkommensbonus',
    ctaText: 'Mehr erfahren',
    link: 'https://www.bwin.com'
  },
  {
    id: '3',
    bookmaker: 'tipico',
    logo: '/assets/logos/bookmakers/tipico.svg',
    backgroundColor: '#E20613',
    title: 'Tipico',
    subtitle: 'Die beste App',
    ctaText: 'Jetzt spielen',
    link: 'https://www.tipico.at'
  },
  {
    id: '4',
    bookmaker: 'interwetten',
    logo: '/assets/logos/bookmakers/Interwetten.svg',
    backgroundColor: '#FFD200',
    title: 'Interwetten',
    subtitle: 'Top Quoten',
    ctaText: 'Entdecken',
    link: 'https://www.interwetten.com'
  },
  {
    id: '5',
    bookmaker: 'admiral',
    logo: '/assets/logos/bookmakers/Admiral.png',
    backgroundColor: '#1E3A8A',
    title: 'Admiral',
    subtitle: 'Österreichs Favorit',
    ctaText: 'Mehr Info',
    link: 'https://www.admiral.at'
  },
  {
    id: '6',
    bookmaker: 'win2day',
    logo: '/assets/logos/bookmakers/win2day.svg',
    backgroundColor: '#DC2626',
    title: 'win2day',
    subtitle: 'Staatlich lizenziert',
    ctaText: 'Jetzt wetten',
    link: 'https://www.win2day.at'
  }
]

export function BookmakerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const scrollLeft = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const scrollRight = () => {
    const visibleCount = isMobile ? 1 : 3 // 1 on mobile, 3 on desktop
    const maxIndex = banners.length - visibleCount
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))
  }

  const visibleCount = isMobile ? 1 : 3
  const canScrollLeft = currentIndex > 0
  const canScrollRight = currentIndex < banners.length - visibleCount

  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        <div className="relative">
          {/* Scroll Left Button */}
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center ${
              canScrollLeft 
                ? 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-xl' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Carousel Container */}
          <div className="mx-4 md:mx-12 overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-out gap-4"
              style={{
                transform: `translateX(-${currentIndex * (350 + 16)}px)` // 350px width + 16px gap
              }}
            >
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="flex-shrink-0 w-[350px] h-[175px] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                  style={{ backgroundColor: banner.backgroundColor }}
                  onClick={() => window.open(banner.link, '_blank')}
                >
                  <div className="relative w-full h-full flex items-center justify-between p-6 text-white">
                    {/* Content Side */}
                    <div className="flex-1 z-10">
                      <h3 className="text-xl font-bold mb-1 text-white">
                        {banner.title}
                      </h3>
                      <p className="text-sm opacity-90 mb-3">
                        {banner.subtitle}
                      </p>
                      <div className="inline-block bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-medium transition-colors">
                        {banner.ctaText}
                      </div>
                    </div>

                    {/* Logo Side */}
                    <div className="flex-shrink-0 ml-4">
                      <div className="w-20 h-20 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <div className="w-16 h-16 relative">
                          <Image
                            src={banner.logo}
                            alt={`${banner.bookmaker} Logo`}
                            fill
                            className="object-contain"
                            style={{
                              filter: banner.bookmaker === 'bet365' ? 'brightness(0) invert(1)' : 'none'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20"></div>
                      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll Right Button */}
          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center ${
              canScrollRight 
                ? 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-xl' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: Math.max(1, banners.length - (isMobile ? 0 : 2)) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-blue-600 w-6' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}