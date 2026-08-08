import { useEffect, useState } from "react";
import {
  loadFontFaceSafe,
  waitForDocumentFonts,
  findCachedFontFace,
  warmStaticQuranicFonts,
  isFontFamilyReady,
} from "@/lib/font-ready";
import { logDiagnostic } from "@/lib/diagnostics";
import { createMountGuard } from "@/lib/route-abort";

/**
 * useMushafPageFont — يحمّل خط QPC V2 الخاص بصفحة واحدة (public/fonts/qpc-v2/pN.woff2)
 * عبر FontFace API، مع تحميل مسبق للصفحة الحالية والمجاورتين فقط (±1)،
 * وfont-display:block لتفادي وميض الاستبدال. LRU ≤ 12 خط صفحة.
 *
 * Part 16: waits document.fonts.ready after each face load so glyph layout
 * measurements (MushafPageV2 fit) never run against unparsed PUA glyphs.
 * Part 19: FontFaceSet registry reuse — zero re-download across view changes.
 *
 * ⚠️ السبب الجذري لـ«تكسّر خط المصحف»: code_v2 يستخدم نقاط Unicode في
 * Arabic Presentation Forms (مثل U+FC41) يعيد خط الصفحة QPC تعريفها.
 * إن عُرضت بخط Amiri/Noto (unicode-range يغطي FB50–FDFF) تظهر حروفًا
 * عشوائية («لخ لم لى…»). لذلك: لا نُعلِن ready إلا بعد fonts.check،
 * وعند الفشل يُبلَّغ failed ليتراجع العارض إلى نص Unicode + Amiri.
 */

export type MushafPageFontStatus = {
  /** خط الصفحة جاهز للقياس والعرض بـ glyphText */
  ready: boolean;
  /** فشل التحميل/التحقق — يجب التراجع إلى الوضع الخفيف */
  failed: boolean;
};

const MAX_LOADED = 12;
const loadedFonts = new Map<number, FontFace>();
let staticWarmed = false;

function fontFamilyForPage(page: number): string {
  return `qpc-page-${page}`;
}

/** يحترم Vite/Capacitor BASE_URL — لا يفترض جذر `/` دائمًا. */
function pageFontSource(page: number): string {
  const base = String(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  return `url(${base}fonts/qpc-v2/p${page}.woff2) format("woff2")`;
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

  // Reuse FontFaceSet if already parsed (view switch / back-navigation)
  const cached = findCachedFontFace(family);
  if (cached && cached.status === "loaded" && isFontFamilyReady(family)) {
    loadedFonts.set(page, cached);
    return;
  }

  const face = await loadFontFaceSafe(
    family,
    pageFontSource(page),
    { display: "block" },
  );
  if (!face) throw new Error(`font load failed: ${page}`);

  await waitForDocumentFonts(3_000);
  if (!isFontFamilyReady(family)) {
    try {
      document.fonts.delete(face);
    } catch {
      /* ignore */
    }
    throw new Error(`font check failed: ${page}`);
  }

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

const IDLE: MushafPageFontStatus = { ready: false, failed: false };

/** حالة تحميل خط الصفحة المطلوبة وجاهزية document.fonts للقياس. */
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

    for (const neighbor of [pageNumber - 1, pageNumber + 1]) {
      if (neighbor >= 1 && neighbor <= 604) void ensurePageFontLoaded(neighbor).catch(() => {});
    }

    return () => {
      guard.abort();
    };
  }, [pageNumber]);

  return status;
}
