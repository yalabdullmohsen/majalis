#!/usr/bin/env node
/**
 * ملء «المعنى الإجمالي» في knowledge/tafsir/ayahs من التفسير الميسّر المحلي
 * (public/data/tafsir/muyassar) — نقل حرفي بلا اجتهاد.
 *
 * الاستعمال:
 *   node scripts/content-gates/fill-knowledge-tafsir-muyassar.mjs --surah=3 --batch=01,02
 *   node scripts/content-gates/fill-knowledge-tafsir-muyassar.mjs --file=juz-amma-and-fatiha.json
 *   node scripts/content-gates/fill-knowledge-tafsir-muyassar.mjs --file=juz-amma-and-fatiha.json --reprocess
 */
import fs from "node:fs";
import path from "node:path";
import { KNOWLEDGE, loadQuran, getAyah, loadKnowledgeItems, softNorm } from "./lib.mjs";

const TODAY = new Date().toISOString().slice(0, 10);
const TAFSIR_DIR = path.join(KNOWLEDGE, "../tafsir/muyassar");
const SKIP_PREFIX = /^سبق الكلام/i;
const DUPE_THRESH = 0.97;

function parseArgs() {
  const fileArg = process.argv.find((a) => a.startsWith("--file="))?.split("=")[1];
  const reprocess = process.argv.includes("--reprocess");
  if (fileArg) return { mode: "file", file: fileArg, reprocess };

  const surah = Number(process.argv.find((a) => a.startsWith("--surah="))?.split("=")[1]);
  const batchArg = process.argv.find((a) => a.startsWith("--batch="))?.split("=")[1] ?? "01";
  const batches = batchArg.split(",").map((b) => b.trim().padStart(2, "0"));
  if (!surah || surah < 1 || surah > 114) {
    console.error("مطلوب --surah=1..114 أو --file=...");
    process.exit(1);
  }
  return { mode: "batch", surah, batches, reprocess };
}

function loadMuyassar(surah) {
  const fp = path.join(TAFSIR_DIR, `${String(surah).padStart(3, "0")}.json`);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

function replaceSection(body, heading, content) {
  const re = new RegExp(`(## ${heading}\\n)[\\s\\S]*?(?=\\n## |$)`);
  if (!re.test(body)) return body;
  return body.replace(re, `$1${content}`);
}

function bodyTokens(text) {
  const n = softNorm(text);
  const out = [];
  for (let i = 0; i + 3 <= n.length; i += 2) out.push(n.slice(i, i + 3));
  return new Set(out);
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

function wouldDuplicateBody(body, verifiedBodies) {
  const norm = softNorm(body);
  if (norm.length <= 80) return false;
  const ti = bodyTokens(body);
  for (const prev of verifiedBodies) {
    if (jaccard(ti, bodyTokens(prev)) >= DUPE_THRESH) return true;
  }
  return false;
}

function fillItem(item, muyassar, quranText, verifiedBodies) {
  const ayah = item.meta?.ayah;
  const text = muyassar?.ayahs?.[String(ayah)]?.trim();
  if (!text || text.length < 20 || SKIP_PREFIX.test(text)) {
    return { item, status: "skipped" };
  }

  let body = item.body;
  body = replaceSection(body, "المعنى الإجمالي", text);
  body = replaceSection(
    body,
    "نسبة القول",
    "نقل حرفي من التفسير الميسّر (public/data/tafsir/muyassar) دون اختيار أو صياغة تحريرية.",
  );

  const ref = `${item.meta.surah}:${ayah}`;
  const ayahEvidence = item.evidences?.find((e) => e.type === "ayah");
  if (ayahEvidence && quranText && ayahEvidence.text !== quranText) {
    ayahEvidence.text = quranText;
    ayahEvidence.ref = ref;
  }

  const duplicate = wouldDuplicateBody(body, verifiedBodies);
  const nextItem = {
    ...item,
    body,
    review_status: duplicate ? "needs_review" : "verified",
    updated_at: TODAY,
    sources: [
      {
        book: "القرآن الكريم برسم العثماني",
        author: "مصحف المشروع المحلي",
        locator: `public/data/quran/surah-${String(item.meta.surah).padStart(3, "0")}.json`,
      },
      {
        book: "التفسير الميسّر",
        author: "نخبة من العلماء",
        locator: ref,
      },
    ],
  };
  if (!duplicate) verifiedBodies.push(body);
  return { item: nextItem, status: duplicate ? "duplicate" : "filled" };
}

function refreshManifest() {
  const manPath = path.join(KNOWLEDGE, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manPath, "utf8"));
  const items = loadKnowledgeItems();
  const verified = items.filter((i) => i.review_status === "verified").length;
  const needs = items.filter((i) => i.review_status === "needs_review").length;
  const tafsir = items.filter((i) => i.section === "tafsir").length;
  manifest.updated_at = TODAY;
  manifest.round = "fill-tafsir-muyassar";
  manifest.totals = {
    ...manifest.totals,
    all: items.length,
    verified,
    needs_review: needs,
    tafsir,
  };
  fs.writeFileSync(manPath, JSON.stringify(manifest, null, 2) + "\n");
}

function processItems(dataItems, muyassarBySurah, { reprocess = false } = {}) {
  let filled = 0;
  let skipped = 0;
  let duplicate = 0;
  let already = 0;
  const items = [];
  const verifiedBodies = [];

  for (const item of dataItems) {
    if (item.review_status === "verified" && !reprocess) {
      already++;
      verifiedBodies.push(item.body);
      items.push(item);
      continue;
    }
    const surah = item.meta?.surah;
    if (!muyassarBySurah.has(surah)) {
      const muyassar = loadMuyassar(surah);
      if (!muyassar) {
        console.error(`لا يوجد muyassar لسورة ${surah}`);
        process.exit(1);
      }
      muyassarBySurah.set(surah, muyassar);
    }
    const quranText = getAyah(surah, item.meta.ayah)?.text;
    const { item: next, status } = fillItem(
      item,
      muyassarBySurah.get(surah),
      quranText,
      verifiedBodies,
    );
    items.push(next);
    if (status === "filled") filled++;
    else if (status === "duplicate") duplicate++;
    else skipped++;
  }
  return { items, filled, skipped, duplicate, already };
}

function main() {
  const args = parseArgs();
  loadQuran();
  const muyassarBySurah = new Map();
  let filled = 0;
  let skipped = 0;
  let duplicate = 0;
  let already = 0;

  if (args.mode === "file") {
    const fp = path.join(KNOWLEDGE, "tafsir/ayahs", args.file);
    if (!fs.existsSync(fp)) {
      console.error("ملف غير موجود:", fp);
      process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync(fp, "utf8"));
    const result = processItems(data.items, muyassarBySurah, { reprocess: args.reprocess });
    filled = result.filled;
    skipped = result.skipped;
    duplicate = result.duplicate;
    already = result.already;
    fs.writeFileSync(fp, JSON.stringify({ items: result.items }, null, 2) + "\n");
    console.log(
      `✓ ${args.file} — ملء ${filled} تكرار ${duplicate} تخطي ${skipped} كان verified ${already}`,
    );
    refreshManifest();
    console.log(JSON.stringify({ file: args.file, filled, duplicate, skipped, already }, null, 2));
    return;
  }

  const { surah, batches, reprocess } = args;
  const muyassar = loadMuyassar(surah);
  if (!muyassar) {
    console.error(`لا يوجد muyassar لسورة ${surah}`);
    process.exit(1);
  }
  muyassarBySurah.set(surah, muyassar);

  const outDir = path.join(KNOWLEDGE, "tafsir/ayahs");
  for (const batch of batches) {
    const fp = path.join(outDir, `surah-${String(surah).padStart(3, "0")}-batch-${batch}.json`);
    if (!fs.existsSync(fp)) {
      console.error("ملف غير موجود:", fp);
      process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync(fp, "utf8"));
    const result = processItems(data.items, muyassarBySurah, { reprocess });
    filled += result.filled;
    skipped += result.skipped;
    duplicate += result.duplicate;
    already += result.already;
    fs.writeFileSync(fp, JSON.stringify({ items: result.items }, null, 2) + "\n");
    console.log(
      `✓ ${path.basename(fp)} — ملء ${filled} (تراكمي) تخطي ${skipped} تكرار ${duplicate}`,
    );
  }

  refreshManifest();
  console.log(JSON.stringify({ surah, batches, filled, duplicate, skipped, already }, null, 2));
}

main();
