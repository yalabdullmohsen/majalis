#!/usr/bin/env node
/**
 * يستعيد المتن الثالث للدروس التي انهارت إلى ثنائيات بعد strip الخاطئ.
 * المتن = «باب «العنوان»: الملخص» بلا حشو قالبي — منقول من العنوان+الملخص فقط.
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

function unescapeTs(s) {
  return s.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
}
function escapeTs(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function makeBody(title, summary) {
  const t = title.trim();
  const s = summary.trim();
  let body = `باب «${t}»: ${s}`;
  if (body.length < 30) body = `باب «${t}»: ${s} — من عنوان الدرس وملخّصه المنقول.`;
  return body;
}

let filesTouched = 0;
let restored = 0;

for (const name of TARGETS) {
  const file = path.join(LIB, name);
  if (!fs.existsSync(file)) continue;
  let src = fs.readFileSync(file, "utf8");
  let n = 0;

  // لا تلمس الثلاثيات القائمة
  const withMark = src.replace(
    /\["((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\]/g,
    "<<<TRIPLE>>>",
  );

  const nextMarked = withMark.replace(
    /\["((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\]/g,
    (full, titleRaw, summaryRaw) => {
      const title = unescapeTs(titleRaw).trim();
      const summary = unescapeTs(summaryRaw).trim();
      if (!title || !summary) return full;
      n++;
      const body = makeBody(title, summary);
      return `["${escapeTs(title)}", "${escapeTs(summary)}", "${escapeTs(body)}"]`;
    },
  );

  // أعد الثلاثيات
  const triples = [...src.matchAll(/\["((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\]/g)];
  let i = 0;
  const next = nextMarked.replace(/<<<TRIPLE>>>/g, () => triples[i++][0]);

  // حسّن الثلاثيات التي المتن فيها = الملخص فقط أو قصير جداً
  const next2 = next.replace(
    /\["((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\]/g,
    (full, titleRaw, summaryRaw, bodyRaw) => {
      const title = unescapeTs(titleRaw).trim();
      const summary = unescapeTs(summaryRaw).trim();
      let body = unescapeTs(bodyRaw).trim();
      if (!body || body === summary || body.length < 30) {
        body = makeBody(title, summary);
        n++;
        return `["${escapeTs(title)}", "${escapeTs(summary)}", "${escapeTs(body)}"]`;
      }
      return full;
    },
  );

  if (n > 0) {
    fs.writeFileSync(file, next2, "utf8");
    filesTouched++;
    restored += n;
    console.log(`✓ ${name}: ${n}`);
  } else {
    console.log(`· ${name}: لا تغيير`);
  }
}

console.log(`restore-lesson-bodies: ${restored} في ${filesTouched} ملف`);
