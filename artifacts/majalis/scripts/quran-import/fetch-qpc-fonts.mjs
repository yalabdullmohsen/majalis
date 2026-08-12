#!/usr/bin/env node
/**
 * fetch-qpc-fonts.mjs
 * ينزّل خطوط QPC V2 لكل صفحة (604 خط WOFF2، خط لكل صفحة — راجع
 * docs/mushaf-rebuild-inventory.md القسم 7 لتوثيق المصدر) إلى
 * public/fonts/qpc-v2/. يُشغَّل مرة واحدة يدويًا، ليس عبر build.
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "public/fonts/qpc-v2");
const TOTAL_PAGES = 604;
const CONCURRENCY = 10;
const RETRY = 3;

async function fetchBinary(url, attempt = 1) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    if (attempt < RETRY) {
      await new Promise((r) => setTimeout(r, 800 * attempt));
      return fetchBinary(url, attempt + 1);
    }
    throw err;
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  let totalBytes = 0;
  let completed = 0;
  const failures = [];

  async function worker(pageNumbers) {
    for (const p of pageNumbers) {
      try {
        const buf = await fetchBinary(`https://quran.com/fonts/quran/hafs/v2/woff2/p${p}.woff2`);
        await writeFile(path.join(OUT_DIR, `p${p}.woff2`), buf);
        totalBytes += buf.length;
      } catch (err) {
        failures.push({ page: p, error: String(err) });
      }
      completed++;
      if (completed % 100 === 0 || completed === TOTAL_PAGES) {
        console.log(`  ${completed}/${TOTAL_PAGES} (${(totalBytes / 1024 / 1024).toFixed(1)}MB حتى الآن)`);
      }
    }
  }

  const allPages = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);
  const chunks = Array.from({ length: CONCURRENCY }, (_, i) =>
    allPages.filter((_, idx) => idx % CONCURRENCY === i),
  );
  await Promise.all(chunks.map(worker));

  console.log(`\nنجح: ${TOTAL_PAGES - failures.length}/${TOTAL_PAGES}, الحجم الإجمالي: ${(totalBytes / 1024 / 1024).toFixed(1)}MB`);
  if (failures.length) console.log("فشل:", JSON.stringify(failures));
  console.log("done");
}

main().catch((err) => {
  console.error("فشل عام:", err);
  process.exit(1);
});
