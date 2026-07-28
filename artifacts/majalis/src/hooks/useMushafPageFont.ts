import { useEffect, useState } from "react";
import {
  loadFontFaceSafe,
  waitForDocumentFonts,
  findCachedFontFace,
  warmStaticQuranicFonts,
} from "@/lib/font-ready";
import { logDiagnostic } from "@/lib/diagnostics";
import { createMountGuard } from "@/lib/route-abort";

/**
 * useMushafPageFont — يحمّل خط QPC V2 الخاص بصفحة واحدة (public/fonts/qpc-v2/pN.woff2)
 * عبر FontFace API، مع تحميل مسبق للصفحة الحالية ± 2، وذاكرة
 * LRU لا تُبقي أكثر من 12 خط صفحة محمَّلًا.
 *
 * Part 16: waits document.fonts.ready after each face load so glyph layout
 * measurements (MushafPageV2 fit) never run against unparsed PUA glyphs.
 * Part 19: FontFaceSet registry reuse — zero re-download across view changes.
 */
const MAX_LOADED = 12;
const loadedFonts = new Map<number, FontFace>();
let staticWarmed = false;

function fontFamilyForPage(page: number): string {
  return `qpc-page-${page}`;
}

async function ensurePageFontLoaded(page: number): Promise<void> {
  if (loadedFonts.has(page)) {
    const f = loadedFonts.get(page)!;
    loadedFonts.delete(page);
    loadedFonts.set(page, f);
    return;
  }

  const family = fontFamilyForPage(page);

  // Reuse FontFaceSet if already parsed (view switch / back-navigation)
  const cached = findCachedFontFace(family);
  if (cached && cached.status === "loaded") {
    loadedFonts.set(page, cached);
    return;
  }

  const face = await loadFontFaceSafe(
    family,
    `url(/fonts/qpc-v2/p${page}.woff2) format("woff2")`,
    { display: "block" },
  );
  if (!face) throw new Error(`font load failed: ${page}`);
  loadedFonts.set(page, face);

  if (loadedFonts.size > MAX_LOADED) {
    const oldestPage = loadedFonts.keys().next().value;
    if (oldestPage !== undefined && oldestPage !== page) {
      const oldFace = loadedFonts.get(oldestPage);
      if (oldFace) {
        document.fonts.delete(oldFace);
        loadedFonts.delete(oldestPage);
      }
    }
  }
}

export function mushafPageFontFamily(page: number): string {
  return fontFamilyForPage(page);
}

/** true فور تحميل خط الصفحة المطلوبة وجاهزية document.fonts للقياس. */
export function useMushafPageFont(pageNumber: number | null): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pageNumber === null) return;
    const guard = createMountGuard();
    setReady(false);

    (async () => {
      try {
        if (!staticWarmed) {
          staticWarmed = true;
          void warmStaticQuranicFonts();
        }
        await ensurePageFontLoaded(pageNumber);
        const wait = await waitForDocumentFonts(4_000);
        if (wait.waitedMs > 50) {
          logDiagnostic("font-wait", `page ${pageNumber}`, { ms: Math.round(wait.waitedMs) });
        }
        if (guard.isCurrent()) setReady(true);
      } catch {
        if (guard.isCurrent()) setReady(false);
      }
    })();

    for (const neighbor of [pageNumber - 2, pageNumber - 1, pageNumber + 1, pageNumber + 2]) {
      if (neighbor >= 1 && neighbor <= 604) void ensurePageFontLoaded(neighbor).catch(() => {});
    }

    return () => {
      guard.abort();
    };
  }, [pageNumber]);

  return ready;
}
