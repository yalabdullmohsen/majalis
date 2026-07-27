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
];

function countPhrase(phrase) {
  let n = 0;
  for (const f of FILES) {
    const s = fs.readFileSync(path.join(LIB, f), "utf8");
    n += s.split(phrase).length - 1;
  }
  return n;
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

// Detect top phrases from enrich script TRACKED list by scanning common known bridges
const CANDIDATES = [
  "ويُستحضر أن كل باب يُسأل عنه يوم القيامة",
  "فلا يُطلب من النص ما لم يُفتح له باب",
  "والمقصد يُستقرأ من جملة الشريعة لا من الرأي المنفرد",
  "وفقه المقاصد أداة فهم وتنزيل لا بديلاً عن النص القطعي",
  "والدليل النبوي يُعرض بأدب وتوثيق لا بادّعاء بلا سند",
  "واللغة العربية وعاء الوحي فتُفهم بقواعدها لا بالاجتهاد الشخصي",
];

const ranked = CANDIDATES.map((p) => ({ p, n: countPhrase(p) }))
  .filter((x) => x.n > MAX)
  .sort((a, b) => b.n - a.n);

console.log("over-limit:", ranked);
let totalRep = 0;
for (const { p, n } of ranked) {
  const r = rebalance(p);
  totalRep += r;
  console.log(`rebalanced "${p.slice(0, 40)}…" ${n}→${countPhrase(p)} (replaced ${r})`);
}
console.log(JSON.stringify({ max: MAX, overBefore: ranked.length, totalRep }));
