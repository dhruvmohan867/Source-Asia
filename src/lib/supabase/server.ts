// ============================================================
// Supabase Server Client (Server Components / Route Handlers)
// ============================================================
// WHY createServerClient: Runs on the server with cookie-based
// session management. Each request gets a fresh client that
// reads the auth cookie from the request headers.
//
// INTERVIEW POINT: "I use separate Supabase clients for server
// and client — the server client uses cookies for auth, while
// the browser client uses the session."
// ============================================================

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';


export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}
