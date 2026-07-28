/**
 * Master polish — HTTP Range resumable downloader.
 * Resumes large offline assets from exact byte offset after interruption.
 * Logic-only — no UI.
 */

export type RangeDownloadProgress = {
  received: number;
  total: number | null;
  done: boolean;
};

export type RangeDownloadOptions = {
  url: string;
  /** Prior partial bytes (e.g. from IDB). */
  existing?: Uint8Array | null;
  signal?: AbortSignal;
  onProgress?: (p: RangeDownloadProgress) => void;
  /** Chunk hint for progress only. */
  preferredChunk?: number;
};

export type RangeDownloadResult = {
  bytes: Uint8Array;
  fromByte: number;
  usedRange: boolean;
  contentType: string | null;
};

async function readResponseBytes(
  res: Response,
  onChunk?: (n: number) => void,
): Promise<Uint8Array> {
  if (!res.body || typeof res.body.getReader !== "function") {
    const buf = new Uint8Array(await res.arrayBuffer());
    onChunk?.(buf.length);
    return buf;
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.length;
      onChunk?.(value.length);
    }
  }
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

/**
 * Download with Range resume. If server ignores Range, falls back to full GET.
 */
export async function downloadWithRangeResume(
  opts: RangeDownloadOptions,
): Promise<RangeDownloadResult> {
  const existing = opts.existing && opts.existing.length > 0 ? opts.existing : null;
  const fromByte = existing?.length ?? 0;

  const headers: Record<string, string> = {};
  if (fromByte > 0) headers.Range = `bytes=${fromByte}-`;

  let res: Response;
  try {
    res = await fetch(opts.url, { headers, signal: opts.signal });
  } catch (err) {
    throw err;
  }

  // 206 Partial Content — append
  if (res.status === 206 && existing) {
    let received = fromByte;
    const totalHeader = res.headers.get("content-range");
    let total: number | null = null;
    const m = totalHeader?.match(/\/(\d+)$/);
    if (m) total = Number(m[1]);

    const next = await readResponseBytes(res, (n) => {
      received += n;
      opts.onProgress?.({ received, total, done: false });
    });
    const merged = new Uint8Array(existing.length + next.length);
    merged.set(existing, 0);
    merged.set(next, existing.length);
    opts.onProgress?.({ received: merged.length, total: total ?? merged.length, done: true });
    return {
      bytes: merged,
      fromByte,
      usedRange: true,
      contentType: res.headers.get("content-type"),
    };
  }

  // 200 after Range request — server ignored Range; replace
  if (!res.ok) throw new Error(`range-download-${res.status}`);

  let received = 0;
  const len = Number(res.headers.get("content-length") || 0) || null;
  const bytes = await readResponseBytes(res, (n) => {
    received += n;
    opts.onProgress?.({ received, total: len, done: false });
  });
  opts.onProgress?.({ received: bytes.length, total: len ?? bytes.length, done: true });
  return {
    bytes,
    fromByte: 0,
    usedRange: false,
    contentType: res.headers.get("content-type"),
  };
}

/** Probe whether a URL supports Range requests. */
export async function supportsHttpRange(url: string, signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal,
    });
    const accept = res.headers.get("accept-ranges");
    return !!accept && accept.toLowerCase().includes("bytes");
  } catch {
    return false;
  }
}
