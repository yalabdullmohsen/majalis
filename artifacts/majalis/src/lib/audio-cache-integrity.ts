/**
 * Offline / SW audio cache integrity — detect truncated or corrupt MP3 blobs.
 * Quiet background revalidation without touching UI timeline.
 * Logic-only.
 */

/** Minimum plausible full-surah / ayah mp3 size (bytes). */
export const AUDIO_MIN_BYTES = 2_048;

/** Magic: ID3 tag or MPEG frame sync. */
export function looksLikeMp3(bytes: ArrayBuffer | Uint8Array): boolean {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (u8.length < 3) return false;
  // ID3v2
  if (u8[0] === 0x49 && u8[1] === 0x44 && u8[2] === 0x33) return true;
  // MPEG frame sync 0xFFEx
  if (u8[0] === 0xff && (u8[1]! & 0xe0) === 0xe0) return true;
  return false;
}

export type AudioIntegrityResult =
  | { ok: true; size: number }
  | { ok: false; reason: "empty" | "too_small" | "bad_magic" | "length_mismatch"; size: number };

export async function validateAudioBlob(
  blob: Blob | null | undefined,
  opts?: { expectedLength?: number | null; minBytes?: number },
): Promise<AudioIntegrityResult> {
  if (!blob) return { ok: false, reason: "empty", size: 0 };
  const size = blob.size;
  const min = opts?.minBytes ?? AUDIO_MIN_BYTES;
  if (size < min) return { ok: false, reason: "too_small", size };

  const expected = opts?.expectedLength;
  if (typeof expected === "number" && expected > 0) {
    // Allow 1% slack for encoding padding; reject severe truncation
    if (size < expected * 0.95) {
      return { ok: false, reason: "length_mismatch", size };
    }
  }

  const head = await blob.slice(0, 16).arrayBuffer();
  if (!looksLikeMp3(head)) return { ok: false, reason: "bad_magic", size };
  return { ok: true, size };
}

/**
 * Validate a Response body for audio caching.
 * Consumes a clone — original Response remains usable by caller if not body-locked.
 */
export async function validateAudioResponse(res: Response): Promise<{
  ok: boolean;
  blob: Blob | null;
  reason?: AudioIntegrityResult["reason"];
}> {
  if (!res.ok) return { ok: false, blob: null, reason: "empty" };
  const contentLength = Number(res.headers.get("content-length") || 0);
  try {
    const blob = await res.blob();
    const check = await validateAudioBlob(blob, {
      expectedLength: contentLength > 0 ? contentLength : null,
    });
    if (!check.ok) return { ok: false, blob: null, reason: check.reason };
    return { ok: true, blob };
  } catch {
    return { ok: false, blob: null, reason: "empty" };
  }
}

export function isAudioCdnUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname.includes("everyayah.com") ||
      u.hostname.includes("mp3quran.net") ||
      /\.mp3(\?|$)/i.test(u.pathname)
    );
  } catch {
    return false;
  }
}
