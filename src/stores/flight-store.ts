import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  Flight,
  Seat,
  PassengerFormData,
} from '@/types';

interface SearchQuery {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
}

interface FlightState {
  // Search state
  searchQuery: SearchQuery;

  // Booking flow
  selectedFlight: Flight | null;
  selectedSeats: Seat[];
  currentStep: number;

  // Passenger flow
  passengerFormData: PassengerFormData[];

  // Pricing
  totalAmount: number;

  // UI state
  isBooking: boolean;
  bookingError: string | null;
}

interface FlightActions {
  setSearchQuery: (
    query: Partial<SearchQuery>
  ) => void;

  setFlight: (
    flight: Flight | null
  ) => void;

  setSelectedSeats: (
    seats: Seat[]
  ) => void;

  addSeat: (seat: Seat) => void;

  removeSeat: (
    seatId: string
  ) => void;

  clearSeats: () => void;

  setStep: (
    step: number
  ) => void;

  setPassengerFormData: (
    passengers: PassengerFormData[]
  ) => void;

  setBooking: (
    isBooking: boolean
  ) => void;

  setBookingError: (
    error: string | null
  ) => void;

  reset: () => void;
}

const initialState: FlightState = {
  searchQuery: {
    origin: '',
    destination: '',
    date: '',
    passengers: 1,
  },

  selectedFlight: null,

  selectedSeats: [],

  currentStep: 0,

  passengerFormData: [],

  totalAmount: 0,

  isBooking: false,

  bookingError: null,
};

export const useFlightStore = create<
  FlightState & FlightActions
>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ============================================================
      // Search Query
      // ============================================================

      setSearchQuery: (query) =>
        set((state) => ({
          searchQuery: {
            ...state.searchQuery,
            ...query,
          },
        })),

      // ============================================================
      // Flight Selection
      // ============================================================

      setFlight: (selectedFlight) =>
        set({
          selectedFlight,

          selectedSeats: [],

          passengerFormData: [],

          currentStep:
            selectedFlight ? 1 : 0,

          totalAmount:
            selectedFlight?.base_price ?? 0,
        }),

      // ============================================================
      // Seat Selection
      // ============================================================

      setSelectedSeats: (
        selectedSeats
      ) =>
        set({
          selectedSeats,
        }),

      addSeat: (seat) => {
        const currentSeats =
          get().selectedSeats;

        // Prevent duplicate selection
        const alreadyExists =
          currentSeats.some(
            (s) => s.id === seat.id
          );

        if (alreadyExists) return;

        const updatedSeats = [
          ...currentSeats,
          seat,
        ];

        const flight =
          get().selectedFlight;

        const basePrice =
          flight?.base_price ?? 0;

        const total =
          updatedSeats.reduce(
            (sum, currentSeat) =>
              sum +
              basePrice +
              currentSeat.price_modifier,
            0
          );

        set({
          selectedSeats: updatedSeats,
          totalAmount: total,
        });
      },

      removeSeat: (seatId) => {
        const filteredSeats =
          get().selectedSeats.filter(
            (seat) =>
              seat.id !== seatId
          );

        const flight =
          get().selectedFlight;

        const basePrice =
          flight?.base_price ?? 0;

        const total =
          filteredSeats.reduce(
            (sum, currentSeat) =>
              sum +
              basePrice +
              currentSeat.price_modifier,
            0
          );

        set({
          selectedSeats:
            filteredSeats,
          totalAmount: total,
        });
      },

      clearSeats: () =>
        set({
          selectedSeats: [],
          totalAmount: 0,
        }),

      // ============================================================
      // Booking Flow
      // ============================================================

      setStep: (currentStep) =>
        set({
          currentStep,
        }),

      setPassengerFormData: (
        passengerFormData
      ) =>
        set({
          passengerFormData,
        }),

      setBooking: (isBooking) =>
        set({
          isBooking,
        }),

      setBookingError: (
        bookingError
      ) =>
        set({
          bookingError,
        }),

      // ============================================================
      // Reset
      // ============================================================

      reset: () =>
        set({
          ...initialState,
        }),
    }),

    {
      name: 'source-asia-flight-flow',

      // Prevent sensitive passenger
      // data from localStorage persistence
      partialize: (state) => ({
        searchQuery:
          state.searchQuery,

        selectedFlight:
          state.selectedFlight,

        selectedSeats:
          state.selectedSeats,

        currentStep:
          state.currentStep,

        totalAmount:
          state.totalAmount,
      }),
    }
  )
);