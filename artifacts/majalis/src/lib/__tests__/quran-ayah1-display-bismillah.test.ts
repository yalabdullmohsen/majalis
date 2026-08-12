/**
 * حارس عرض: مقتطف الآية ١ لا يبدأ بالبسملة عدا الفاتحة.
 * طبقة عرض فقط — لا يمس بيانات النص المخزَّنة.
 *
 * تشغيل: node --import tsx src/lib/__tests__/quran-ayah1-display-bismillah.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  displayAyahSnippet,
  displaySnippetStartsWithBismillah,
  displaySurahName,
} from "@/lib/quran-display";
import { stripEmbeddedBismillah, getSurahMeta } from "@/lib/quran-api";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, "../../..");

/** عيّنة نصوص آية ١ من الملفات المحلية إن وُجدت؛ وإلا نصوص تمثيلية. */
function loadAyah1Text(surah: number): string | null {
  const path = resolve(appRoot, `public/data/quran/surah-${String(surah).padStart(3, "0")}.json`);
  if (!existsSync(path)) return null;
  try {
    const data = JSON.parse(readFileSync(path, "utf8")) as {
      ayahs?: Array<{ numberInSurah?: number; text?: string }>;
    };
    const a1 = data.ayahs?.find((a) => a.numberInSurah === 1);
    return a1?.text ?? null;
  } catch {
    return null;
  }
}

let checked = 0;
let fromFiles = 0;

for (let surah = 1; surah <= 114; surah++) {
  const raw = loadAyah1Text(surah);
  // نص تمثيلي إن لم يتوفر الملف: فاتحة=بسملة، توبة=بلا، غيرهما=بسملة+متن
  const text =
    raw ??
    (surah === 1
      ? "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"
      : surah === 9
        ? "بَرَآءَةٌ مِّنَ ٱللَّهِ وَرَسُولِهِ"
        : "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ نَصٌّ تَمْثِيلِيٌّ لِلْآيَةِ");
  if (raw) fromFiles += 1;

  const stored = text; // البصمة المخزَّنة لا تُمس
  const shown = displayAyahSnippet(surah, 1, stored);
  assert.equal(shown, stripEmbeddedBismillah(surah, 1, stored));

  if (surah === 1) {
    assert.ok(
      displaySnippetStartsWithBismillah(shown) || /بسم|بِسْم/.test(shown),
      "الفاتحة: البسملة آية ١ وتبقى في العرض",
    );
  } else {
    assert.equal(
      displaySnippetStartsWithBismillah(shown),
      false,
      `سورة ${surah} (${getSurahMeta(surah).name}): مقتطف الآية ١ لا يبدأ بالبسملة`,
    );
  }

  // أسماء العرض بلا تشكيل عثماني معلّق
  const name = displaySurahName(surah);
  assert.ok(name.length > 0);
  assert.equal(name, getSurahMeta(surah).name);
  assert.ok(!/[\u064B-\u065F]/.test(name), `اسم سورة ${surah} بلا حركات: ${name}`);

  checked += 1;
}

assert.equal(checked, 114);
console.log(
  `quran-ayah1-display-bismillah.test.ts: ok (${checked} سورة، ${fromFiles} من ملفات محلية)`,
);
