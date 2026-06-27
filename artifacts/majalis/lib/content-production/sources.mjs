/**
 * Source connectors — ingest verified content into staging (no fabricated data).
 */
import { buildDedupKeys } from "./dedup.mjs";
import { contentHash } from "./normalize.mjs";

async function stageItem(admin, pipeline, item) {
  if (!admin) return { staged: false, reason: "no_admin" };
  const body = item.body || item.text || item.question || "";
  if (!body || body.length < 8) return { staged: false, reason: "empty_body" };
  if (!item.source_url && !item.source_name) return { staged: false, reason: "no_source" };

  const keys = buildDedupKeys(item);
  const row = {
    pipeline,
    source_slug: item.source_slug || null,
    source_url: item.source_url || item.source_name,
    external_key: item.external_key || null,
    title: item.title || null,
    body,
    metadata: item.metadata || {},
    content_hash: keys.content_hash,
    title_hash: keys.title_hash,
    semantic_fingerprint: keys.semantic_fingerprint,
    status: "pending",
  };

  const { error } = await admin.from("content_production_staging").upsert(row, {
    onConflict: "pipeline,content_hash",
    ignoreDuplicates: true,
  });
  if (error && !error.message?.includes("duplicate")) throw error;
  return { staged: !error, content_hash: keys.content_hash };
}

export async function ingestFromVerifiedHadith(admin, source, limit = 30) {
  const cursor = source.cursor?.offset || 0;
  const { data, error } = await admin
    .from("verified_hadith_items")
    .select("*")
    .eq("verification_status", "verified")
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .range(cursor, cursor + limit - 1);
  if (error) throw error;

  let staged = 0;
  for (const row of data || []) {
    const r = await stageItem(admin, "hadith", {
      source_slug: source.slug,
      source_url: row.source_url || source.url,
      source_name: row.source_name,
      external_key: row.id,
      title: row.title,
      body: row.text,
      narrator: row.narrator,
      metadata: {
        collection: row.collection,
        hadith_number: row.hadith_number,
        grade: row.grade,
        chapter: row.chapter,
        keywords: row.keywords,
        explanation: row.explanation,
        source_name: row.source_name,
        source_url: row.source_url,
        quality_score: row.quality_score,
        trust_level: row.trust_level,
      },
    });
    if (r.staged) staged += 1;
  }

  await admin
    .from("content_pipeline_sources")
    .update({
      cursor: { offset: cursor + (data?.length || 0) },
      last_checked_at: new Date().toISOString(),
      last_success_at: staged > 0 ? new Date().toISOString() : source.last_success_at,
    })
    .eq("slug", source.slug);

  return { discovered: data?.length || 0, staged };
}

export async function ingestFromQaQuestions(admin, source, limit = 50) {
  const cursor = source.cursor?.offset || 0;
  const { data, error } = await admin
    .from("qa_questions")
    .select("id, question, answer, qa_categories(name), reference, status")
    .eq("status", "published")
    .order("created_at", { ascending: true })
    .range(cursor, cursor + limit - 1);
  if (error) throw error;

  let staged = 0;
  for (const row of data || []) {
    const wrongOptions = await buildWrongOptions(admin, row.answer);
    const options = shuffleOptions([row.answer, ...wrongOptions].slice(0, 4));
    const correctIndex = options.indexOf(row.answer);
    if (correctIndex < 0) continue;

    const r = await stageItem(admin, "questions", {
      source_slug: source.slug,
      source_url: `qa:${row.id}`,
      source_name: "مجالس العلم — الأسئلة والأجوبة",
      external_key: `qa-quiz-${row.id}`,
      question: row.question,
      body: row.question,
      options,
      correct_index: correctIndex,
      category: row.qa_categories?.name || "عام",
      metadata: {
        options,
        correct_index: correctIndex,
        category: row.qa_categories?.name || "عام",
        source_name: "مجالس العلم — الأسئلة والأجوبة",
        source_url: `qa:${row.id}`,
        reference: row.reference,
        keywords: [],
      },
    });
    if (r.staged) staged += 1;
  }

  await admin
    .from("content_pipeline_sources")
    .update({ cursor: { offset: cursor + (data?.length || 0) }, last_checked_at: new Date().toISOString() })
    .eq("slug", source.slug);

  return { discovered: data?.length || 0, staged };
}

async function buildWrongOptions(admin, correctAnswer) {
  const { data } = await admin
    .from("qa_questions")
    .select("answer")
    .neq("answer", correctAnswer)
    .eq("status", "published")
    .limit(20);
  const pool = [...new Set((data || []).map((r) => r.answer).filter((a) => a && a !== correctAnswer))];
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function shuffleOptions(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export async function ingestFromFawaid(admin, source, limit = 80) {
  const cursor = source.cursor?.offset || 0;
  const { data, error } = await admin
    .from("fawaid")
    .select("id, text, author_name, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .range(cursor, cursor + limit - 1);
  if (error) throw error;

  let staged = 0;
  for (const row of data || []) {
    const r = await stageItem(admin, "fawaid", {
      source_slug: source.slug,
      source_url: `fawaid:${row.id}`,
      source_name: row.author_name || "مجالس العلم",
      external_key: `fawaid-cp-${row.id}`,
      body: row.text,
      metadata: { author_name: row.author_name, source_name: row.author_name || "مجالس العلم" },
    });
    if (r.staged) staged += 1;
  }

  await admin
    .from("content_pipeline_sources")
    .update({ cursor: { offset: cursor + (data?.length || 0) }, last_checked_at: new Date().toISOString() })
    .eq("slug", source.slug);

  return { discovered: data?.length || 0, staged };
}

export async function ingestFromAutoContent(admin, source, limit = 10) {
  const cursor = source.cursor?.offset || 0;
  const { data, error } = await admin
    .from("auto_imported_content")
    .select("id, title, body, source_url, source_name, pipeline_stage, status")
    .eq("pipeline_stage", "needs_review")
    .order("created_at", { ascending: true })
    .range(cursor, cursor + limit - 1);
  if (error) {
    if (error.message?.includes("does not exist")) return { discovered: 0, staged: 0 };
    throw error;
  }

  let staged = 0;
  for (const row of data || []) {
    if (!row.source_url) continue;
    const r = await stageItem(admin, "articles", {
      source_slug: source.slug,
      source_url: row.source_url,
      source_name: row.source_name || "RSS",
      external_key: `article-${row.id}`,
      title: row.title,
      body: row.body,
      metadata: { source_url: row.source_url, source_name: row.source_name },
    });
    if (r.staged) staged += 1;
  }

  await admin
    .from("content_pipeline_sources")
    .update({ cursor: { offset: cursor + (data?.length || 0) }, last_checked_at: new Date().toISOString() })
    .eq("slug", source.slug);

  return { discovered: data?.length || 0, staged };
}

export async function ingestFromRssSource(admin, source, limit = 5) {
  if (!source.url?.startsWith("http")) return { discovered: 0, staged: 0, error: "invalid_url" };

  try {
    const res = await fetch(source.url, {
      headers: { "User-Agent": "MajlisIlm-ContentBot/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { discovered: 0, staged: 0, error: `HTTP ${res.status}` };
    const xml = await res.text();
    const items = parseRssItems(xml).slice(0, limit);
    let staged = 0;
    for (const item of items) {
      if (!item.link || !item.title) continue;
      const r = await stageItem(admin, "articles", {
        source_slug: source.slug,
        source_url: item.link,
        source_name: source.name,
        external_key: contentHash(item.link),
        title: item.title,
        body: item.description || item.title,
        metadata: { source_url: item.link, source_name: source.name, category: source.metadata?.category },
      });
      if (r.staged) staged += 1;
    }
    await admin
      .from("content_pipeline_sources")
      .update({ last_checked_at: new Date().toISOString(), last_success_at: new Date().toISOString() })
      .eq("slug", source.slug);
    return { discovered: items.length, staged };
  } catch (err) {
    await admin
      .from("content_pipeline_sources")
      .update({ last_checked_at: new Date().toISOString(), last_error: err.message })
      .eq("slug", source.slug);
    return { discovered: 0, staged: 0, error: err.message };
  }
}

function parseRssItems(xml) {
  const items = [];
  const chunks = xml.split(/<item[\s>]/i).slice(1);
  for (const chunk of chunks) {
    const title = extractTag(chunk, "title");
    const link = extractTag(chunk, "link");
    const description = extractTag(chunk, "description");
    if (title) items.push({ title: stripCdata(title), link: stripCdata(link), description: stripCdata(description) });
  }
  return items;
}

function extractTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

function stripCdata(s) {
  return String(s || "")
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .replace(/<[^>]+>/g, " ")
    .trim();
}

export async function checkSourceHealth(admin, source) {
  if (source.source_type === "rss" && source.url?.startsWith("http")) {
    try {
      const res = await fetch(source.url, { method: "HEAD", signal: AbortSignal.timeout(8000) });
      return { healthy: res.ok, status: res.status };
    } catch (err) {
      return { healthy: false, error: err.message };
    }
  }
  if (source.source_type === "supabase" || source.source_type === "internal") {
    return { healthy: true, status: "local" };
  }
  if (source.source_type === "sunnah") {
    try {
      const res = await fetch(source.url, { method: "HEAD", signal: AbortSignal.timeout(8000) });
      return { healthy: res.ok, status: res.status };
    } catch (err) {
      return { healthy: false, error: err.message };
    }
  }
  return { healthy: false, error: "unknown_source_type" };
}

export async function runSourceIngest(admin, source) {
  switch (source.pipeline) {
    case "hadith":
      if (source.source_type === "supabase") return ingestFromVerifiedHadith(admin, source);
      return { discovered: 0, staged: 0, note: "sunnah_fetch_requires_cursor_implementation" };
    case "questions":
      return ingestFromQaQuestions(admin, source);
    case "fawaid":
      return ingestFromFawaid(admin, source);
    case "articles":
      if (source.source_type === "rss") return ingestFromRssSource(admin, source);
      if (source.source_type === "supabase") return ingestFromAutoContent(admin, source);
      return { discovered: 0, staged: 0 };
    default:
      return { discovered: 0, staged: 0 };
  }
}
