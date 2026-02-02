/**
 * Asset Management Utility
 * Centralized management of all static assets for the Austrian Sportwetten Quoten website
 */

// Base asset paths
const ASSETS_BASE = '/assets'
const LOGOS_BASE = `${ASSETS_BASE}/logos`
const BANNERS_BASE = `${ASSETS_BASE}/banners`
const ICONS_BASE = `${ASSETS_BASE}/icons`
const IMAGES_BASE = `${ASSETS_BASE}/images`

// Main website logo
export const mainLogo = `${LOGOS_BASE}/logo-main.png`

// Bookmaker asset paths
export const bookmakerAssets = {
  // Austrian State Operators
  win2day: `${LOGOS_BASE}/bookmakers/win2day.svg`,
  tipp3: `${LOGOS_BASE}/bookmakers/tipp3.svg`,
  
  // International with Austrian License
  bet365: `${LOGOS_BASE}/bookmakers/bet365.svg`,
  bwin: `${LOGOS_BASE}/bookmakers/bwin.svg`,
  interwetten: `${LOGOS_BASE}/bookmakers/interwetten.svg`,
  tipico: `${LOGOS_BASE}/bookmakers/tipico.svg`,
  betway: `${LOGOS_BASE}/bookmakers/betway.svg`,
  
  // Austrian/European Specialists
  admiral: `${LOGOS_BASE}/bookmakers/Admiral.png`,
  neo_bet: `${LOGOS_BASE}/bookmakers/neo-bet.svg`,
  tipwin: `${LOGOS_BASE}/bookmakers/tipwin.svg`,
  mozzart: `${LOGOS_BASE}/bookmakers/mozzart.svg`,
  merkur_bets: `${LOGOS_BASE}/bookmakers/merkur.svg`,
  rabona: `${LOGOS_BASE}/bookmakers/rabona.svg`,
  bet_at_home: `${LOGOS_BASE}/bookmakers/bet-at-home.svg`,
  lottoland: `${LOGOS_BASE}/bookmakers/lottoland.svg`,
} as const

// League asset paths
export const leagueAssets = {
  // Austrian Leagues
  austrian_bundesliga: `${LOGOS_BASE}/leagues/austrian-bundesliga.svg`,
  austrian_2_liga: `${LOGOS_BASE}/leagues/austrian-2-liga.svg`,
  
  // International Leagues
  premier_league: `${LOGOS_BASE}/leagues/premier-league.svg`,
  bundesliga: `${LOGOS_BASE}/leagues/bundesliga.svg`,
  serie_a: `${LOGOS_BASE}/leagues/serie-a.svg`,
  la_liga: `${LOGOS_BASE}/leagues/la-liga.svg`,
  champions_league: `${LOGOS_BASE}/leagues/champions-league.svg`,
  europa_league: `${LOGOS_BASE}/leagues/europa-league.svg`,
} as const

// Austrian team asset paths
export const teamAssets = {
  // Austrian Bundesliga Teams
  rb_salzburg: `${LOGOS_BASE}/teams/rb-salzburg.svg`,
  rapid_wien: `${LOGOS_BASE}/teams/rapid-wien.svg`,
  austria_wien: `${LOGOS_BASE}/teams/austria-wien.svg`,
  sturm_graz: `${LOGOS_BASE}/teams/sturm-graz.svg`,
  lask: `${LOGOS_BASE}/teams/lask.svg`,
  wolfsberg: `${LOGOS_BASE}/teams/wolfsberg.svg`,
  tsv_hartberg: `${LOGOS_BASE}/teams/tsv-hartberg.svg`,
  wsg_tirol: `${LOGOS_BASE}/teams/wsg-tirol.svg`,
  austria_klagenfurt: `${LOGOS_BASE}/teams/austria-klagenfurt.svg`,
  scr_altach: `${LOGOS_BASE}/teams/scr-altach.svg`,
} as const

// UI Icons
export const uiIcons = {
  star: `${ICONS_BASE}/ui/star.svg`,
  bell: `${ICONS_BASE}/ui/bell.svg`,
  trend_up: `${ICONS_BASE}/ui/trend-up.svg`,
  shield: `${ICONS_BASE}/ui/shield.svg`,
  check_circle: `${ICONS_BASE}/ui/check-circle.svg`,
  fire: `${ICONS_BASE}/ui/fire.svg`,
  crown: `${ICONS_BASE}/ui/crown.svg`,
  target: `${ICONS_BASE}/ui/target.svg`,
} as const

// Sports Icons
export const sportsIcons = {
  football: `${ICONS_BASE}/sports/football.svg`,
  trophy: `${ICONS_BASE}/sports/trophy.svg`,
  whistle: `${ICONS_BASE}/sports/whistle.svg`,
  stadium: `${ICONS_BASE}/sports/stadium.svg`,
} as const

// Country Flags
export const countryFlags = {
  austria: `${IMAGES_BASE}/flags/austria.svg`,
  germany: `${IMAGES_BASE}/flags/germany.svg`,
  england: `${IMAGES_BASE}/flags/england.svg`,
  italy: `${IMAGES_BASE}/flags/italy.svg`,
  spain: `${IMAGES_BASE}/flags/spain.svg`,
  france: `${IMAGES_BASE}/flags/france.svg`,
} as const

// Banner assets
export const bannerAssets = {
  promotional: {
    welcome: `${BANNERS_BASE}/promotional/welcome-banner.jpg`,
    new_user: `${BANNERS_BASE}/promotional/new-user-bonus.jpg`,
    best_odds: `${BANNERS_BASE}/promotional/best-odds-guaranteed.jpg`,
  },
  advertising: {
    header_728x90: `${BANNERS_BASE}/advertising/header-728x90.jpg`,
    sidebar_300x250: `${BANNERS_BASE}/advertising/sidebar-300x250.jpg`,
    footer_970x90: `${BANNERS_BASE}/advertising/footer-970x90.jpg`,
  },
} as const

// Background images
export const backgroundImages = {
  hero: `${IMAGES_BASE}/backgrounds/hero-bg.jpg`,
  stadium: `${IMAGES_BASE}/backgrounds/stadium.jpg`,
  pitch: `${IMAGES_BASE}/backgrounds/football-pitch.jpg`,
  austria_landscape: `${IMAGES_BASE}/backgrounds/austria-landscape.jpg`,
} as const

// Utility functions for asset management
export const getBookmakerLogo = (bookmakerName: string): string => {
  // Map common bookmaker name variations to our asset keys
  const nameMapping: Record<string, keyof typeof bookmakerAssets> = {
    'win2day': 'win2day',
    'tipp3': 'tipp3',
    'bet365': 'bet365',
    'bwin': 'bwin',
    'interwetten': 'interwetten',
    'tipico': 'tipico',
    'betway': 'betway',
    'admiral': 'admiral',
    'neo_bet': 'neo_bet',  // Add this mapping for the backend name
    'neo-bet': 'neo_bet',
    'neo.bet': 'neo_bet',
    'neobet': 'neo_bet',
    'tipwin': 'tipwin',
    'mozzart': 'mozzart',
    'merkur_bets': 'merkur_bets',  // Add this mapping for the backend name
    'merkur-bets': 'merkur_bets',
    'merkur': 'merkur_bets',
    'merkurbets': 'merkur_bets',
    'rabona': 'rabona',
    'bet_at_home': 'bet_at_home',  // Add this mapping for the backend name
    'bet-at-home': 'bet_at_home',
    'betathome': 'bet_at_home',
    'lottoland': 'lottoland',
  }
  
  const normalizedName = bookmakerName.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const key = nameMapping[normalizedName] || nameMapping[bookmakerName.toLowerCase()]
  
  
  return key ? bookmakerAssets[key] : `${LOGOS_BASE}/bookmakers/default.svg`
}

export const getTeamLogo = (teamName: string): string => {
  const key = teamName.toLowerCase().replace(/\s+/g, '_').replace('-', '_') as keyof typeof teamAssets
  return teamAssets[key] || `${LOGOS_BASE}/teams/default.svg`
}

export const getLeagueLogo = (leagueName: string): string => {
  const key = leagueName.toLowerCase().replace(/\s+/g, '_') as keyof typeof leagueAssets
  return leagueAssets[key] || `${LOGOS_BASE}/leagues/default.svg`
}

export const getCountryFlag = (countryName: string): string => {
  const key = countryName.toLowerCase() as keyof typeof countryFlags
  return countryFlags[key] || `${IMAGES_BASE}/flags/default.svg`
}

// Asset presets for common combinations
export const assetPresets = {
  // Austrian football match setup
  austrianMatch: {
    league: leagueAssets.austrian_bundesliga,
    country: countryFlags.austria,
    defaultTeam: teamAssets.rb_salzburg,
  },
  
  // Bookmaker comparison setup
  topBookmakers: [
    bookmakerAssets.win2day,
    bookmakerAssets.tipp3,
    bookmakerAssets.bet365,
    bookmakerAssets.bwin,
    bookmakerAssets.interwetten,
  ],
  
  // UI decoration
  premiumFeatures: [
    uiIcons.crown,
    uiIcons.star,
    uiIcons.trend_up,
    uiIcons.shield,
  ],
} as const

// Default/fallback assets
export const defaultAssets = {
  bookmaker: `${LOGOS_BASE}/bookmakers/default.svg`,
  team: `${LOGOS_BASE}/teams/default.svg`,
  league: `${LOGOS_BASE}/leagues/default.svg`,
  user_avatar: `${IMAGES_BASE}/avatars/default-user.svg`,
  placeholder: `${IMAGES_BASE}/placeholders/image-placeholder.svg`,
} as const

// Asset metadata for optimization
export const assetMetadata = {
  bookmaker_logo: { width: 120, height: 60 },
  team_logo: { width: 32, height: 32 },
  league_logo: { width: 40, height: 40 },
  country_flag: { width: 32, height: 24 },
  banner_header: { width: 728, height: 90 },
  banner_sidebar: { width: 300, height: 250 },
  banner_footer: { width: 970, height: 90 },
} as const

export type BookmakerKey = keyof typeof bookmakerAssets
export type TeamKey = keyof typeof teamAssets
export type LeagueKey = keyof typeof leagueAssets
export type CountryKey = keyof typeof countryFlags