// ============================================================
// Auth Store — Zustand with Persist
// ============================================================
// WHY Zustand over Context: Zustand is ~2KB, works outside React,
// has built-in persist middleware, and avoids unnecessary re-renders.
//
// WHY persist: Session survives page refresh without re-fetching.
// WHY partialize: We exclude sensitive tokens from localStorage.
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      // WHY reset action: Clean logout — no stale state
      reset: () => set(initialState),
    }),
    {
      name: 'source-asia-auth',
      // WHY partialize: Only persist non-sensitive user info
      // Tokens are handled by Supabase's cookie-based auth
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
