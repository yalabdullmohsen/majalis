#!/usr/bin/env node
/**
 * fetch-mushaf-v2-data.mjs
 * يجلب بيانات مصحف المدينة الحقيقية (تخطيط أسطر QPC V2) من واجهة
 * api.qurancdn.com الإنتاجية العلنية (نفس البيانات التي يخدمها quran.com
 * نفسه حيًّا — تحقّقتُ عبر مراقبة شبكة حقيقية، راجع docs/mushaf-rebuild-inventory.md
 * القسم 7 لتفاصيل عدم توفر تنزيل مباشر آلي من qul.tarteel.ai نفسها).
 *
 * لا توليد ولا تخمين لأي نص — نقل حرفي لما تُعيده الواجهة فقط.
 * يُشغَّل مرة واحدة يدويًا (ليس عبر build)، النتائج تُخزَّن في
 * public/data/quran-v2/ وتُراجَع بسكربت التحقق المنفصل.
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "public/data/quran-v2");
const PAGES_DIR = path.join(OUT_DIR, "pages");
const TOTAL_PAGES = 604;
const CONCURRENCY = 8;
const RETRY = 3;

async function fetchJson(url, attempt = 1) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (attempt < RETRY) {
      await new Promise((r) => setTimeout(r, 800 * attempt));
      return fetchJson(url, attempt + 1);
    }
    throw err;
  }
}

async function fetchPage(pageNumber) {
  // code_v2 حاسم: هو حرف/ligature الصحيح المطابق لخط "hafs/v2" الذي
  // نزّلناه (Phase 2) — حقل "text" الافتراضي يُعيد code_v1 (خط V1 أقدم
  // غير مُنزَّل هنا)، فيرندر حروفًا منفصلة خاطئة لا كلمات مركَّبة صحيحة
  // (اكتُشف بمقارنة حية مع quran.com نفسه — راجع docs/mushaf-rebuild-inventory.md).
  const url = `https://api.qurancdn.com/api/qdc/verses/by_page/${pageNumber}?words=true&word_fields=text_uthmani,text_qpc_hafs,code_v2&mushaf=2&per_page=50`;
  const data = await fetchJson(url);
  return data.verses ?? [];
}

async function main() {
  await mkdir(PAGES_DIR, { recursive: true });

  console.log("جلب بيانات السور (chapters)...");
  const chaptersData = await fetchJson("https://api.qurancdn.com/api/qdc/chapters?language=ar");
  await writeFile(path.join(OUT_DIR, "chapters.json"), JSON.stringify(chaptersData.chapters, null, 0));
  console.log(`✓ ${chaptersData.chapters.length} سورة`);

  console.log(`جلب ${TOTAL_PAGES} صفحة (توازي ${CONCURRENCY})...`);
  const results = new Array(TOTAL_PAGES + 1);
  const failures = [];
  let completed = 0;

  async function worker(pageNumbers) {
    for (const p of pageNumbers) {
      try {
        const verses = await fetchPage(p);
        if (!verses.length) throw new Error("صفحة بلا آيات");
        results[p] = verses;
        await writeFile(
          path.join(PAGES_DIR, `page-${String(p).padStart(3, "0")}.json`),
          JSON.stringify(verses, null, 0),
        );
      } catch (err) {
        failures.push({ page: p, error: String(err) });
      }
      completed++;
      if (completed % 50 === 0 || completed === TOTAL_PAGES) {
        console.log(`  ${completed}/${TOTAL_PAGES}...`);
      }
    }
  }

  const allPages = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);
  const chunks = Array.from({ length: CONCURRENCY }, (_, i) =>
    allPages.filter((_, idx) => idx % CONCURRENCY === i),
  );
  await Promise.all(chunks.map(worker));

  console.log(`\nنجح: ${TOTAL_PAGES - failures.length}/${TOTAL_PAGES}`);
  if (failures.length) {
    console.log("فشل:", JSON.stringify(failures, null, 2));
    await writeFile(path.join(OUT_DIR, "fetch-failures.json"), JSON.stringify(failures, null, 2));
  }

  console.log("done");
}

main().catch((err) => {
  console.error("فشل عام:", err);
  process.exit(1);
});
