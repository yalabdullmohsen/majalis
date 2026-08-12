#!/usr/bin/env node
/**
 * جلب صحيحي البخاري ومسلم من fawazahmed0/hadith-api وتخزينهما محلياً
 * كمرجع ثابت — بلا درجات ملفّقة (العضوية في الصحيحين هي إشارة الصحة).
 *
 * المصدر: https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions
 * تشغيل: node scripts/fetch-hadith-sahihayn.mjs
 *
 * لا يُشغَّل ضمن pnpm build (يحتاج شبكة) — النتائج تُحفظ في المستودع.
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "data", "hadith");
const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

const EDITIONS = [
  { edition: "ara-bukhari", collection: "bukhari", label: "صحيح البخاري" },
  { edition: "ara-muslim", collection: "muslim", label: "صحيح مسلم" },
];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

function leanHadiths(rawHadiths) {
  const out = [];
  let skippedEmpty = 0;
  let skippedDup = 0;
  const seen = new Set();
  for (const h of rawHadiths || []) {
    const text = String(h.text || "").trim();
    if (!text) {
      skippedEmpty++;
      continue;
    }
    const num = Number(h.hadithnumber);
    const key = `${num}|${text.slice(0, 96)}`;
    if (seen.has(key)) {
      skippedDup++;
      continue;
    }
    seen.add(key);
    /** @type {Record<string, unknown>} */
    const row = { n: num, t: text };
    if (h.arabicnumber != null && Number(h.arabicnumber) !== num) {
      row.a = Number(h.arabicnumber);
    }
    if (h.reference?.book != null) row.b = Number(h.reference.book);
    if (h.reference?.hadith != null) row.h = Number(h.reference.hadith);
    out.push(row);
  }
  return { hadiths: out, skippedEmpty, skippedDup };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const files = [];

  for (const ed of EDITIONS) {
    const url = `${CDN}/${ed.edition}.min.json`;
    process.stdout.write(`↓ ${ed.label} … `);
    const raw = await fetchJson(url);
    const { hadiths, skippedEmpty, skippedDup } = leanHadiths(raw.hadiths);
    const payload = {
      source: "fawazahmed0/hadith-api@1",
      edition: ed.edition,
      collection: ed.collection,
      label: ed.label,
      authenticity: "sahih-by-collection",
      note: "لا درجة فردية من المصدر؛ الصحة بإدراج الحديث في الصحيح. حُذفت النصوص الفارغة (رؤوس أبواب).",
      count: hadiths.length,
      skippedEmpty,
      skippedDup,
      fetchedAt: new Date().toISOString().slice(0, 10),
      hadiths,
    };
    const fileName = `${ed.collection}.json`;
    const abs = path.join(OUT_DIR, fileName);
    const body = JSON.stringify(payload);
    await writeFile(abs, body);
    const sha256 = createHash("sha256").update(body).digest("hex");
    files.push({
      file: fileName,
      collection: ed.collection,
      edition: ed.edition,
      label: ed.label,
      count: hadiths.length,
      skippedEmpty,
      skippedDup,
      bytes: Buffer.byteLength(body),
      sha256,
    });
    console.log(`${hadiths.length} حديثاً (−فارغ ${skippedEmpty})`);
  }

  const total = files.reduce((s, f) => s + f.count, 0);
  const manifest = {
    source: "fawazahmed0/hadith-api@1",
    authenticity: "sahih-by-collection",
    generatedAt: new Date().toISOString(),
    totalHadiths: total,
    files,
  };
  await writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\n✓ المرجع المحلي: ${total} حديثاً في ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
