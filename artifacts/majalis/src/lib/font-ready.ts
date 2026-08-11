/**
 * Variable Quranic / Uthmani font cache via CSS Font Loading API (FontFaceSet).
 * Reuses already-parsed faces across view changes — no re-download / re-parse flicker.
 * Logic-only — no CSS/DOM visual changes.
 */

export type FontReadyResult = {
  ready: boolean;
  waitedMs: number;
  fromCache?: boolean;
};

/** In-memory index of faces already added to document.fonts (by family+source key). */
const faceRegistry = new Map<string, FontFace>();
const inflight = new Map<string, Promise<FontFace | null>>();

function cacheKey(family: string, source: string): string {
  return `${family}::${source}`;
}

/**
 * Await document.fonts.ready (and optional family check) without throwing.
 */
export async function waitForDocumentFonts(timeoutMs = 8_000): Promise<FontReadyResult> {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (typeof document === "undefined" || !document.fonts) {
    return { ready: true, waitedMs: 0 };
  }
  try {
    const ready = document.fonts.ready;
    await Promise.race([
      ready,
      new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  } catch {
    /* ignore */
  }
  const waitedMs = (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0;
  return { ready: true, waitedMs };
}

/** True when a family is loadable / already loaded. */
export function isFontFamilyReady(family: string): boolean {
  if (typeof document === "undefined" || !document.fonts?.check) return true;
  try {
    return document.fonts.check(`16px "${family}"`) || document.fonts.check(`16px ${family}`);
  } catch {
    return true;
  }
}

/** Find an already-loaded FontFace in document.fonts matching family. */
export function findCachedFontFace(family: string): FontFace | null {
  if (typeof document === "undefined" || !document.fonts) return null;
  try {
    for (const face of document.fonts) {
      if (face.family === family || face.family === `"${family}"`) {
        if (face.status === "loaded" || face.status === "loading") return face;
      }
    }
  } catch {
    /* ignore */
  }
  for (const [key, face] of faceRegistry) {
    if (key.startsWith(`${family}::`) && face.status === "loaded") return face;
  }
  return null;
}

/**
 * Load a FontFace with FontFaceSet reuse — skips re-download when already cached.
 * Prevents glyph layout thrash and text flicker across dynamic view changes.
 */
export async function loadFontFaceSafe(
  family: string,
  source: string,
  descriptors?: FontFaceDescriptors,
): Promise<FontFace | null> {
  if (typeof FontFace === "undefined" || typeof document === "undefined") return null;

  const key = cacheKey(family, source);

  // 1) Registry hit
  const cached = faceRegistry.get(key);
  if (cached && cached.status === "loaded") {
    return cached;
  }

  // 2) Already in FontFaceSet (e.g. previous view)
  const existing = findCachedFontFace(family);
  if (existing && existing.status === "loaded") {
    faceRegistry.set(key, existing);
    return existing;
  }

  // 3) Coalesce concurrent loads for the same face
  const pending = inflight.get(key);
  if (pending) return pending;

  const work = (async (): Promise<FontFace | null> => {
    try {
      // Prefer FontFaceSet.load when available — uses browser font cache
      if (typeof document.fonts.load === "function") {
        try {
          const loaded = await document.fonts.load(`16px "${family}"`);
          if (loaded.length > 0 && isFontFamilyReady(family)) {
            const hit = findCachedFontFace(family);
            if (hit) {
              faceRegistry.set(key, hit);
              return hit;
            }
          }
        } catch {
          /* fall through to FontFace constructor */
        }
      }

      const face = new FontFace(family, source, descriptors);
      await face.load();
      if (![...document.fonts].includes(face)) {
        document.fonts.add(face);
      }
      faceRegistry.set(key, face);
      await waitForDocumentFonts(3_000);
      return face;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, work);
  return work;
}

/**
 * Gate a callback until fonts are ready — use before heavy text layout measures.
 */
export async function whenFontsReady<T>(fn: () => T | Promise<T>, timeoutMs = 8_000): Promise<T> {
  await waitForDocumentFonts(timeoutMs);
  return await fn();
}

/** Warm common Quranic / Hadith body fonts once (Amiri Quran etc.). */
export async function warmStaticQuranicFonts(
  families: string[] = ["Amiri Quran", "Scheherazade New"],
): Promise<void> {
  if (typeof document === "undefined" || !document.fonts?.load) return;
  for (const family of families) {
    if (isFontFamilyReady(family)) continue;
    try {
      await document.fonts.load(`16px "${family}"`);
    } catch {
      /* optional */
    }
  }
  await waitForDocumentFonts(2_000);
}

export function getFontCacheSize(): number {
  return faceRegistry.size;
}

/** يزيل وجهًا من document.fonts وfaceRegistry (نافذة ذاكرة الخطوط). */
export function unloadFontFace(face: FontFace | null | undefined, familyHint?: string): void {
  if (!face && !familyHint) return;
  try {
    if (face && typeof document !== "undefined" && document.fonts) {
      document.fonts.delete(face);
    }
  } catch {
    /* ignore */
  }
  const family = familyHint || face?.family?.replace(/^"|"$/g, "") || "";
  if (family) {
    for (const key of [...faceRegistry.keys()]) {
      if (key.startsWith(`${family}::`)) faceRegistry.delete(key);
    }
  }
}

export function resetFontCacheForTests(): void {
  faceRegistry.clear();
  inflight.clear();
}
