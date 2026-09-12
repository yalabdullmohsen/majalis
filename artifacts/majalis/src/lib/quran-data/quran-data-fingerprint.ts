/**
 * بصمة بيانات quran-v2 — تحقق فقط؛ لا تعديل للنص.
 * الخوارزمية مطابقة لـ SOURCE.json (codes/texts = join بلا فاصل، verseOrder = |).
 */

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type QuranV2Fingerprint = {
  ayahCount: number;
  wordCount: number;
  verseOrderLen: number;
  codesSha: string;
  textsSha: string;
  verseOrderSha: string;
};

export type FingerprintCheckResult = {
  ok: boolean;
  status: "ok" | "QuranDataReviewRequired";
  expected: QuranV2Fingerprint;
  actual: QuranV2Fingerprint;
  mismatches: string[];
  pageCount: number;
};

type RawVerse = {
  verse_key?: string;
  words?: Array<{ code_v2?: string; text_uthmani?: string }>;
};

function sha256(payload: string): string {
  return createHash("sha256").update(payload, "utf8").digest("hex");
}

export function resolveQuranV2Root(fromFileUrl = import.meta.url): string {
  const here = dirname(fileURLToPath(fromFileUrl));
  // src/lib/quran-data → artifacts/majalis
  return resolve(here, "../../..");
}

export function computeQuranV2Fingerprint(pagesDir: string): QuranV2Fingerprint & { pageCount: number } {
  const files = readdirSync(pagesDir)
    .filter((f) => /^page-\d+\.json$/.test(f))
    .sort();
  const codes: string[] = [];
  const texts: string[] = [];
  const verseOrder: string[] = [];

  for (const file of files) {
    const raw = JSON.parse(readFileSync(resolve(pagesDir, file), "utf8")) as RawVerse[] | { verses?: RawVerse[] };
    const verses = Array.isArray(raw) ? raw : (raw.verses ?? []);
    for (const v of verses) {
      if (typeof v.verse_key === "string" && v.verse_key.length > 0) {
        verseOrder.push(v.verse_key);
      }
      for (const w of v.words ?? []) {
        if (typeof w.code_v2 === "string") codes.push(w.code_v2);
        if (typeof w.text_uthmani === "string") texts.push(w.text_uthmani);
      }
    }
  }

  return {
    pageCount: files.length,
    ayahCount: verseOrder.length,
    wordCount: codes.length,
    verseOrderLen: verseOrder.length,
    codesSha: sha256(codes.join("")),
    textsSha: sha256(texts.join("")),
    verseOrderSha: sha256(verseOrder.join("|")),
  };
}

export function checkQuranV2Fingerprint(root?: string): FingerprintCheckResult {
  const base = root ?? resolveQuranV2Root();
  const sourcePath = resolve(base, "public/data/quran-v2/SOURCE.json");
  const pagesDir = resolve(base, "public/data/quran-v2/pages");
  if (!existsSync(sourcePath) || !existsSync(pagesDir)) {
    return {
      ok: false,
      status: "QuranDataReviewRequired",
      expected: {
        ayahCount: 6236,
        wordCount: 83665,
        verseOrderLen: 6236,
        codesSha: "",
        textsSha: "",
        verseOrderSha: "",
      },
      actual: {
        ayahCount: 0,
        wordCount: 0,
        verseOrderLen: 0,
        codesSha: "",
        textsSha: "",
        verseOrderSha: "",
      },
      mismatches: ["SOURCE.json أو مجلد الصفحات مفقود"],
      pageCount: 0,
    };
  }

  const source = JSON.parse(readFileSync(sourcePath, "utf8")) as {
    mushafId?: number;
    fingerprint?: Partial<QuranV2Fingerprint>;
  };
  const expected: QuranV2Fingerprint = {
    ayahCount: Number(source.fingerprint?.ayahCount ?? 6236),
    wordCount: Number(source.fingerprint?.wordCount ?? 83665),
    verseOrderLen: Number(source.fingerprint?.verseOrderLen ?? 6236),
    codesSha: String(source.fingerprint?.codesSha ?? ""),
    textsSha: String(source.fingerprint?.textsSha ?? ""),
    verseOrderSha: String(source.fingerprint?.verseOrderSha ?? ""),
  };
  const computed = computeQuranV2Fingerprint(pagesDir);
  const actual: QuranV2Fingerprint = {
    ayahCount: computed.ayahCount,
    wordCount: computed.wordCount,
    verseOrderLen: computed.verseOrderLen,
    codesSha: computed.codesSha,
    textsSha: computed.textsSha,
    verseOrderSha: computed.verseOrderSha,
  };

  const mismatches: string[] = [];
  if (Number(source.mushafId) !== 1) {
    mismatches.push(`mushafId=${source.mushafId} (المسموح: 1 فقط)`);
  }
  if (computed.pageCount !== 604) {
    mismatches.push(`pageCount=${computed.pageCount} (المتوقع 604)`);
  }
  for (const key of Object.keys(expected) as (keyof QuranV2Fingerprint)[]) {
    if (String(expected[key]) !== String(actual[key])) {
      mismatches.push(`${key}: expected=${expected[key]} actual=${actual[key]}`);
    }
  }

  return {
    ok: mismatches.length === 0,
    status: mismatches.length === 0 ? "ok" : "QuranDataReviewRequired",
    expected,
    actual,
    mismatches,
    pageCount: computed.pageCount,
  };
}
