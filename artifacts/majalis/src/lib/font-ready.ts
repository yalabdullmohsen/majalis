/**
 * Quranic / page font loading — wait for document.fonts before layout work.
 * Logic-only — no CSS/DOM visual changes.
 */

export type FontReadyResult = {
  ready: boolean;
  waitedMs: number;
};

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

/**
 * Load a FontFace then wait until document.fonts reports it ready.
 * Prevents glyph layout thrash from measuring before PUA glyphs parse.
 */
export async function loadFontFaceSafe(
  family: string,
  source: string,
  descriptors?: FontFaceDescriptors,
): Promise<FontFace | null> {
  if (typeof FontFace === "undefined" || typeof document === "undefined") return null;
  try {
    const face = new FontFace(family, source, descriptors);
    await face.load();
    document.fonts.add(face);
    // Ensure the document font set has settled before callers measure
    await waitForDocumentFonts(3_000);
    return face;
  } catch {
    return null;
  }
}

/**
 * Gate a callback until fonts are ready — use before heavy text layout measures.
 */
export async function whenFontsReady<T>(fn: () => T | Promise<T>, timeoutMs = 8_000): Promise<T> {
  await waitForDocumentFonts(timeoutMs);
  return await fn();
}
