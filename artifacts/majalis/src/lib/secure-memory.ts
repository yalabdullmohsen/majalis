/**
 * Secure-context memory hygiene for crypto buffers, Blob URLs, and transient bytes.
 * Zeroes ArrayBuffers after use; tracks/revokes object URLs. Logic-only — no UI.
 */

const trackedUrls = new Set<string>();

export function isSecureContextNow(): boolean {
  if (typeof window === "undefined") return false;
  return window.isSecureContext === true;
}

/** Overwrite Uint8Array (and underlying buffer view) with zeros. */
export function zeroBytes(view: ArrayBufferView | null | undefined): void {
  if (!view) return;
  try {
    const u8 = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    u8.fill(0);
  } catch {
    /* ignore detached buffers */
  }
}

/** Zero a raw ArrayBuffer. */
export function zeroArrayBuffer(buf: ArrayBuffer | null | undefined): void {
  if (!buf) return;
  try {
    new Uint8Array(buf).fill(0);
  } catch {
    /* ignore */
  }
}

/**
 * Decode base64url → Uint8Array for Web Push / Web Crypto.
 * Caller should zeroBytes() after the API consumes the key.
 */
export function decodeBase64UrlToBytes(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Track blob: URL for mandatory revoke. */
export function trackObjectUrl(url: string): string {
  if (url?.startsWith("blob:")) trackedUrls.add(url);
  return url;
}

export function createTrackedObjectUrl(blob: Blob): string {
  return trackObjectUrl(URL.createObjectURL(blob));
}

export function revokeObjectUrl(url: string | null | undefined): void {
  if (!url || !url.startsWith("blob:")) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    /* ignore */
  }
  trackedUrls.delete(url);
}

export function revokeAllTrackedObjectUrls(): void {
  for (const u of [...trackedUrls]) revokeObjectUrl(u);
}

export function getTrackedObjectUrlCount(): number {
  return trackedUrls.size;
}

/**
 * Safe JSON parse that never throws; returns fallback on failure.
 * Does not keep the raw string after parse (caller drops reference).
 */
export function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Run Web Crypto digest when secure context; otherwise null.
 * Digests are not secret but we still avoid holding input copies.
 */
export async function secureDigestSha256(data: ArrayBufferView): Promise<ArrayBuffer | null> {
  if (!isSecureContextNow() || !globalThis.crypto?.subtle) return null;
  try {
    const copy = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    const digest = await crypto.subtle.digest("SHA-256", copy);
    zeroArrayBuffer(copy);
    return digest;
  } catch {
    return null;
  }
}

export function resetSecureMemoryForTests(): void {
  trackedUrls.clear();
}
