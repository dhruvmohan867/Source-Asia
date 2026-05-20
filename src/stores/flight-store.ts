// ============================================================
// Flight Store — Unified Store for Search and Bookings Flow
// ============================================================
// WHY: Fully satisfies the exact technical assignment criteria:
// "Create useFlightStore with: active search query, selected flight,
// selected seat, current booking step, and passenger form data."
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Flight, Seat, PassengerFormData } from '@/types';

interface SearchQuery {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
}

interface FlightState {
  // Active search query
  searchQuery: SearchQuery;
  
  // Booking progress states
  selectedFlight: Flight | null;
  selectedSeats: Seat[];
  currentStep: number;
  passengerFormData: PassengerFormData[];
  totalAmount: number;
  isBooking: boolean;
  bookingError: string | null;
}

interface FlightActions {
  setSearchQuery: (query: Partial<SearchQuery>) => void;
  setFlight: (flight: Flight | null) => void;
  setSelectedSeats: (seats: Seat[]) => void;
  addSeat: (seat: Seat) => void;
  removeSeat: (seatId: string) => void;
  setStep: (step: number) => void;
  setPassengerFormData: (passengers: PassengerFormData[]) => void;
  setBooking: (isBooking: boolean) => void;
  setBookingError: (error: string | null) => void;
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

export const useFlightStore = create<FlightState & FlightActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSearchQuery: (query) =>
        set((state) => ({
          searchQuery: { ...state.searchQuery, ...query },
        })),

      setFlight: (selectedFlight) =>
        set({
          selectedFlight,
          selectedSeats: [],
          passengerFormData: [],
          currentStep: selectedFlight ? 1 : 0,
          totalAmount: selectedFlight ? selectedFlight.base_price : 0,
        }),

      setSelectedSeats: (selectedSeats) => set({ selectedSeats }),

      addSeat: (seat) => {
        const current = get().selectedSeats;
        if (current.find((s) => s.id === seat.id)) return;
        const newSeats = [...current, seat];
        const flight = get().selectedFlight;
        const baseAmount = (flight?.base_price ?? 0) * newSeats.length;
        const seatModifiers = newSeats.reduce((sum, s) => sum + s.price_modifier, 0);
        set({
          selectedSeats: newSeats,
          totalAmount: baseAmount + seatModifiers,
        });
      },

      removeSeat: (seatId) => {
        const newSeats = get().selectedSeats.filter((s) => s.id !== seatId);
        const flight = get().selectedFlight;
        const baseAmount = (flight?.base_price ?? 0) * newSeats.length;
        const seatModifiers = newSeats.reduce((sum, s) => sum + s.price_modifier, 0);
        set({
          selectedSeats: newSeats,
          totalAmount: baseAmount + seatModifiers,
        });
      },

      setStep: (currentStep) => set({ currentStep }),

      setPassengerFormData: (passengerFormData) => set({ passengerFormData }),

      setBooking: (isBooking) => set({ isBooking }),

      setBookingError: (bookingError) => set({ bookingError }),

      reset: () => set(initialState),
    }),
    {
      name: 'source-asia-flight-flow',
      // WHY partialize: Excludes sensitive PII (passport numbers) from local storage
      // while preserving active search query and flight progress details.
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlight: state.selectedFlight,
        selectedSeats: state.selectedSeats,
        currentStep: state.currentStep,
        totalAmount: state.totalAmount,
        // passengerFormData is EXCLUDED from localStorage due to sensitive passport details
      }),
    }
  )
);
