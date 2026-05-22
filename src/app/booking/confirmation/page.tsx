// ============================================================
// Booking Confirmation Page
// ============================================================

'use client';

import { useSearchParams } from 'next/navigation';
import { useBookingStore } from '@/stores/booking-store';
import { Button } from '@/components/ui/button';
import { formatPrice, formatTime, formatDate } from '@/lib/utils';
import { AIRPORTS } from '@/lib/constants';
import Link from 'next/link';
import { useEffect } from 'react';
import { Suspense } from 'react';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const pnr = searchParams.get('pnr');
  const { selectedFlight, selectedSeats, totalAmount, reset } = useBookingStore();

  // Store flight info before reset
  const flightInfo = selectedFlight;
  const seatsInfo = selectedSeats;
  const amount = totalAmount;

 
  if (!pnr) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-muted mb-4">No booking found</p>
        <Link href="/search" className="text-accent hover:underline">
          Search for flights
        </Link>
      </div>
    );
  }

  const originAirport = flightInfo ? AIRPORTS.find((a) => a.code === flightInfo.origin) : null;
  const destAirport = flightInfo ? AIRPORTS.find((a) => a.code === flightInfo.destination) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Success Animation */}
      <div className="text-center mb-8 animate-slide-up">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
        <p className="text-muted">Your flight has been booked successfully.</p>
      </div>

      {/* PNR Card */}
      <div className="rounded-2xl bg-gradient-to-br from-accent/10 to-purple-500/10 border border-accent/20 p-8 text-center mb-6 animate-fade-in">
        <p className="text-sm text-muted mb-2">Your PNR Number</p>
        <p className="text-4xl font-mono font-bold tracking-widest text-accent">{pnr}</p>
        <p className="text-xs text-muted mt-2">Save this for managing your booking</p>
      </div>

      {/* Flight Details */}
      {flightInfo && (
        <div className="rounded-2xl bg-surface border border-border p-6 mb-6 space-y-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-semibold">Flight Details</h3>

          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-2xl font-bold">{flightInfo.origin}</p>
              <p className="text-xs text-muted">{originAirport?.city}</p>
              <p className="text-sm font-medium mt-1">{formatTime(flightInfo.departure_time)}</p>
            </div>
            <div className="flex-1 px-4 text-center">
              <p className="text-xs text-muted">{flightInfo.flight_number}</p>
              <div className="h-px bg-border my-1" />
              <p className="text-xs text-muted">{formatDate(flightInfo.departure_time)}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{flightInfo.destination}</p>
              <p className="text-xs text-muted">{destAirport?.city}</p>
              <p className="text-sm font-medium mt-1">{formatTime(flightInfo.arrival_time)}</p>
            </div>
          </div>

          {seatsInfo.length > 0 && (
            <div className="pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Seats</span>
                <span className="font-medium">{seatsInfo.map((s) => s.seat_number).join(', ')}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted">Total Paid</span>
                <span className="font-bold text-lg">{formatPrice(amount)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <Link href="/bookings" className="flex-1">
          <Button variant="primary" size="lg" className="w-full">
            View My Bookings
          </Button>
        </Link>
        <Link href="/search" className="flex-1">
          <Button variant="secondary" size="lg" className="w-full">
            Book Another Flight
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-12"><div className="skeleton h-96 w-full rounded-2xl" /></div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
