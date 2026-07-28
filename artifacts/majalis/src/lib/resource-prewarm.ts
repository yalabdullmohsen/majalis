/**
 * Dynamic domain preconnect / DNS prefetch for audio CDNs and text APIs.
 * Reduces DNS+TLS handshake latency before first play/search.
 * Logic-only — injects <link> tags; no layout/CSS.
 */

import { useEffect } from "react";

export const AUDIO_CDN_ORIGINS = [
  "https://everyayah.com",
  "https://server8.mp3quran.net",
] as const;

export const TEXT_API_ORIGINS = [
  "https://api.alquran.cloud",
  "https://cdn.jsdelivr.net",
] as const;

const warmed = new Set<string>();

function ensureHead(): HTMLHeadElement | null {
  if (typeof document === "undefined") return null;
  return document.head;
}

/**
 * Idempotent preconnect (+ dns-prefetch) for an absolute origin.
 * Safe to call repeatedly from hooks / interaction handlers.
 */
export function preconnectOrigin(origin: string, { crossOrigin = true }: { crossOrigin?: boolean } = {}): void {
  const head = ensureHead();
  if (!head || !origin) return;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return;
  }
  const key = url.origin;
  if (warmed.has(key)) return;
  warmed.add(key);

  if (!head.querySelector(`link[rel="preconnect"][href="${key}"]`)) {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = key;
    if (crossOrigin) link.crossOrigin = "anonymous";
    head.appendChild(link);
  }
  if (!head.querySelector(`link[rel="dns-prefetch"][href="${key}"]`)) {
    const dns = document.createElement("link");
    dns.rel = "dns-prefetch";
    dns.href = key;
    head.appendChild(dns);
  }
}

/** Warm known audio CDN origins (everyayah + mp3quran). */
export function prewarmAudioCdns(): void {
  for (const o of AUDIO_CDN_ORIGINS) preconnectOrigin(o);
}

/** Warm Quran/Hadith text API origins. */
export function prewarmTextApis(): void {
  for (const o of TEXT_API_ORIGINS) preconnectOrigin(o);
}

/** Best-effort HEAD/GET warmup of a URL without consuming the body heavily. */
export function prewarmUrl(url: string, { mode = "no-cors" }: { mode?: RequestMode } = {}): void {
  if (typeof fetch !== "function" || !url) return;
  try {
    void fetch(url, {
      method: "GET",
      mode,
      credentials: "omit",
      cache: "force-cache",
      // Low priority — never contend with verse/page text on congested links
      priority: "low",
      signal: typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
        ? AbortSignal.timeout(2_500)
        : undefined,
    } as RequestInit).catch(() => undefined);
  } catch {
    /* ignore */
  }
}

/** React hook: preconnect origins when `enabled` is true (e.g. modal open / player mount). */
export function useResourcePrewarm(
  origins: readonly string[],
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;
    for (const o of origins) preconnectOrigin(o);
  }, [enabled, origins]);
}

/** Test helper — clears warmed set. */
export function clearPrewarmState(): void {
  warmed.clear();
}
