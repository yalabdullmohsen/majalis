/**
 * mushaf-v2-data.ts
 * تحميل وتحويل بيانات مصحف المدينة الحقيقية (تخطيط أسطر QPC V2) —
 * المصدر: public/data/quran-v2/ (604 صفحة + بيانات السور)، جُلبت حرفيًا
 * من api.qurancdn.com (راجع docs/mushaf-rebuild-inventory.md القسم 7
 * لتوثيق المصدر الكامل وسبب اعتماده بديلًا عن بوابة QUL المباشرة).
 * لا تطبيع ولا تعديل لأي نص هنا — نقل وتجميع فقط.
 */

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

/** عنصر واحد ضمن الشبكة الرأسية لصفحة (15 خانة كحد أقصى): إما سطر آيات
 * حقيقي (له line_number من البيانات)، أو منطقة رأس سورة زخرفية تحجز
 * عدد الأسطر الفارغة قبل أول سطر آيات فعلي لتلك السورة على هذه الصفحة. */
export type MushafPageRow =
  | { kind: "line"; lineNumber: number; words: QpcWord[] }
  | { kind: "surah-header"; surah: MushafChapter; spanRows: number };

export type MushafPageLayout = {
  pageNumber: number;
  juzNumber: number;
  rows: MushafPageRow[];
  surahsOnPage: MushafChapter[];
};

let chaptersPromise: Promise<Map<number, MushafChapter>> | null = null;

export function loadChapters(): Promise<Map<number, MushafChapter>> {
  if (!chaptersPromise) {
    chaptersPromise = fetch("/data/quran-v2/chapters.json", { signal: AbortSignal.timeout(10_000) })
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

const pageCache = new Map<number, Promise<QpcVerse[]>>();

function fetchRawPage(pageNumber: number): Promise<QpcVerse[]> {
  let p = pageCache.get(pageNumber);
  if (!p) {
    p = fetch(`/data/quran-v2/pages/page-${String(pageNumber).padStart(3, "0")}.json`, {
      signal: AbortSignal.timeout(10_000),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`page ${pageNumber} fetch failed: HTTP ${res.status}`);
        return res.json();
      })
      .then((raw: any[]) =>
        raw.map((v): QpcVerse => {
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
        }),
      )
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
export async function loadMushafPage(pageNumber: number): Promise<MushafPageLayout> {
  const [verses, chapters] = await Promise.all([fetchRawPage(pageNumber), loadChapters()]);

  const lineWords = new Map<number, QpcWord[]>();
  for (const v of verses) {
    for (const w of v.words) {
      if (!lineWords.has(w.lineNumber)) lineWords.set(w.lineNumber, []);
      lineWords.get(w.lineNumber)!.push(w);
    }
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

  const rows: MushafPageRow[] = [];
  let cursor = 1;
  const headerStartLines = [...surahStartsOnPage.entries()].sort((a, b) => a[1] - b[1]);

  for (const [surahNum, firstLine] of headerStartLines) {
    if (firstLine > cursor) {
      const chapter = chapters.get(surahNum);
      if (chapter) rows.push({ kind: "surah-header", surah: chapter, spanRows: firstLine - cursor });
    }
    cursor = firstLine;
  }

  for (let ln = 1; ln <= maxLine; ln++) {
    if (lineWords.has(ln)) {
      rows.push({ kind: "line", lineNumber: ln, words: lineWords.get(ln)! });
    }
  }
  // أعد ترتيب rows زمنيًا صحيحًا: رؤوس السور يجب أن تسبق أول سطر آياتها،
  // لا أن تُذيَّل بعد كل الأسطر — أعد البناء بدمج مرتّب حسب "أول سطر تالٍ".
  const merged: MushafPageRow[] = [];
  const headerQueue = [...headerStartLines];
  const lineRows = rows.filter((r): r is Extract<MushafPageRow, { kind: "line" }> => r.kind === "line");
  for (const lineRow of lineRows) {
    while (headerQueue.length && headerQueue[0][1] <= lineRow.lineNumber) {
      const [surahNum] = headerQueue.shift()!;
      const chapter = chapters.get(surahNum);
      const headerRow = rows.find(
        (r): r is Extract<MushafPageRow, { kind: "surah-header" }> => r.kind === "surah-header" && r.surah.id === surahNum,
      );
      if (chapter && headerRow) merged.push(headerRow);
    }
    merged.push(lineRow);
  }
  // رؤوس سور بلا أي سطر آيات تالٍ على هذه الصفحة (نادر) تُضاف في النهاية.
  for (const [surahNum] of headerQueue) {
    const headerRow = rows.find(
      (r): r is Extract<MushafPageRow, { kind: "surah-header" }> => r.kind === "surah-header" && r.surah.id === surahNum,
    );
    if (headerRow) merged.push(headerRow);
  }

  const surahsOnPage = [...new Set(verses.map((v) => v.surahNumber))]
    .map((n) => chapters.get(n))
    .filter((c): c is MushafChapter => !!c);

  return {
    pageNumber,
    juzNumber: verses[0]?.juzNumber ?? 1,
    rows: merged,
    surahsOnPage,
  };
}

export function prefetchMushafPage(pageNumber: number): void {
  if (pageNumber >= 1 && pageNumber <= 604) void fetchRawPage(pageNumber).catch(() => {});
}
