/**
 * Streaming binary text decoder — TextDecoderStream / Uint8Array path.
 * Minimizes intermediate string allocations during large payload ingestion.
 * Logic-only — no UI.
 */

export type StreamJsonOptions = {
  signal?: AbortSignal;
  /** Fallback to full arrayBuffer+JSON.parse when streams unsupported */
  preferStream?: boolean;
};

/**
 * Read a Response body as UTF-8 text via streaming decoder when available.
 * Returns the full string (callers that need incremental parse can use decodeStreamChunks).
 */
export async function decodeResponseText(res: Response): Promise<string> {
  if (!res.body || typeof TextDecoderStream === "undefined" || typeof ReadableStream === "undefined") {
    return res.text();
  }
  try {
    const stream = res.body.pipeThrough(new TextDecoderStream("utf-8"));
    const reader = stream.getReader();
    const parts: string[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) parts.push(value);
    }
    return parts.length === 1 ? parts[0]! : parts.join("");
  } catch {
    // Body may already be consumed — best effort
    try {
      return await res.text();
    } catch {
      return "";
    }
  }
}

/**
 * Decode ArrayBuffer / Uint8Array to string with a reusable TextDecoder.
 */
const sharedDecoder =
  typeof TextDecoder !== "undefined" ? new TextDecoder("utf-8", { fatal: false }) : null;

export function decodeUtf8(bytes: ArrayBuffer | Uint8Array): string {
  if (!sharedDecoder) {
    // Extremely old environments
    const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let s = "";
    for (let i = 0; i < view.length; i++) s += String.fromCharCode(view[i]!);
    return decodeURIComponent(escape(s));
  }
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return sharedDecoder.decode(view);
}

/**
 * Fetch URL and parse JSON using binary buffer path (fewer string intermediates than res.json() on some engines).
 */
export async function fetchJsonBinary<T = unknown>(
  url: string,
  opts?: StreamJsonOptions & RequestInit,
): Promise<T> {
  const { signal, preferStream = true, ...init } = opts ?? {};
  const res = await fetch(url, { ...init, signal });
  if (!res.ok) throw new Error(`fetchJsonBinary failed: ${res.status}`);

  if (preferStream && res.body && typeof TextDecoderStream !== "undefined") {
    const text = await decodeResponseText(res);
    return JSON.parse(text) as T;
  }

  const buf = await res.arrayBuffer();
  const text = decodeUtf8(buf);
  return JSON.parse(text) as T;
}

/**
 * Incrementally accumulate decoded chunks — yields control via optional onChunk.
 */
export async function decodeStreamChunks(
  body: ReadableStream<Uint8Array>,
  onChunk?: (chunk: string, index: number) => void | Promise<void>,
): Promise<string> {
  if (typeof TextDecoderStream === "undefined") {
    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        total += value.byteLength;
      }
    }
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.byteLength;
    }
    const text = decodeUtf8(merged);
    if (onChunk) await onChunk(text, 0);
    return text;
  }

  const stream = body.pipeThrough(new TextDecoderStream("utf-8"));
  const reader = stream.getReader();
  const parts: string[] = [];
  let i = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      parts.push(value);
      if (onChunk) await onChunk(value, i++);
    }
  }
  return parts.length === 1 ? parts[0]! : parts.join("");
}
