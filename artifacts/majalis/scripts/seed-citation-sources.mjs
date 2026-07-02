#!/usr/bin/env node
/**
import "dotenv/config";
 * scripts/seed-citation-sources.mjs
 *
 * يملأ جدول citation_sources من المحتوى المعتمد الموجود في قاعدة البيانات.
 * يعيّن is_approved = true فقط للمحتوى الذي يحمل مصدرًا موثَّقًا.
 *
 * الجداول المصدر:
 *   - fawaid (فوائد)
 *   - lessons (دروس)
 *   - kn_nodes (عقد شبكة المعرفة)
 *
 * الاستخدام:
 *   node scripts/seed-citation-sources.mjs
 */

import pkg from "../node_modules/pg/lib/index.js";
const { Client } = pkg;

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL غير محدد. مثال:");
  console.error('  DATABASE_URL="postgresql://user:pass@host:5432/db" node scripts/seed-citation-sources.mjs');
  process.exit(1);
}

function buildConfig(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port) || 5432,
    database: u.pathname.replace(/^\//, "") || "postgres",
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    ssl: { rejectUnauthorized: false },
  };
}

const DB_CONFIG = buildConfig(DB_URL);

async function run() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log("✅ متصل بقاعدة البيانات\n");

  let total = 0;
  let approved = 0;

  // ── 1. من kn_nodes (شبكة المعرفة — موثَّقة بالكامل) ────────────────────────
  try {
    const { rows: nodes } = await client.query(`
      SELECT id, node_type, title, summary, reference_id
      FROM kn_nodes
      ORDER BY created_at
    `);
    console.log(`📊 kn_nodes: ${nodes.length} عقدة`);

    for (const node of nodes) {
      const contentType = mapNodeType(node.node_type);
      if (!contentType) continue;

      await client.query(`
        INSERT INTO citation_sources (
          content_type, reference_id, knowledge_node_id,
          title_ar, is_approved
        )
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT DO NOTHING
      `, [contentType, node.reference_id, node.id, node.title]);

      total++;
      approved++;
    }
    console.log(`   ✅ أضيف ${nodes.length} مصدر من kn_nodes (جميعها معتمدة)\n`);
  } catch (err) {
    console.log(`   ⚠️ kn_nodes: ${err.message.split("\n")[0]}\n`);
  }

  // ── 2. من fawaid (فوائد — معتمدة إذا كانت لها مصدر) ─────────────────────────
  try {
    const { rows: fawaid } = await client.query(`
      SELECT id, text, source_name, author_name, book_name, status
      FROM fawaid
      WHERE status = 'approved'
      ORDER BY created_at
      LIMIT 500
    `);
    console.log(`📊 fawaid: ${fawaid.length} فائدة معتمدة`);

    let faAdded = 0;
    for (const f of fawaid) {
      const isApproved = Boolean(f.source_name || f.author_name || f.book_name);
      const title = truncate(f.text, 120) || "فائدة";

      await client.query(`
        INSERT INTO citation_sources (
          content_type, reference_id, title_ar,
          author_name, book_name, is_approved
        )
        VALUES ('benefit', $1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [f.id, title, f.author_name || f.source_name || null, f.book_name || null, isApproved]);

      total++;
      if (isApproved) approved++;
      faAdded++;
    }
    console.log(`   ✅ أضيف ${faAdded} مصدر من fawaid (منها ${approved - (total - faAdded)} معتمد)\n`);
  } catch (err) {
    if (err.message.includes("does not exist")) {
      console.log(`   ⏭️ جدول fawaid غير موجود — تخطي\n`);
    } else {
      console.log(`   ⚠️ fawaid: ${err.message.split("\n")[0]}\n`);
    }
  }

  // ── 3. من lessons (دروس) ──────────────────────────────────────────────────────
  try {
    const { rows: lessons } = await client.query(`
      SELECT id, title, sheikh_name, source_url, status
      FROM lessons
      WHERE status = 'approved'
      ORDER BY created_at
      LIMIT 200
    `);
    console.log(`📊 lessons: ${lessons.length} درس معتمد`);

    let lsAdded = 0;
    for (const l of lessons) {
      const isApproved = Boolean(l.sheikh_name);
      await client.query(`
        INSERT INTO citation_sources (
          content_type, reference_id, title_ar,
          author_name, source_url, is_approved
        )
        VALUES ('lesson', $1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [l.id, l.title || "درس", l.sheikh_name || null, l.source_url || null, isApproved]);

      total++;
      if (isApproved) approved++;
      lsAdded++;
    }
    console.log(`   ✅ أضيف ${lsAdded} مصدر من lessons\n`);
  } catch (err) {
    if (err.message.includes("does not exist") || err.message.includes("column")) {
      console.log(`   ⏭️ lessons: بنية مختلفة — تخطي\n`);
    } else {
      console.log(`   ⚠️ lessons: ${err.message.split("\n")[0]}\n`);
    }
  }

  // ── ملخص ───────────────────────────────────────────────────────────────────
  const { rows: counts } = await client.query(`
    SELECT
      COUNT(*) FILTER (WHERE is_approved) AS approved_count,
      COUNT(*) FILTER (WHERE NOT is_approved) AS pending_count,
      COUNT(*) AS total_count
    FROM citation_sources
  `);

  console.log("─".repeat(50));
  console.log(`📋 إجمالي citation_sources في قاعدة البيانات:`);
  console.log(`   معتمدة (is_approved=true):  ${counts[0].approved_count}`);
  console.log(`   قيد المراجعة:               ${counts[0].pending_count}`);
  console.log(`   الإجمالي:                   ${counts[0].total_count}`);
  console.log("─".repeat(50));
  console.log(`\n✅ اكتملت العملية — أضيف ${total} مصدر (${approved} معتمد)`);

  await client.end();
}

function mapNodeType(nodeType) {
  const map = {
    quran_ayah: "quran_ayah",
    hadith: "hadith",
    fatwa: "fatwa",
    scholar: null,
    book: "book",
    lesson: "lesson",
    benefit: "benefit",
    prophet_story: "prophet_story",
    term: null,
  };
  return map[nodeType] || null;
}

function truncate(str, len) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "..." : str;
}

run().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
