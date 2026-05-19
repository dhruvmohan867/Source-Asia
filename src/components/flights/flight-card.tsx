// ============================================================
// Flight Card — Individual Flight Result
// ============================================================

'use client';

import { useRouter } from 'next/navigation';
import type { Flight } from '@/types';
import { useBookingStore } from '@/stores/booking-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatTime, formatDate, calculateDuration } from '@/lib/utils';
import { AIRPORTS } from '@/lib/constants';

interface FlightCardProps {
  flight: Flight;
  passengers: number;
}

export function FlightCard({ flight, passengers }: FlightCardProps) {
  const router = useRouter();
  const setFlight = useBookingStore((s) => s.setFlight);

  const originAirport = AIRPORTS.find((a) => a.code === flight.origin);
  const destAirport = AIRPORTS.find((a) => a.code === flight.destination);
  const duration = calculateDuration(flight.departure_time, flight.arrival_time);
  const totalPrice = flight.base_price * passengers;

  const handleSelect = () => {
    setFlight(flight);
    router.push(`/booking/seats?flightId=${flight.id}&passengers=${passengers}`);
  };

  return (
    <div className="rounded-2xl bg-surface border border-border p-6 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground">{flight.flight_number}</p>
            <p className="text-xs text-muted">{flight.airline} · {flight.aircraft_type}</p>
          </div>
        </div>
        <Badge variant={flight.available_seats < 20 ? 'warning' : 'success'}>
          {flight.available_seats} seats left
        </Badge>
      </div>

      {/* Route */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{flight.origin}</p>
          <p className="text-xs text-muted">{originAirport?.city ?? flight.origin}</p>
          <p className="text-sm font-medium text-foreground mt-1">
            {formatTime(flight.departure_time)}
          </p>
        </div>

        <div className="flex-1 px-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <div className="flex flex-col items-center">
              <svg className="w-4 h-4 text-accent rotate-90" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
              <span className="text-xs text-muted">{duration}</span>
            </div>
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{flight.destination}</p>
          <p className="text-xs text-muted">{destAirport?.city ?? flight.destination}</p>
          <p className="text-sm font-medium text-foreground mt-1">
            {formatTime(flight.arrival_time)}
          </p>
        </div>
      </div>

      {/* Date */}
      <p className="text-xs text-muted mb-4">{formatDate(flight.departure_time)}</p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          <p className="text-2xl font-bold text-foreground">{formatPrice(totalPrice)}</p>
          <p className="text-xs text-muted">
            {passengers > 1 ? `${formatPrice(flight.base_price)}/person` : 'per person'}
          </p>
        </div>
        <Button onClick={handleSelect} className="group-hover:animate-pulse-glow">
          Select Flight
        </Button>
      </div>
    </div>
  );
}
