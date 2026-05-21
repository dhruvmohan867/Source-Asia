// ============================================================
// My Bookings Page — View, Cancel, Reschedule
// ============================================================
// WHY Client Component: Handles cancellation dialogs, optimistic
// updates, and real-time status. Protected by middleware auth.
// ============================================================

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { BookingCardSkeleton } from "@/components/ui/skeleton";
import {
  formatPrice,
  formatTime,
  formatDate,
  calculateDuration,
  isWithinHours,
} from "@/lib/utils";
import { AIRPORTS } from "@/lib/constants";
import type { BookingWithFlight , Flight } from "@/types";
import { toast } from "sonner";
import Link from "next/link";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingWithFlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);

  const [selectedBooking, setSelectedBooking] =
    useState<BookingWithFlight | null>(null);

  const [alternativeFlights, setAlternativeFlights] = useState<Flight[]>([]);
  const userId = useAuthStore((s) => s.user?.id);

  const fetchBookings = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        *,
        flight:flights(*),
        passengers(*)
      `,
      )
      .eq("user_id", userId)
      .order("booked_at", { ascending: false });

    if (error) {
      toast.error("Failed to load bookings");
      setIsLoading(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = (data ?? []) as BookingWithFlight[];

    // Transform data to match our type
    const transformed: BookingWithFlight[] = rawData.map((b) => ({
      ...b,
      flight: Array.isArray(b.flight) ? b.flight[0] : b.flight,
      passengers: b.passengers ?? [],
    }));

    setBookings(transformed);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancelClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setShowCancelDialog(true);
  };
  const handleRescheduleClick = async (booking: BookingWithFlight) => {
    console.log("RESCHEDULE CLICKED");
    setSelectedBooking(booking);

    setShowRescheduleDialog(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("flights")
      .select("*")
      .eq("origin", booking.flight.origin)
      .eq("destination", booking.flight.destination)
      .neq("id", booking.flight.id);

    if (error) {
      toast.error("Failed to load alternative flights");
      return;
    }

    setAlternativeFlights(data || []);
  };

  const handleCancelConfirm = async () => {
    if (!selectedBookingId || !userId) return;

    setCancellingId(selectedBookingId);
    setShowCancelDialog(false);

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc("cancel_booking", {
      p_booking_id: selectedBookingId,
      p_user_id: userId,
    });

    console.log(error);
    const result = data as {
      success: boolean;
      error?: string;
      refund_amount?: number;
    };

    if (result?.success) {
      // Optimistic update
      setBookings((prev) =>
        prev.map((b) =>
          b.id === selectedBookingId
            ? {
                ...b,
                status: "cancelled",
                cancelled_at: new Date().toISOString(),
              }
            : b,
        ),
      );
      toast.success(
        `Booking cancelled. Refund: ${formatPrice(result.refund_amount ?? 0)}`,
      );
    } else {
      toast.error(result?.error ?? "Cancellation failed");
    }

    setCancellingId(null);
    setSelectedBookingId(null);
  };
  const handleRescheduleConfirm = async (newFlightId: string) => {
    if (!selectedBooking) return;

    const supabase = createClient();

    const { data, error } = await supabase.rpc("reschedule_booking", {
      p_booking_id: selectedBooking.id,
      p_new_flight_id: newFlightId,
    });

    if (error) {
      toast.error("Reschedule failed");
      return;
    }

    const result = data as {
      success: boolean;
      error?: string;
    };

    if (result?.success) {
      toast.success("Flight rescheduled successfully");

      setShowRescheduleDialog(false);

      fetchBookings();
    } else {
      toast.error(result?.error || "Reschedule failed");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="success">Confirmed</Badge>;
      case "cancelled":
        return <Badge variant="danger">Cancelled</Badge>;
      case "rescheduled":
        return <Badge variant="info">Rescheduled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <EmptyState
          icon="🎫"
          title="No bookings yet"
          description="You haven't booked any flights. Start by searching for your next trip!"
          action={
            <Link href="/search">
              <Button>Search Flights</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const flight = booking.flight;
            if (!flight) return null;

            const originAirport = AIRPORTS.find(
              (a) => a.code === flight.origin,
            );
            const destAirport = AIRPORTS.find(
              (a) => a.code === flight.destination,
            );
            const duration = calculateDuration(
              flight.departure_time,
              flight.arrival_time,
            );
            const canCancel =
              booking.status === "confirmed" &&
              !isWithinHours(flight.departure_time, 2);
            const isCancelling = cancellingId === booking.id;

            return (
              <div
                key={booking.id}
                className="rounded-2xl bg-surface border border-border p-6 transition-all hover:border-zinc-600"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm text-accent">
                        {booking.pnr}
                      </span>
                      {getStatusBadge(booking.status)}
                    </div>
                    <p className="text-xs text-muted">
                      Booked on {formatDate(booking.booked_at)}
                    </p>
                  </div>
                  <p className="text-lg font-bold">
                    {formatPrice(booking.total_amount)}
                  </p>
                </div>

                {/* Route */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <p className="text-xl font-bold">{flight.origin}</p>
                    <p className="text-xs text-muted">{originAirport?.city}</p>
                    <p className="text-sm font-medium mt-1">
                      {formatTime(flight.departure_time)}
                    </p>
                  </div>
                  <div className="flex-1 px-4 text-center">
                    <p className="text-xs text-muted">{flight.flight_number}</p>
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-border" />
                      <svg
                        className="w-4 h-4 text-accent rotate-90"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                      </svg>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <p className="text-xs text-muted">{duration}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold">{flight.destination}</p>
                    <p className="text-xs text-muted">{destAirport?.city}</p>
                    <p className="text-sm font-medium mt-1">
                      {formatTime(flight.arrival_time)}
                    </p>
                  </div>
                </div>

                {/* Date & Passengers */}
                <div className="flex items-center justify-between text-sm text-muted mb-4">
                  <span>{formatDate(flight.departure_time)}</span>
                  <span>
                    {booking.passenger_count} passenger
                    {booking.passenger_count > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Passengers */}
                {booking.passengers.length > 0 && (
                  <div className="border-t border-border pt-3 mb-4">
                    <p className="text-xs text-muted mb-2">Passengers</p>
                    <div className="flex flex-wrap gap-2">
                      {booking.passengers.map((p) => (
                        <span
                          key={p.id}
                          className="text-xs bg-surface-hover px-2 py-1 rounded-lg"
                        >
                          {p.first_name} {p.last_name}
                          {p.seat_number && ` (${p.seat_number})`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}

                {booking.status === "confirmed" && (
                  <div className="flex gap-3 pt-3 border-t border-border">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleCancelClick(booking.id)}
                      disabled={!canCancel || isCancelling}
                      isLoading={isCancelling}
                    >
                      {canCancel ? "Cancel Booking" : "Cannot cancel (< 2h)"}
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRescheduleClick(booking)}
                    >
                      Reschedule
                    </Button>
                  </div>
                )}

                {booking.status === "cancelled" && booking.cancelled_at && (
                  <p className="text-xs text-red-400 pt-3 border-t border-border">
                    Cancelled on {formatDate(booking.cancelled_at)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        title="Cancel Booking"
      >
        <p className="text-muted text-sm mb-6">
          Are you sure you want to cancel this booking? This action cannot be
          undone. A full refund will be processed.
        </p>

        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={() => setShowCancelDialog(false)}
          >
            Keep Booking
          </Button>

          <Button variant="danger" onClick={handleCancelConfirm}>
            Yes, Cancel
          </Button>
        </div>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog
        isOpen={showRescheduleDialog}
        onClose={() => setShowRescheduleDialog(false)}
        title="Reschedule Flight"
      >
        <div className="space-y-3">
          {alternativeFlights.length === 0 ? (
            <p className="text-sm text-muted">
              No alternative flights available.
            </p>
          ) : (
            alternativeFlights.map((flight) => (
              <div
                key={flight.id}
                className="border border-border rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{flight.flight_number}</p>

                    <p className="text-sm text-muted">
                      {formatDate(flight.departure_time)}
                    </p>

                    <p className="text-sm text-muted">
                      {formatTime(flight.departure_time)}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleRescheduleConfirm(flight.id)}
                  >
                    Select Flight
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Dialog>
    </div>
  );
}
