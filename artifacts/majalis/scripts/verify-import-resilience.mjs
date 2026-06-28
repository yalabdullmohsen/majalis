#!/usr/bin/env node
/**
 * Verify resilient lesson CSV import — non-blocking optional fields.
 */
import { validateLessonRowsResilient, assessLessonRow, generateLessonTitle } from "../lib/content-import/lesson-field-policy.mjs";
import { validateAllRows, runContentImportRows } from "../lib/content-import/engine.mjs";
import { validateLessonDraft } from "../lib/cms/content-validator.mjs";
import { getAkeRpcHealth } from "../lib/auto-knowledge-engine/rpc-probe.mjs";
import { getAutoKnowledgeEngineStats } from "../lib/auto-knowledge-engine/orchestrator.mjs";

let pass = 0;
let fail = 0;

function ok(cond, msg) {
  if (cond) {
    pass++;
    console.log(`✓ ${msg}`);
  } else {
    fail++;
    console.error(`✗ ${msg}`);
  }
}

const baseRow = {
  sheikh_name: "فهد الكندري",
  mosque: "مسجد الصباح",
  day: "الجمعة",
  time: "8:00 م",
  source_url: "https://t.me/DrosQ8/123",
};

// 1. CSV without title — auto-generate
{
  const row = { ...baseRow, category: "فقه" };
  delete row.title;
  const title = generateLessonTitle(row);
  ok(title.startsWith("درس للشيخ"), "Auto-generates title as درس للشيخ …");
  const r = validateLessonRowsResilient([row]);
  ok(r.allValid && r.validRows.length === 1, "Import accepts row without title");
  ok(r.stats.published + r.stats.published_incomplete >= 1, "Row marked publishable without title");
}

// 2. CSV missing mosque — still imports
{
  const row = { title: "درس تجريبي", day: "السبت", time: "9:00 م", source_url: "https://example.com/x" };
  const r = validateLessonRowsResilient([row]);
  ok(r.allValid && r.validRows.length === 1, "Import accepts row without mosque");
  ok(r.stats.published_incomplete >= 1 || r.stats.published >= 1, "Missing mosque does not block");
}

// 3. CSV missing category — defaults to أخرى
{
  const row = { title: "درس بدون تصنيف", sheikh_name: "علي", day: "الأحد", time: "7:30 م", source_url: "https://a.b/c" };
  const r = validateLessonRowsResilient([row]);
  ok(r.validRows[0]?.category === "أخرى", "Missing category defaults to أخرى");
  ok(r.allValid, "Import accepts row without category");
}

// 4. Mixed file — one empty row + good rows
{
  const rows = [
    { title: "درس 1", day: "الاثنين", time: "8:00 م", source_url: "https://x/1" },
    { title: "", day: "", time: "", source_url: "" },
    { sheikh_name: "محمد", mosque: "مسجد النور", day: "الثلاثاء", time: "9:00 م", source_url: "https://x/2" },
  ];
  const r = validateLessonRowsResilient(rows);
  ok(r.validRows.length >= 2, "Mixed file: good rows not blocked by weak row");
  ok(r.allValid, "Mixed file: import continues (allValid with partial)");
}

// 5. validateAllRows integration
{
  const { validRows, allValid, partial } = validateAllRows("lessons", [
    { sheikh_name: "سالم", mosque: "مسجد الإمام", day: "الخميس", time: "10:00 م", source_url: "https://x/3" },
  ]);
  ok(allValid && validRows.length === 1, "validateAllRows lessons resilient");
}

// 6. Dry-run import engine
{
  const report = await runContentImportRows({
    type: "lessons",
    rows: [
      { sheikh_name: "أحمد", mosque: "مسجد الكبير", day: "الجمعة", time: "8:15 م", source_url: "https://x/4" },
      { title: "درس كامل", category: "عقيدة", day: "السبت", time: "7:00 م", source_url: "https://x/5", mosque: "مسجد X" },
    ],
    dryRun: true,
    source: "lesson_extracted_from_poster.csv",
  });
  ok(report.ok, "Dry-run import OK without title on first row");
  ok((report.stats?.imported ?? 0) >= 2, `Dry-run imported ${report.stats?.imported ?? 0} rows`);
}

// 7. Publish validator — incomplete optional fields still publish
{
  const v = validateLessonDraft({
    title: "درس للشيخ فلان",
    day_of_week: "الجمعة",
    lesson_time: "8:00 م",
    source_url: "https://example.com",
  });
  ok(v.canPublish, "Lesson with only required fields canPublish");
  ok(v.dataIncomplete, "Flags dataIncomplete when mosque/sheikh missing");
}

// 8. Publish validator — missing required blocks
{
  const v = validateLessonDraft({ title: "x" });
  ok(!v.canPublish, "Missing date/time/source blocks publish");
}

// 9. AKE RPC health probe (offline-safe)
{
  const health = await getAkeRpcHealth();
  ok(typeof health.engineStatsExists === "boolean", "AKE RPC health probe runs");
  ok(Array.isArray(health.functions), "AKE RPC functions list returned");
}

// 10. AKE stats with fallback (offline-safe when no service role)
{
  const stats = await getAutoKnowledgeEngineStats(7);
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    ok(stats.ok === true, "AKE stats returns ok with service role");
    ok(stats.stats != null, "AKE stats payload present");
  } else {
    ok(true, "AKE stats skipped (no service role in env)");
  }
}

// 11. assessLessonRow disposition
{
  const a = assessLessonRow({ sheikh_name: "X", mosque: "Y", day: "السبت", time: "8م", source_url: "https://z" }, 0);
  ok(a.disposition === "published_incomplete" || a.disposition === "published", "Disposition allows publish without title");
}

// 12. Title priority: sheikh then mosque then fallback
{
  ok(generateLessonTitle({ speaker_name: "علي" }) === "درس للشيخ علي", "Title priority: sheikh");
  ok(generateLessonTitle({ mosque: "مسجد النور" }) === "درس في مسجد النور", "Title priority: mosque");
  ok(generateLessonTitle({}) === "درس شرعي", "Title priority: fallback");
}

// 13. lesson_extracted.csv scenario — dry-run without title column
{
  const report = await runContentImportRows({
    type: "lessons",
    rows: [
      { sheikh_name: "فهد الكندري", mosque: "مسجد الصباح", day: "الجمعة", time: "8:00 م", source_url: "https://t.me/DrosQ8/1" },
    ],
    dryRun: true,
    source: "lesson_extracted.csv",
  });
  ok(report.ok, "lesson_extracted.csv dry-run OK");
  ok((report.stats?.imported ?? 0) >= 1, "lesson_extracted row imported");
  ok(!report.validationErrors?.some((e) => /title/i.test(e)), "No title validation error");
}
