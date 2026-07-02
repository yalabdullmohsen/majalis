#!/usr/bin/env node
/**
 * تطبيق migration نظام خارطة طالب العلم
 * Usage: node scripts/apply-learning-path-migration.mjs
 * DATABASE_URL تُقرأ من ملف .env تلقائياً عبر dotenv
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getPgClient } from "../lib/database.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const supabaseDir = join(__dir, "../supabase");

const MIGRATION_FILES = [
  "learning_path_v1.sql",
  "learning_path_seed.sql",
];

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

    console.log("\n🎉 جميع migrations نجحت!");
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((e) => {
  console.error("💥 فشل تطبيق المigrations:", e.message);
  process.exit(1);
});
