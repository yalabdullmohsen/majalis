#!/usr/bin/env node
/**
 * ملء «المعنى الإجمالي» في knowledge/tafsir/ayahs من التفسير الميسّر المحلي
 * (public/data/tafsir/muyassar) — نقل حرفي بلا اجتهاد.
 *
 * الاستعمال:
 *   node scripts/content-gates/fill-knowledge-tafsir-muyassar.mjs --surah=3 --batch=01
 *   node scripts/content-gates/fill-knowledge-tafsir-muyassar.mjs --surah=3 --batch=01,02
 */
import fs from "node:fs";
import path from "node:path";
import { KNOWLEDGE, loadQuran, getAyah, loadKnowledgeItems } from "./lib.mjs";

const TODAY = new Date().toISOString().slice(0, 10);
const TAFSIR_DIR = path.join(KNOWLEDGE, "../tafsir/muyassar");

const SKIP_PREFIX = /^سبق الكلام/i;

function parseArgs() {
  const surah = Number(process.argv.find((a) => a.startsWith("--surah="))?.split("=")[1]);
  const batchArg = process.argv.find((a) => a.startsWith("--batch="))?.split("=")[1] ?? "01";
  const batches = batchArg.split(",").map((b) => b.trim().padStart(2, "0"));
  if (!surah || surah < 1 || surah > 114) {
    console.error("مطلوب --surah=1..114");
    process.exit(1);
  }
  return { surah, batches };
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

function fillItem(item, muyassar, quranText) {
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

  return {
    item: {
      ...item,
      body,
      review_status: "verified",
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
    },
    status: "filled",
  };
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

function main() {
  const { surah, batches } = parseArgs();
  loadQuran();
  const muyassar = loadMuyassar(surah);
  if (!muyassar) {
    console.error(`لا يوجد muyassar لسورة ${surah}`);
    process.exit(1);
  }

  const outDir = path.join(KNOWLEDGE, "tafsir/ayahs");
  let filled = 0;
  let skipped = 0;
  let already = 0;

  for (const batch of batches) {
    const fp = path.join(outDir, `surah-${String(surah).padStart(3, "0")}-batch-${batch}.json`);
    if (!fs.existsSync(fp)) {
      console.error("ملف غير موجود:", fp);
      process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync(fp, "utf8"));
    const items = [];
    for (const item of data.items) {
      if (item.review_status === "verified") {
        already++;
        items.push(item);
        continue;
      }
      const quranText = getAyah(surah, item.meta.ayah)?.text;
      const { item: next, status } = fillItem(item, muyassar, quranText);
      items.push(next);
      if (status === "filled") filled++;
      else skipped++;
    }
    fs.writeFileSync(fp, JSON.stringify({ items }, null, 2) + "\n");
    console.log(`✓ ${path.basename(fp)} — ملء ${filled} (تراكمي) تخطي ${skipped}`);
  }

  refreshManifest();
  console.log(JSON.stringify({ surah, batches, filled, skipped, already }, null, 2));
}

main();
