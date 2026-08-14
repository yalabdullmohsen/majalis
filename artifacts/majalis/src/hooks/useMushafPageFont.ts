import { useEffect, useState } from "react";
import {
  loadFontFaceSafe,
  waitForDocumentFonts,
  findCachedFontFace,
  warmStaticQuranicFonts,
  isFontFamilyReady,
  unloadFontFace,
} from "@/lib/font-ready";
import { logDiagnostic } from "@/lib/diagnostics";
import { createMountGuard } from "@/lib/route-abort";
import {
  pagesInWindow,
  QPC_FONT_MEMORY_WINDOW,
  QPC_FONT_PREFETCH_RADIUS,
  resolveQpcFontFaceSource,
  revokeQpcFontBlob,
} from "@/lib/qpc-font-pack";

/**
 * useMushafPageFont — يحمّل خط QPC V2 (WOFF2) للصفحة الحالية + جوار ±٢،
 * ويبقي في الذاكرة ≤٥ وجوه فقط مع تحرير document.fonts لما خارج النافذة.
 *
 * المصدر: Cache API إن وُجد، وإلا `/fonts/qpc-v2/pN.woff2`.
 */

export type MushafPageFontStatus = {
  ready: boolean;
  failed: boolean;
};

const loadedFonts = new Map<number, FontFace>();
let staticWarmed = false;

function fontFamilyForPage(page: number): string {
  return `qpc-page-${page}`;
}

function pruneOutsideWindow(center: number): void {
  const keep = new Set(pagesInWindow(center, QPC_FONT_PREFETCH_RADIUS));
  /* صفحة ١ دائمة: بسملة زخرفية موحّدة (code_v2 + qpc-page-1) على كل الصفحات */
  keep.add(1);
  for (const page of [...loadedFonts.keys()]) {
    if (keep.has(page)) continue;
    const face = loadedFonts.get(page);
    unloadFontFace(face, fontFamilyForPage(page));
    revokeQpcFontBlob(page);
    loadedFonts.delete(page);
  }
  /* حارس إضافي إن تجاوز الحجم لأي سبب — لا تُفرِّغ صفحة ١ */
  while (loadedFonts.size > QPC_FONT_MEMORY_WINDOW + 1) {
    const oldest = [...loadedFonts.keys()].find((p) => p !== 1 && p !== center);
    if (oldest === undefined) break;
    const face = loadedFonts.get(oldest);
    unloadFontFace(face, fontFamilyForPage(oldest));
    revokeQpcFontBlob(oldest);
    loadedFonts.delete(oldest);
  }
}

/** يحمّل خط صفحة QPC (مثلاً صفحة ١ لبسملة موحّدة على كل الصفحات). */
export async function ensureMushafPageFont(page: number): Promise<void> {
  return ensurePageFontLoaded(page);
}

async function ensurePageFontLoaded(page: number): Promise<void> {
  if (loadedFonts.has(page)) {
    const f = loadedFonts.get(page)!;
    loadedFonts.delete(page);
    loadedFonts.set(page, f);
    const family = fontFamilyForPage(page);
    if (!isFontFamilyReady(family)) {
      loadedFonts.delete(page);
      throw new Error(`cached font unusable: ${page}`);
    }
    return;
  }

  const family = fontFamilyForPage(page);
  const cached = findCachedFontFace(family);
  if (cached && cached.status === "loaded" && isFontFamilyReady(family)) {
    loadedFonts.set(page, cached);
    return;
  }

  const source = await resolveQpcFontFaceSource(page);
  const face = await loadFontFaceSafe(family, source, { display: "block" });
  if (!face) throw new Error(`font load failed: ${page}`);

  await waitForDocumentFonts(3_000);
  if (!isFontFamilyReady(family)) {
    unloadFontFace(face, family);
    throw new Error(`font check failed: ${page}`);
  }

  loadedFonts.set(page, face);
}

export function mushafPageFontFamily(page: number): string {
  return fontFamilyForPage(page);
}

/** للاختبارات / التشخيص */
export function getLoadedQpcFontPages(): number[] {
  return [...loadedFonts.keys()];
}

export function resetLoadedQpcFontsForTests(): void {
  for (const [page, face] of loadedFonts) {
    unloadFontFace(face, fontFamilyForPage(page));
    revokeQpcFontBlob(page);
  }
  loadedFonts.clear();
  staticWarmed = false;
}

const IDLE: MushafPageFontStatus = { ready: false, failed: false };

export function useMushafPageFont(pageNumber: number | null): MushafPageFontStatus {
  const [status, setStatus] = useState<MushafPageFontStatus>(IDLE);

  useEffect(() => {
    if (pageNumber === null) {
      setStatus(IDLE);
      return;
    }
    const guard = createMountGuard();
    setStatus(IDLE);

    (async () => {
      try {
        if (!staticWarmed) {
          staticWarmed = true;
          void warmStaticQuranicFonts();
        }
        await ensurePageFontLoaded(pageNumber);
        pruneOutsideWindow(pageNumber);
        const wait = await waitForDocumentFonts(4_000);
        if (wait.waitedMs > 50) {
          logDiagnostic("font-wait", `page ${pageNumber}`, { ms: Math.round(wait.waitedMs) });
        }
        if (!isFontFamilyReady(fontFamilyForPage(pageNumber))) {
          throw new Error(`font still unusable after wait: ${pageNumber}`);
        }
        if (guard.isCurrent()) setStatus({ ready: true, failed: false });
      } catch (err) {
        logDiagnostic("font-fail", `page ${pageNumber}`, {
          error: String((err as Error)?.message || err),
        });
        if (guard.isCurrent()) setStatus({ ready: false, failed: true });
      }
    })();

    for (const neighbor of pagesInWindow(pageNumber, QPC_FONT_PREFETCH_RADIUS)) {
      if (neighbor === pageNumber) continue;
      void ensurePageFontLoaded(neighbor)
        .then(() => {
          if (guard.isCurrent()) pruneOutsideWindow(pageNumber);
        })
        .catch(() => {});
    }

    return () => {
      guard.abort();
    };
  }, [pageNumber]);

  return status;
}
