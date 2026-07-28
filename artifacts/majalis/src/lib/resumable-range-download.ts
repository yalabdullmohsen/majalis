/**
 * Resumable HTTP Range downloads for large offline assets (audio surahs, packs).
 * Logic-only — no UI.
 */

export type RangeProbe = {
  supportsRange: boolean;
  contentLength: number | null;
  etag: string | null;
};

export type ChunkDownloadProgress = {
  bytesReceived: number;
  totalBytes: number | null;
  chunkIndex: number;
};

export type PartialAssetStore = {
  getPartial(assetKey: string): Promise<Uint8Array | null>;
  putPartial(assetKey: string, bytes: Uint8Array, meta?: { etag?: string | null }): Promise<void>;
  clearPartial(assetKey: string): Promise<void>;
};

const DEFAULT_CHUNK = 512 * 1024; // 512 KiB

/** Probe Accept-Ranges / Content-Length without downloading the body. */
export async function probeRangeSupport(
  url: string,
  signal?: AbortSignal,
): Promise<RangeProbe> {
  try {
    const head = await fetch(url, { method: "HEAD", signal });
    if (head.ok) {
      const accept = (head.headers.get("accept-ranges") || "").toLowerCase();
      const len = parseInt(head.headers.get("content-length") || "", 10);
      return {
        supportsRange: accept.includes("bytes"),
        contentLength: Number.isFinite(len) ? len : null,
        etag: head.headers.get("etag"),
      };
    }
  } catch {
    /* fall through to Range probe */
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      signal,
    });
    if (res.status === 206) {
      const cr = res.headers.get("content-range") || "";
      const m = /\/(\d+)\s*$/.exec(cr);
      const total = m ? parseInt(m[1], 10) : null;
      // Drain tiny body
      await res.arrayBuffer().catch(() => undefined);
      return {
        supportsRange: true,
        contentLength: Number.isFinite(total as number) ? total : null,
        etag: res.headers.get("etag"),
      };
    }
    await res.arrayBuffer().catch(() => undefined);
  } catch {
    /* ignore */
  }

  return { supportsRange: false, contentLength: null, etag: null };
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const p of parts) total += p.byteLength;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.byteLength;
  }
  return out;
}

/**
 * Download a URL with HTTP Range chunking; resumes from partial store on reconnect.
 * Falls back to a single full GET when the server rejects Range.
 */
export async function downloadResumable(
  url: string,
  assetKey: string,
  store: PartialAssetStore,
  opts?: {
    chunkSize?: number;
    signal?: AbortSignal;
    isCancelled?: () => boolean;
    onProgress?: (p: ChunkDownloadProgress) => void;
  },
): Promise<Blob> {
  const chunkSize = opts?.chunkSize ?? DEFAULT_CHUNK;
  const signal = opts?.signal;
  const isCancelled = opts?.isCancelled ?? (() => false);

  const existing = (await store.getPartial(assetKey)) ?? new Uint8Array(0);
  let offset = existing.byteLength;
  const parts: Uint8Array[] = existing.byteLength > 0 ? [existing] : [];

  const probe = await probeRangeSupport(url, signal);
  if (isCancelled() || signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  // No Range or already complete via unknown length → full fetch (or finish from partial if size known)
  if (!probe.supportsRange) {
    if (offset > 0) {
      // Can't resume without Range — restart cleanly
      await store.clearPartial(assetKey);
      parts.length = 0;
      offset = 0;
    }
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`download failed: ${res.status}`);
    const buf = new Uint8Array(await res.arrayBuffer());
    if (isCancelled() || signal?.aborted) throw new DOMException("Aborted", "AbortError");
    opts?.onProgress?.({
      bytesReceived: buf.byteLength,
      totalBytes: buf.byteLength,
      chunkIndex: 0,
    });
    await store.clearPartial(assetKey);
    return new Blob([buf], { type: res.headers.get("content-type") || "application/octet-stream" });
  }

  let totalBytes = probe.contentLength;
  let chunkIndex = 0;
  let contentType = "application/octet-stream";

  while (totalBytes == null || offset < totalBytes) {
    if (isCancelled() || signal?.aborted) {
      // Persist progress for resume
      const merged = concatBytes(parts);
      await store.putPartial(assetKey, merged, { etag: probe.etag });
      throw new DOMException("Aborted", "AbortError");
    }

    const end = totalBytes != null
      ? Math.min(offset + chunkSize - 1, totalBytes - 1)
      : offset + chunkSize - 1;

    const res = await fetch(url, {
      signal,
      headers: { Range: `bytes=${offset}-${end}` },
    });

    if (res.status === 416) {
      // Range not satisfiable — treat as complete if we have bytes
      break;
    }

    if (res.status === 200 && offset > 0) {
      // Server ignored Range mid-resume — restart
      await store.clearPartial(assetKey);
      parts.length = 0;
      offset = 0;
      const buf = new Uint8Array(await res.arrayBuffer());
      opts?.onProgress?.({
        bytesReceived: buf.byteLength,
        totalBytes: buf.byteLength,
        chunkIndex: 0,
      });
      await store.clearPartial(assetKey);
      return new Blob([buf], { type: res.headers.get("content-type") || contentType });
    }

    if (res.status !== 206 && res.status !== 200) {
      throw new Error(`range download failed: ${res.status}`);
    }

    contentType = res.headers.get("content-type") || contentType;
    if (totalBytes == null) {
      const cr = res.headers.get("content-range") || "";
      const m = /\/(\d+)\s*$/.exec(cr);
      if (m) totalBytes = parseInt(m[1], 10);
    }

    const chunk = new Uint8Array(await res.arrayBuffer());
    if (chunk.byteLength === 0) break;
    parts.push(chunk);
    offset += chunk.byteLength;
    chunkIndex += 1;

    // Checkpoint every chunk so reconnect resumes exactly
    await store.putPartial(assetKey, concatBytes(parts), { etag: probe.etag });

    opts?.onProgress?.({
      bytesReceived: offset,
      totalBytes,
      chunkIndex,
    });

    // If server returned less than requested and total unknown, assume EOF
    if (totalBytes == null && chunk.byteLength < chunkSize) break;
  }

  const finalBytes = concatBytes(parts);
  await store.clearPartial(assetKey);
  return new Blob([finalBytes], { type: contentType });
}

/** Pure helper: next byte offset after partial length (for tests / callers). */
export function resumeByteOffset(partialLength: number): number {
  return Math.max(0, Math.floor(partialLength));
}

/** Build a Range header value. */
export function formatRangeHeader(start: number, endInclusive: number): string {
  return `bytes=${start}-${endInclusive}`;
}

/** Parse Content-Range total size: `bytes 0-511/2048` → 2048 */
export function parseContentRangeTotal(header: string | null | undefined): number | null {
  if (!header) return null;
  const m = /\/(\d+)\s*$/.exec(header);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}
