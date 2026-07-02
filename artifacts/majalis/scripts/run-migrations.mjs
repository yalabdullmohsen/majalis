#!/usr/bin/env node
/**
import "dotenv/config";
 * scripts/run-migrations.mjs
 *
 * يطبّق ملفات SQL على Supabase تلقائياً.
 * الاستخدام:
 *   DATABASE_URL="postgresql://..." node scripts/run-migrations.mjs [file1.sql file2.sql ...]
 *   أو بدون معاملات لتشغيل جميع ملفات supabase/*.sql بالترتيب.
 */

import { readFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pkg from "../node_modules/pg/lib/index.js";

const { Client } = pkg;
const __dir = dirname(fileURLToPath(import.meta.url));

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL غير محدد. مثال:");
  console.error('  DATABASE_URL="postgresql://user:pass@host:5432/db" node scripts/run-migrations.mjs');
  process.exit(1);
}

// تحديد الملفات: إما من الأوامر أو تلقائياً
const specificFiles = process.argv.slice(2);
let sqlFiles;

if (specificFiles.length > 0) {
  sqlFiles = specificFiles.map((f) => resolve(f));
} else {
  const supabaseDir = resolve(__dir, "../supabase");
  sqlFiles = readdirSync(supabaseDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => resolve(supabaseDir, f));
}

async function run() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("✅ متصل بقاعدة البيانات\n");

  let ok = 0, failed = 0;

  for (const file of sqlFiles) {
    const name = file.split("/").pop();
    process.stdout.write(`▶ ${name} ... `);
    try {
      const sql = readFileSync(file, "utf-8");
      await client.query(sql);
      console.log("✅");
      ok++;
    } catch (err) {
      console.log(`❌ ${err.message.split("\n")[0]}`);
      failed++;
    }
  }

  console.log(`\n── النتيجة: ${ok} نجح / ${failed} فشل ──`);
  await client.end();
  if (failed > 0) process.exit(1);
}

run().catch((err) => { console.error("FATAL:", err.message); process.exit(1); });
