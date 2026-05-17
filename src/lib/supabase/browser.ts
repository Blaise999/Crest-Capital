"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client — anon key, used ONLY to subscribe to Realtime
 * row changes on the support tables. All authorised reads/writes still go
 * through the server API routes (service-role key).
 *
 * If the anon env vars are not configured, this returns null and the chat
 * UI transparently falls back to polling.
 */
let cached: SupabaseClient | null | undefined;

export function supabaseBrowser(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    cached = null;
    return cached;
  }

  cached = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 5 } },
  });
  return cached;
}

export const REALTIME_ENABLED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
