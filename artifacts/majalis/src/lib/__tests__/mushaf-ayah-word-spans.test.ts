/**
 * حدود تحديد الآية من مفاتيح الكلمات (سورة:آية:موضع) على عيّنة 20 صفحة.
 * علامة الرقم تنتمي للآية التي تنهيها؛ لا تسرّب من آية مجاورة.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-ayah-word-spans.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ayahWordSpansFromLayout,
  assertAyahSpanBoundaries,
} from "@/features/mushaf/ayah-word-keys";
import { horizontalSpan } from "@/features/mushaf/ayah-hit-regions";
import type { MushafPageLayout, MushafPageRow, QpcWord } from "@/lib/mushaf-v2-data";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");
const pagesDir = resolve(appRoot, "public/data/quran-v2/pages");

/** عيّنة 20 صفحة موزّعة — تشمل ص5 (آية 25) */
const SAMPLE_PAGES = [
  1, 2, 5, 50, 76, 100, 150, 200, 250, 283,
  300, 350, 400, 450, 500, 550, 580, 595, 600, 604,
];

function layoutFromPageJson(pageNum: number): MushafPageLayout {
  const verses = JSON.parse(
    readFileSync(
      resolve(pagesDir, `page-${String(pageNum).padStart(3, "0")}.json`),
      "utf8",
    ),
  ) as Array<{
    verse_key: string;
    juz_number?: number;
    words?: Array<{
      id: number;
      position: number;
      line_number: number;
      char_type_name: string;
      text_uthmani: string;
      text_qpc_hafs?: string;
      code_v2?: string;
    }>;
  }>;

  const lineWords = new Map<number, QpcWord[]>();
  for (const v of verses) {
    for (const w of v.words ?? []) {
      const qw: QpcWord = {
        id: w.id,
        position: w.position,
        lineNumber: w.line_number,
        charType: w.char_type_name,
        textUthmani: w.text_uthmani,
        textQpcHafs: w.text_qpc_hafs ?? w.text_uthmani,
        glyphText: w.code_v2 ?? "",
        audioUrl: null,
        verseKey: v.verse_key,
        sajdahNumber: null,
      };
      const list = lineWords.get(w.line_number) ?? [];
      list.push(qw);
      lineWords.set(w.line_number, list);
    }
  }

  const rows: MushafPageRow[] = [...lineWords.keys()]
    .sort((a, b) => a - b)
    .map((ln) => ({ kind: "line" as const, lineNumber: ln, words: lineWords.get(ln)! }));

  return {
    pageNumber: pageNum,
    juzNumber: verses[0]?.juz_number ?? 1,
    rows,
    surahsOnPage: [],
    layoutMode: pageNum <= 2 ? "opening-centered" : "standard",
    ayahLineCount: lineWords.size,
  };
}

for (const n of SAMPLE_PAGES) {
  const layout = layoutFromPageJson(n);
  const spans = ayahWordSpansFromLayout(layout);
  assert.ok(spans.length > 0, `ص${n}: بلا آيات`);
  const errs = assertAyahSpanBoundaries(spans);
  assert.equal(errs.length, 0, `ص${n}: ${errs.join(" | ")}`);
}

// ص5 آية 25: علامة ٢٥ ضمن 2:25، وأول كلمة 2:26 خارجها
{
  const layout = layoutFromPageJson(5);
  const spans = ayahWordSpansFromLayout(layout);
  const a25 = spans.find((s) => s.verseKey === "2:25");
  const a26 = spans.find((s) => s.verseKey === "2:26");
  assert.ok(a25 && a26, "ص5: 2:25 و2:26 موجودتان");
  assert.equal(a25!.firstWordKey, "2:25:1");
  assert.equal(a25!.endMarkerKey, "2:25:35");
  assert.equal(a25!.lastWordKey, "2:25:35");
  assert.equal(a26!.firstWordKey, "2:26:1");
  assert.equal(a25!.wordKeys.includes("2:26:1"), false, "لا تسرّب أول كلمة 2:26 إلى 2:25");

  const line4 = layout.rows.find((r) => r.kind === "line" && r.lineNumber === 4);
  assert.ok(line4 && line4.kind === "line");
  const span25 = horizontalSpan(
    line4.words,
    line4.words.filter((w) => w.verseKey === "2:25"),
  );
  const span26 = horizontalSpan(
    line4.words,
    line4.words.filter((w) => w.verseKey === "2:26"),
  );
  // لا تداخل داخلي (الملامسة عند الحد مسموحة)
  const a0 = span25.x;
  const a1 = span25.x + span25.w;
  const b0 = span26.x;
  const b1 = span26.x + span26.w;
  const overlap = Math.min(a1, b1) - Math.max(a0, b0);
  assert.ok(overlap <= 1e-6, `تداخل حيز 2:25 و2:26 على السطر 4: ${JSON.stringify({ span25, span26, overlap })}`);
}

// الطبقة النشطة للـhit شفافة — لا تظليل حاوية
{
  const css = readFileSync(resolve(appRoot, "src/features/mushaf/mushaf-layered.css"), "utf8");
  assert.match(css, /\.mfl-hit__ayah--active\s*\{[\s\S]*?fill:\s*transparent/);
  assert.equal(
    /fill:\s*color-mix/.test(css),
    false,
    "أُزيل تظليل color-mix من طبقة الضغط",
  );
}

console.log("mushaf-ayah-word-spans.test.ts: ok");
