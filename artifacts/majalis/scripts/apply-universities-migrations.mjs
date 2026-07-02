#!/usr/bin/env node
/**
 * تطبيق migration دليل الجامعات الشرعية
 * Usage: node scripts/apply-universities-migrations.mjs
 * DATABASE_URL تُقرأ من ملف .env تلقائياً عبر dotenv
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pkg from "../node_modules/pg/lib/index.js";

const { Client } = pkg;

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL غير محدد");
  process.exit(1);
}

function buildConfig(url) {
  const u = new URL(url);
  return {
    host:     u.hostname,
    port:     Number(u.port) || 5432,
    database: u.pathname.replace(/^\//, "") || "postgres",
    user:     decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    ssl:      { rejectUnauthorized: false },
  };
}

const __dir = dirname(fileURLToPath(import.meta.url));
const client = new Client(buildConfig(DB_URL));

async function main() {
  await client.connect();
  console.log("✅ متصل بقاعدة البيانات\n");

  const sqlFile = join(__dir, "../supabase/universities_v1.sql");
  const sql     = readFileSync(sqlFile, "utf8");

  console.log("📌 تطبيق universities_v1.sql ...");
  await client.query(sql);
  console.log("   ✅ تم بنجاح");

  // إحصائيات
  const { rows } = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM universities)           AS universities,
      (SELECT COUNT(*) FROM university_programs)    AS programs,
      (SELECT COUNT(*) FROM admission_requirements) AS requirements,
      (SELECT COUNT(*) FROM university_faqs)        AS faqs
  `);
  const s = rows[0];
  console.log(`\n📋 الإحصائيات:`);
  console.log(`   جامعات: ${s.universities}`);
  console.log(`   برامج: ${s.programs}`);
  console.log(`   شروط قبول: ${s.requirements}`);
  console.log(`   أسئلة شائعة: ${s.faqs}`);
  console.log("\n✅ اكتمل تطبيق migration الجامعات");
}

main()
  .catch((e) => {
    console.error("❌ خطأ:", e.message);
    process.exit(1);
  })
  .finally(() => client.end());
