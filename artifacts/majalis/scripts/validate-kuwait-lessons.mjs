#!/usr/bin/env node
/**
 * يفشل إذا ظهر متحدث غير شخص / عنوان مكرر / تصنيف لا يطابق صفحة الكويت.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

// Load TS helpers via tsx when available; fallback to inline checks on JSON.
const chunk = JSON.parse(
  readFileSync(resolve(root, "public/data/lessons/chunk-000.json"), "utf8"),
);

const FIQH_TOPIC_RE =
  /^(الطهارة|الصلاة|الزكاة|الصيام|الصوم|الحج|العمرة|الاعتكاف|الجنائز|البيوع|علوم\s*القرآن|نواقض|العقيدة|التوحيد|الفقه|التفسير|الحديث|السيرة)(?:\s|$)/u;
const SESSION_COUNT_RE = /^\d+\s*مجلس/u;

function looksLikePerson(name) {
  const n = String(name || "").trim();
  if (!n) return false;
  if (/^\d+$/.test(n) || SESSION_COUNT_RE.test(n) || FIQH_TOPIC_RE.test(n)) return false;
  if (n.split(/\s+/).length < 2 && !/بن|ابن/.test(n)) return false;
  return true;
}

function hasDupTitleSegments(title) {
  const parts = String(title || "")
    .split(/\s*[—–\-]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  const seen = new Set();
  for (const p of parts) {
    const k = p.replace(/\s+/g, " ");
    if (seen.has(k)) return true;
    seen.add(k);
  }
  return false;
}

const errors = [];
for (const row of chunk) {
  const sp = row.speaker_name || "";
  const title = row.title || "";
  // Empty speaker is allowed (hidden by display filter); non-empty must be person-like.
  if (sp && !looksLikePerson(sp)) {
    errors.push(`speaker_invalid id=${row.id} speaker=${JSON.stringify(sp)}`);
  }
  if (hasDupTitleSegments(title)) {
    errors.push(`title_dup id=${row.id} title=${JSON.stringify(title)}`);
  }
  // Page is Kuwait lessons — city/region should not advertise non-Kuwait country as primary.
  const place = [row.city, row.region, row.mosque, row.description].filter(Boolean).join(" ");
  if (/الرياض|جدة|المدينة المنورة|القاهرة/.test(place) && !/الكويت|حولي|الفروانية|الجهراء|الأحمدي|مبارك/.test(place)) {
    errors.push(`place_outside id=${row.id} place=${JSON.stringify(place.slice(0, 80))}`);
  }
}

if (errors.length) {
  console.error(`validate-kuwait-lessons: FAIL (${errors.length})`);
  for (const e of errors.slice(0, 40)) console.error(" -", e);
  process.exit(1);
}
console.log(`validate-kuwait-lessons: ok (${chunk.length} rows)`);
