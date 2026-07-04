#!/usr/bin/env node
/**
 * data-cleanup-dryrun.mjs — تقرير dry-run للتكرارات والبيانات الناقصة
 *
 * يعرض فقط ولا يُعدّل أي سجل.
 * التشغيل: DATABASE_URL=<url> node scripts/data-cleanup-dryrun.mjs
 *
 * ⚠️ لا تُشغّل أي DELETE أو UPDATE بدون نسخة احتياطية أولاً.
 */
import pg from "pg";
const { Client } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL env var is required");

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log("✅ متصل — وضع DRY RUN (لا تعديل)");
console.log("═".repeat(60));

// ── 1. تكرارات الدروس (lessons) ────────────────────────────────────────────
async function findDuplicateLessons() {
  const { rows } = await client.query(`
    SELECT title, COUNT(*) AS cnt, array_agg(id ORDER BY id) AS ids
    FROM lessons
    GROUP BY title
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
    LIMIT 50
  `).catch(() => ({ rows: [] }));
  return rows;
}

// ── 2. دروس بدون مصدر أو محتوى ──────────────────────────────────────────────
async function findIncompleteLessons() {
  const { rows } = await client.query(`
    SELECT id, title, created_at
    FROM lessons
    WHERE (content IS NULL OR content = '' OR LENGTH(content) < 50)
      AND (transcript IS NULL OR transcript = '')
    ORDER BY created_at DESC
    LIMIT 50
  `).catch(() => ({ rows: [] }));
  return rows;
}

// ── 3. تكرارات الفوائد (fawaid) ──────────────────────────────────────────────
async function findDuplicateFawaid() {
  const { rows } = await client.query(`
    SELECT text, COUNT(*) AS cnt, array_agg(id ORDER BY id) AS ids
    FROM fawaid
    GROUP BY text
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
    LIMIT 30
  `).catch(() => ({ rows: [] }));
  return rows;
}

// ── 4. قصص الأنبياء غير المعتمدة ─────────────────────────────────────────────
async function findUnapprovedProphetStories() {
  const { rows } = await client.query(`
    SELECT id, name_ar, is_approved, created_at
    FROM prophet_stories
    WHERE is_approved = false
    ORDER BY created_at
    LIMIT 100
  `).catch(() => ({ rows: [] }));
  return rows;
}

// ── 5. القصص الإسلامية غير المعتمدة ──────────────────────────────────────────
async function findUnapprovedIslamicStories() {
  const { rows } = await client.query(`
    SELECT id, title, category, is_approved, created_at
    FROM islamic_stories
    WHERE is_approved = false
    ORDER BY category, id
  `).catch(() => ({ rows: [] }));
  return rows;
}

// ── 6. ملفات RLS المفعّلة ──────────────────────────────────────────────────────
async function checkRlsStatus() {
  const { rows } = await client.query(`
    SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname IN (
        'lessons','fawaid','hadith_items','prophet_stories',
        'islamic_stories','adhkar','profiles','citations'
      )
    ORDER BY c.relname
  `).catch(() => ({ rows: [] }));
  return rows;
}

// ── تشغيل التقارير ────────────────────────────────────────────────────────────
const [dupLessons, incomplLessons, dupFawaid, unapprProphets, unapprIslamic, rlsStatus] =
  await Promise.all([
    findDuplicateLessons(),
    findIncompleteLessons(),
    findDuplicateFawaid(),
    findUnapprovedProphetStories(),
    findUnapprovedIslamicStories(),
    checkRlsStatus(),
  ]);

// ── تقرير ──────────────────────────────────────────────────────────────────────
console.log(`\n1️⃣  تكرارات الدروس: ${dupLessons.length} مجموعة`);
for (const r of dupLessons.slice(0, 5)) {
  console.log(`   • "${r.title}" — ${r.cnt} نسخة — IDs: ${r.ids.join(", ")}`);
}
if (dupLessons.length > 5) console.log(`   ... و${dupLessons.length - 5} أخرى`);

console.log(`\n2️⃣  دروس بمحتوى ناقص: ${incomplLessons.length} درس`);
for (const r of incomplLessons.slice(0, 5)) {
  console.log(`   • ID=${r.id} — "${r.title}" — ${r.created_at?.toISOString?.() ?? r.created_at}`);
}
if (incomplLessons.length > 5) console.log(`   ... و${incomplLessons.length - 5} أخرى`);

console.log(`\n3️⃣  تكرارات الفوائد: ${dupFawaid.length} مجموعة`);
for (const r of dupFawaid.slice(0, 3)) {
  const preview = (r.text || "").slice(0, 60).replace(/\n/g, " ");
  console.log(`   • "${preview}…" — ${r.cnt} نسخة — IDs: ${r.ids.join(", ")}`);
}
if (dupFawaid.length > 3) console.log(`   ... و${dupFawaid.length - 3} أخرى`);

console.log(`\n4️⃣  قصص الأنبياء قيد المراجعة: ${unapprProphets.length} قصة`);
for (const r of unapprProphets.slice(0, 5)) {
  console.log(`   • ID=${r.id} — ${r.name_ar}`);
}

console.log(`\n5️⃣  القصص الإسلامية قيد المراجعة: ${unapprIslamic.length} قصة`);
for (const r of unapprIslamic.slice(0, 10)) {
  console.log(`   • ID=${r.id} — [${r.category}] ${r.title}`);
}
if (unapprIslamic.length > 10) console.log(`   ... و${unapprIslamic.length - 10} أخرى`);

console.log(`\n6️⃣  حالة RLS على الجداول الحساسة:`);
for (const r of rlsStatus) {
  const status = r.rls_enabled ? "✅ مُفعَّل" : "⚠️  مُعطَّل";
  console.log(`   ${status} — ${r.table_name}`);
}

console.log("\n═".repeat(60));
console.log("📋 هذا تقرير DRY RUN — لم يُعدَّل أي سجل.");
console.log("📌 لتطبيق أي تنظيف: خذ نسخة احتياطية أولاً ثم شغّل السكريبت المخصص.");
console.log("═".repeat(60));

await client.end();
