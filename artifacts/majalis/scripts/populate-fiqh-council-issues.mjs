#!/usr/bin/env node
/**
 * يولّد SQL لتعبئة fiqh_council_items (الصفوف الناقصة فقط) وfiqh_council_issues
 * وfiqh_issue_items وfiqh_issue_timeline_events من seed الحالي في الكود
 * (src/lib/fiqh-council-seed.ts وsrc/lib/fiqh-issues-seed.ts).
 *
 * يولّد UUID محليًا لكل صف (يُخزَّن في slug→uuid map) بدل الاعتماد على
 * gen_random_uuid() في SQL، لأن fiqh_issue_items وfiqh_issue_timeline_events
 * تحتاج الإشارة لنفس الـUUID عبر عدة عبارات INSERT.
 *
 * التشغيل: npx tsx scripts/populate-fiqh-council-issues.mjs > /tmp/fiqh_seed.sql
 * ثم: npx supabase db query --linked -f /tmp/fiqh_seed.sql
 */
import { randomUUID } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const { FIQH_COUNCIL_PUBLISHED_SEED } = await import(pathToFileURL(resolve(appRoot, "src/lib/fiqh-council-seed.ts")).href);
const { FIQH_ISSUES_PUBLISHED_SEED, FIQH_ISSUE_ITEM_LINKS, FIQH_ISSUE_TIMELINE_SEED } =
  await import(pathToFileURL(resolve(appRoot, "src/lib/fiqh-issues-seed.ts")).href);

function sqlStr(v) {
  if (v == null) return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}
function sqlInt(v) {
  return v == null ? "NULL" : String(Number(v));
}
function sqlDate(v) {
  return v == null ? "NULL" : `'${String(v).slice(0, 10)}'`;
}
function sqlTs(v) {
  return v == null ? "NULL" : `'${v}'`;
}
function sqlJsonb(v) {
  return v == null ? "'[]'::jsonb" : `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
}
function sqlTextArray(v) {
  if (!v || !v.length) return "'{}'";
  return `ARRAY[${v.map((s) => sqlStr(s)).join(",")}]::text[]`;
}

// تصنيف fiqh_council_items/fiqh_council_issues مقيَّد بقائمة ثابتة (CHECK) في
// المخطط — بعض قيم category في seed تنويعات نصية لنفس المعنى (لا فرق ديني)،
// نُطبِّعها هنا وقت الإدراج فقط دون تعديل ملفات seed المصدرية.
const CATEGORY_NORMALIZE = {
  "الطب والحياة": "الطب والنوازل",
  "الطب والمستجدات": "الطب والنوازل",
  "الطب والأسرة": "الطب والنوازل",
  "الأسرة والنكاح": "الأسرة",
  "الصيام والعبادات": "العبادات",
  "العبادات والصلاة": "العبادات",
  "المعاملات المالية": "المعاملات",
  "النوازل المعاصرة": "القضايا المعاصرة",
  "الدعوة والإعلام": "القضايا المعاصرة",
};
function normCategory(c) {
  return CATEGORY_NORMALIZE[c] || c;
}

const itemIdBySlug = new Map();
for (const it of FIQH_COUNCIL_PUBLISHED_SEED) itemIdBySlug.set(it.slug, randomUUID());

const issueIdBySlug = new Map();
for (const iss of FIQH_ISSUES_PUBLISHED_SEED) issueIdBySlug.set(iss.slug, randomUUID());

const lines = [];
lines.push("-- مُولَّد آليًا من scripts/populate-fiqh-council-issues.mjs — لا تُحرَّر يدويًا.");
lines.push("BEGIN;");

// 1) fiqh_council_items — فقط الصفوف غير الموجودة (تحقق بـslug)
lines.push("\n-- fiqh_council_items");
for (const it of FIQH_COUNCIL_PUBLISHED_SEED) {
  const id = itemIdBySlug.get(it.slug);
  lines.push(
    `INSERT INTO public.fiqh_council_items (id, title, slug, type, category, summary, content, ruling_text, evidence, source_name, source_url, council_name, session_number, session_date, tags, status, views_count, published_at, external_id) VALUES (` +
    `${sqlStr(id)}, ${sqlStr(it.title)}, ${sqlStr(it.slug)}, ${sqlStr(it.type)}, ${sqlStr(normCategory(it.category))}, ${sqlStr(it.summary)}, ${sqlStr(it.content)}, ${sqlStr(it.ruling_text)}, ${sqlJsonb(it.evidence)}, ${sqlStr(it.source_name)}, ${sqlStr(it.source_url)}, ${sqlStr(it.council_name)}, ${sqlStr(it.session_number)}, ${sqlDate(it.session_date)}, ${sqlTextArray(it.tags)}, ${sqlStr(it.status || "published")}, ${sqlInt(it.views_count || 0)}, ${sqlTs(it.published_at)}, ${sqlStr(it.external_id)}` +
    `) ON CONFLICT (slug) DO NOTHING;`
  );
}

// 2) fiqh_council_issues
lines.push("\n-- fiqh_council_issues");
for (const iss of FIQH_ISSUES_PUBLISHED_SEED) {
  const id = issueIdBySlug.get(iss.slug);
  lines.push(
    `INSERT INTO public.fiqh_council_issues (id, slug, title, summary, description, category, subcategory, ruling_summary, evidence_summary, documentation_level, status, views_count, published_at, created_at, updated_at) VALUES (` +
    `${sqlStr(id)}, ${sqlStr(iss.slug)}, ${sqlStr(iss.title)}, ${sqlStr(iss.summary)}, ${sqlStr(iss.description)}, ${sqlStr(normCategory(iss.category))}, ${sqlStr(iss.subcategory)}, ${sqlStr(iss.ruling_summary)}, ${sqlStr(iss.evidence_summary)}, ${sqlStr(iss.documentation_level || "official_verified")}, ${sqlStr(iss.status || "published")}, ${sqlInt(iss.views_count || 0)}, ${sqlTs(iss.published_at)}, ${sqlTs(iss.created_at) === "NULL" ? "now()" : sqlTs(iss.created_at)}, ${sqlTs(iss.updated_at) === "NULL" ? "now()" : sqlTs(iss.updated_at)}` +
    `) ON CONFLICT (slug) DO NOTHING;`
  );
}

// 3) fiqh_issue_items (روابط)
lines.push("\n-- fiqh_issue_items");
let skippedLinks = 0;
for (const [issueSlug, itemSlugs] of Object.entries(FIQH_ISSUE_ITEM_LINKS)) {
  const issueId = issueIdBySlug.get(issueSlug);
  if (!issueId) continue;
  itemSlugs.forEach((itemSlug, i) => {
    const itemId = itemIdBySlug.get(itemSlug);
    if (!itemId) { skippedLinks++; return; }
    lines.push(
      `INSERT INTO public.fiqh_issue_items (issue_id, item_id, link_type, sort_order) VALUES (${sqlStr(issueId)}, ${sqlStr(itemId)}, 'related', ${i}) ON CONFLICT (issue_id, item_id) DO NOTHING;`
    );
  });
}

// 4) fiqh_issue_timeline_events
lines.push("\n-- fiqh_issue_timeline_events");
for (const [issueSlug, events] of Object.entries(FIQH_ISSUE_TIMELINE_SEED)) {
  const issueId = issueIdBySlug.get(issueSlug);
  if (!issueId) continue;
  const linkedItemSlugs = FIQH_ISSUE_ITEM_LINKS[issueSlug] || [];
  events.forEach((ev, i) => {
    const itemSlug = linkedItemSlugs[i] || linkedItemSlugs[0];
    const itemId = itemSlug ? itemIdBySlug.get(itemSlug) : null;
    lines.push(
      `INSERT INTO public.fiqh_issue_timeline_events (issue_id, event_type, title, description, event_date, item_id, sort_order) VALUES (${sqlStr(issueId)}, ${sqlStr(ev.event_type)}, ${sqlStr(ev.title)}, ${sqlStr(ev.description)}, ${sqlDate(ev.event_date)}, ${sqlStr(itemId)}, ${sqlInt(ev.sort_order ?? i + 1)});`
    );
  });
}

lines.push("\nCOMMIT;");

console.error(`# items=${FIQH_COUNCIL_PUBLISHED_SEED.length} issues=${FIQH_ISSUES_PUBLISHED_SEED.length} skippedLinks=${skippedLinks}`);
console.log(lines.join("\n"));
