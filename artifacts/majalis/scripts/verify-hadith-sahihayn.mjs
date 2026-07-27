#!/usr/bin/env node
/**
 * تدقيق سلامة مرجع الصحيحين المحلي + عيّنة من البذرة المنسّقة.
 * تشغيل: node scripts/verify-hadith-sahihayn.mjs
 */
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "public", "data", "hadith");

function fail(msg) {
  console.error("✗", msg);
  process.exitCode = 1;
}

function ok(msg) {
  console.log("✓", msg);
}

const manifestPath = path.join(DIR, "manifest.json");
if (!existsSync(manifestPath)) {
  fail(`لا يوجد ${manifestPath} — شغّل: node scripts/fetch-hadith-sahihayn.mjs`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
let total = 0;

for (const f of manifest.files || []) {
  const abs = path.join(DIR, f.file);
  if (!existsSync(abs)) {
    fail(`ملف مفقود: ${f.file}`);
    continue;
  }
  const raw = readFileSync(abs);
  const sha = createHash("sha256").update(raw).digest("hex");
  if (f.sha256 && f.sha256 !== sha) fail(`SHA مختلف لـ ${f.file}`);
  const data = JSON.parse(raw.toString("utf8"));
  if (data.authenticity !== "sahih-by-collection") fail(`${f.file}: authenticity غير متوقع`);
  if (!Array.isArray(data.hadiths) || data.hadiths.length === 0) fail(`${f.file}: لا أحاديث`);
  if (data.count !== data.hadiths.length) fail(`${f.file}: count ≠ hadiths.length`);
  const empty = data.hadiths.filter((h) => !String(h.t || "").trim()).length;
  if (empty) fail(`${f.file}: ${empty} نص فارغ`);
  const nums = new Set();
  let dupNum = 0;
  for (const h of data.hadiths) {
    if (nums.has(h.n)) dupNum++;
    nums.add(h.n);
  }
  // تكرار الرقم ممكن نادراً في بعض الطبعات — نسجّل دون فشل إن كان قليلاً
  if (dupNum > 50) fail(`${f.file}: تكرار أرقام مفرط (${dupNum})`);
  total += data.hadiths.length;
  ok(`${f.label || f.collection}: ${data.hadiths.length} (sha ${sha.slice(0, 12)}…)`);
}

if (total < 4000) fail(`المجموع ${total} أقل من ٤٠٠٠`);
else ok(`المجموع ${total} ≥ ٤٠٠٠`);

if (manifest.totalHadiths !== total) fail("manifest.totalHadiths لا يطابق الملفات");

// تدقيق سريع للبذرة المنسّقة: لا تعارض id/class
const seedPath = path.join(ROOT, "src/lib/verified-hadith-local-seed.ts");
if (existsSync(seedPath)) {
  const seed = readFileSync(seedPath, "utf8");
  const blocks = [...seed.matchAll(/"id":\s*"([^"]+)"[\s\S]*?"authenticity_class":\s*"([^"]+)"/g)];
  const badPrefix = blocks.filter(([, id, cls]) => {
    if (cls === "sahih" && !id.startsWith("sahih")) return true;
    if (cls === "daif" && !id.startsWith("daif")) return true;
    if (cls === "mawdu" && !id.startsWith("mawdu")) return true;
    return false;
  });
  if (badPrefix.length) {
    fail(`بذرة: ${badPrefix.length} بطاقة بمعرّف لا يطابق authenticity_class`);
  } else {
    ok(`البذرة المنسّقة: ${blocks.length} بطاقة (معرّفات متسقة)`);
  }
}

if (process.exitCode) {
  console.error("\nفشل تدقيق مرجع الحديث");
  process.exit(1);
}
console.log("\n✓ تدقيق مرجع الصحيحين ناجح");
