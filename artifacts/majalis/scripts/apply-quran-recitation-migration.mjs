#!/usr/bin/env node
/**
 * تطبيق migration ميزة "اختبار التسميع بالذكاء الاصطناعي"
 * Usage: node scripts/apply-quran-recitation-migration.mjs
 * DATABASE_URL تُقرأ من ملف .env تلقائياً عبر dotenv
 *
 * ⚠️ لا يُشغَّل تلقائيًا من هذه الجلسة — يحتاج تشغيلًا يدويًا من المالك
 * بصلاحية DATABASE_URL على قاعدة الإنتاج، بنفس نمط باقي سكربتات
 * apply-*-migration.mjs القائمة في المشروع.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getPgClient } from "../lib/database.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const supabaseDir = join(__dir, "../supabase");

const MIGRATION_FILES = ["quran_recitation_ai_test_v1.sql"];

async function main() {
  const { client } = await getPgClient();

  try {
    console.log("✅ متصل بقاعدة البيانات");

    for (const file of MIGRATION_FILES) {
      const sql = readFileSync(join(supabaseDir, file), "utf8");
      console.log(`\n📌 تطبيق ${file} ...`);
      try {
        await client.query(sql);
        console.log(`   ✅ ${file} — تم`);
      } catch (err) {
        console.error(`   ❌ ${file} — فشل: ${err.message}`);
        throw err;
      }
    }

    console.log("\n🎉 جميع migrations نجحت! (recitation_sessions, recitation_errors, recitation_settings, recitation_deferred_jobs)");
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((e) => {
  console.error("💥 فشل تطبيق المigrations:", e.message);
  process.exit(1);
});
