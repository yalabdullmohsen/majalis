#!/usr/bin/env node
/**
 * إكمال حقول trust_level / editorial_review_status على البذور المتبقية.
 * لا يختلق مصادر؛ يستنتج الدرجة من الحقول الموجودة فقط.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TODAY = "2026-07-26T00:00:00.000Z";

function inferTrust(text) {
  const t = (text ?? "").trim();
  if (!t) return "unsourced";
  const hasQuranPin = /(?:سورة|﴿)/.test(t) && /:\s*\d+|:\d+|[٠-٩]+\s*:\s*[٠-٩]+/.test(t);
  const hasHadithPin =
    /(?:صحيح|سنن|مسند|موطأ|الترمذي|النسائي|أبو داود|ابن ماجه|البخاري|مسلم)/.test(t) &&
    /(?:رقم|حديث)?\s*(?:\d{1,5}|[٠-٩]{1,5})/.test(t);
  if (hasQuranPin) return "primary_text";
  if (hasHadithPin) {
    const hasGrade =
      /(?:صححه|حسّنه|ضعّفه|صحيح|حسن|ضعيف|موضوع)/.test(t) &&
      /(?:الألباني|الذهبي|ابن حجر|النووي|الحاكم|الترمذي)/.test(t);
    return hasGrade ? "primary_text" : "scholarly_source";
  }
  if (/(?:قرار|مجمع|هيئة|اللجنة الدائمة)/.test(t) && /(?:رقم|بتاريخ)/.test(t))
    return "institutional_ruling";
  if (/(?:جزء|ج\s*\d+|ص\s*\d+|صفحة\s*\d+|المغني|المجموع|فتح الباري|زاد المعاد)/.test(t))
    return "scholarly_source";
  if (/(?:قاعدة|مقاصد|الغرر|الضرورات|الاستدلال|رواه|متفق|القرآن|سورة|ابن)/.test(t))
    return "general_reasoning";
  if (t.length < 12) return "unsourced";
  return "general_reasoning";
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

function extractTopObjects(src, exportName) {
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
        objs.push({
          text: arrText.slice(oStart, j + 1),
          absStart: start + oStart,
          absEnd: start + j + 1,
        });
        oStart = -1;
      }
    }
  }
  return { objs, arrStart: start, arrEnd: i, src };
}

function injectFields(objText, fields) {
  if (/trust_level\s*:/.test(objText)) return objText;
  // insert before final }
  const trimmed = objText.replace(/\s*\}$/, "");
  const needsComma = /[^\s,{]$/.test(trimmed) && !trimmed.endsWith(",");
  const lines = Object.entries(fields)
    .map(([k, v]) => {
      if (typeof v === "string") return `    "${k}": "${v}"`;
      if (v === null) return `    "${k}": null`;
      return `    "${k}": ${JSON.stringify(v)}`;
    })
    .join(",\n");
  // detect indent style: quoted keys vs bare
  const usesBare = /^\s*[a-z_]+\s*:/m.test(objText) && !/^\s*"[a-z_]+"\s*:/m.test(objText);
  let fieldBlock;
  if (usesBare) {
    fieldBlock = Object.entries(fields)
      .map(([k, v]) =>
        typeof v === "string"
          ? `    ${k}: "${v}"`
          : `    ${k}: ${JSON.stringify(v)}`,
      )
      .join(",\n");
  } else {
    fieldBlock = lines;
  }
  return `${trimmed}${needsComma ? "," : ""}\n${fieldBlock}\n  }`;
}

function patchExport(rel, exportName, freeTextKeys) {
  const file = path.join(ROOT, rel);
  let src = fs.readFileSync(file, "utf8");
  const extracted = extractTopObjects(src, exportName);
  if (!extracted) {
    console.log("skip (no export)", rel, exportName);
    return { patched: 0 };
  }
  const { objs } = extracted;
  // rebuild from end to start
  let patched = 0;
  for (let i = objs.length - 1; i >= 0; i--) {
    const o = objs[i];
    if (/trust_level\s*:/.test(o.text)) continue;
    const parts = freeTextKeys.map((k) => field(o.text, k));
    const free = parts
      .filter((x) => typeof x === "string" && x.trim())
      .join(" | ");
    const trust = inferTrust(free);
    const next = injectFields(o.text, {
      trust_level: trust,
      editorial_review_status: "unreviewed",
      last_updated_at: TODAY,
    });
    src = src.slice(0, o.absStart) + next + src.slice(o.absEnd);
    patched++;
  }
  fs.writeFileSync(file, src);
  console.log("patched", rel, patched, "/", objs.length);
  return { patched, total: objs.length };
}

const summary = {};
summary.qa = patchExport("src/lib/qa-seed.ts", "SEED_QA", [
  "evidence",
  "reference",
]);
summary.quiz = patchExport("src/lib/quiz-seed.ts", "DEMO_QUIZ_QUESTIONS", [
  "reference",
  "explanation",
]);
summary.fawaid = patchExport("src/lib/fawaid-seed.ts", "SEED_FAWAID", [
  "source",
  "author_name",
]);
summary.stories = patchExport(
  "src/lib/islamic-stories-seed.ts",
  "ISLAMIC_STORIES_SEED",
  ["reference", "source", "evidence"],
);
summary.miracles = patchExport("src/lib/miracles-seed.ts", "MIRACLES_SEED", [
  "reference",
  "source",
  "evidence",
]);

fs.writeFileSync(
  "/tmp/trust-remaining-summary.json",
  JSON.stringify(summary, null, 2),
);
console.log(JSON.stringify(summary, null, 2));
