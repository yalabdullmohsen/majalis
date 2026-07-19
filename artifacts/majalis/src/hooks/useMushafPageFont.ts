import { useEffect, useState } from "react";

/**
 * useMushafPageFont — يحمّل خط QPC V2 الخاص بصفحة واحدة (public/fonts/qpc-v2/pN.woff2)
 * عبر FontFace API، مع تحميل مسبق للصفحة الحالية ± 2 (القسم 5.3)، وذاكرة
 * LRU لا تُبقي أكثر من 12 خط صفحة محمَّلًا في الذاكرة دفعة واحدة (تُزال
 * الأقدم استخدامًا via document.fonts.delete — لا تأثير على صفحة ظاهرة
 * حاليًا، فقط صفحات بعيدة عن نطاق التصفح الحالي).
 *
 * font-display:block إلزامي فعليًا هنا عبر انتظار تحميل الخط قبل عرض أي
 * نص — لا FOUT أبدًا (خط بديل سيعرض رموزًا PUA غير مفهومة بلا معنى).
 */
const MAX_LOADED = 12;
const loadedFonts = new Map<number, FontFace>(); // page -> FontFace، بترتيب الاستخدام (Map يحفظ ترتيب الإدراج)

function fontFamilyForPage(page: number): string {
  return `qpc-page-${page}`;
}

async function ensurePageFontLoaded(page: number): Promise<void> {
  if (loadedFonts.has(page)) {
    // اجعله "الأحدث استخدامًا": احذفه وأعد إدراجه (Map يحفظ ترتيب الإدراج).
    const f = loadedFonts.get(page)!;
    loadedFonts.delete(page);
    loadedFonts.set(page, f);
    return;
  }

  const family = fontFamilyForPage(page);
  const face = new FontFace(family, `url(/fonts/qpc-v2/p${page}.woff2) format("woff2")`, {
    display: "block",
  });
  await face.load();
  document.fonts.add(face);
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

/** true فور تحميل خط الصفحة المطلوبة فعليًا وجاهزيته للعرض. */
export function useMushafPageFont(pageNumber: number | null): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pageNumber === null) return;
    let cancelled = false;
    setReady(false);

    ensurePageFontLoaded(pageNumber)
      .then(() => { if (!cancelled) setReady(true); })
      .catch(() => { if (!cancelled) setReady(false); });

    // تحميل مسبق صامت للصفحتين قبل وبعد (لا ينتظرهما هذا الأثر، ولا يُغيّر ready).
    for (const neighbor of [pageNumber - 2, pageNumber - 1, pageNumber + 1, pageNumber + 2]) {
      if (neighbor >= 1 && neighbor <= 604) void ensurePageFontLoaded(neighbor).catch(() => {});
    }

    return () => { cancelled = true; };
  }, [pageNumber]);

  return ready;
}
