/**
 * Unified Dynamic League Page
 * Single page component that works for all leagues
 */

'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import LeagueHeader from '../../../components/ui/LeagueHeader';
import CompactMatchCard from '../../../components/matches/CompactMatchCard';
import { getLeagueConfig } from '../../../lib/leagues/config';

interface LeagueData {
  league: {
    id: string;
    name: string;
    displayName: string;
    country: string;
    logoPath: string;
  };
  round: number;
  matchesPerRound: number;
  matches: any[];
  lastUpdated: string;
}

async function fetchLeagueMatches(leagueId: string): Promise<LeagueData> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const res = await fetch(`${apiUrl}/leagues/${leagueId}`, {
    cache: 'no-store'
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch matches');
  }

  return res.json();
}

export default function LeaguePage() {
  const params = useParams();
  const leagueId = params.league as string;

  // Get league config for metadata
  const config = getLeagueConfig(leagueId);

  // Fetch league data
  const { data, isLoading, error } = useQuery({
    queryKey: ['league', leagueId],
    queryFn: () => fetchLeagueMatches(leagueId),
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000 // Consider data stale after 30 seconds
  });

  if (!config) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Liga nicht gefunden</h1>
          <p className="text-muted-foreground">
            Die Liga &quot;{leagueId}&quot; wurde nicht gefunden.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LeagueHeader
          leagueName={config.name}
          logoSrc={config.logoPath}
          logoAlt={`${config.name} Logo`}
        />
        <div className="mt-8 text-center">
          <p className="text-red-600 font-semibold mb-2">Fehler beim Laden der Spiele</p>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'Unbekannter Fehler'}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LeagueHeader
          leagueName={config.name}
          logoSrc={config.logoPath}
          logoAlt={`${config.name} Logo`}
        />
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">Lädt Spiele...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { league, round, matches } = data;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* League Header */}
      <LeagueHeader
        leagueName={league.name}
        logoSrc={league.logoPath}
        logoAlt={`${league.name} Logo`}
      />

      {/* Round Information */}
      <div className="mt-6 mb-4">
        <h2 className="text-xl font-semibold text-foreground">
          {round}. Spieltag
        </h2>
      </div>

      {/* Matches */}
      {matches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            Keine anstehenden Spiele gefunden.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <CompactMatchCard
              key={match.id}
              match={match}
            />
          ))}
        </div>
      )}

      {/* Last Updated */}
      {data.lastUpdated && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Zuletzt aktualisiert: {new Date(data.lastUpdated).toLocaleString('de-DE')}
        </div>
      )}
    </div>
  );
}
