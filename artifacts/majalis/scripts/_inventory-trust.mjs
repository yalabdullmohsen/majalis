#!/usr/bin/env node
/**
 * جرد درجات التوثيق — أداة داخلية للمرحلة 2 (ليست بوابة الانحدار).
 * تكتب /tmp/inventory-raw.json وتطبع ملخصاً.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function inferTrust(text) {
  const t = (text ?? "").trim();
  if (!t) return "unsourced";
  const hasQuranPin = /(?:سورة|﴿)/.test(t) && /:\s*\d+|:\d+/.test(t);
  const hasHadithPin =
    /(?:صحيح|سنن|مسند|موطأ|الترمذي|النسائي|أبو داود|ابن ماجه|البخاري|مسلم)/.test(
      t,
    ) && /(?:رقم|حديث)\s*\d+|\(\s*\d+\s*\)/.test(t);
  if (hasQuranPin) return "primary_text";
  if (hasHadithPin) {
    const hasGrade =
      /(?:صححه|حسّنه|ضعّفه|صحيح|حسن|ضعيف|موضوع)/.test(t) &&
      /(?:الألباني|الذهبي|ابن حجر|النووي|الحاكم|الترمذي)/.test(t);
    return hasGrade ? "primary_text" : "scholarly_source";
  }
  if (
    /(?:قرار|مجمع|هيئة|اللجنة الدائمة|مجمع الفقه)/.test(t) &&
    /(?:رقم|بتاريخ)/.test(t)
  ) {
    return "institutional_ruling";
  }
  if (
    /(?:جزء|ج\s*\d+|ص\s*\d+|صفحة\s*\d+|المغني|المجموع|الأم|نيل الأوطار|زاد المعاد|فتح الباري)/.test(
      t,
    )
  ) {
    return "scholarly_source";
  }
  if (
    /(?:قاعدة|مقاصد|الضرورات|الغرر|أكل المال بالباطل|لا ضرر|اليقين لا يزول|المشقة تجلب|الاستدلال)/.test(
      t,
    )
  ) {
    return "general_reasoning";
  }
  if (t.length < 20) return "unsourced";
  if (
    /(?:البخاري|مسلم|القرآن|سورة|ابن|الشافعي|أبو حنيفة|مالك|أحمد|الألباني|﴿)/.test(
      t,
    )
  ) {
    return "general_reasoning";
  }
  return "general_reasoning";
}

function extractArrayObjects(src, exportName) {
  const re = new RegExp(
    `export\\s+const\\s+${exportName}\\s*(?::[^=]+)?=\\s*\\[`,
  );
  const m = src.match(re);
  if (!m) return null;
  const start = m.index + m[0].length - 1;
  let depth = 0,
    i = start,
    inStr = false,
    strCh = "",
    esc = false;
  for (; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (c === "\\") {
        esc = true;
        continue;
      }
      if (c === strCh) inStr = false;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = true;
      strCh = c;
      continue;
    }
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
  }
  const arrText = src.slice(start, i);
  const objs = [];
  let d = 0,
    oStart = -1,
    inS = false,
    sCh = "",
    escaped = false;
  for (let j = 0; j < arrText.length; j++) {
    const c = arrText[j];
    if (inS) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (c === "\\") {
        escaped = true;
        continue;
      }
      if (c === sCh) inS = false;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inS = true;
      sCh = c;
      continue;
    }
    if (c === "{") {
      if (d === 0) oStart = j;
      d++;
    } else if (c === "}") {
      d--;
      if (d === 0 && oStart >= 0) {
        objs.push({ text: arrText.slice(oStart, j + 1), offset: start + oStart });
        oStart = -1;
      }
    }
  }
  return objs;
}

function field(objText, name) {
  const re = new RegExp(`(?:^|[,\\n]\\s*)(?:"${name}"|${name})\\s*:\\s*`);
  const m = objText.match(re);
  if (!m) return undefined;
  let i = m.index + m[0].length;
  while (i < objText.length && /\s/.test(objText[i])) i++;
  if (objText.slice(i, i + 4) === "null") return null;
  if (objText[i] === '"' || objText[i] === "'") {
    const q = objText[i];
    let j = i + 1,
      out = "",
      esc = false;
    for (; j < objText.length; j++) {
      const c = objText[j];
      if (esc) {
        out += c;
        esc = false;
        continue;
      }
      if (c === "\\") {
        esc = true;
        continue;
      }
      if (c === q) break;
      out += c;
    }
    return out;
  }
  const m2 = objText.slice(i).match(/^[A-Za-z0-9_.-]+/);
  return m2 ? m2[0] : undefined;
}

function lineOf(src, offset) {
  return src.slice(0, offset).split("\n").length;
}

const LEVELS = [
  "primary_text",
  "scholarly_source",
  "institutional_ruling",
  "general_reasoning",
  "unsourced",
];

function tally(levels) {
  const t = Object.fromEntries(LEVELS.map((l) => [l, 0]));
  for (const l of levels) t[l] = (t[l] || 0) + 1;
  return t;
}

const results = {};

// QA
{
  const file = "src/lib/qa-seed.ts";
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  const objs = extractArrayObjects(src, "SEED_QA");
  const levels = [];
  let evidNull = 0,
    refNull = 0,
    bothNull = 0;
  for (const { text: o } of objs) {
    const evid = field(o, "evidence");
    const ref = field(o, "reference");
    if (evid === null || evid === undefined) evidNull++;
    if (ref === null || ref === undefined) refNull++;
    if (
      (evid === null || evid === undefined) &&
      (ref === null || ref === undefined)
    )
      bothNull++;
    const free = [evid, ref]
      .filter((x) => typeof x === "string" && x)
      .join(" | ");
    levels.push(inferTrust(free));
  }
  results.qa = {
    file,
    total: objs.length,
    levels: tally(levels),
    evidNull,
    refNull,
    bothNull,
    documentedPct: +(((objs.length - bothNull) / objs.length) * 100).toFixed(1),
  };
}

// Quiz
{
  const file = "src/lib/quiz-seed.ts";
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  const objs = extractArrayObjects(src, "DEMO_QUIZ_QUESTIONS");
  const levels = [];
  let circular = 0,
    templated = 0,
    refNull = 0,
    refEmpty = 0;
  const circPhrase = "مستند إلى مضمون الإجابة";
  for (const { text: o } of objs) {
    const ref = field(o, "reference");
    const ans = field(o, "answer") || "";
    const expl = field(o, "explanation") || "";
    if (ref === null || ref === undefined) refNull++;
    else if (ref === "") refEmpty++;
    if (
      typeof ref === "string" &&
      (ref.includes(circPhrase) || (ans && ref.trim() === ans.trim()))
    )
      circular++;
    if (expl.startsWith("بيان موجز للإجابة:") && ans && expl.includes(ans))
      templated++;
    levels.push(inferTrust(typeof ref === "string" ? ref : ""));
  }
  results.quiz = {
    file,
    total: objs.length,
    levels: tally(levels),
    circular,
    templated,
    refNull,
    refEmpty,
    documentedPct: +(
      ((objs.length - refNull - refEmpty) / objs.length) *
      100
    ).toFixed(1),
  };
}

// Fiqh issues
{
  const file = "src/lib/fiqh-issues-seed.ts";
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  const objs = extractArrayObjects(src, "FIQH_ISSUES_PUBLISHED_SEED");
  const levels = [];
  let docOfficial = 0,
    evidEmpty = 0;
  const rows = [];
  for (const { text: o, offset } of objs) {
    const id = field(o, "id");
    const evid = field(o, "evidence_summary");
    const doc = field(o, "documentation_level");
    if (doc === "official_verified") docOfficial++;
    if (!evid) evidEmpty++;
    const trust = inferTrust(typeof evid === "string" ? evid : "");
    levels.push(trust);
    rows.push({
      id,
      line: lineOf(src, offset),
      documentation_level: doc,
      inferred_trust: trust,
      evid: (evid || "").slice(0, 120),
    });
  }
  results.fiqh = {
    file,
    total: objs.length,
    levels: tally(levels),
    docOfficial,
    evidEmpty,
    rows,
  };
}

// Fawaid
{
  const file = "src/lib/fawaid-seed.ts";
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  const objs = extractArrayObjects(src, "SEED_FAWAID");
  const levels = [];
  let noAuthor = 0,
    emptyAuthor = 0;
  for (const { text: o } of objs) {
    const author = field(o, "author_name");
    const ref =
      field(o, "reference") || field(o, "source") || field(o, "evidence");
    if (author === undefined) noAuthor++;
    else if (author === null || author === "") emptyAuthor++;
    levels.push(
      inferTrust(
        typeof ref === "string"
          ? ref
          : typeof author === "string" && author
            ? `author:${author}`
            : "",
      ),
    );
  }
  results.fawaid = {
    file,
    total: objs.length,
    levels: tally(levels),
    noAuthor,
    emptyAuthor,
  };
}

// Fawaid curated
{
  const file = "src/lib/fawaid-curated-seed.ts";
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  let objs = extractArrayObjects(src, "FAWAID_CURATED_SEED");
  if (!objs || objs.length === 0) {
    const tmp = src.replace(/const\s+curated\s*=/, "export const curated =");
    objs = extractArrayObjects(tmp, "curated") || [];
  }
  const levels = [];
  for (const { text: o } of objs) {
    const author = field(o, "author_name") || field(o, "author");
    const ref = field(o, "reference") || field(o, "source");
    levels.push(
      inferTrust(
        typeof ref === "string"
          ? ref
          : typeof author === "string" && author
            ? `author:${author}`
            : "",
      ),
    );
  }
  results.fawaid_curated = {
    file,
    total: objs.length,
    levels: tally(levels),
  };
}

// Asma
{
  const file = "src/lib/asma-husna-data.ts";
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  const objs = extractArrayObjects(src, "ASMAA");
  const levels = [];
  let only99 = 0;
  const only99Nums = [];
  for (const { text: o } of objs) {
    const ref = field(o, "reference") || "";
    const num = field(o, "num");
    if (ref === "الحديث: تسعة وتسعون اسماً") {
      only99++;
      only99Nums.push(num);
      levels.push("unsourced");
    } else {
      levels.push(inferTrust(ref));
    }
  }
  results.asma = {
    file,
    total: objs.length,
    levels: tally(levels),
    only99,
    only99Nums,
  };
}

// Stories
{
  const file = "src/lib/islamic-stories-seed.ts";
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  const objs = extractArrayObjects(src, "ISLAMIC_STORIES_SEED") || [];
  const levels = [];
  for (const { text: o } of objs) {
    const ref =
      field(o, "reference") ||
      field(o, "source") ||
      field(o, "evidence") ||
      "";
    levels.push(inferTrust(typeof ref === "string" ? ref : ""));
  }
  results.stories = { file, total: objs.length, levels: tally(levels) };
}

// Miracles
{
  const file = "src/lib/miracles-seed.ts";
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  const objs = extractArrayObjects(src, "MIRACLES_SEED") || [];
  const levels = [];
  for (const { text: o } of objs) {
    const ref =
      field(o, "reference") ||
      field(o, "source") ||
      field(o, "evidence") ||
      "";
    levels.push(inferTrust(typeof ref === "string" ? ref : ""));
  }
  results.miracles = { file, total: objs.length, levels: tally(levels) };
}

// Rulings encyclopedia generated
{
  const file = "src/lib/rulings-encyclopedia-seed.generated.ts";
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  const exportMatch = src.match(/export\s+const\s+(\w+)\s*(?::[^=]+)?=\s*\[/);
  let objs = [];
  if (exportMatch) objs = extractArrayObjects(src, exportMatch[1]) || [];
  const levels = [];
  for (const { text: o } of objs) {
    const ref =
      field(o, "reference") ||
      field(o, "source") ||
      field(o, "evidence") ||
      field(o, "dalil") ||
      "";
    levels.push(inferTrust(typeof ref === "string" ? ref : ""));
  }
  results.rulings_enc = {
    file,
    exportName: exportMatch?.[1],
    total: objs.length,
    levels: tally(levels),
  };
}

// Curriculum
{
  const file = "data/rulings-encyclopedia/curriculum-topics.json";
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
  const items = Array.isArray(data)
    ? data
    : data.topics || data.items || [];
  const levels = [];
  const watched = [];
  for (const it of items) {
    const text = JSON.stringify(it);
    const ref =
      it.reference || it.source || it.evidence || it.hadith || it.proof || "";
    const body =
      it.content || it.body || it.text || it.description || it.summary || "";
    levels.push(
      inferTrust(
        typeof ref === "string" && ref
          ? ref
          : typeof body === "string"
            ? body.slice(0, 240)
            : "",
      ),
    );
    const id = it.id || it.slug;
    if (
      ["curriculum-1", "curriculum-4", "curriculum-5", "curriculum-10"].includes(
        id,
      )
    ) {
      watched.push({
        id,
        keys: Object.keys(it),
        publication_gate: it.publication_gate ?? null,
        text_flags: it.text_flags ?? null,
        sample: text.slice(0, 500),
      });
    }
  }
  results.curriculum = {
    file,
    total: items.length,
    levels: tally(levels),
    watched,
    sampleKeys: items[0] ? Object.keys(items[0]) : [],
  };
}

fs.writeFileSync(
  "/tmp/inventory-raw.json",
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
