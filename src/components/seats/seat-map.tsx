// ============================================================
// Seat Map Component — Interactive Aircraft Seat Map
// ============================================================
// WHY Client Component: Handles real-time updates, seat selection
// state, and optimistic UI. Subscribes to Supabase Realtime for
// live seat status changes.
//
// INTERVIEW POINT: "The seat map uses Supabase Realtime to show
// other users' selections in real-time, preventing conflicts."
// ============================================================

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useBookingStore } from '@/stores/booking-store';
import { useAuthStore } from '@/stores/auth-store';
import { cn, formatPrice } from '@/lib/utils';
import { SEAT_CLASSES } from '@/lib/constants';
import type { Seat } from '@/types';
import { toast } from 'sonner';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface SeatMapProps {
  flightId: string;
  maxSeats: number;
  basePrice: number;
}

export function SeatMap({
  flightId,
  maxSeats,
  basePrice,
}: SeatMapProps) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    selectedSeats,
    addSeat,
    removeSeat,
  } = useBookingStore();

  const userId = useAuthStore(
    (s) => s.user?.id
  );

  // ============================================================
  // Fetch Seats
  // ============================================================

  const fetchSeats = useCallback(async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('seats')
      .select('*')
      .eq('flight_id', flightId)
      .order('seat_number');

    if (error) {
      toast.error('Failed to load seat map');
      return;
    }

    setSeats((data as Seat[]) ?? []);
    setIsLoading(false);
  }, [flightId]);

  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  // ============================================================
  // Realtime Seat Updates
  // ============================================================

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`seats-${flightId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seats',
          filter: `flight_id=eq.${flightId}`,
        },
        (
          payload: RealtimePostgresChangesPayload<Seat>
        ) => {
          if (payload.eventType === 'UPDATE') {
            const updatedSeat =
              payload.new as Seat;

            setSeats((prev) =>
              prev.map((s) =>
                s.id === updatedSeat.id
                  ? updatedSeat
                  : s
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [flightId]);

  // ============================================================
  // Seat Selection Logic (Optimistic UI)
  // ============================================================

  const handleSeatClick = async (
    seat: Seat
  ) => {
    // Prevent booked seat selection
    if (seat.status === 'booked') return;

    // Prevent selecting seat locked by another user
    if (
      seat.status === 'locked' &&
      seat.locked_by !== userId
    ) {
      return;
    }

    const isSelected = selectedSeats.find(
      (s) => s.id === seat.id
    );

    const supabase = createClient();

    // ============================================================
    // Deselect Seat
    // ============================================================

    if (isSelected) {
      removeSeat(seat.id);

      if (userId) {
        await supabase.rpc('unlock_seat', {
          p_seat_id: seat.id,
          p_user_id: userId,
        });
      }

      return;
    }

    // ============================================================
    // Max Seat Validation
    // ============================================================

    if (selectedSeats.length >= maxSeats) {
      toast.error(
        `You can only select ${maxSeats} seat${
          maxSeats > 1 ? 's' : ''
        }`
      );

      return;
    }

    // ============================================================
    // Optimistic UI Update
    // ============================================================

    addSeat(seat);

    toast.success(
      `Seat ${seat.seat_number} selected`
    );

    // ============================================================
    // Lock Seat via RPC
    // ============================================================

    if (userId) {
      const { data } = await supabase.rpc(
        'lock_seat',
        {
          p_seat_id: seat.id,
          p_user_id: userId,
        }
      );

      console.log('SEAT:', seat);
      console.log('SEAT ID:', seat.id);
      console.log('USER ID:', userId);
      console.log('RPC RESPONSE:', data);

      const result = data as {
        success: boolean;
        error?: string;
      };

      // ============================================================
      // Rollback if RPC fails
      // ============================================================

      if (!result?.success) {
        removeSeat(seat.id);

        toast.error(
          result?.error ??
            'Failed to select seat'
        );

        fetchSeats();

        return;
      }
    }
  };

  // ============================================================
  // Group Seats by Row
  // ============================================================

  const seatsByRow = seats.reduce<
    Record<string, Seat[]>
  >((acc, seat) => {
    const row = seat.seat_number.replace(
      /[A-F]/g,
      ''
    );

    if (!acc[row]) acc[row] = [];

    acc[row].push(seat);

    return acc;
  }, {});

  const rows = Object.keys(
    seatsByRow
  ).sort((a, b) => Number(a) - Number(b));

  // ============================================================
  // Loading State
  // ============================================================

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 mx-auto" />

        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex justify-center gap-2"
          >
            {Array.from({ length: 6 }).map(
              (_, j) => (
                <div
                  key={j}
                  className="skeleton w-10 h-10 rounded-lg"
                />
              )
            )}
          </div>
        ))}
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-zinc-700 border border-zinc-600" />
          <span className="text-muted">
            Available
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-accent" />
          <span className="text-muted">
            Selected
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-zinc-800 opacity-30" />
          <span className="text-muted">
            Booked
          </span>
        </div>

        {Object.entries(SEAT_CLASSES).map(
          ([key, val]) => (
            <div
              key={key}
              className="flex items-center gap-1.5"
            >
              <span>{val.icon}</span>

              <span className="text-muted">
                {val.label}
              </span>
            </div>
          )
        )}
      </div>

      {/* Aircraft Nose */}
      <div className="flex justify-center">
        <div className="w-32 h-8 rounded-t-full bg-surface border border-border border-b-0" />
      </div>

      {/* Seat Map */}
      <div className="seat-map-container">
        <div className="min-w-[360px] max-w-lg mx-auto space-y-1.5 px-4">

          {/* Column Labels */}
          <div className="flex items-center justify-center gap-1.5 mb-2">
            {[
              'A',
              'B',
              'C',
              '',
              'D',
              'E',
              'F',
            ].map((col, i) =>
              col === '' ? (
                <div
                  key={`aisle-${i}`}
                  className="w-8"
                />
              ) : (
                <div
                  key={col}
                  className="w-10 text-center text-xs text-muted font-medium"
                >
                  {col}
                </div>
              )
            )}
          </div>

          {rows.map((rowNum) => {
            const rowSeats =
              seatsByRow[rowNum];

            const seatClass =
              rowSeats[0]?.seat_class;

            const isExitRow =
              rowNum === '11' ||
              rowNum === '12';

            return (
              <div key={rowNum}>
                {/* Class Labels */}

                {rowNum === '1' && (
                  <div className="text-center text-xs text-amber-400 font-medium py-1 mb-1">
                    First Class
                  </div>
                )}

                {rowNum === '4' && (
                  <div className="text-center text-xs text-indigo-400 font-medium py-1 mb-1 border-t border-border mt-2 pt-2">
                    Business Class
                  </div>
                )}

                {rowNum === '11' && (
                  <div className="text-center text-xs text-emerald-400 font-medium py-1 mb-1 border-t border-border mt-2 pt-2">
                    Economy Class
                  </div>
                )}

                {isExitRow && (
                  <div className="text-center text-[10px] text-amber-500 mb-0.5">
                    EXIT ROW
                  </div>
                )}

                <div className="flex items-center justify-center gap-1.5">
                  {[
                    'A',
                    'B',
                    'C',
                    'AISLE',
                    'D',
                    'E',
                    'F',
                  ].map((col) => {
                    if (col === 'AISLE') {
                      return (
                        <div
                          key={`${rowNum}-aisle`}
                          className="w-8 flex items-center justify-center"
                        >
                          <span className="text-[10px] text-zinc-600">
                            {rowNum}
                          </span>
                        </div>
                      );
                    }

                    const seat =
                      rowSeats.find(
                        (s) =>
                          s.seat_number ===
                          `${rowNum}${col}`
                      );

                    if (!seat) {
                      return (
                        <div
                          key={`${rowNum}${col}`}
                          className="w-10 h-10"
                        />
                      );
                    }

                    const isSelected =
                      selectedSeats.find(
                        (s) =>
                          s.id === seat.id
                      );

                    const isBooked =
                      seat.status === 'booked';

                    const isLockedByOther =
                      seat.status ===
                        'locked' &&
                      seat.locked_by !==
                        userId;

                    return (
                      <button
                        key={seat.id}
                        onClick={() =>
                          handleSeatClick(
                            seat
                          )
                        }
                        disabled={
                          isBooked ||
                          isLockedByOther
                        }
                        aria-label={`Seat ${seat.seat_number}`}
                        className={cn(
                          'w-10 h-10 rounded-lg text-xs font-medium transition-all duration-150 border',

                          isSelected
                            ? 'seat-selected border-accent'
                            : isBooked
                              ? 'seat-booked bg-zinc-800 border-zinc-700 text-zinc-600'
                              : isLockedByOther
                                ? 'seat-locked border-zinc-600 text-zinc-500'
                                : 'seat-available border-zinc-600 hover:border-accent',

                          !isSelected &&
                            !isBooked &&
                            !isLockedByOther &&
                            seatClass ===
                              'first' &&
                            'bg-amber-500/10 text-amber-300',

                          !isSelected &&
                            !isBooked &&
                            !isLockedByOther &&
                            seatClass ===
                              'business' &&
                            'bg-indigo-500/10 text-indigo-300',

                          !isSelected &&
                            !isBooked &&
                            !isLockedByOther &&
                            seatClass ===
                              'economy' &&
                            'bg-zinc-700 text-zinc-300'
                        )}
                      >
                        {seat.seat_number}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Aircraft Tail */}
      <div className="flex justify-center">
        <div className="w-20 h-6 rounded-b-lg bg-surface border border-border border-t-0" />
      </div>
    </div>
  );
}