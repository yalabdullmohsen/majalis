#!/usr/bin/env node
/**
 * بوابة انحدار التوثيق — المرحلة 8.
 * بلا اعتماديات خارجية. exit 1 عند مخالفات صارمة؛ تحذيرات بلا فشل.
 *
 * التشغيل: node scripts/verify-citations.mjs
 * (إضافة سطر package.json مؤجّلة — انظر docs/deferred-ui-work.md)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function fail(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

function isValidVerifiedFrom(v) {
  if (typeof v !== "string") return false;
  if (v === "NEEDS_HUMAN") return true;
  return v.startsWith("repo:") && v.length > 5;
}

/** استخراج كائنات citations: [...] بسيطة من النص */
function extractCitationBlocks(src) {
  const out = [];
  const re = /citations\s*:\s*\[([\s\S]*?)\]/g;
  let m;
  while ((m = re.exec(src))) {
    out.push(m[1]);
  }
  return out;
}

function checkCitationObjectLiteral(block, file) {
  // كائنات داخل المصفوفة
  const objs = block.match(/\{[\s\S]*?\}/g) || [];
  for (const o of objs) {
    const type = (o.match(/type\s*:\s*['"]([^'"]+)['"]/) || [])[1];
    const work = (o.match(/work\s*:\s*['"]([^'"]*)['"]/) || [])[1];
    const number = (o.match(/number\s*:\s*['"]([^'"]*)['"]/) || [])[1];
    const grade = (o.match(/grade\s*:\s*['"]([^'"]+)['"]/) || [])[1];
    const grader = (o.match(/grader\s*:\s*['"]([^'"]*)['"]/) || [])[1];
    const vf = (o.match(/verified_from\s*:\s*['"]([^'"]*)['"]/) || [])[1];
    const trustNearby = null;

    if (vf !== undefined && !isValidVerifiedFrom(vf)) {
      fail(`${file}: verified_from غير مقبول: "${vf}"`);
    }
    if (grade && !grader) {
      fail(`${file}: grade بلا grader`);
    }
    if (grader && !grade) {
      fail(`${file}: grader بلا grade`);
    }
    // primary_text records checked via trust_level + citations pairing below
    if (type === "hadith" || type === "quran") {
      if (!work || !number) {
        // فقط إن وُسمت درجة primary في نفس السياق — نفحص لاحقاً على مستوى السجل
      }
    }
  }
}

// ── 1) مخطط citation-schema موجود ────────────────────────────
{
  const schemaPath = "src/lib/citation-schema.ts";
  if (!fs.existsSync(path.join(ROOT, schemaPath))) {
    fail("missing src/lib/citation-schema.ts");
  } else {
    const s = read(schemaPath);
    for (const token of [
      "primary_text",
      "scholarly_source",
      "institutional_ruling",
      "general_reasoning",
      "unsourced",
      "verified_from",
    ]) {
      if (!s.includes(token)) fail(`citation-schema missing ${token}`);
    }
  }
}

// ── 2) trust_level=primary_text يجب أن يكون له citations كاملة إن وُجدت ──
const TRUST_FILES = [
  "src/lib/fiqh-issues-seed.ts",
  "src/lib/asma-husna-data.ts",
  "src/lib/fawaid-curated-seed.ts",
];

for (const rel of TRUST_FILES) {
  if (!fs.existsSync(path.join(ROOT, rel))) continue;
  const src = read(rel);
  for (const block of extractCitationBlocks(src)) {
    checkCitationObjectLiteral(block, rel);
  }
  // primary_text + citations ناقصة
  const primaryWithCitations = [
    ...src.matchAll(
      /trust_level\s*:\s*["']primary_text["'][\s\S]{0,400}?citations\s*:\s*\[([\s\S]*?)\]/g,
    ),
  ];
  for (const m of primaryWithCitations) {
    const inner = m[1];
    const work = /work\s*:\s*['"][^'"]+['"]/.test(inner);
    const number = /number\s*:\s*['"][^'"]+['"]/.test(inner);
    if (!work || !number) {
      fail(`${rel}: primary_text ينقصه work أو number في citations`);
    }
  }
  // verified_from أي قيم
  for (const m of src.matchAll(/verified_from\s*:\s*["']([^"']*)["']/g)) {
    if (!isValidVerifiedFrom(m[1])) {
      fail(`${rel}: verified_from غير مقبول: "${m[1]}"`);
    }
  }
  // SUSPECT_TEXT بدون blocked
  if (
    src.includes("SUSPECT_TEXT") &&
    !/publication_gate\s*:\s*["']blocked["']/.test(src)
  ) {
    // قد يكون الوسم في تعليقات — افحص السجلات
    const suspects = [
      ...src.matchAll(/text_flags\s*:\s*\[[^\]]*SUSPECT_TEXT[^\]]*\]/g),
    ];
    for (const s of suspects) {
      const window = src.slice(
        Math.max(0, s.index - 200),
        s.index + s[0].length + 200,
      );
      if (!/publication_gate\s*:\s*["']blocked["']/.test(window)) {
        fail(`${rel}: SUSPECT_TEXT بلا publication_gate=blocked`);
      }
    }
  }
}

// ── 3) curriculum JSON ───────────────────────────────────────
{
  const rel = "data/rulings-encyclopedia/curriculum-topics.json";
  const items = JSON.parse(read(rel));
  for (const it of items) {
    const flags = it.text_flags || [];
    if (flags.includes("SUSPECT_TEXT") && it.publication_gate !== "blocked") {
      fail(
        `${rel}: ${it.external_key} SUSPECT_TEXT بلا publication_gate=blocked`,
      );
    }
    if (it.trust_level === "primary_text") {
      const q = it.quran_evidence || [];
      const s = it.sunnah_evidence || [];
      const hasPin =
        q.some((x) => x.source && /:\s*\d+|:\d+|[٠-٩]/.test(x.source)) ||
        s.some((x) => x.source && /\d|[٠-٩]/.test(x.source));
      if (!hasPin && q.length === 0 && s.length === 0) {
        fail(`${rel}: ${it.external_key} primary_text بلا دليل مرقّم`);
      }
    }
    if (it.verified_from && !isValidVerifiedFrom(it.verified_from)) {
      fail(`${rel}: verified_from غير مقبول على ${it.external_key}`);
    }
    // نص ينتهي منتصف كلمة في summary (حرف مقطوع شائع)
    const summary = it.summary || "";
    if (summary && /الرجلي$|ويُ$|الألبان$/.test(summary.trim())) {
      fail(`${rel}: ${it.external_key} summary ينتهي منتصف كلمة`);
    }
    if (it.editorial_review_status === "unreviewed") {
      warn(`${rel}: ${it.external_key} editorial_review_status=unreviewed`);
    }
    if (it.trust_level === "unsourced" && it.publication_gate !== "blocked") {
      warn(`${rel}: ${it.external_key} منشور بدرجة unsourced`);
    }
  }
}

// ── 4) مراجع دائرية في quiz ──────────────────────────────────
{
  const rel = "src/lib/quiz-seed.ts";
  const src = read(rel);
  if (src.includes("مستند إلى مضمون الإجابة")) {
    fail(`${rel}: مرجع دائري قالبي ما زال موجوداً`);
  }
  // مرجع = نفس الإجابة
  const objs = src.match(/\{[^{}]*"id"\s*:\s*"[^"]+"[^{}]*\}/g) || [];
  let circ = 0;
  for (const o of objs) {
    const ans = (o.match(/"answer"\s*:\s*"((?:\\.|[^"\\])*)"/) || [])[1];
    const ref = (o.match(/"reference"\s*:\s*"((?:\\.|[^"\\])*)"/) || [])[1];
    if (ans && ref && ans.trim() === ref.trim()) circ++;
  }
  if (circ > 0) fail(`${rel}: ${circ} مرجع يطابق نص الإجابة حرفياً`);
}

// ── 5) نقحرة لاتينية في متون عربية داخل علامات «» مع ﷺ ────────
{
  const files = [
    "src/lib/qa-seed.ts",
    "src/lib/quiz-seed.ts",
    "src/lib/fawaid-seed.ts",
    "src/lib/asma-husna-data.ts",
    "data/rulings-encyclopedia/curriculum-topics.json",
  ];
  for (const rel of files) {
    if (!fs.existsSync(path.join(ROOT, rel))) continue;
    const src = read(rel);
    const lines = src.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes("ﷺ")) continue;
      for (const m of line.matchAll(/«([^»]+)»/g)) {
        if (/[A-Za-z]{3,}/.test(m[1]) && /[\u0600-\u06FF]/.test(m[1])) {
          fail(`${rel}:${i + 1}: نقحرة لاتينية داخل متن عربي مع ﷺ`);
        }
      }
    }
  }
}

// ── 6) نسبة نبوية بلا أي مؤشر تخريج في سطر الدليل ─────────────
{
  // تحذير فقط إن السطر يقول «لقوله ﷺ» بلا رواه/متفق/صحيح/سنن
  const files = ["src/lib/qa-seed.ts", "src/lib/fawaid-seed.ts"];
  for (const rel of files) {
    const lines = read(rel).split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!/لقوله\s*ﷺ|قال\s*رسول\s*الله\s*ﷺ/.test(line)) continue;
      {
        // اقبل تخريجاً في نفس السجل (evidence/reference) أو وسم NEEDS_HUMAN صريح
        const window = lines.slice(Math.max(0, i - 30), i + 30).join("\n");
        const hasTakhrijNearby =
          /(?:رواه|متفق|البخاري|مسلم|الترمذي|أبو داود|النسائي|ابن ماجه|صححه|حسّنه)/.test(
            window,
          );
        const hasNeedsHuman = /["']?takhrij_status["']?\s*:\s*["']NEEDS_HUMAN["']/.test(
          window,
        );
        if (!hasTakhrijNearby && !hasNeedsHuman) {
          fail(`${rel}:${i + 1}: نص منسوب للنبي ﷺ بلا حقل/مؤشر تخريج`);
        }
      }
    }
  }
}

// ── 7) تحذيرات unsourced / unreviewed على الفقه ───────────────
{
  const rel = "src/lib/fiqh-issues-seed.ts";
  const src = read(rel);
  const unsourced = [
    ...src.matchAll(/id:\s*"([^"]+)"[\s\S]*?trust_level:\s*"unsourced"/g),
  ];
  for (const m of unsourced) {
    warn(`${rel}: ${m[1]} trust_level=unsourced (منشور)`);
  }
  const unrev = [...src.matchAll(/editorial_review_status:\s*"unreviewed"/g)];
  if (unrev.length) {
    warn(`${rel}: ${unrev.length} سجلاً editorial_review_status=unreviewed`);
  }
}

// ── تقرير ────────────────────────────────────────────────────
const summary = {
  errors: errors.length,
  warnings: warnings.length,
  error_samples: errors.slice(0, 40),
  warning_samples: warnings.slice(0, 20),
};
console.log(JSON.stringify(summary, null, 2));
if (errors.length) {
  console.error(`\nverify-citations: FAILED with ${errors.length} error(s)`);
  process.exit(1);
}
console.log("\nverify-citations: OK");
process.exit(0);
