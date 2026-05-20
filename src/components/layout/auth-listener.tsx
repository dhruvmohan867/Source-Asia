// ============================================================
// Auth Listener — Syncs Supabase Auth with Zustand
// ============================================================
// WHY: Supabase manages the actual session (cookies/JWT).
// This component listens for auth changes and syncs them
// to the Zustand store for UI reactivity.
// ============================================================

'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export function AuthListener() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const initAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({
          id: user.id,
          email: user.email ?? '',
          fullName: user.user_metadata?.full_name ?? '',
        });
      } else {
        setUser(null);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? '',
            fullName: session.user.user_metadata?.full_name ?? '',
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  return null; // Renderless component
}
