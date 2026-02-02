import Image from 'next/image'

interface LeagueHeaderProps {
  leagueName: string
  logoPath: string
  logoAlt: string
  subtitle?: string
  backgroundColor?: string
}

export function LeagueHeader({ 
  leagueName, 
  logoPath, 
  logoAlt, 
  subtitle,
  backgroundColor = 'bg-red-900' 
}: LeagueHeaderProps) {
  return (
    <div className={`${backgroundColor} text-white rounded-lg mb-6 overflow-hidden shadow-2xl border-2 border-gray-700`}>
      <div className="px-6 py-4 flex items-center space-x-4">
        <Image
          src={logoPath}
          alt={logoAlt}
          width={48}
          height={48}
          className="object-contain"
          onError={(e) => {
            // Fallback for missing logos
            (e.target as HTMLImageElement).src = '/assets/logos/leagues/default.svg'
          }}
        />
        <div>
          <h1 className="text-2xl font-bold">{leagueName}</h1>
          {subtitle && (
            <p className="text-red-200 text-sm">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}