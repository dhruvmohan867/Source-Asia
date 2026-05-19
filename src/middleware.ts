// ============================================================
// Next.js Middleware — Auth Session Refresh
// ============================================================
// WHY at root: Next.js middleware runs BEFORE every matched route.
// It refreshes expired Supabase sessions so Server Components
// always have a valid auth state.
// ============================================================

import { updateSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on all routes except static files and API internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
