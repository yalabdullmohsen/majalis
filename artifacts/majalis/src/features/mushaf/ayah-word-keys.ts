/**
 * مفاتيح كلمات الآية بصيغة سورة:آية:موضع — أساس التحديد/الاختبار،
 * لا إزاحات محارف ولا صناديق أسطر كاملة.
 */
import type { MushafPageLayout, QpcWord } from "@/lib/mushaf-v2-data";

/** مفتاح كلمة مرسومة: surah:ayah:position */
export function wordKeyFromQpc(w: QpcWord): string {
  const [surah, ayah] = w.verseKey.split(":").map(Number);
  return `${surah}:${ayah}:${w.position}`;
}

export type AyahWordSpan = {
  verseKey: string;
  /** كل مفاتيح الكلمات بما فيها علامة رقم الآية (charType=end) */
  wordKeys: string[];
  firstWordKey: string;
  lastWordKey: string;
  /** مفتاح علامة الرقم إن وُجدت */
  endMarkerKey: string | null;
};

/** يستخرج نطاق كلمات كل آية من تخطيط الصفحة (QPC ids/positions). */
export function ayahWordSpansFromLayout(layout: MushafPageLayout | null): AyahWordSpan[] {
  if (!layout) return [];
  const byAyah = new Map<string, QpcWord[]>();
  for (const row of layout.rows) {
    if (row.kind !== "line") continue;
    for (const w of row.words) {
      const list = byAyah.get(w.verseKey) ?? [];
      list.push(w);
      byAyah.set(w.verseKey, list);
    }
  }

  const spans: AyahWordSpan[] = [];
  for (const [verseKey, words] of byAyah) {
    const ordered = [...words].sort((a, b) => a.position - b.position);
    const wordKeys = ordered.map(wordKeyFromQpc);
    const end = ordered.find((w) => w.charType === "end");
    spans.push({
      verseKey,
      wordKeys,
      firstWordKey: wordKeys[0]!,
      lastWordKey: wordKeys[wordKeys.length - 1]!,
      endMarkerKey: end ? wordKeyFromQpc(end) : null,
    });
  }

  spans.sort((a, b) => {
    const [as, aa] = a.verseKey.split(":").map(Number);
    const [bs, ba] = b.verseKey.split(":").map(Number);
    return as - bs || aa - ba;
  });
  return spans;
}

/**
 * يثبت أن علامة الرقم تنتمي للآية التي تنهيها، وأن أول كلمة من الآية
 * التالية ليست ضمن نطاق الآية الحالية.
 * (الآية قد تبدأ منتصف صفحة بموضع > 1 إن استُؤنفت من الصفحة السابقة.)
 */
export function assertAyahSpanBoundaries(spans: AyahWordSpan[]): string[] {
  const errors: string[] = [];
  for (let i = 0; i < spans.length; i++) {
    const cur = spans[i]!;
    const positions = cur.wordKeys.map((k) => Number(k.split(":")[2]));
    const minPos = Math.min(...positions);
    const maxPos = Math.max(...positions);
    const [surah, ayah] = cur.verseKey.split(":").map(Number);
    const expectedFirst = `${surah}:${ayah}:${minPos}`;
    const expectedLast = `${surah}:${ayah}:${maxPos}`;
    if (cur.firstWordKey !== expectedFirst) {
      errors.push(`${cur.verseKey}: أول كلمة ${cur.firstWordKey} ≠ ${expectedFirst}`);
    }
    if (cur.lastWordKey !== expectedLast) {
      errors.push(`${cur.verseKey}: آخر كلمة ${cur.lastWordKey} ≠ ${expectedLast}`);
    }
    if (cur.endMarkerKey) {
      if (!cur.wordKeys.includes(cur.endMarkerKey)) {
        errors.push(`${cur.verseKey}: علامة الرقم خارج النطاق`);
      }
      if (cur.lastWordKey !== cur.endMarkerKey) {
        errors.push(
          `${cur.verseKey}: آخر عنصر يجب أن يكون علامة الرقم (${cur.endMarkerKey}) لا ${cur.lastWordKey}`,
        );
      }
    }
    const next = spans[i + 1];
    if (next) {
      const leak = cur.wordKeys.filter((k) => next.wordKeys.includes(k));
      if (leak.length) {
        errors.push(`${cur.verseKey}↔${next.verseKey}: تسرّب مفاتيح ${leak.join(",")}`);
      }
      if (cur.wordKeys.includes(next.firstWordKey)) {
        errors.push(`${cur.verseKey}: يتضمّن أول كلمة الآية التالية ${next.firstWordKey}`);
      }
    }
  }
  return errors;
}
