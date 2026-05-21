// ============================================================
// Search Widget — Flight Search Form
// ============================================================
// WHY Client Component: Manages form state, validation, and
// router navigation. Kept minimal — delegates to Zustand store.
// ============================================================

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFlightStore } from '@/stores/search-store';
import { Button } from '@/components/ui/button';
import { AIRPORTS } from '@/lib/constants';

export function SearchWidget() {
  const router = useRouter();
  const {
    origin, destination, date, passengers,
    setOrigin, setDestination, setDate, setPassengerFormData , swapCities,
  } = useFlightStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!origin) newErrors.origin = 'Select origin';
    if (!destination) newErrors.destination = 'Select destination';
    if (!date) newErrors.date = 'Select date';
    if (origin && destination && origin === destination) {
      newErrors.destination = 'Must differ from origin';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const params = new URLSearchParams({
      origin,
      destination,
      date,
      passengers: passengers.toString(),
    });
    router.push(`/flights?${params.toString()}`);
  };

  // Get tomorrow's date as minimum for date picker
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <form onSubmit={handleSearch} className="rounded-2xl bg-surface border border-border p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Origin */}
        <div className="space-y-1.5">
          <label htmlFor="search-origin" className="block text-sm font-medium text-zinc-300">
            From
          </label>
          <select
            id="search-origin"
            value={origin}
            onChange={(e) => { setOrigin(e.target.value); setErrors({}); }}
            className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="">Select origin</option>
            {AIRPORTS.map((airport) => (
              <option key={airport.code} value={airport.code}>
                {airport.city} ({airport.code})
              </option>
            ))}
          </select>
          {errors.origin && <p className="text-xs text-red-400">{errors.origin}</p>}
        </div>

        {/* Swap Button + Destination */}
        <div className="space-y-1.5 relative">
          <label htmlFor="search-destination" className="block text-sm font-medium text-zinc-300">
            To
          </label>
          <div className="relative">
            <select
              id="search-destination"
              value={destination}
              onChange={(e) => { setDestination(e.target.value); setErrors({}); }}
              className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="">Select destination</option>
              {AIRPORTS.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {airport.city} ({airport.code})
                </option>
              ))}
            </select>
            {/* Swap cities button — positioned between origin and destination on desktop */}
            <button
              type="button"
              onClick={swapCities}
              className="absolute -left-8 top-1/2 -translate-y-1/2 hidden lg:flex w-8 h-8 items-center justify-center rounded-full bg-surface-hover border border-border hover:bg-accent/20 hover:border-accent/30 transition-all z-10"
              aria-label="Swap cities"
            >
              <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>
          {errors.destination && <p className="text-xs text-red-400">{errors.destination}</p>}
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <label htmlFor="search-date" className="block text-sm font-medium text-zinc-300">
            Date
          </label>
          <input
            type="date"
            id="search-date"
            value={date}
            min={minDate}
            onChange={(e) => { setDate(e.target.value); setErrors({}); }}
            className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent [color-scheme:dark]"
          />
          {errors.date && <p className="text-xs text-red-400">{errors.date}</p>}
        </div>

        {/* Passengers */}
        <div className="space-y-1.5">
          <label htmlFor="search-passengers" className="block text-sm font-medium text-zinc-300">
            Passengers
          </label>
          <select
            id="search-passengers"
            value={passengers}
            onChange={(e) => setPassengerFormData(Number(e.target.value))}
            className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'Passenger' : 'Passengers'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile swap button */}
      <div className="flex lg:hidden justify-center mb-4">
        <button
          type="button"
          onClick={swapCities}
          className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-foreground rounded-lg hover:bg-surface-hover transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          Swap Cities
        </button>
      </div>

      <Button type="submit" size="lg" className="w-full">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Search Flights
      </Button>
    </form>
  );
}
