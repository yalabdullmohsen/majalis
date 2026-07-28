/**
 * Part 22 — Zero-allocation Text encoding/decoding pipeline.
 * Reuses process-wide TextEncoder / TextDecoder and a growable Uint8Array
 * scratch buffer via encodeInto when available — cuts GC during multi-MB
 * Arabic indexing. Logic-only — no UI.
 */

const encoder: TextEncoder =
  typeof TextEncoder !== "undefined" ? new TextEncoder() : (null as unknown as TextEncoder);
const decoder: TextDecoder =
  typeof TextDecoder !== "undefined"
    ? new TextDecoder("utf-8", { fatal: false })
    : (null as unknown as TextDecoder);

/** Shared scratch buffer — grows monotonically, never shrinks (stable shape). */
let scratch = new Uint8Array(0);
let scratchLen = 0;

function ensureScratch(minBytes: number): Uint8Array {
  if (scratch.length >= minBytes) return scratch;
  // Grow 1.5× to amortize reallocations
  const next = Math.max(minBytes, Math.ceil(scratch.length * 1.5) || minBytes);
  scratch = new Uint8Array(next);
  return scratch;
}

/** Global singleton encoder (never allocate per call). */
export function getTextEncoder(): TextEncoder {
  return encoder;
}

/** Global singleton decoder. */
export function getTextDecoder(): TextDecoder {
  return decoder;
}

/**
 * Encode UTF-8 into the shared scratch buffer when `encodeInto` exists;
 * returns a view (not a copy) valid until the next encodeUtf8 call.
 * For durable storage, use `encodeUtf8Copy`.
 */
export function encodeUtf8(text: string): Uint8Array {
  if (!encoder) {
    // Extremely old environments — empty fallback
    scratchLen = 0;
    return scratch.subarray(0, 0);
  }
  // Worst-case UTF-8 length is 3 bytes per JS code unit for BMP + surrogates
  const max = text.length * 3;
  const buf = ensureScratch(max);
  if (typeof encoder.encodeInto === "function") {
    const result = encoder.encodeInto(text, buf);
    scratchLen = result.written ?? 0;
    return buf.subarray(0, scratchLen);
  }
  const encoded = encoder.encode(text);
  const dest = ensureScratch(encoded.length);
  dest.set(encoded);
  scratchLen = encoded.length;
  return dest.subarray(0, scratchLen);
}

/** Durable copy — allocates once for the exact byte length. */
export function encodeUtf8Copy(text: string): Uint8Array {
  if (!encoder) return new Uint8Array(0);
  return encoder.encode(text);
}

export function decodeUtf8(bytes: ArrayBufferView | ArrayBuffer): string {
  if (!decoder) return "";
  try {
    if (bytes instanceof ArrayBuffer) return decoder.decode(bytes);
    return decoder.decode(bytes);
  } catch {
    return "";
  }
}

/** UTF-8 byte length without retaining the encoded buffer (uses scratch). */
export function utf8ByteLength(text: string): number {
  return encodeUtf8(text).length;
}

/** Last encode scratch length (tests / diagnostics). */
export function getScratchByteLength(): number {
  return scratchLen;
}

export function getScratchCapacity(): number {
  return scratch.length;
}

/** Test helper — does not free the buffer (V8 shape stable). */
export function resetTextCodecScratchForTests(): void {
  scratch = new Uint8Array(0);
  scratchLen = 0;
}
