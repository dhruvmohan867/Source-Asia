// ============================================================
// Search Store — Flight Search State
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SearchState {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
}

interface SearchActions {
  setOrigin: (origin: string) => void;
  setDestination: (destination: string) => void;
  setDate: (date: string) => void;
  setPassengerFormData : (passengers: number) => void;
  swapCities: () => void;
  reset: () => void;
}

const initialState: SearchState = {
  origin: '',
  destination: '',
  date: '',
  passengers: 1,
};

export const useFlightStore = create<SearchState & SearchActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setOrigin: (origin) => set({ origin }),
      setDestination: (destination) => set({ destination }),
      setDate: (date) => set({ date }),
      setPassengerFormData : (passengers) => set({ passengers }),

      swapCities: () => {
        const { origin, destination } = get();
        set({ origin: destination, destination: origin });
      },

      reset: () => set(initialState),
    }),
    {
      name: 'source-asia-search',
    }
  )
);
