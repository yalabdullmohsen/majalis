#!/usr/bin/env node
/**
 * Rebalance over-frequent tracked bridge phrases across lesson data files.
 * Usage: node scripts/rebalance-lesson-bridges.mjs [maxFreq=35]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.join(__dirname, "../src/lib");
const MAX = Number(process.argv[2] || 35);

const FILES = [
  "maqasid-sharia-data.ts",
  "dalail-nubuwwah-data.ts",
  "arabic-language-data.ts",
  "sunnah-studies-data.ts",
  "tarikh-islami-data.ts",
  "mawsuaat-data.ts",
  "iman-topics-data.ts",
  "tazkiya-topics-data.ts",
  "durus-mutanawwia-data.ts",
  "durus-imaniyya-data.ts",
  "fikr-waqia-data.ts",
  "usra-mujtama-data.ts",
  "quran-studies-data.ts",
];

const ALTS = [
  "والفهم الرشيد يقف عند حدود الدليل بلا تكلّف",
  "ويُعرض المعنى بأدب العلم لا بادّعاء ما لم يثبت",
  "وتُحفظ مرتبة النص فلا يُزاد عليه من الرأي ما يُلبسه لباس القطع",
  "والمقصود تقريب الهداية بضابط أهل التحقيق",
  "ويُفرَّق بين ما يحتمله اللفظ وما يُستحسن بلا سند",
  "ويبقى المنهج: تحقق ثم بيان ثم تطبيق برفق",
  "ولا يُجعل المشتهر في مقام الثابت عند أهل التحقيق",
  "والعبرة بالاتباع والعمل لا بالانبهار بالألفاظ",
  "ويُستأنس بكلام المحققين في الضبط دون غلو",
  "وهذا باب من أبواب النصح لطالب العلم بالرفق",
  "ويُقدَّم الثابت على المشهور الواهي عند التعارض",
  "فلا يُحمل النص ما لا يحتمله من المعاني",
  "ويُراعى حال المخاطب عند البيان بلا تكلّف",
  "والعلم النافع ما ظهر أثره في الخلق والعمل",
  "ويُحذر من الغلو في فهم ما لم يُحرَّر دليله",
];

function loadTrackedPhrases() {
  const enrichPath = path.join(__dirname, "enrich-r143-lesson-bodies.mjs");
  const src = fs.readFileSync(enrichPath, "utf8");
  const start = src.indexOf("const R53_BRIDGE_POOL = [");
  const end = src.indexOf("];", start);
  if (start === -1 || end === -1) throw new Error("Cannot load R53_BRIDGE_POOL");
  const poolSrc = src.slice(start, end + 2);
  const uniq = [...poolSrc.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse(`"${m[1]}"`));
  // Drop proper prefixes of longer phrases to avoid collision counts
  return [...new Set(uniq)].filter((p) => !uniq.some((q) => q !== p && q.startsWith(p)));
}

function countPhraseNonOverlap(phrase, text) {
  let n = 0;
  let idx = 0;
  while ((idx = text.indexOf(phrase, idx)) !== -1) {
    n++;
    idx += phrase.length;
  }
  return n;
}

function combinedText() {
  return FILES.map((f) => fs.readFileSync(path.join(LIB, f), "utf8")).join("\n");
}

function rebalance(phrase) {
  let keep = MAX;
  let replaced = 0;
  for (const f of FILES) {
    const fp = path.join(LIB, f);
    const s = fs.readFileSync(fp, "utf8");
    let out = "";
    let idx = 0;
    while (true) {
      const at = s.indexOf(phrase, idx);
      if (at === -1) {
        out += s.slice(idx);
        break;
      }
      out += s.slice(idx, at);
      if (keep > 0) {
        out += phrase;
        keep--;
      } else {
        out += ALTS[replaced % ALTS.length];
        replaced++;
      }
      idx = at + phrase.length;
    }
    fs.writeFileSync(fp, out);
  }
  return replaced;
}

const CANDIDATES = loadTrackedPhrases();
const text = combinedText();
const ranked = CANDIDATES.map((p) => ({ p, n: countPhraseNonOverlap(p, text) }))
  .filter((x) => x.n > MAX)
  .sort((a, b) => b.p.length - a.p.length || b.n - a.n);

console.log("over-limit:", ranked.slice(0, 20));
let totalRep = 0;
for (const { p, n } of ranked) {
  const r = rebalance(p);
  totalRep += r;
  const after = countPhraseNonOverlap(p, combinedText());
  console.log(`rebalanced "${p.slice(0, 40)}…" ${n}→${after} (replaced ${r})`);
}
console.log(JSON.stringify({ max: MAX, overBefore: ranked.length, totalRep, tracked: CANDIDATES.length }));
