/**
 * quran-reference-words.ts
 * يبني قائمة ReferenceWord[] من آيات جُلبت مسبقًا عبر src/lib/quran-api.ts
 * (fetchSurahDetail) — لا يجلب بيانات بنفسه، ولا يُعدّل نص القرآن؛ فقط
 * يُقسّم النص المرجعي كلمة كلمة مع الاحتفاظ بالنص الأصلي الكامل
 * (raw) وبنسخة مطبَّعة (normalized) للمقارنة فقط.
 *
 * ⚠️ اكتشاف من فحص مباشر لبيانات public/data/quran/*.json: البسملة ليست
 *    آية منفصلة لكل السور — هي **مدمَجة داخل نص الآية 1** لكل سورة عدا
 *    الفاتحة (البسملة = الآية 1 نفسها) والتوبة (لا بسملة إطلاقًا). مثال
 *    محقَّق: سورة 112 آية 1 = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ قُلْ
 *    هُوَ ٱللَّهُ أَحَدٌ" (نص واحد متصل). لذلك: تُفصَل البسملة عن مقطعها
 *    فور القسمة وتُستبعَد من قائمة الكلمات المرجعية القابلة للاختبار،
 *    بحيث تُصلَح مشكلة "زيادة/نقص البسملة لا تُحتسَب خطأ" (القسم 6) عبر
 *    عدم وجودها في المرجع أصلاً بدل معالجتها وقت المقارنة الحيّة.
 */
import type { Ayah } from "@/lib/quran-api";
import type { ReferenceWord } from "./types";
import { normalizeQuranWord, WORD_POSITION_OVERRIDES, positionKey } from "./quran-normalize";

const BISMILLAH_WORD_COUNT = 4;

/** يُعيد نص آية 1 بعد فصل البسملة المدمَجة إن وُجدت (لا يُعدّل الآية الأصلية). */
function stripEmbeddedBismillah(surahNumber: number, ayahNumberInSurah: number, text: string): string {
  if (ayahNumberInSurah !== 1) return text;
  if (surahNumber === 1 || surahNumber === 9) return text; // الفاتحة: البسملة هي الآية ذاتها. التوبة: لا بسملة.
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= BISMILLAH_WORD_COUNT) return text; // احتياط: لا نُفرغ الآية بالخطأ
  return words.slice(BISMILLAH_WORD_COUNT).join(" ");
}

export function buildReferenceWords(surahNumber: number, ayahs: Ayah[]): ReferenceWord[] {
  const result: ReferenceWord[] = [];
  let globalIndex = 0;

  for (const ayah of ayahs) {
    const text = stripEmbeddedBismillah(surahNumber, ayah.numberInSurah, ayah.text);
    const rawWords = text.split(/\s+/).filter(Boolean);

    rawWords.forEach((raw, wordIndex) => {
      const override = WORD_POSITION_OVERRIDES[positionKey(surahNumber, ayah.numberInSurah, wordIndex)];
      result.push({
        surah: surahNumber,
        ayah: ayah.numberInSurah,
        wordIndex,
        globalIndex: globalIndex++,
        raw,
        normalized: override ?? normalizeQuranWord(raw),
      });
    });
  }

  return result;
}

/** يبني كلمات مرجعية لعدة سور متتالية (مثال: جزء أو حزب يمتد لأكثر من سورة). */
export function buildReferenceWordsForRange(
  surahAyahs: Array<{ surahNumber: number; ayahs: Ayah[] }>,
): ReferenceWord[] {
  const all: ReferenceWord[] = [];
  let offset = 0;
  for (const { surahNumber, ayahs } of surahAyahs) {
    const words = buildReferenceWords(surahNumber, ayahs);
    for (const w of words) all.push({ ...w, globalIndex: w.globalIndex + offset });
    offset += words.length;
  }
  return all;
}
