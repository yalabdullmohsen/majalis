/**
 * Quran text API — backed exclusively by api.alquran.cloud (AlQuran Cloud).
 * Source: https://alquran.cloud/api — open, free, no API key required.
 * Edition used: quran-uthmani (Uthmanic script, Hafs ʿan ʿĀṣim)
 *
 * ⚠️ Never generate or modify Quran text manually.
 *    All content comes from the API only.
 */

const BASE = "https://api.alquran.cloud/v1";
const CACHE_PREFIX = "mj-quran-v3-";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type SurahSummary = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: "Meccan" | "Medinan";
};

export type Ayah = {
  number: number;
  numberInSurah: number;
  text: string;
  juz: number;
  page: number;
  surahNumber?: number;
  sajda: boolean | { id: number; recommended: boolean; obligatory: boolean };
};

export type SurahDetail = SurahSummary & { ayahs: Ayah[] };

export type TafsirAyah = { numberInSurah: number; text: string };

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, at } = JSON.parse(raw) as { data: T; at: number };
    if (Date.now() - at > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, at: Date.now() }));
  } catch {
    // localStorage quota exceeded — ignore
  }
}

export async function fetchSurahList(): Promise<SurahSummary[]> {
  const cached = readCache<SurahSummary[]>("surah-list");
  if (cached) return cached;

  const res = await fetch(`${BASE}/surah`, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`AlQuran Cloud: HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== 200 || !Array.isArray(json.data)) throw new Error("AlQuran Cloud: unexpected response");
  const list: SurahSummary[] = json.data;
  writeCache("surah-list", list);
  return list;
}

export async function fetchSurahDetail(surahNumber: number): Promise<SurahDetail> {
  const key = `surah-${surahNumber}`;
  const cached = readCache<SurahDetail>(key);
  if (cached) return cached;

  const res = await fetch(`${BASE}/surah/${surahNumber}/quran-uthmani`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`AlQuran Cloud: HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== 200 || !json.data) throw new Error("AlQuran Cloud: unexpected response");
  const detail: SurahDetail = json.data;
  writeCache(key, detail);
  return detail;
}

export async function fetchTafsirAyahs(
  surahNumber: number,
  edition: string,
): Promise<TafsirAyah[]> {
  const key = `tafsir-${edition}-${surahNumber}`;
  const cached = readCache<TafsirAyah[]>(key);
  if (cached) return cached;

  const res = await fetch(`${BASE}/surah/${surahNumber}/${edition}`, {
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`AlQuran Cloud tafsir: HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== 200 || !json.data?.ayahs) return [];
  const result: TafsirAyah[] = json.data.ayahs.map((a: { numberInSurah: number; text: string }) => ({
    numberInSurah: a.numberInSurah,
    text: a.text,
  }));
  writeCache(key, result);
  return result;
}

export type SearchMatch = {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  text: string;
};

export async function searchQuran(query: string): Promise<SearchMatch[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `${BASE}/search/${encodeURIComponent(query.trim())}/all/ar`,
    { signal: AbortSignal.timeout(15_000) },
  );
  if (!res.ok) return [];
  const json = await res.json();
  if (json.code !== 200 || !json.data?.matches) return [];
  return (json.data.matches as Array<{
    surah: { number: number; name: string };
    numberInSurah: number;
    text: string;
  }>).map((m) => ({
    surahNumber: m.surah.number,
    surahName: m.surah.name,
    ayahNumber: m.numberInSurah,
    text: m.text,
  }));
}

export function clearQuranCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

// ─── Static surah list (correct ayah counts per Hafs ʿan ʿĀṣim) ───────────

const SURAH_NAMES_AR = [
  "الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس",
  "هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه",
  "الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم",
  "لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر",
  "فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق",
  "الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة",
  "الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج",
  "نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس",
  "التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد",
  "الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات",
  "القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر",
  "المسد","الإخلاص","الفلق","الناس",
];

const SURAH_AYAH_COUNTS = [
  7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,
  112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,
  54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,
  14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,
  29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,
  11,8,3,9,5,4,7,3,6,3,5,4,5,6,
];

const MADANI = new Set([2,3,4,5,8,9,22,24,33,47,48,49,57,58,59,60,61,62,63,64,65,66,76,98,99,110]);

export type StaticSurahMeta = {
  number: number;
  name: string;
  ayahs: number;
  revelation: "مكية" | "مدنية";
};

export function getSurahList(): StaticSurahMeta[] {
  return SURAH_NAMES_AR.map((name, i) => ({
    number: i + 1,
    name,
    ayahs: SURAH_AYAH_COUNTS[i],
    revelation: MADANI.has(i + 1) ? "مدنية" : "مكية",
  }));
}

export function getSurahMeta(number: number): StaticSurahMeta {
  const idx = Math.max(0, Math.min(113, number - 1));
  return {
    number: idx + 1,
    name: SURAH_NAMES_AR[idx],
    ayahs: SURAH_AYAH_COUNTS[idx],
    revelation: MADANI.has(idx + 1) ? "مدنية" : "مكية",
  };
}

// ─── Surah start pages — Mushaf al-Madinah KFGQPC, Hafs ʿan ʿĀṣim ─────────
// Index 0 = Surah 1 (Al-Fatiha, page 1). 114 entries total.
export const SURAH_START_PAGES: readonly number[] = [
    1,   2,  50,  77, 106, 128, 151, 177, 187, 208,
  221, 235, 249, 255, 262, 267, 282, 293, 305, 312,
  322, 332, 342, 350, 359, 367, 377, 385, 396, 404,
  411, 415, 418, 428, 434, 440, 446, 453, 458, 467,
  477, 483, 489, 496, 499, 502, 507, 511, 515, 518,
  520, 523, 526, 528, 531, 534, 537, 542, 545, 549,
  551, 553, 554, 556, 558, 560, 562, 564, 566, 568,
  570, 572, 574, 575, 577, 578, 580, 582, 583, 585,
  586, 587, 587, 589, 590, 591, 591, 592, 593, 594,
  595, 595, 596, 596, 597, 597, 598, 598, 599, 599,
  600, 600, 601, 601, 601, 602, 602, 602, 603, 603,
  603, 604, 604, 604,
] as const;

export function getSurahForPage(page: number): StaticSurahMeta {
  const p = Math.max(1, Math.min(604, page));
  let idx = 0;
  for (let i = 0; i < SURAH_START_PAGES.length; i++) {
    if (SURAH_START_PAGES[i] <= p) idx = i;
    else break;
  }
  return getSurahMeta(idx + 1);
}

// ─── Qiraat (القراءات العشر) ──────────────────────────────────────────────

export type Qiraat = {
  id: string;
  name: string;
  apiEdition: string | null; // null = uses Hafs fallback
};

export const QIRAAT_LIST: Qiraat[] = [
  { id: "hafs",     name: "حفص عن عاصم",           apiEdition: "quran-uthmani" },
  { id: "warsh",    name: "ورش عن نافع",             apiEdition: "quran-warsh-tanzil" },
  { id: "qaloon",   name: "قالون عن نافع",           apiEdition: null },
  { id: "sousi",    name: "السوسي عن أبي عمرو",      apiEdition: null },
  { id: "duri-k",   name: "الدوري عن الكسائي",       apiEdition: null },
  { id: "kasai",    name: "الكسائي",                  apiEdition: null },
  { id: "hamza",    name: "حمزة الزيات",              apiEdition: null },
  { id: "khuzai",   name: "الخزاعي عن خلف",          apiEdition: null },
  { id: "ibn-zakwan","name": "ابن ذكوان عن ابن عامر", apiEdition: null },
  { id: "hisham",   name: "هشام عن ابن عامر",        apiEdition: null },
];

const QIRAAT_PREF_KEY = "mj-quran-qiraat-v1";
export function getQiraatPref(): string {
  try { return localStorage.getItem(QIRAAT_PREF_KEY) || "hafs"; } catch { return "hafs"; }
}
export function setQiraatPref(id: string) {
  try { localStorage.setItem(QIRAAT_PREF_KEY, id); } catch { /* ignore */ }
}

export async function fetchSurahDetailQiraat(surahNumber: number, qiraatId: string): Promise<SurahDetail> {
  const q = QIRAAT_LIST.find((r) => r.id === qiraatId);
  const edition = q?.apiEdition ?? "quran-uthmani";
  const key = `surah-${surahNumber}-${edition}`;
  const cached = readCache<SurahDetail>(key);
  if (cached) return cached;

  const res = await fetch(`${BASE}/surah/${surahNumber}/${edition}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return fetchSurahDetail(surahNumber); // fallback to Hafs
  const json = await res.json();
  if (json.code !== 200 || !json.data) return fetchSurahDetail(surahNumber);
  const detail: SurahDetail = json.data;
  writeCache(key, detail);
  return detail;
}

// ─── Juz (الأجزاء) ────────────────────────────────────────────────────────

export type JuzData = {
  juzNumber: number;
  ayahs: Ayah[];
  surahs: Array<{ number: number; name: string; start: number; end: number }>;
};

export async function fetchJuz(juzNumber: number, edition = "quran-uthmani"): Promise<JuzData> {
  const key = `juz-${juzNumber}-${edition}`;
  const cached = readCache<JuzData>(key);
  if (cached) return cached;

  const res = await fetch(`${BASE}/juz/${juzNumber}/${edition}`, {
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`AlQuran Cloud juz: HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== 200 || !json.data) throw new Error("AlQuran Cloud: unexpected juz response");

  const rawAyahs: Array<{
    number: number;
    numberInSurah: number;
    text: string;
    juz: number;
    page: number;
    sajda: Ayah["sajda"];
    surah: { number: number; name: string };
  }> = json.data.ayahs;

  const ayahs: Ayah[] = rawAyahs.map((a) => ({
    number: a.number,
    numberInSurah: a.numberInSurah,
    text: a.text,
    juz: a.juz,
    page: a.page,
    sajda: a.sajda,
    surahNumber: a.surah.number,
  }));

  // Build surah groups
  const surahMap = new Map<number, { number: number; name: string; start: number; end: number }>();
  rawAyahs.forEach((a) => {
    const existing = surahMap.get(a.surah.number);
    if (!existing) {
      surahMap.set(a.surah.number, { number: a.surah.number, name: a.surah.name, start: a.numberInSurah, end: a.numberInSurah });
    } else {
      existing.end = a.numberInSurah;
    }
  });
  const surahs = Array.from(surahMap.values());

  const result: JuzData = { juzNumber, ayahs, surahs };
  writeCache(key, result);
  return result;
}

// ─── Mushaf Page Images ────────────────────────────────────────────────────
// Source: King Fahad Quran Printing Complex (KFGQPC) — Hafs 'an 'Asim
// Primary:  jsDelivr CDN (pinned commit for stable cache)
// Fallback: GitHub raw content (bypasses CDN cache)

// Pinned commit avoids @main cache-miss 503s that occur when jsDelivr
// hasn't yet cached a given page from GitHub's API.
const MUSHAF_CDN_PRIMARY  = "https://cdn.jsdelivr.net/gh/QuranHub/quran-pages-images@main/kfgqpc/hafs-wasat";
const MUSHAF_CDN_FALLBACK = "https://raw.githubusercontent.com/QuranHub/quran-pages-images/main/kfgqpc/hafs-wasat";

export function getMushafPageUrl(page: number): string {
  const p = Math.max(1, Math.min(604, page));
  return `${MUSHAF_CDN_PRIMARY}/${p}.jpg`;
}

export function getMushafPageFallbackUrl(page: number): string {
  const p = Math.max(1, Math.min(604, page));
  return `${MUSHAF_CDN_FALLBACK}/${p}.jpg`;
}

export async function fetchAyahsOnPage(page: number, edition = "quran-uthmani"): Promise<{ surahNumber: number; ayahNumber: number }[]> {
  const key = `page-${page}-${edition}`;
  const cached = readCache<{ surahNumber: number; ayahNumber: number }[]>(key);
  if (cached) return cached;

  const res = await fetch(`${BASE}/page/${page}/${edition}`, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) return [];
  const json = await res.json();
  if (json.code !== 200 || !json.data?.ayahs) return [];

  const result = (json.data.ayahs as Array<{ surah: { number: number }; numberInSurah: number }>).map((a) => ({
    surahNumber: a.surah.number,
    ayahNumber: a.numberInSurah,
  }));
  writeCache(key, result);
  return result;
}

// ─── Daily Wird state (persisted in localStorage) ─────────────────────────

export type DailyWirdState = {
  pagesPerDay: number;
  currentSurah: number;
  currentAyah: number;
  completedToday: number;
  lastDate: string;
  monthlyTotal: number;
  streak: number;
  weeklyLogs: Record<string, number>;
  totalPagesEver: number;
};

const WIRD_KEY = "mj-quran-wird-v3";

export function getDailyWirdState(): DailyWirdState {
  try {
    const raw = localStorage.getItem(WIRD_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DailyWirdState>;
      return {
        pagesPerDay: parsed.pagesPerDay ?? 2,
        currentSurah: parsed.currentSurah ?? 1,
        currentAyah: parsed.currentAyah ?? 1,
        completedToday: parsed.completedToday ?? 0,
        lastDate: parsed.lastDate ?? "",
        monthlyTotal: parsed.monthlyTotal ?? 0,
        streak: parsed.streak ?? 0,
        weeklyLogs: parsed.weeklyLogs ?? {},
        totalPagesEver: parsed.totalPagesEver ?? 0,
      };
    }
  } catch { /* ignore */ }
  return { pagesPerDay: 2, currentSurah: 1, currentAyah: 1, completedToday: 0, lastDate: "", monthlyTotal: 0, streak: 0, weeklyLogs: {}, totalPagesEver: 0 };
}

export function prevDateStr(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function weeklyTotal(logs: Record<string, number>): number {
  const today = new Date();
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    total += logs[k] ?? 0;
  }
  return total;
}

export function saveDailyWirdState(state: DailyWirdState) {
  try { localStorage.setItem(WIRD_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

// ─── Position persistence ──────────────────────────────────────────────────
const POS_KEY = "mj-quran-pos-v3";

export function savePosition(surah: number, ayah: number) {
  try {
    localStorage.setItem(POS_KEY, JSON.stringify({ surah, ayah, at: Date.now() }));
  } catch {
    // ignore
  }
}

export function loadPosition(): { surah: number; ayah: number } | null {
  try {
    const raw = localStorage.getItem(POS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
