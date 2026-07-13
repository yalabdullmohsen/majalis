/**
 * نظام اختبارات الحفظ القرآني — SM-2 Spaced Repetition
 *
 * يستند النص القرآني حصرًا إلى api.alquran.cloud — لا يُنتج أي نص قرآني بالذكاء الاصطناعي.
 */

import { fetchSurahList, fetchSurahDetail, type SurahSummary, type Ayah } from "./quran-api";

// ── أنواع الاختبارات ──────────────────────────────────────────────────────────

export type TestType =
  | "complete-ayah"    // 1. أكمل الآية
  | "which-surah"      // 2. من أي سورة؟
  | "next-ayah"        // 3. ما الآية التالية؟
  | "prev-ayah"        // 4. ما الآية السابقة؟
  | "fill-blank"       // 5. أكمل الفراغ
  | "ayah-number"      // 6. ما رقم هذه الآية؟
  | "surah-type"       // 7. مكية أم مدنية؟
  | "juz-number"       // 8. في أي جزء؟
  | "multiple-choice"  // 9. اختيار من متعدد
  | "surah-count"      // 10. كم عدد آيات السورة؟
  | "order-ayahs"      // 11. رتّب الآيات
  | "first-word";      // 12. ما أول كلمة؟

export const TEST_LABELS: Record<TestType, string> = {
  "complete-ayah":   "أكمل الآية",
  "which-surah":     "حدّد السورة",
  "next-ayah":       "الآية التالية",
  "prev-ayah":       "الآية السابقة",
  "fill-blank":      "أكمل الفراغ",
  "ayah-number":     "رقم الآية",
  "surah-type":      "مكية أم مدنية؟",
  "juz-number":      "رقم الجزء",
  "multiple-choice": "اختيار من متعدد",
  "surah-count":     "عدد آيات السورة",
  "order-ayahs":     "ترتيب الآيات",
  "first-word":      "أول كلمة في الآية",
};

export const TEST_DESCRIPTIONS: Record<TestType, string> = {
  "complete-ayah":   "أكمل النص الناقص من الآية الكريمة",
  "which-surah":     "حدّد اسم السورة التي تنتمي إليها هذه الآية",
  "next-ayah":       "ما الآية التي تلي هذه الآية مباشرةً؟",
  "prev-ayah":       "ما الآية التي تسبق هذه الآية مباشرةً؟",
  "fill-blank":      "أكمل الكلمة المحذوفة من الآية الكريمة",
  "ayah-number":     "ما رقم هذه الآية في سورتها؟",
  "surah-type":      "هل هذه السورة مكية أم مدنية؟",
  "juz-number":      "في أي جزء من أجزاء القرآن تقع هذه الآية؟",
  "multiple-choice": "اختر تكملة الآية الصحيحة من بين الخيارات",
  "surah-count":     "كم عدد آيات هذه السورة الكريمة؟",
  "order-ayahs":     "رتّب هذه الآيات حسب ورودها في القرآن الكريم",
  "first-word":      "ما أول كلمة في هذه الآية الكريمة؟",
};

// ── سؤال الاختبار ────────────────────────────────────────────────────────────

export interface QuizQuestion {
  id: string;
  type: TestType;
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  prompt: string;
  /** الآية الكاملة للمرجع */
  fullAyah: string;
  /** الإجابة الصحيحة */
  correctAnswer: string;
  /** خيارات (للأسئلة متعددة الخيارات) */
  options?: string[];
  /** آيات مبعثرة (لاختبار الترتيب) */
  scrambled?: { id: string; text: string }[];
}

// ── SM-2 Spaced Repetition ────────────────────────────────────────────────────

export interface AyahCard {
  key: string; // "surah:ayah"
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  text: string;
  ef: number;        // عامل السهولة (2.5 افتراضي)
  interval: number;  // أيام حتى المراجعة التالية
  repetitions: number;
  dueAt: number;     // timestamp
  lastReview: number;
}

const SM2_KEY = "msk-quran-mem-v1";

function loadCards(): AyahCard[] {
  try {
    const raw = localStorage.getItem(SM2_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCards(cards: AyahCard[]) {
  try { localStorage.setItem(SM2_KEY, JSON.stringify(cards)); } catch { /* ok */ }
}

export function getCards(): AyahCard[] { return loadCards(); }

export function getDueCards(): AyahCard[] {
  const now = Date.now();
  return loadCards().filter((c) => c.dueAt <= now);
}

export function getStatsSnapshot() {
  const cards = loadCards();
  const now = Date.now();
  return {
    total: cards.length,
    due: cards.filter((c) => c.dueAt <= now).length,
    learning: cards.filter((c) => c.repetitions < 2).length,
    reviewing: cards.filter((c) => c.repetitions >= 2).length,
    mastered: cards.filter((c) => c.interval >= 21).length,
  };
}

/** SM-2: تحديث بطاقة بعد تقييم الإجابة (quality 0–5) */
export function reviewCard(key: string, quality: 0 | 1 | 2 | 3 | 4 | 5): void {
  const cards = loadCards();
  const idx = cards.findIndex((c) => c.key === key);
  if (idx === -1) return;

  const card = { ...cards[idx] };

  if (quality < 3) {
    card.repetitions = 0;
    card.interval = 1;
  } else {
    if (card.repetitions === 0) card.interval = 1;
    else if (card.repetitions === 1) card.interval = 6;
    else card.interval = Math.round(card.interval * card.ef);

    card.repetitions += 1;
    card.ef = Math.max(1.3, card.ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  }

  card.dueAt = Date.now() + card.interval * 24 * 60 * 60 * 1000;
  card.lastReview = Date.now();

  cards[idx] = card;
  saveCards(cards);
}

/** إضافة آية جديدة للمراجعة */
export function addCard(
  surahNumber: number,
  surahName: string,
  ayahNumber: number,
  text: string
): void {
  const key = `${surahNumber}:${ayahNumber}`;
  const cards = loadCards();
  if (cards.some((c) => c.key === key)) return;

  cards.push({
    key,
    surahNumber,
    surahName,
    ayahNumber,
    text,
    ef: 2.5,
    interval: 1,
    repetitions: 0,
    dueAt: Date.now(),
    lastReview: 0,
  });
  saveCards(cards);
}

/** حذف آية من نظام المراجعة */
export function removeCard(key: string): void {
  const cards = loadCards().filter((c) => c.key !== key);
  saveCards(cards);
}

// ── توليد الأسئلة ─────────────────────────────────────────────────────────────

let _surahList: SurahSummary[] | null = null;

async function getSurahList(): Promise<SurahSummary[]> {
  if (!_surahList) _surahList = await fetchSurahList();
  return _surahList;
}

/** يختار N سورة عشوائية من القائمة باستثناء سورة معينة */
function pickRandomSurahs(list: SurahSummary[], exclude: number, count: number): SurahSummary[] {
  const pool = list.filter((s) => s.number !== exclude);
  const result: SurahSummary[] = [];
  const used = new Set<number>();
  while (result.length < count && result.length < pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    if (!used.has(idx)) { used.add(idx); result.push(pool[idx]); }
  }
  return result;
}

/** يخفي النصف الأخير من الآية */
function hideSecondHalf(text: string): { prompt: string; answer: string } {
  const words = text.split(" ");
  const half = Math.max(1, Math.floor(words.length / 2));
  return {
    prompt: words.slice(0, half).join(" ") + " ...",
    answer: words.slice(half).join(" "),
  };
}

/** يخفي كلمة عشوائية من الآية */
function hideRandomWord(text: string): { prompt: string; answer: string } {
  const words = text.split(" ");
  if (words.length < 3) return hideSecondHalf(text);
  const idx = 1 + Math.floor(Math.random() * (words.length - 2));
  const answer = words[idx];
  const prompt = [...words];
  prompt[idx] = "______";
  return { prompt: prompt.join(" "), answer };
}

export async function generateQuestion(
  type: TestType,
  surahNum: number,
  ayah: Ayah,
  surahName: string
): Promise<QuizQuestion> {
  const surahList = await getSurahList();
  const id = `${type}-${surahNum}-${ayah.numberInSurah}-${Date.now()}`;

  switch (type) {
    case "complete-ayah": {
      const { prompt, answer } = hideSecondHalf(ayah.text);
      return {
        id, type, surahNumber: surahNum, surahName, ayahNumber: ayah.numberInSurah,
        prompt: `أكمل هذه الآية من سورة ${surahName}:\n${prompt}`,
        fullAyah: ayah.text, correctAnswer: answer,
      };
    }

    case "fill-blank": {
      const { prompt, answer } = hideRandomWord(ayah.text);
      return {
        id, type, surahNumber: surahNum, surahName, ayahNumber: ayah.numberInSurah,
        prompt: `أكمل الفراغ في هذه الآية من سورة ${surahName}:\n${prompt}`,
        fullAyah: ayah.text, correctAnswer: answer,
      };
    }

    case "which-surah": {
      const others = pickRandomSurahs(surahList, surahNum, 3);
      const options = [...others.map((s) => s.name), surahName].sort(() => Math.random() - 0.5);
      return {
        id, type, surahNumber: surahNum, surahName, ayahNumber: ayah.numberInSurah,
        prompt: `من أي سورة هذه الآية الكريمة؟\n﴿${ayah.text}﴾`,
        fullAyah: ayah.text, correctAnswer: surahName, options,
      };
    }

    case "surah-type": {
      const surah = surahList.find((s) => s.number === surahNum);
      const isMeccan = surah?.revelationType === "Meccan";
      const answer = isMeccan ? "مكية" : "مدنية";
      return {
        id, type, surahNumber: surahNum, surahName, ayahNumber: ayah.numberInSurah,
        prompt: `هل سورة ${surahName} مكية أم مدنية؟`,
        fullAyah: ayah.text, correctAnswer: answer,
        options: ["مكية", "مدنية"],
      };
    }

    case "juz-number": {
      const juz = ayah.juz;
      const fakeJuz = [juz === 1 ? 2 : juz - 1, juz + 1 > 30 ? 29 : juz + 1, juz + 2 > 30 ? 28 : juz + 2]
        .filter((j) => j !== juz && j >= 1 && j <= 30).slice(0, 3);
      const options = [...fakeJuz.map(String), String(juz)].sort(() => Math.random() - 0.5);
      return {
        id, type, surahNumber: surahNum, surahName, ayahNumber: ayah.numberInSurah,
        prompt: `في أي جزء تقع هذه الآية من سورة ${surahName}؟\n﴿${ayah.text}﴾`,
        fullAyah: ayah.text, correctAnswer: String(juz), options,
      };
    }

    case "ayah-number": {
      const n = ayah.numberInSurah;
      const opts = Array.from({ length: 4 }, (_, i) => {
        let v = n + (i === 0 ? 0 : i === 1 ? 1 : i === 2 ? -1 : 2);
        if (v < 1) v = n + 3;
        return String(v);
      });
      const options = [...new Set(opts)].slice(0, 4).sort(() => Math.random() - 0.5);
      return {
        id, type, surahNumber: surahNum, surahName, ayahNumber: n,
        prompt: `ما رقم هذه الآية في سورة ${surahName}؟\n﴿${ayah.text}﴾`,
        fullAyah: ayah.text, correctAnswer: String(n), options,
      };
    }

    case "surah-count": {
      const surah = surahList.find((s) => s.number === surahNum);
      const count = surah?.numberOfAyahs ?? 0;
      const fakes = [count - 2, count + 2, count + 5].filter((v) => v > 0 && v !== count);
      const options = [...fakes.slice(0, 3).map(String), String(count)].sort(() => Math.random() - 0.5);
      return {
        id, type, surahNumber: surahNum, surahName, ayahNumber: ayah.numberInSurah,
        prompt: `كم عدد آيات سورة ${surahName}؟`,
        fullAyah: ayah.text, correctAnswer: String(count), options,
      };
    }

    case "multiple-choice": {
      const { answer } = hideSecondHalf(ayah.text);
      const words = answer.split(" ").slice(0, 3).join(" ");
      const fakeEndings = ["وَهُوَ العَلِيمُ الحَكِيمُ", "إِنَّهُ هُوَ التَّوَّابُ الرَّحِيمُ", "وَاللَّهُ بِكُلِّ شَيءٍ عَلِيمٌ"];
      const options = [answer, ...fakeEndings.filter((f) => f !== answer)].slice(0, 4).sort(() => Math.random() - 0.5);
      const { prompt: half } = hideSecondHalf(ayah.text);
      return {
        id, type, surahNumber: surahNum, surahName, ayahNumber: ayah.numberInSurah,
        prompt: `أكمل الآية:\n${half}`,
        fullAyah: ayah.text, correctAnswer: answer, options,
      };
    }

    case "first-word": {
      const first = ayah.text.split(" ")[0];
      const fakeWords = ["قَالَ", "وَإِذَا", "فَلَمَّا", "يَا أَيُّهَا"].filter((w) => w !== first);
      const options = [first, ...fakeWords.slice(0, 3)].sort(() => Math.random() - 0.5);
      return {
        id, type, surahNumber: surahNum, surahName, ayahNumber: ayah.numberInSurah,
        prompt: `ما أول كلمة في الآية رقم ${ayah.numberInSurah} من سورة ${surahName}؟`,
        fullAyah: ayah.text, correctAnswer: first, options,
      };
    }

    case "next-ayah":
    case "prev-ayah": {
      const { prompt: half } = hideSecondHalf(ayah.text);
      const isNext = type === "next-ayah";
      return {
        id, type, surahNumber: surahNum, surahName, ayahNumber: ayah.numberInSurah,
        prompt: `${isNext ? "ما الآية التي تلي" : "ما الآية التي تسبق"} هذه الآية من سورة ${surahName}؟\n﴿${half}﴾`,
        fullAyah: ayah.text,
        correctAnswer: "",
      };
    }

    case "order-ayahs": {
      return {
        id, type, surahNumber: surahNum, surahName, ayahNumber: ayah.numberInSurah,
        prompt: `رتّب هذه الآيات حسب ورودها في سورة ${surahName}`,
        fullAyah: ayah.text, correctAnswer: "",
      };
    }

    default:
      return {
        id, type, surahNumber: surahNum, surahName, ayahNumber: ayah.numberInSurah,
        prompt: ayah.text, fullAyah: ayah.text, correctAnswer: "",
      };
  }
}

/** يجلب آية عشوائية من سورة معينة */
export async function fetchRandomAyah(surahNum: number): Promise<{ surah: SurahSummary; ayah: Ayah }> {
  const [list, detail] = await Promise.all([fetchSurahList(), fetchSurahDetail(surahNum)]);
  const surah = list.find((s) => s.number === surahNum)!;
  const ayah = detail.ayahs[Math.floor(Math.random() * detail.ayahs.length)];
  return { surah, ayah };
}

/** يجلب الآية التالية أو السابقة */
export async function fetchAdjacentAyah(
  surahNum: number,
  ayahNum: number,
  direction: "next" | "prev"
): Promise<Ayah | null> {
  const detail = await fetchSurahDetail(surahNum);
  const idx = detail.ayahs.findIndex((a) => a.numberInSurah === ayahNum);
  if (idx === -1) return null;
  const target = direction === "next" ? detail.ayahs[idx + 1] : detail.ayahs[idx - 1];
  return target ?? null;
}
