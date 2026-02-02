import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatOdds(odds: number): string {
  return odds.toFixed(2)
}

export function calculateImpliedProbability(odds: number): number {
  return (1 / odds) * 100
}

export function findBestOdds(oddsArray: Array<{ bookmaker: string; odds: number }>) {
  return oddsArray.reduce((best, current) => 
    current.odds > best.odds ? current : best
  )
}