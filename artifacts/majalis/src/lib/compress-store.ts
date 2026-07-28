/**
 * Transparent JSON compression for large local datasets.
 * Prefers CompressionStream (gzip); falls back to raw JSON.
 * Logic-only — no UI.
 */

import { supports } from "@/lib/feature-detect";

const MAGIC = "mjz1:"; // prefix for compressed base64 payloads

export type CompressResult = {
  payload: string;
  compressed: boolean;
  rawBytes: number;
  storedBytes: number;
};

function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = bytes.subarray(i, i + CHUNK);
    let s = "";
    for (let j = 0; j < slice.length; j++) s += String.fromCharCode(slice[j]!);
    parts.push(s);
  }
  return btoa(parts.join(""));
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function gzipEncode(text: string): Promise<Uint8Array> {
  const stream = new CompressionStream("gzip");
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  await writer.write(encoder.encode(text));
  await writer.close();
  const buf = await new Response(stream.readable).arrayBuffer();
  return new Uint8Array(buf);
}

async function gzipDecode(bytes: Uint8Array): Promise<string> {
  const stream = new DecompressionStream("gzip");
  const writer = stream.writable.getWriter();
  await writer.write(bytes);
  await writer.close();
  return await new Response(stream.readable).text();
}

/**
 * Compress a JSON-serializable value to a storage string.
 * Small payloads (< minBytes) stay uncompressed to avoid overhead.
 */
export async function compressJson(
  value: unknown,
  { minBytes = 2_048 }: { minBytes?: number } = {},
): Promise<CompressResult> {
  const raw = JSON.stringify(value);
  const rawBytes = raw.length * 2; // UTF-16 rough
  if (!supports("compressionStream") || raw.length < minBytes) {
    return { payload: raw, compressed: false, rawBytes, storedBytes: raw.length };
  }
  try {
    const gz = await gzipEncode(raw);
    const b64 = bytesToBase64(gz);
    const payload = MAGIC + b64;
    // Only keep compression if it actually shrinks
    if (payload.length >= raw.length) {
      return { payload: raw, compressed: false, rawBytes, storedBytes: raw.length };
    }
    return { payload, compressed: true, rawBytes, storedBytes: payload.length };
  } catch {
    return { payload: raw, compressed: false, rawBytes, storedBytes: raw.length };
  }
}

/** Decompress a storage string produced by compressJson (or plain JSON). */
export async function decompressJson<T>(payload: string): Promise<T | null> {
  if (!payload) return null;
  try {
    if (payload.startsWith(MAGIC)) {
      if (!supports("compressionStream")) return null;
      const bytes = base64ToBytes(payload.slice(MAGIC.length));
      const text = await gzipDecode(bytes);
      return JSON.parse(text) as T;
    }
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}

/** Sync-friendly: write compressed when possible; fire-and-forget async compress. */
export function writeLocalCompressed(
  key: string,
  value: unknown,
  storage: Storage = localStorage,
): void {
  const raw = JSON.stringify(value);
  try {
    storage.setItem(key, raw);
  } catch {
    /* quota */
  }
  if (!supports("compressionStream") || raw.length < 2_048) return;
  void compressJson(value).then((r) => {
    if (!r.compressed) return;
    try {
      storage.setItem(key, r.payload);
    } catch {
      /* ignore */
    }
  });
}

/** Read possibly-compressed JSON from storage. */
export async function readLocalCompressed<T>(
  key: string,
  storage: Storage = localStorage,
): Promise<T | null> {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return await decompressJson<T>(raw);
  } catch {
    return null;
  }
}

/** Sync read — only works for uncompressed; compressed returns null (use async). */
export function readLocalCompressedSync<T>(
  key: string,
  storage: Storage = localStorage,
): T | null {
  try {
    const raw = storage.getItem(key);
    if (!raw || raw.startsWith(MAGIC)) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
