#!/usr/bin/env node
/**
 * فحص جودة البحث — كل كلمة أساسية يجب أن ترجع count > 0.
 *
 * Usage:
 *   node scripts/check-search-quality.js
 *   node scripts/check-search-quality.js --url=https://www.ssunnah.com
 */
import {
  parseBaseUrl,
  localSearchCount,
  fetchText,
} from "./monitoring-utils.mjs";

const TERMS = [
  "الصلاة",
  "الوضوء",
  "الحديث",
  "البخاري",
  "الأذكار",
  "القرآن",
  "الزكاة",
  "الصيام",
  "الفقه",
];

const base = parseBaseUrl();
const failures = [];

async function apiCount(term) {
  const path = `/api/search?q=${encodeURIComponent(term)}&limit=1`;
  const { status, text } = await fetchText(base, path);
  if (status !== 200) return { ok: false, detail: `HTTP ${status}` };
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, detail: "JSON غير صالح" };
  }
  const total = Number(json.total ?? json.count ?? 0);
  return { ok: total > 0, detail: `total=${total}` };
}

console.log(`▶ check-search-quality${base ? ` — ${base}` : " (محلي)"}\n`);

for (const term of TERMS) {
  let result;
  if (base) {
    result = await apiCount(term);
  } else {
    const count = localSearchCount(term);
    if (count === null) {
      console.error("❌ public/data/search/index.json مفقود — شغّل generate:search-index أو مرّر --url");
      process.exit(1);
    }
    result = { ok: count > 0, detail: `local=${count}` };
  }
  if (result.ok) {
    console.log(`✓ ${term} — ${result.detail}`);
  } else {
    console.error(`✗ ${term} — ${result.detail}`);
    failures.push(term);
  }
}

if (failures.length) {
  console.error(`\n❌ check-search-quality فشل: ${failures.join(", ")}`);
  process.exit(1);
}

console.log("\n✅ check-search-quality — نجح");
