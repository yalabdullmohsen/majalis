/**
 * mushaf-v2-data.ts
 * تحميل وتحويل بيانات مصحف المدينة الحقيقية (تخطيط أسطر QPC V2) —
 * المصدر: public/data/quran-v2/ (604 صفحة + بيانات السور)، جُلبت حرفيًا
 * من api.qurancdn.com (راجع docs/mushaf-rebuild-inventory.md القسم 7
 * لتوثيق المصدر الكامل وسبب اعتماده بديلًا عن بوابة QUL المباشرة).
 * لا تطبيع ولا تعديل لأي نص هنا — نقل وتجميع فقط.
 */

import { pooledFetch } from "@/lib/fetch-pool";
import { LruCache } from "@/lib/lru-cache";
import { mapInChunks, yieldToMain } from "@/lib/yield-to-main";

export type QpcWord = {
  id: number;
  position: number;
  lineNumber: number;
  charType: "word" | "end" | string;
  textUthmani: string;
  /** نص Hafs بترميز Unicode عادي (تشكيل بأسلوب QPC) — للنسخ/البحث/قراءة الشاشة. */
  textQpcHafs: string;
  /** حرف/ligature من نطاق PUA خاص بخط *هذه الصفحة تحديدًا* — هذا فقط ما
   * يُعرَض بصريًا (عبر خط qpc-page-N)؛ لا يُستخدَم لأي غرض آخر (نسخ/بحث/
   * قراءة شاشة) لأنه بلا معنى خارج سياق ذلك الخط. */
  glyphText: string;
  audioUrl: string | null;
  /** مكرَّرة من الآية الأم عمدًا (denormalized) — تُغني عن أي بحث عكسي
   * لمعرفة أي آية تنتمي إليها كلمة عند التفاعل معها (نقرة تفتح Action Sheet). */
  verseKey: string;
  sajdahNumber: number | null;
};

export type QpcVerse = {
  verseKey: string; // "2:255"
  surahNumber: number;
  ayahNumber: number;
  pageNumber: number;
  juzNumber: number;
  hizbNumber: number;
  rubElHizbNumber: number;
  sajdahNumber: number | null;
  words: QpcWord[];
};

export type MushafChapter = {
  id: number;
  nameArabic: string;
  revelationPlace: "makkah" | "madinah";
  versesCount: number;
  bismillahPre: boolean;
  pages: [number, number];
};

/** عنصر واحد ضمن الشبكة الرأسية لصفحة (15 خانة): سطر آيات أو شارة/بسملة
 * كلٌّ في خانة مستقلة (`gridSlot` ١…١٥) على خط أساس mushaf-grid.json. */
export type MushafPageRow =
  | { kind: "line"; lineNumber: number; gridSlot: number; words: QpcWord[] }
  | {
      kind: "surah-header";
      surah: MushafChapter;
      spanRows: number;
      /** خانة الشارة (١…١٥) */
      bannerSlot: number;
      /** خانة البسملة إن وُجدت */
      basmalaSlot: number | null;
    };

export type MushafPageLayout = {
  pageNumber: number;
  juzNumber: number;
  rows: MushafPageRow[];
  surahsOnPage: MushafChapter[];
  /** سور تبدأ فعليًا في هذه الصفحة (آية ١) — لرأس الصفحة */
  surahsStartingOnPage: MushafChapter[];
  /**
   * تخطيط موحّد لكل الصفحات (بما فيها 1 و2): تحجيم من أعرض سطر،
   * تموضع مطلق على شبكة خطوط الأساس الـ١٥.
   */
  layoutMode: "standard";
  /** عدد الأسطر الفعلية ذات الكلمات (من mushaf=1) — للتحجيم */
  ayahLineCount: number;
  /** رقم الحزب الجاري على الصفحة (من أول آية) — للرأس */
  hizbNumber: number;
  /** رقم الحزب إن بدأ حزب جديد في هذه الصفحة؛ وإلا null */
  hizbStartingOnPage: number | null;
  /**
   * rub_el_hizb_number إن بدأ ربع/نصف/ثلاثة أرباع (أو حزب) جديد في الصفحة.
   * كان يُعرض في الذيل؛ الحزب الجاري أصبح في الرأس (hizbNumber).
   */
  rubElHizbStartingOnPage: number | null;
};

let chaptersPromise: Promise<Map<number, MushafChapter>> | null = null;

export function loadChapters(): Promise<Map<number, MushafChapter>> {
  if (!chaptersPromise) {
    chaptersPromise = pooledFetch("/data/quran-v2/chapters.json", {
      signal: AbortSignal.timeout(10_000),
      dedupeKey: "mushaf-v2:chapters",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`chapters.json fetch failed: HTTP ${res.status}`);
        return res.json();
      })
      .then((raw: any[]) => {
        const map = new Map<number, MushafChapter>();
        for (const c of raw) {
          map.set(c.id, {
            id: c.id,
            nameArabic: c.name_arabic,
            revelationPlace: c.revelation_place,
            versesCount: c.verses_count,
            bismillahPre: c.bismillah_pre,
            pages: c.pages,
          });
        }
        return map;
      })
      .catch((err) => {
        chaptersPromise = null;
        throw err;
      });
  }
  return chaptersPromise;
}

/** Bounded LRU of in-flight/resolved page JSON — prevents unbounded growth across long mushaf sessions. */
const PAGE_CACHE_MAX = 32;
const pageCache = new LruCache<number, Promise<QpcVerse[]>>(PAGE_CACHE_MAX);

function fetchRawPage(pageNumber: number): Promise<QpcVerse[]> {
  let p = pageCache.get(pageNumber);
  if (!p) {
    p = pooledFetch(`/data/quran-v2/pages/page-${String(pageNumber).padStart(3, "0")}.json`, {
      signal: AbortSignal.timeout(10_000),
      dedupeKey: `mushaf-v2:page:${pageNumber}`,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`page ${pageNumber} fetch failed: HTTP ${res.status}`);
        return res.json();
      })
      .then(async (raw: any[]) => {
        // Yield before mapping large page payloads so INP stays responsive when flipping Juz/pages.
        await yieldToMain();
        return mapInChunks(raw ?? [], 40, (v): QpcVerse => {
          const [surahStr, ayahStr] = v.verse_key.split(":");
          return {
            verseKey: v.verse_key,
            surahNumber: Number(surahStr),
            ayahNumber: Number(ayahStr),
            pageNumber: v.page_number,
            juzNumber: v.juz_number,
            hizbNumber: v.hizb_number,
            rubElHizbNumber: v.rub_el_hizb_number,
            sajdahNumber: v.sajdah_number,
            words: (v.words ?? []).map(
              (w: any): QpcWord => ({
                id: w.id,
                position: w.position,
                lineNumber: w.line_number,
                charType: w.char_type_name,
                textUthmani: w.text_uthmani,
                textQpcHafs: w.text_qpc_hafs,
                // code_v2 لا text (V1) — يطابق خط "hafs/v2" المُنزَّل في
                // Phase 2 فعليًا؛ راجع تعليق fetch-mushaf-v2-data.mjs.
                glyphText: w.code_v2,
                audioUrl: w.audio_url ?? null,
                verseKey: v.verse_key,
                sajdahNumber: v.sajdah_number,
              }),
            ),
          };
        });
      })
      .catch((err) => {
        pageCache.delete(pageNumber);
        throw err;
      });
    pageCache.set(pageNumber, p);
  }
  return p;
}

/** يبني تخطيط صفحة كاملًا: صفوفًا (سطر آيات أو رأس سورة زخرفي) بترتيبها
 * الرأسي الصحيح، مشتقًا كليًا من line_number الحقيقي — لا تخمين لعدد
 * الأسطر الفارغة، يُحسَب من الفجوة الفعلية بين آخر سطر مُستخدَم وأول سطر
 * تال. */
/** هل يبدأ حزب جديد في هذه الصفحة؟ يقارن آخر آية بالصفحة السابقة. */
async function resolveHizbStartingOnPage(
  pageNumber: number,
  verses: QpcVerse[],
): Promise<number | null> {
  if (!verses.length) return null;
  if (pageNumber <= 1) return verses[0]!.hizbNumber || 1;
  try {
    const prev = await fetchRawPage(pageNumber - 1);
    const prevLastHizb = prev[prev.length - 1]?.hizbNumber ?? 0;
    for (const v of verses) {
      if (v.hizbNumber > prevLastHizb) return v.hizbNumber;
    }
  } catch {
    /* تجاهل — لا شارة حزب إن تعذّر السابق */
  }
  return null;
}

/** أول rub_el_hizb_number جديد يبدأ في هذه الصفحة (مقارنةً بآخر الصفحة السابقة). */
async function resolveRubElHizbStartingOnPage(
  pageNumber: number,
  verses: QpcVerse[],
): Promise<number | null> {
  if (!verses.length) return null;
  if (pageNumber <= 1) return verses[0]!.rubElHizbNumber || 1;
  try {
    const prev = await fetchRawPage(pageNumber - 1);
    const prevLastRub = prev[prev.length - 1]?.rubElHizbNumber ?? 0;
    for (const v of verses) {
      if (v.rubElHizbNumber > prevLastRub) return v.rubElHizbNumber;
    }
  } catch {
    /* تجاهل */
  }
  return null;
}

export async function loadMushafPage(pageNumber: number): Promise<MushafPageLayout> {
  const [verses, chapters] = await Promise.all([fetchRawPage(pageNumber), loadChapters()]);
  const [hizbStartingOnPage, rubElHizbStartingOnPage] = await Promise.all([
    resolveHizbStartingOnPage(pageNumber, verses),
    resolveRubElHizbStartingOnPage(pageNumber, verses),
  ]);

  const lineWords = new Map<number, QpcWord[]>();
  for (const v of verses) {
    for (const w of v.words) {
      if (!lineWords.has(w.lineNumber)) lineWords.set(w.lineNumber, []);
      lineWords.get(w.lineNumber)!.push(w);
    }
  }
  for (const [, words] of lineWords) {
    words.sort((a, b) => a.id - b.id || a.position - b.position);
  }

  // سور تبدأ فعليًا على هذه الصفحة (أول ظهور لآيتها الأولى هنا).
  const surahStartsOnPage = new Map<number, number>(); // surah -> أول line_number لآيتها الأولى
  for (const v of verses) {
    if (v.ayahNumber === 1 && !surahStartsOnPage.has(v.surahNumber)) {
      const firstLine = Math.min(...v.words.map((w) => w.lineNumber));
      surahStartsOnPage.set(v.surahNumber, firstLine);
    }
  }

  const usedLines = [...lineWords.keys()].sort((a, b) => a - b);
  const maxLine = usedLines.length ? Math.max(...usedLines) : 15;
  const isOpening = pageNumber === 1 || pageNumber === 2;
  const headerStartLines = [...surahStartsOnPage.entries()].sort((a, b) => a[1] - b[1]);

  const headers: Extract<MushafPageRow, { kind: "surah-header" }>[] = [];
  for (const [surahNum, firstLine] of headerStartLines) {
    const chapter = chapters.get(surahNum);
    if (!chapter) continue;
    const prevUsed = usedLines.filter((ln) => ln < firstLine).pop() ?? 0;
    const gap = firstLine - prevUsed - 1;
    const spanRows = Math.max(gap, chapter.bismillahPre ? 2 : 1);
    let bannerSlot: number;
    let basmalaSlot: number | null = null;
    if (isOpening) {
      /* ص١–٢: الشارة في الخانة ٣، البسملة في ٤ إن وُجدت، ثم الأسطر تباعًا */
      bannerSlot = 3;
      if (chapter.bismillahPre) basmalaSlot = 4;
    } else {
      /* الصفحات العادية: الشارة ثم البسملة — سطران مستقلان دائماً.
       * عند gap===1 تُدرَج البسملة كسطر إضافي غير مُمثَّل في line_number
       * فتُزاح أسطر الآيات التالية +١ خانة شبكة. */
      bannerSlot = Math.max(1, prevUsed + 1);
      basmalaSlot = chapter.bismillahPre ? bannerSlot + 1 : null;
    }
    headers.push({ kind: "surah-header", surah: chapter, spanRows, bannerSlot, basmalaSlot });
  }

  const lineRows: Extract<MushafPageRow, { kind: "line" }>[] = [];
  if (isOpening) {
    const startSlot = headers[0]?.basmalaSlot != null ? 5 : 4;
    usedLines.forEach((ln, i) => {
      lineRows.push({
        kind: "line",
        lineNumber: ln,
        gridSlot: startSlot + i,
        words: lineWords.get(ln)!,
      });
    });
  } else {
    const basmalaInsertBefore = new Map<number, number>();
    for (const [surahNum, firstLine] of headerStartLines) {
      const chapter = chapters.get(surahNum);
      if (!chapter?.bismillahPre) continue;
      const prevUsed = usedLines.filter((ln) => ln < firstLine).pop() ?? 0;
      const gap = firstLine - prevUsed - 1;
      if (gap === 1) basmalaInsertBefore.set(firstLine, 1);
    }
    const bySlot = new Map<number, QpcWord[]>();
    for (let ln = 1; ln <= maxLine; ln++) {
      if (!lineWords.has(ln)) continue;
      let insert = 0;
      for (const [firstLine, offset] of basmalaInsertBefore) {
        if (ln >= firstLine) insert += offset;
      }
      const gridSlot = Math.min(ln + insert, 15);
      const words = lineWords.get(ln)!;
      if (bySlot.has(gridSlot)) {
        bySlot.get(gridSlot)!.push(...words);
      } else {
        bySlot.set(gridSlot, [...words]);
      }
    }
    for (const [gridSlot, words] of bySlot) {
      words.sort((a, b) => a.id - b.id || a.position - b.position);
      lineRows.push({
        kind: "line",
        lineNumber: words[0]!.lineNumber,
        gridSlot,
        words,
      });
    }
  }

  const merged: MushafPageRow[] = [];
  const headerQueue = [...headers];
  for (const lineRow of lineRows) {
    while (
      headerQueue.length &&
      (isOpening
        ? headerQueue[0]!.bannerSlot <= lineRow.gridSlot
        : surahStartsOnPage.get(headerQueue[0]!.surah.id)! <= lineRow.lineNumber)
    ) {
      merged.push(headerQueue.shift()!);
    }
    merged.push(lineRow);
  }
  for (const h of headerQueue) merged.push(h);

  const surahsOnPage = [...new Set(verses.map((v) => v.surahNumber))]
    .map((n) => chapters.get(n))
    .filter((c): c is MushafChapter => !!c);
  const surahsStartingOnPage = headerStartLines
    .map(([n]) => chapters.get(n))
    .filter((c): c is MushafChapter => !!c);

  return {
    pageNumber,
    juzNumber: verses[0]?.juzNumber ?? 1,
    rows: merged,
    surahsOnPage,
    surahsStartingOnPage,
    layoutMode: "standard",
    ayahLineCount: usedLines.length,
    hizbNumber: verses[0]?.hizbNumber ?? 1,
    hizbStartingOnPage,
    rubElHizbStartingOnPage,
  };
}

export function prefetchMushafPage(pageNumber: number): void {
  if (pageNumber >= 1 && pageNumber <= 604) void fetchRawPage(pageNumber).catch(() => {});
}

/** نص الآية العثماني الكامل (لا الـglyph الخاص بخط الصفحة) من تخطيط
 * مُحمَّل بالفعل — بلا أي طلب شبكة إضافي، ومصدره نفس بيانات QPC V2
 * المعتمدة (لا AlQuran Cloud ولا أي مصدر بديل). */
export function getAyahTextFromLayout(layout: MushafPageLayout, verseKey: string): string {
  const words: QpcWord[] = [];
  for (const row of layout.rows) {
    if (row.kind === "line") {
      for (const w of row.words) {
        if (w.verseKey === verseKey) words.push(w);
      }
    }
  }
  return words
    .sort((a, b) => a.position - b.position)
    .map((w) => w.textUthmani)
    .join(" ");
}
