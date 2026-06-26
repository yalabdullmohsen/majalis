/**
 * Admin API client — uses Supabase session JWT (no client-side secrets).
 */

import { supabase } from "@/lib/supabase";

export async function getAdminAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function adminFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAdminAuthHeaders();
  const merged: Record<string, string> = {
    ...authHeaders,
    ...(init.headers as Record<string, string> | undefined),
  };
  return fetch(url, { ...init, headers: merged });
}
