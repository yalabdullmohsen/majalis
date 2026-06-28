#!/usr/bin/env node
/**
 * Smart Extraction test suite — 500+ rule/confidence/decision cases.
 */
import { runRuleEngine } from "../lib/ai/smart-extraction/rule-engine.mjs";
import { computeConfidence } from "../lib/ai/smart-extraction/confidence-engine.mjs";
import { shouldInvokeAi } from "../lib/ai/smart-extraction/decision-engine.mjs";
import { resetSmartExtractionStats } from "../lib/ai/smart-extraction/monitoring.mjs";

const SHEIKHS = ["محمد العجمي", "فهد المطيري", "سالم الباحو", "عبدالله الرومي", "يوسف الصقر"];
const MOSQUES = ["مسجد السلام", "جامع الإمام", "مسجد الفردوس", "مسجد النور", "جامع الرحمة"];
const CITIES = ["العاصمة", "حولي", "الفروانية", "الأحمدي", "الجهراء", "مبارك الكبير"];
const DAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const CATEGORIES = ["تفسير", "فقه", "عقيدة", "حديث", "سيرة", "تجويد"];
const TYPES = [
  { type: "announcement", prefix: "إعلان درس" },
  { type: "course", prefix: "دورة" },
  { type: "quran", prefix: "حلقة قرآن" },
  { type: "mutoon", prefix: "متون" },
  { type: "conference", prefix: "ملتقى" },
  { type: "mobile", prefix: "" },
  { type: "low_quality", prefix: "" },
  { type: "tilted", prefix: "" },
  { type: "multi", prefix: "" },
];

function buildPoster({ sheikh, mosque, city, day, category, type, idx }) {
  const date = `2026-${String((idx % 12) + 1).padStart(2, "0")}-${String((idx % 28) + 1).padStart(2, "0")}`;
  const time = `${7 + (idx % 5)}:${idx % 2 ? "30" : "00"} م`;
  const phone = `+965${9000 + idx}${1000 + idx}`;
  const url = `https://forms.example.com/reg-${idx}`;

  if (type === "low_quality") {
    return `درس ${category}\n${mosque}\n${day}`;
  }
  if (type === "multi") {
    return `إعلان 1: الشيخ ${sheikh} — ${mosque}\n---\nإعلان 2: دورة ${category} — ${city}`;
  }

  const title = type === "course"
    ? `دورة ${category} — ${sheikh.split(" ")[1] || "علم"}`
    : type === "quran"
      ? `حلقة قرآن — ${category}`
      : `شرح ${category} — ${sheikh.split(" ")[1] || "درس"}`;

  return [
    title,
    `الشيخ ${sheikh}`,
    mosque,
    `منطقة ${city === "العاصمة" ? "الدسمة" : "الرقة"}`,
    city,
    day,
    date,
    time,
    `للتسجيل: ${url}`,
    phone,
    type === "conference" ? "ملتقى علمي — ينظم: جمعية خيرية" : "",
  ].filter(Boolean).join("\n");
}

function generateCases() {
  const cases = [];
  let id = 0;
  for (const t of TYPES) {
    for (let i = 0; i < 60; i++) {
      id++;
      cases.push({
        id,
        type: t.type,
        text: buildPoster({
          sheikh: SHEIKHS[i % SHEIKHS.length],
          mosque: MOSQUES[i % MOSQUES.length],
          city: CITIES[i % CITIES.length],
          day: DAYS[i % DAYS.length],
          category: CATEGORIES[i % CATEGORIES.length],
          type: t.type,
          idx: id,
        }),
      });
    }
  }
  return cases;
}

let pass = 0;
let fail = 0;

function ok(cond, msg) {
  if (cond) { pass++; } else { fail++; console.error(`  ✗ ${msg}`); }
}

resetSmartExtractionStats();
const cases = generateCases();
console.log(`=== Smart Extraction Tests (${cases.length} cases) ===\n`);

let rulePass = 0;
let aiSkipped = 0;
let highConfidence = 0;

for (const c of cases) {
  const rule = runRuleEngine(c.text);
  ok(rule.fields.speaker_name.length > 2 || c.type === "low_quality", `#${c.id} speaker or low_quality`);
  ok(rule.fields.mosque.includes("مسجد") || rule.fields.mosque.includes("جامع") || c.type === "low_quality", `#${c.id} mosque`);
  ok(rule.completeness > 0.2, `#${c.id} completeness > 0.2`);

  const conf = computeConfidence(rule.fields, c.text);
  ok(conf.overall >= 0, `#${c.id} confidence computed`);

  const decision = shouldInvokeAi({
    ruleResult: rule,
    confidence: conf,
    ocrOk: true,
    ocrTextLength: c.text.length,
    lineCount: c.text.split(/\n/).length,
    urlCount: (c.text.match(/https?:\/\//g) || []).length,
  });

  if (c.type !== "low_quality" && c.type !== "multi" && rule.completeness >= 0.35) {
    rulePass++;
  }
  if (!decision.invoke) aiSkipped++;
  if (conf.overall >= 0.7) highConfidence++;
}

ok(cases.length >= 500, `at least 500 cases (${cases.length})`);
ok(rulePass / cases.length > 0.5, `rule engine pass rate > 50% (${Math.round(rulePass / cases.length * 100)}%)`);
ok(aiSkipped / cases.length >= 0.5, `AI skipped >= 50% (${Math.round(aiSkipped / cases.length * 100)}%)`);

console.log(`\nResults: ${pass} passed, ${fail} failed`);
console.log(`Rule pass rate: ${Math.round(rulePass / cases.length * 100)}%`);
console.log(`AI skipped: ${Math.round(aiSkipped / cases.length * 100)}%`);
console.log(`High confidence: ${Math.round(highConfidence / cases.length * 100)}%`);
console.log(`Cost savings estimate: ${Math.round(aiSkipped / cases.length * 100)}%`);

process.exit(fail > 0 ? 1 : 0);
