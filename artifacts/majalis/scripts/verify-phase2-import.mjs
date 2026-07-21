#!/usr/bin/env node
/**
 * Verify Phase 2 trial rows exist in Supabase (anon read) and search API.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || "https://www.majlisilm.com";

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const sb = createClient(url, key);

async function columnExists(table, column) {
  const { error } = await sb.from(table).select(column).limit(0);
  return !error;
}

async function main() {
  const checks = [];

  const sheikh = await sb.from("sheikhs").select("id, name").ilike("name", "%Phase2%").maybeSingle();
  checks.push({ name: "sheikhs Phase2", ok: Boolean(sheikh.data), detail: sheikh.data?.name || sheikh.error?.message });

  const hasExternalKey = await columnExists("lessons", "external_key");
  let lessonQuery = sb.from("lessons").select("id, title").ilike("title", "%Phase 2%").eq("status", "approved");
  if (hasExternalKey) {
    lessonQuery = sb
      .from("lessons")
      .select("id, title, external_key")
      .or("external_key.eq.phase2-import-lesson-001,title.ilike.%Phase 2%")
      .eq("status", "approved");
  }
  const lesson = await lessonQuery.maybeSingle();
  checks.push({
    name: "lessons Phase2",
    ok: Boolean(lesson.data),
    detail: lesson.data?.external_key || lesson.data?.title || lesson.error?.message,
  });

  const question = await sb
    .from("qa_questions")
    .select("id, question, status")
    .ilike("question", "%Phase2%")
    .eq("status", "published")
    .maybeSingle();
  checks.push({ name: "qa_questions Phase2", ok: Boolean(question.data), detail: question.data?.question?.slice(0, 60) || question.error?.message });

  const book = await sb
    .from("library_items")
    .select("id, title, status")
    .ilike("title", "%Phase2%")
    .eq("status", "approved")
    .maybeSingle();
  checks.push({ name: "library_items Phase2", ok: Boolean(book.data), detail: book.data?.title || book.error?.message });

  let searchOk = false;
  try {
    const res = await fetch(`${base}/api/intelligent-search?q=Phase2&limit=5`);
    const json = await res.json();
    const count = json.count ?? json.results?.length ?? json.items?.length ?? 0;
    searchOk = count > 0;
    checks.push({ name: "search Phase2", ok: searchOk, detail: `count=${count}` });
  } catch (e) {
    checks.push({ name: "search Phase2", ok: false, detail: String(e.message || e) });
  }

  console.log("\n=== Phase 2 Import Verification ===\n");
  for (const c of checks) {
    console.log(`${c.ok ? "✓" : "✗"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }

  const ok = checks.every((c) => c.ok);
  console.log(`\nOverall: ${ok ? "PASS" : "FAIL"}\n`);
  process.exit(ok ? 0 : 1);
}

main();
