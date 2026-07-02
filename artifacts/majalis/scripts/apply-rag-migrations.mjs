#!/usr/bin/env node
/**
 * تطبيق migrations نظام الباحث الشرعي (RAG)
 * Usage: DATABASE_URL="..." node scripts/apply-rag-migrations.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getPgClient } from "../lib/database.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const supabaseDir = join(__dir, "../supabase");

const MIGRATION_FILES = ["search_index_rag_v1.sql"];

async function main() {
  const client = await getPgClient();
  if (!client) {
    console.error("❌ تعذر الاتصال بقاعدة البيانات — تأكد من DATABASE_URL");
    process.exit(1);
  }

  try {
    await client.connect();
    console.log("✅ متصل بقاعدة البيانات");

    for (const file of MIGRATION_FILES) {
      const sql = readFileSync(join(supabaseDir, file), "utf8");
      console.log(`\n📌 تطبيق ${file} ...`);
      await client.query(sql);
      console.log(`   ✅ ${file} — تم`);
    }

    console.log("\n✅ جميع migrations تم تطبيقها بنجاح");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("❌ خطأ:", e.message);
  process.exit(1);
});
