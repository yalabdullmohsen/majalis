#!/usr/bin/env node
/**
 * تطبيق سياسات RLS على جدول islamic_stories
 * التشغيل: DATABASE_URL=<your_db_url> node scripts/apply-rls-islamic-stories.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
const { Client } = pg;

const __dir = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(resolve(__dir, "../supabase/islamic_stories_rls_v1.sql"), "utf-8");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL env var is required");

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log("✅ متصل بقاعدة البيانات");

await client.query(sql);
console.log("✅ تم تطبيق سياسات RLS على جدول islamic_stories");

// التحقق من النتيجة
const { rows } = await client.query(`
  SELECT policyname, cmd, qual
  FROM pg_policies
  WHERE tablename = 'islamic_stories'
  ORDER BY policyname
`);
console.log("\nسياسات RLS المُفعَّلة:");
for (const r of rows) console.log(`  • ${r.policyname} (${r.cmd})`);

await client.end();
