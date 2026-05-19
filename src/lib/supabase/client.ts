// ============================================================
// Supabase Browser Client (Client Components)
// ============================================================
// WHY createBrowserClient: This client runs in the browser.
// It uses the ANON key (public) and relies on RLS for security.
// Singleton pattern prevents creating multiple GoTrue instances.
// ============================================================

import { createBrowserClient } from '@supabase/ssr';


let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}
