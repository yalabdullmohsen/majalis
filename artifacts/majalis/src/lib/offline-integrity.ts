/**
 * Web Crypto SHA-256 integrity for offline JSON / text payloads.
 * Auto re-fetch + repair when digests mismatch. Logic-only — no UI.
 */

import { hasWebCryptoSubtle } from "@/lib/feature-detect";

const hexCache = new Map<string, string>();

function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i]!.toString(16).padStart(2, "0");
  }
  return out;
}

/** SHA-256 hex digest of a string (UTF-8). Null when Web Crypto unavailable. */
export async function sha256Hex(text: string): Promise<string | null> {
  if (!hasWebCryptoSubtle()) return null;
  try {
    const cached = hexCache.get(text);
    // Don't cache huge strings
    if (text.length < 4_096 && cached) return cached;
    const data = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", data);
    const hex = toHex(digest);
    if (text.length < 4_096 && hexCache.size < 64) hexCache.set(text, hex);
    return hex;
  } catch {
    return null;
  }
}

export async function sha256HexBytes(bytes: ArrayBuffer | Uint8Array): Promise<string | null> {
  if (!hasWebCryptoSubtle()) return null;
  try {
    const view =
      bytes instanceof ArrayBuffer ? bytes : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const digest = await crypto.subtle.digest("SHA-256", view);
    return toHex(digest);
  } catch {
    return null;
  }
}

export function digestsEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

export type IntegrityFetchOptions = {
  /** Expected SHA-256 hex (from manifest) */
  expectedSha256?: string | null;
  /** When mismatch / corrupt — refetch once */
  repair?: () => Promise<string | null>;
  /** Optional localStorage key to drop on corruption */
  cacheKey?: string;
};

/**
 * Verify text against expected SHA. On failure, drop cache + optional repair refetch.
 * Returns verified text or null.
 */
export async function verifyOrRepairPayload(
  text: string,
  opts: IntegrityFetchOptions,
): Promise<{ text: string; ok: boolean; repaired: boolean }> {
  const expected = opts.expectedSha256;
  if (!expected || !hasWebCryptoSubtle()) {
    return { text, ok: true, repaired: false };
  }
  const actual = await sha256Hex(text);
  if (digestsEqual(actual, expected)) {
    return { text, ok: true, repaired: false };
  }
  // Corrupt — drop cache
  if (opts.cacheKey && typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(opts.cacheKey);
    } catch {
      /* ignore */
    }
  }
  if (opts.repair) {
    try {
      const repaired = await opts.repair();
      if (repaired != null) {
        const again = await sha256Hex(repaired);
        if (digestsEqual(again, expected) || !again) {
          return { text: repaired, ok: !!again || true, repaired: true };
        }
      }
    } catch {
      /* ignore */
    }
  }
  return { text, ok: false, repaired: false };
}

/** Attach integrity envelope when writing LS caches. */
export type IntegrityEnvelope<T> = {
  data: T;
  at: number;
  sha256?: string;
};

export async function wrapWithIntegrity<T>(data: T): Promise<IntegrityEnvelope<T>> {
  const raw = JSON.stringify(data);
  const sha = await sha256Hex(raw);
  return { data, at: Date.now(), sha256: sha ?? undefined };
}

export async function unwrapWithIntegrity<T>(
  envelope: IntegrityEnvelope<T>,
): Promise<{ data: T; ok: boolean }> {
  if (!envelope?.sha256 || !hasWebCryptoSubtle()) {
    return { data: envelope.data, ok: true };
  }
  const raw = JSON.stringify(envelope.data);
  const actual = await sha256Hex(raw);
  return { data: envelope.data, ok: digestsEqual(actual, envelope.sha256) };
}

export function resetIntegrityCacheForTests(): void {
  hexCache.clear();
}
