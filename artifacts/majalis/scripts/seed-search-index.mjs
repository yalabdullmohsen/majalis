#!/usr/bin/env node
/**
 * تعبئة search_index من جميع محتويات قاعدة البيانات.
 *
 * Usage: node scripts/seed-search-index.mjs
 * DATABASE_URL تُقرأ من ملف .env تلقائياً عبر dotenv
 */
import "dotenv/config";
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

const client = new Client(buildConfig(DB_URL));

async function main() {
  await client.connect();
  console.log("✅ متصل بقاعدة البيانات\n");

  // تشغيل دالة التعبئة المدمجة في SQL
  console.log("📌 تعبئة search_index من جميع الجداول...");

  const { rows } = await client.query(
    "SELECT * FROM populate_search_index_from_all()"
  );

  let totalInserted = 0;
  for (const row of rows) {
    console.log(`   ✅ ${row.content_type}: ${row.inserted} سجل جديد`);
    totalInserted += row.inserted;
  }

  // إحصائيات نهائية
  const { rows: stats } = await client.query(`
    SELECT content_type, COUNT(*) AS total
    FROM search_index
    GROUP BY content_type
    ORDER BY total DESC
  `);

  console.log("\n──────────────────────────────────────");
  console.log("📋 إحصائيات search_index النهائية:");
  let grandTotal = 0;
  for (const row of stats) {
    console.log(`   ${row.content_type}: ${row.total}`);
    grandTotal += Number(row.total);
  }
  console.log(`   المجموع: ${grandTotal}`);
  console.log(`\n✅ اكتمل بذر فهرس البحث`);
}

main()
  .catch((e) => {
    console.error("❌ خطأ:", e.message);
    process.exit(1);
  })
  .finally(() => client.end());
