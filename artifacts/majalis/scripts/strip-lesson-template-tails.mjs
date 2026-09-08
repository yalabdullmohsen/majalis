#!/usr/bin/env node
/**
 * يزيل ذيول الحشو القالبي من متون الدروس في *-data.ts:
 * - يُراجع بضابط الملخص المنقول…
 * - يُبدأ بحدّ العلم ونشأته…
 * - باب «…»: بادئة مكررة
 * - بيان موجز لموضوع «…»
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIB = path.join(root, "src/lib");

const TARGETS = [
  "usra-mujtama-data.ts",
  "tazkiya-topics-data.ts",
  "iman-topics-data.ts",
  "fikr-waqia-data.ts",
  "tarikh-islami-data.ts",
  "mawsuaat-data.ts",
  "durus-mutanawwia-data.ts",
  "durus-imaniyya-data.ts",
  "maqasid-sharia-data.ts",
  "sunnah-studies-data.ts",
  "arabic-language-data.ts",
  "dalail-nubuwwah-data.ts",
];

const TAILS = [
  /\s*يُراجع بضابط الملخص المنقول، بلا زيادة حديث أو حكم غير مذكور فيه\.?\s*$/u,
  /\s*يُؤخذ للعمل بضابط الدليل، دون توسع فيما لم يثبت\.?\s*$/u,
  /\s*يُبدأ بحدّ العلم ونشأته قبل التطبيق حتى لا تُفهم المقاصد بمعزل عن الأدلة\.?\s*$/u,
  /\s*[—\-–]\s*بيان موجز لموضوع\s*«[^»]+»\.?\s*$/u,
  /\s*بيان موجز لموضوع\s*«[^»]+»\.?\s*$/u,
];

function unescapeTs(s) {
  return s.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
}
function escapeTs(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function cleanBody(title, summary, body) {
  let next = body.trim();
  let changed = false;
  for (const re of TAILS) {
    const after = next.replace(re, "").trim();
    if (after !== next) {
      next = after;
      changed = true;
    }
  }
  // باب «العنوان»: …
  const bab = new RegExp(`^باب\\s*«${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}»\\s*[:：]\\s*`, "u");
  const afterBab = next.replace(bab, "").trim();
  if (afterBab !== next) {
    next = afterBab;
    changed = true;
  }
  // إن بقي المتن = الملخص فقط
  if (next === summary || !next) {
    return { body: summary, changed: true, dropBody: true };
  }
  return { body: next, changed, dropBody: false };
}

let filesTouched = 0;
let triplesFixed = 0;

for (const name of TARGETS) {
  const file = path.join(LIB, name);
  if (!fs.existsSync(file)) continue;
  let src = fs.readFileSync(file, "utf8");
  let n = 0;
  const next = src.replace(
    /\["((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\]/g,
    (full, titleRaw, summaryRaw, bodyRaw) => {
      const title = unescapeTs(titleRaw).trim();
      const summary = unescapeTs(summaryRaw).trim();
      const body = unescapeTs(bodyRaw).trim();
      const result = cleanBody(title, summary, body);
      if (!result.changed && body === result.body) return full;
      n++;
      // نظّف الملخص أيضاً من بيان موجز
      let sum = summary;
      for (const re of TAILS) sum = sum.replace(re, "").trim();
      sum = sum.replace(/\s*[—\-–]\s*بيان موجز لموضوع\s*«[^»]+»\.?\s*$/u, "").trim() || summary;
      if (result.dropBody || result.body === sum) {
        return `["${escapeTs(title)}", "${escapeTs(sum)}"]`;
      }
      return `["${escapeTs(title)}", "${escapeTs(sum)}", "${escapeTs(result.body)}"]`;
    },
  );
  // أيضاً ثنائيات الملخص التي فيها بيان موجز فقط
  const next2 = next.replace(
    /\["((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\]/g,
    (full, titleRaw, summaryRaw) => {
      let sum = unescapeTs(summaryRaw).trim();
      const before = sum;
      for (const re of TAILS) sum = sum.replace(re, "").trim();
      sum = sum.replace(/\s*[—\-–]\s*بيان موجز لموضوع\s*«[^»]+»\.?\s*$/u, "").trim();
      if (!sum || sum === before) return full;
      n++;
      return `["${titleRaw}", "${escapeTs(sum)}"]`;
    },
  );
  if (n > 0) {
    fs.writeFileSync(file, next2, "utf8");
    filesTouched++;
    triplesFixed += n;
    console.log(`✓ ${name}: ${n}`);
  } else {
    console.log(`· ${name}: لا تغيير`);
  }
}

console.log(`strip-lesson-template-tails: ${triplesFixed} في ${filesTouched} ملف`);
