// ============================================================
// Seat Selection Page (Booking Step 1)
// ============================================================

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useBookingStore } from '@/stores/booking-store';
import { useAuthStore } from '@/stores/auth-store';
import { SeatMap } from '@/components/seats/seat-map';
import { Button } from '@/components/ui/button';
import { formatPrice, formatTime, calculateDuration } from '@/lib/utils';
import { AIRPORTS } from '@/lib/constants';
import Link from 'next/link';
import { Suspense } from 'react';

function SeatSelectionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { selectedFlight, selectedSeats, totalAmount } = useBookingStore();
  const { isAuthenticated } = useAuthStore();

  const flightId = searchParams.get('flightId');
  const passengers = Number(searchParams.get('passengers')) || 1;

  if (!selectedFlight || !flightId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-muted mb-4">No flight selected</p>
        <Link href="/search" className="text-accent hover:underline">
          Search for flights
        </Link>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold mb-4">Sign in to continue</h2>
        <p className="text-muted mb-6">You need to be signed in to book a flight.</p>
        <Link
          href={`/login?redirect=/booking/seats?flightId=${flightId}&passengers=${passengers}`}
          className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const originAirport = AIRPORTS.find((a) => a.code === selectedFlight.origin);
  const destAirport = AIRPORTS.find((a) => a.code === selectedFlight.destination);
  const duration = calculateDuration(selectedFlight.departure_time, selectedFlight.arrival_time);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href={`/flights?origin=${selectedFlight.origin}&destination=${selectedFlight.destination}&date=${selectedFlight.departure_time.split('T')[0]}&passengers=${passengers}`} className="text-sm text-muted hover:text-foreground transition-colors inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to results
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Seat Map — takes 2/3 of space */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold mb-6">Select Your Seats</h1>
          <p className="text-muted text-sm mb-6">
            Select {passengers} seat{passengers > 1 ? 's' : ''} for your flight
          </p>
          <SeatMap flightId={flightId} maxSeats={passengers} basePrice={selectedFlight.base_price} />
        </div>

        {/* Sticky Booking Summary — takes 1/3 */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            {/* Flight Info Card */}
            <div className="rounded-2xl bg-surface border border-border p-5">
              <h3 className="font-semibold mb-3">Flight Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Flight</span>
                  <span className="font-medium">{selectedFlight.flight_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Route</span>
                  <span className="font-medium">
                    {originAirport?.city ?? selectedFlight.origin} → {destAirport?.city ?? selectedFlight.destination}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Time</span>
                  <span className="font-medium">
                    {formatTime(selectedFlight.departure_time)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Duration</span>
                  <span className="font-medium">{duration}</span>
                </div>
              </div>
            </div>

            {/* Selected Seats */}
            <div className="rounded-2xl bg-surface border border-border p-5">
              <h3 className="font-semibold mb-3">
                Selected Seats ({selectedSeats.length}/{passengers})
              </h3>
              {selectedSeats.length === 0 ? (
                <p className="text-sm text-muted">No seats selected yet</p>
              ) : (
                <div className="space-y-2">
                  {selectedSeats.map((seat) => (
                    <div key={seat.id} className="flex justify-between text-sm">
                      <span className="text-muted">
                        Seat {seat.seat_number}
                        <span className="text-xs ml-1 capitalize">({seat.seat_class})</span>
                      </span>
                      <span className="font-medium">
                        {formatPrice(selectedFlight.base_price + seat.price_modifier)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="rounded-2xl bg-surface border border-border p-5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted">Total</span>
                <span className="text-2xl font-bold">{formatPrice(totalAmount)}</span>
              </div>
              <Button
                size="lg"
                className="w-full"
                disabled={selectedSeats.length !== passengers}
                onClick={() => router.push('/booking/passengers')}
              >
                {selectedSeats.length === passengers
                  ? 'Continue to Passengers'
                  : `Select ${passengers - selectedSeats.length} more seat${passengers - selectedSeats.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SeatSelectionPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-8"><div className="skeleton h-96 w-full rounded-2xl" /></div>}>
      <SeatSelectionContent />
    </Suspense>
  );
}
