/**
 * تحميل صفحات المصحف (ترقيم مدينة، 604 صفحة) — المرحلة 8.
 *
 * يعتمد على public/data/quran/pages-manifest.json (فهرس إشارات فقط، بلا
 * نص) + fetchSurahDetail المحلي-أولاً الموجود مسبقًا (نفس مصدر النص
 * المُتحقَّق checksum). لا يُعيد تعريف أو تحويل أي نص آية — يقتطع فقط
 * النطاق المطلوب من نتيجة fetchSurahDetail كما هي حرفيًا.
 */
import { fetchSurahDetail, getSurahMeta, type Ayah, type SurahDetail } from "@/lib/quran-api";

export type PagesManifestEntry = {
  page: number;
  ranges: { surah: number; from: number; to: number }[];
};

export type JuzIndexEntry = { juz: number; firstPage: number };

export type PagesManifest = {
  totalPages: number;
  pages: PagesManifestEntry[];
  juz: JuzIndexEntry[];
};

export type PageAyah = Ayah & {
  surahNumber: number;
  /** اسم مجرَّد بلا "سورة"/"سُورَةُ" بادئة — يُستخدَم في قوالب "سورة {name}"
   *  (AyahActionSheet، ExploreAyahPanel المُستهلِكة أصلاً بهذا الشكل). */
  surahName: string;
  /** الاسم الكامل المُشكَّل كما يظهر في نص المصحف نفسه ("سُورَةُ ٱلْفَاتِحَةِ") —
   *  للعناوين المرئية فقط (رأس القارئ، فاصل بداية سورة داخل الصفحة). */
  surahNameFull: string;
  isFirstOfSurah: boolean;
};

export type PageContent = {
  page: number;
  ayahs: PageAyah[];
  /** السور الظاهرة (كليًا أو جزئيًا) في هذه الصفحة، بترتيب ظهورها. */
  surahs: { number: number; name: string }[];
};

let manifestPromise: Promise<PagesManifest> | null = null;
const surahCache = new Map<number, Promise<SurahDetail>>();

export function fetchPagesManifest(): Promise<PagesManifest> {
  if (!manifestPromise) {
    manifestPromise = fetch("/data/quran/pages-manifest.json", { signal: AbortSignal.timeout(8_000) })
      .then((res) => {
        if (!res.ok) throw new Error(`pages-manifest fetch failed: HTTP ${res.status}`);
        return res.json();
      })
      .catch((err) => {
        manifestPromise = null; // اسمح بإعادة المحاولة لاحقًا بدل تجميد فشل دائم
        throw err;
      });
  }
  return manifestPromise;
}

function cachedSurahDetail(surahNumber: number): Promise<SurahDetail> {
  let p = surahCache.get(surahNumber);
  if (!p) {
    p = fetchSurahDetail(surahNumber);
    surahCache.set(surahNumber, p);
    p.catch(() => surahCache.delete(surahNumber)); // لا تُبقِ وعدًا فاشلاً في الذاكرة المؤقتة
  }
  return p;
}

/** يحمّل محتوى صفحة واحدة كاملة (رقم مدينة 1-604) بآياتها الحرفية. */
export async function fetchPage(pageNumber: number): Promise<PageContent> {
  const manifest = await fetchPagesManifest();
  const entry = manifest.pages.find((p) => p.page === pageNumber);
  if (!entry) throw new Error(`صفحة غير موجودة في الفهرس: ${pageNumber}`);

  const ayahs: PageAyah[] = [];
  const surahsSeen: { number: number; name: string }[] = [];

  for (const range of entry.ranges) {
    const detail = await cachedSurahDetail(range.surah);
    const bareName = getSurahMeta(range.surah).name; // "الفاتحة" — بلا بادئة، للقوالب "سورة {name}"
    surahsSeen.push({ number: range.surah, name: detail.name });
    for (const ayah of detail.ayahs) {
      if (ayah.numberInSurah >= range.from && ayah.numberInSurah <= range.to) {
        ayahs.push({
          ...ayah,
          surahNumber: range.surah,
          surahName: bareName,
          surahNameFull: detail.name,
          isFirstOfSurah: ayah.numberInSurah === 1,
        });
      }
    }
  }

  return { page: pageNumber, ayahs, surahs: surahsSeen };
}

/** رقم الجزء الذي تقع فيه صفحة مُعطاة — لعرضه في رأس القارئ. */
export function juzForPage(manifest: PagesManifest, pageNumber: number): number {
  let current = 1;
  for (const j of manifest.juz) {
    if (j.firstPage > pageNumber) break;
    current = j.juz;
  }
  return current;
}

/** أول صفحة تحتوي أول آية من سورة مُعطاة — لتحويل رابط قديم /mushaf/:surah إلى صفحته الصحيحة. */
export async function firstPageOfSurah(surahNumber: number): Promise<number> {
  const manifest = await fetchPagesManifest();
  for (const entry of manifest.pages) {
    if (entry.ranges.some((r) => r.surah === surahNumber && r.from === 1)) return entry.page;
  }
  // احتياط: أول صفحة تذكر هذه السورة بأي نطاق (نادرًا ما يُستخدَم، فقط لو تعذّر إيجاد from===1)
  for (const entry of manifest.pages) {
    if (entry.ranges.some((r) => r.surah === surahNumber)) return entry.page;
  }
  return 1;
}
