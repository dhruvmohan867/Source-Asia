// ============================================================
// Flights Search Results Page
// ============================================================
// WHY Server Component: Fetches flight data on the server.
// No client JS needed for the initial render — SEO friendly.
// FlightCard is a Client Component for the booking interaction.
// ============================================================

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { FlightCard } from '@/components/flights/flight-card';
import { SearchWidget } from '@/components/flights/search-widget';
import { EmptyState } from '@/components/ui/empty-state';
import { AIRPORTS } from '@/lib/constants';
import type { Flight } from '@/types';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Results',
  description: 'Find and compare available flights',
};

interface FlightsPageProps {
  searchParams: Promise<{
    origin?: string;
    destination?: string;
    date?: string;
    passengers?: string;
  }>;
}

export default async function FlightsPage({ searchParams }: FlightsPageProps) {
  const params = await searchParams;
  const { origin, destination, date, passengers: passengersStr } = params;
  const passengers = Number(passengersStr) || 1;

  // If no search params, show the search form
  if (!origin || !destination || !date) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold mb-6">Search Flights</h1>
        <SearchWidget />
      </div>
    );
  }

  const supabase = await createServerSupabaseClient();

  // Build date range for the selected date (full day)
  const startOfDay = `${date}T00:00:00.000Z`;
  const endOfDay = `${date}T23:59:59.999Z`;

  const { data, error } = await supabase
    .from('flights')
    .select('*')
    .eq('origin', origin)
    .eq('destination', destination)
   // .gte('departure_time', startOfDay)
    //.lte('departure_time', endOfDay)
    .gte('available_seats', passengers)
    .in('status', ['scheduled', 'delayed'])
    .order('departure_time', { ascending: true });

  const flights = data as Flight[] | null;

  const originAirport = AIRPORTS.find((a) => a.code === origin);
  const destAirport = AIRPORTS.find((a) => a.code === destination);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/search" className="text-sm text-muted hover:text-foreground transition-colors mb-4 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Modify search
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold mt-2">
          {originAirport?.city ?? origin} → {destAirport?.city ?? destination}
        </h1>
        <p className="text-muted mt-1">
          {new Date(date).toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })} · {passengers} {passengers === 1 ? 'passenger' : 'passengers'}
        </p>
      </div>

      {/* Results */}
      {error ? (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6 text-center">
          <p className="text-red-400">Failed to load flights. Please try again.</p>
        </div>
      ) : !flights || flights.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No flights found"
          description={`No flights available from ${origin} to ${destination} on this date. Try a different date or route.`}
          action={
            <Link
              href="/search"
              className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
            >
              New Search
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            {flights.length} flight{flights.length !== 1 ? 's' : ''} found
          </p>
          {flights.map((flight) => (
            <FlightCard key={flight.id} flight={flight} passengers={passengers} />
          ))}
        </div>
      )}
    </div>
  );
}
