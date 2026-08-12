/**
 * Admin API client — uses Supabase session JWT + RequestManager (timeout/retry).
 */

import { supabase } from "@/lib/supabase";
import { RequestManager, REQUEST_NO_TIMEOUT } from "@/lib/request-manager";

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
  return RequestManager.fetch(url, { ...init, headers: merged, label: `admin:${url}` });
}

/** Import job API calls — no client-side timeout (progress polled separately). */
export async function adminImportFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAdminAuthHeaders();
  const merged: Record<string, string> = {
    ...authHeaders,
    ...(init.headers as Record<string, string> | undefined),
  };
  return RequestManager.fetch(url, {
    ...init,
    headers: merged,
    label: `import:${url}`,
    timeoutMs: REQUEST_NO_TIMEOUT,
    retries: 0,
  });
}
