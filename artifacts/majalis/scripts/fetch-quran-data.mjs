#!/usr/bin/env node
/**
 * جلب نص القرآن الكريم (رواية حفص عن عاصم، رسم عثماني) من AlQuran Cloud
 * وتخزينه محليًا حرفيًا بلا أي تعديل، ليصبح مصدر البيانات الأساسي بدل
 * الاعتماد الحصري على استدعاء حيّ لكل قراءة — مع بناء بيان سلامة (manifest)
 * بحساب SHA-256 لكل ملف للتحقق لاحقًا بلا حاجة لشبكة (انظر
 * scripts/verify-quran-integrity.mjs).
 *
 * المصدر: https://alquran.cloud/api — إصدار quran-uthmani (نص مصحف حفص
 * عثماني)، وهو بدوره مبني على نص مشروع Tanzil (tanzil.net) المُراجَع.
 *
 * ⚠️ هذا السكربت يُخزِّن النص كما وصل من الـ API دون أي تعديل. لا يُشغَّل
 * تلقائيًا ضمن pnpm build (يحتاج شبكة و~114 طلبًا) — يُشغَّل يدويًا عند
 * إعداد المشروع أو تحديث البيانات، ونتائجه (public/data/quran/) تُحفَظ
 * في المستودع كملفات ثابتة.
 *
 * تشغيل: node scripts/fetch-quran-data.mjs
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "data", "quran");

const BASE = "https://api.alquran.cloud/v1";
const EDITION = "quran-uthmani";
const EXPECTED_SURAH_COUNT = 114;
const EXPECTED_TOTAL_AYAHS = 6236;

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

async function fetchWithRetry(url, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  throw lastErr;
}

async function main() {
  console.log(`${BOLD}جلب نص القرآن الكريم من AlQuran Cloud (${EDITION})${RESET}\n`);
  await mkdir(OUT_DIR, { recursive: true });

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: "https://api.alquran.cloud/v1",
    edition: EDITION,
    license: "نص Tanzil المُراجَع (tanzil.net)، مُعاد نشره عبر AlQuran Cloud — راجع docs/quran-data-source.md",
    totalSurahs: 0,
    totalAyahs: 0,
    surahs: [],
  };

  let totalAyahs = 0;

  for (let n = 1; n <= EXPECTED_SURAH_COUNT; n++) {
    process.stdout.write(`  سورة ${String(n).padStart(3, "0")}... `);
    const json = await fetchWithRetry(`${BASE}/surah/${n}/${EDITION}`);
    if (json.code !== 200 || !json.data || !Array.isArray(json.data.ayahs)) {
      throw new Error(`استجابة غير متوقعة للسورة ${n}`);
    }
    const detail = json.data;
    const ayahCount = detail.ayahs.length;
    totalAyahs += ayahCount;

    const fileName = `surah-${String(n).padStart(3, "0")}.json`;
    const filePath = path.join(OUT_DIR, fileName);
    const content = JSON.stringify(detail);
    await writeFile(filePath, content, "utf8");

    const sha256 = createHash("sha256").update(content, "utf8").digest("hex");
    manifest.surahs.push({
      number: n,
      name: detail.name,
      englishName: detail.englishName,
      numberOfAyahs: ayahCount,
      file: fileName,
      sha256,
    });

    console.log(`${GREEN}✓${RESET} ${ayahCount} آية`);
  }

  manifest.totalSurahs = manifest.surahs.length;
  manifest.totalAyahs = totalAyahs;

  if (manifest.totalSurahs !== EXPECTED_SURAH_COUNT) {
    throw new Error(`عدد السور ${manifest.totalSurahs} ≠ ${EXPECTED_SURAH_COUNT} المتوقَّع — لن يُكتَب manifest.json`);
  }
  if (totalAyahs !== EXPECTED_TOTAL_AYAHS) {
    throw new Error(`إجمالي الآيات ${totalAyahs} ≠ ${EXPECTED_TOTAL_AYAHS} المتوقَّع — لن يُكتَب manifest.json`);
  }

  await writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

  console.log(`\n${GREEN}${BOLD}✓ تم حفظ ${manifest.totalSurahs} سورة، ${totalAyahs} آية إجمالًا.${RESET}`);
  console.log(`${YELLOW}شغّل الآن: node scripts/verify-quran-integrity.mjs${RESET}`);
}

main().catch((err) => {
  console.error(`\n${RED}✗ فشل الجلب:${RESET}`, err.message ?? err);
  process.exit(1);
});
