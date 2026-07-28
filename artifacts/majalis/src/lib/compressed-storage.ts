/**
 * Master polish — CompressionStream offline payload compression.
 * Cuts large Tafseer/Hadith JSON disk usage (~70% gzip-class). Fallback: raw.
 * Logic-only — no UI.
 */

import { decodeUtf8, encodeUtf8Copy } from "@/lib/text-codec";

const PREFIX = "mjz1:"; // compressed marker

export function canCompressStreams(): boolean {
  return typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";
}

async function streamToUint8(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.length;
    }
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function toBase64(bytes: Uint8Array): string {
  if (typeof btoa === "undefined") {
    // Node
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  if (typeof atob === "undefined") {
    return new Uint8Array(Buffer.from(b64, "base64"));
  }
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** Compress a UTF-8 string → prefix+base64 (or return raw if unsupported / tiny). */
export async function compressJsonString(raw: string): Promise<string> {
  if (!raw || raw.length < 512 || !canCompressStreams()) return raw;
  try {
    const bytes = encodeUtf8Copy(raw);
    const cs = new CompressionStream("gzip");
    const writer = cs.writable.getWriter();
    await writer.write(bytes);
    await writer.close();
    const compressed = await streamToUint8(cs.readable);
    if (compressed.length >= bytes.length * 0.95) return raw; // not worth it
    return PREFIX + toBase64(compressed);
  } catch {
    return raw;
  }
}

/** Decompress mjz1: payloads; pass-through for plain JSON strings. */
export async function decompressJsonString(stored: string): Promise<string> {
  if (!stored?.startsWith(PREFIX)) return stored;
  if (!canCompressStreams()) return stored.slice(PREFIX.length); // can't decode — caller may fail parse
  try {
    const bytes = fromBase64(stored.slice(PREFIX.length));
    const ds = new DecompressionStream("gzip");
    const writer = ds.writable.getWriter();
    await writer.write(bytes);
    await writer.close();
    const out = await streamToUint8(ds.readable);
    return decodeUtf8(out);
  } catch {
    return stored;
  }
}

/** JSON.stringify → compress for IDB/LS. */
export async function compressJsonValue(value: unknown): Promise<string> {
  return compressJsonString(JSON.stringify(value));
}

/** decompress → JSON.parse with fallback. */
export async function decompressJsonValue<T>(stored: string, fallback: T): Promise<T> {
  try {
    const raw = await decompressJsonString(stored);
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function isCompressedPayload(stored: string | null | undefined): boolean {
  return !!stored && stored.startsWith(PREFIX);
}
