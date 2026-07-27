#!/usr/bin/env node
/**
 * strip-content-padding.mjs
 * يزيل الحشو الآلي (ذيول قوالب + نقاط التكميل) من:
 *   - scholars-data.ts
 *   - sheikhs-seed.ts
 *   - library-catalog.ts
 *
 * Usage: node scripts/strip-content-padding.mjs [--apply]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const APPLY = process.argv.includes("--apply");

const SCHOLAR_TAILS = [
  /؛?\s*ويُستفاد من تراثه في البناء العلمي بلا غلو في الأشخاص[^."]*\.?/g,
  /؛?\s*وهو مرجع معتمد في تخصصه عند أهل العلم[^."]*\.?/g,
  /؛?\s*وتُرجع إليه مسائل علمه بما ثبت من كتبه ورواياته[^."]*\.?/g,
  /؛?\s*من علماء (?:الأئمة الأربعة|المحدثون|العلماء الكبار|المجددون|المعاصرون)[^."]*\.?/g,
  /؛?\s*ويُستفاد من تراثه في البناء العلمي\.?/g,
];

const SHEIKH_TAILS = [
  /؛?\s*يُستفاد من دروسه في البناء العلمي بلا غلو في الأشخاص[^."]*\.?/g,
  /؛?\s*مع التزام المنهج الوسط[^."]*\.?/g,
  /؛?\s*ويُراعى أدب طلب العلم[^."]*\.?/g,
];

const LIBRARY_TAILS = [
  /؛?\s*من مراجع المكتبة الإسلامية يُنصح به لطالب العلم[^."]*\.?/g,
  /؛?\s*يُستفاد منه في البناء العلمي والتعليم الشرعي[^."]*\.?/g,
  /؛?\s*مع التمييز بين ما ثبت من الشرع وما هو تاريخي أو اجتهادي[^."]*\.?/g,
  /؛?\s*من مراجع [^؛.]{2,40} المعتمدة[^."]*\.?/g,
  /؛?\s*من مراجع علوم القرآن يُستفاد منه في التفسير والتدبر[^."]*\.?/g,
  /؛?\s*من مراجع التاريخ الإسلامي يُستفاد منه في العبرة والمعرفة[^."]*\.?/g,
  /؛?\s*من مراجع المكتبة الإسلامية في باب [^؛.]{2,40}[^."]*\.?/g,
  /؛?\s*مرجع أساس في علوم الحديث[^."]*\.?/g,
];

const TRAILING_DOTS = /\.{3,}\s*$/g;
const MULTI_SEP = /[؛,]{2,}/g;
const TRAILING_SEP = /[؛,\s—\-]+$/g;

function cleanText(raw, tails) {
  let s = String(raw);
  for (const re of tails) s = s.replace(re, "");
  s = s.replace(TRAILING_DOTS, "");
  // أي سلسلة نقاط داخل النص ≥ 4
  s = s.replace(/\.{4,}/g, "");
  s = s.replace(/\s{2,}/g, " ").trim();
  s = s.replace(MULTI_SEP, "؛");
  s = s.replace(TRAILING_SEP, "").trim();
  // نقطة ختامية إن انتهى بجملة مفيدة
  if (s && !/[.؟!。」]$/.test(s)) s += ".";
  return s;
}

function patchQuotedFields(source, fieldNames, tails) {
  let changed = 0;
  let out = source;
  for (const field of fieldNames) {
    // bio: "..." or description: "..."  (double-quoted, may span — but our data is single-line)
    const re = new RegExp(`(${field}\\s*:\\s*)(")((?:\\\\.|[^"\\\\])*)(")`, "g");
    out = out.replace(re, (full, prefix, q1, value, q2) => {
      const cleaned = cleanText(value, tails);
      if (cleaned !== value) changed += 1;
      return `${prefix}${q1}${cleaned.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}${q2}`;
    });
  }
  return { out, changed };
}

function processFile(rel, fields, tails) {
  const file = path.join(ROOT, rel);
  const src = fs.readFileSync(file, "utf8");
  const { out, changed } = patchQuotedFields(src, fields, tails);
  const dotsBefore = (src.match(/\.{4,}/g) || []).length;
  const dotsAfter = (out.match(/\.{4,}/g) || []).length;
  console.log(`${rel}: fields cleaned=${changed}, dots ${dotsBefore}→${dotsAfter}`);
  if (APPLY && out !== src) {
    fs.writeFileSync(file, out, "utf8");
    console.log(`  ✓ written`);
  }
  return { changed, dotsAfter };
}

const r1 = processFile("src/lib/scholars-data.ts", ["bio"], SCHOLAR_TAILS);
const r2 = processFile("src/lib/sheikhs-seed.ts", ["bio"], [...SCHOLAR_TAILS, ...SHEIKH_TAILS]);
const r3 = processFile("src/lib/library-catalog.ts", ["description"], LIBRARY_TAILS);

const remaining = r1.dotsAfter + r2.dotsAfter + r3.dotsAfter;
console.log(`\nRemaining \\.{4,} sequences: ${remaining}`);
if (!APPLY) console.log("(dry-run — pass --apply to write)");
if (APPLY && remaining > 0) {
  console.error("ERROR: trailing/internal dot padding still present");
  process.exit(1);
}
