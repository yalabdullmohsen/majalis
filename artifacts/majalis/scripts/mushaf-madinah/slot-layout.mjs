/**
 * محاكاة خانات شبكة المصحف من JSON — للبوابات بلا DOM.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");

export function loadChaptersJson() {
  return JSON.parse(readFileSync(resolve(root, "public/data/quran-v2/chapters.json"), "utf8"));
}

export function loadPageJson(pageNumber) {
  const file = resolve(
    root,
    `public/data/quran-v2/pages/page-${String(pageNumber).padStart(3, "0")}.json`,
  );
  return JSON.parse(readFileSync(file, "utf8"));
}

/** يُ mimic منطق loadMushafPage لخانات الشبكة ١–١٥ */
export function computePageSlots(pageNumber, chapters, raw) {
  const lineWords = new Map();
  for (const v of raw) {
    for (const w of v.words) {
      if (!lineWords.has(w.line_number)) lineWords.set(w.line_number, []);
      lineWords.get(w.line_number).push(w);
    }
  }
  const usedLines = [...lineWords.keys()].sort((a, b) => a - b);
  const maxLine = usedLines.length ? Math.max(...usedLines) : 15;
  const isOpening = pageNumber === 1 || pageNumber === 2;

  const surahStarts = new Map();
  for (const v of raw) {
    if (v.verse_key.endsWith(":1") && !surahStarts.has(Number(v.verse_key.split(":")[0]))) {
      surahStarts.set(Number(v.verse_key.split(":")[0]), Math.min(...v.words.map((w) => w.line_number)));
    }
  }
  const headerStartLines = [...surahStarts.entries()].sort((a, b) => a[1] - b[1]);

  const slots = new Map();
  const basmalaInsertBefore = new Map();

  for (const [surahNum, firstLine] of headerStartLines) {
    const chapter = chapters.find((c) => c.id === surahNum);
    if (!chapter) continue;
    const prevUsed = usedLines.filter((ln) => ln < firstLine).pop() ?? 0;
    const gap = firstLine - prevUsed - 1;
    let bannerSlot;
    let basmalaSlot = null;
    if (isOpening) {
      bannerSlot = 3;
      if (chapter.bismillah_pre) basmalaSlot = 4;
    } else {
      bannerSlot = Math.max(1, prevUsed + 1);
      basmalaSlot = chapter.bismillah_pre ? bannerSlot + 1 : null;
      if (gap === 1 && chapter.bismillah_pre) basmalaInsertBefore.set(firstLine, 1);
    }
    slots.set(bannerSlot, { kind: "banner", surah: surahNum, bismillahPre: chapter.bismillah_pre });
    if (basmalaSlot != null) slots.set(basmalaSlot, { kind: "basmala", surah: surahNum });
  }

  if (isOpening) {
    const startSlot = [...slots.keys()].includes(4) ? 5 : 4;
    usedLines.forEach((ln, i) => {
      slots.set(startSlot + i, { kind: "line", lineNumber: ln });
    });
  } else {
    const bySlot = new Map();
    for (let ln = 1; ln <= maxLine; ln++) {
      if (!lineWords.has(ln)) continue;
      let insert = 0;
      for (const [firstLine, offset] of basmalaInsertBefore) {
        if (ln >= firstLine) insert += offset;
      }
      const gridSlot = Math.min(ln + insert, 15);
      if (bySlot.has(gridSlot)) {
        bySlot.get(gridSlot).push(ln);
      } else {
        bySlot.set(gridSlot, [ln]);
      }
    }
    for (const [gridSlot, lineNums] of bySlot) {
      slots.set(gridSlot, { kind: "line", lineNumbers: lineNums });
    }
  }

  return { slots, isOpening, headerStartLines, basmalaInsertBefore };
}

export function rootDir() {
  return root;
}
