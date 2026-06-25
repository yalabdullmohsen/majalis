/**
 * Fiqh Council sync engine — runs in Node (cron / API).
 * Official sources only. All imports default to review status.
 */

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getSupabaseAdmin, isMissingTableError } from "./supabase-admin.mjs";
import { findPotentialDuplicates } from "./fiqh-council-dedup.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../data");

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const OFFICIAL_SOURCES = [
  {
    slug: "islamweb-majlis",
    name: "IslamWeb — المجمع الفقهي",
    organization: "IslamWeb.net",
    source_type: "json_manifest",
    base_url: "https://www.islamweb.net",
    manifest_file: "fiqh-official-manifest.json",
  },
  {
    slug: "iifa-oic",
    name: "الأكاديمية الإسلامية للفقه (OIC-IIFA)",
    organization: "منظمة التعاون الإسلامي",
    source_type: "rss",
    base_url: "https://www.iifa-aifi.org",
    feed_url: "https://www.iifa-aifi.org/ar/rss",
  },
  {
    slug: "kfas-sharia",
    name: "اللجنة الشرعية — KFAS",
    organization: "Kuwait Foundation for the Advancement of Sciences",
    source_type: "json_manifest",
    base_url: "https://www.kfas.org.kw",
    manifest_file: "fiqh-kfas-manifest.json",
  },
];

function log(scope, data) {
  console.info(`[fiqh-sync:${scope}]`, JSON.stringify({ at: new Date().toISOString(), ...data }));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function stripHtml(text) {
  return String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80) || `fiqh-${Date.now()}`;
}

function contentHash(parts) {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32);
}

function validateItem(raw) {
  const errors = [];
  if (!raw.external_id?.trim()) errors.push("external_id مطلوب");
  if (!raw.title?.trim() || raw.title.trim().length < 5) errors.push("العنوان قصير أو فارغ");
  if (!raw.source_url?.trim() || !/^https?:\/\//i.test(raw.source_url)) errors.push("رابط المصدر غير صالح");
  if (!raw.source_name?.trim()) errors.push("اسم المصدر مطلوب");
  const validTypes = ["resolution", "fatwa", "research", "recommendation", "ruling"];
  if (!validTypes.includes(raw.type)) errors.push("نوع المحتوى غير معروف");
  const validCats = [
    "العبادات", "المعاملات", "الأسرة", "الطب والنوازل", "الاقتصاد الإسلامي",
    "الأقليات المسلمة", "القضايا المعاصرة", "الأطعمة والأشربة", "الزكاة والوقف", "الحج والعمرة",
  ];
  if (!validCats.includes(raw.category)) errors.push("التصنيف غير معروف");
  if (raw.session_date && !/^\d{4}-\d{2}-\d{2}$/.test(raw.session_date)) errors.push("تاريخ غير صالح");
  return { valid: errors.length === 0, errors };
}

async function loadManifest(filename) {
  try {
    const raw = await readFile(resolve(DATA_DIR, filename), "utf8");
    const json = JSON.parse(raw);
    return Array.isArray(json.items) ? json.items : [];
  } catch (err) {
    log("manifest", { file: filename, error: String(err?.message || err) });
    return [];
  }
}

function parseRssItems(xml) {
  const items = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const block of itemBlocks) {
    const title = stripHtml(block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
    const link = (block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] || "").trim();
    const desc = stripHtml(block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] || "");
    const pubDate = (block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] || "").trim();
    const guid = (block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)?.[1] || link).trim();
    if (!title || !link) continue;
    let session_date = null;
    if (pubDate) {
      const d = new Date(pubDate);
      if (!Number.isNaN(d.getTime())) session_date = d.toISOString().slice(0, 10);
    }
    items.push({
      external_id: slugify(`iifa-${guid || title}`),
      title,
      type: "research",
      category: "القضايا المعاصرة",
      summary: desc.slice(0, 300),
      content: desc,
      source_url: link,
      source_name: "الأكاديمية الإسلامية للفقه (OIC-IIFA)",
      session_date,
      tags: ["بحث", "OIC"],
    });
  }
  return items;
}

async function fetchRssItems(feedUrl) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(feedUrl, {
        headers: { Accept: "application/rss+xml, application/xml, text/xml" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);
      const xml = await res.text();
      return parseRssItems(xml);
    } catch (err) {
      log("rss-retry", { attempt, error: String(err?.message || err) });
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  return [];
}

async function ensureSourceRow(admin, sourceDef) {
  const { data: existing } = await admin
    .from("fiqh_council_sources")
    .select("id, slug")
    .eq("slug", sourceDef.slug)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: inserted, error } = await admin
    .from("fiqh_council_sources")
    .insert({
      slug: sourceDef.slug,
      name: sourceDef.name,
      organization: sourceDef.organization,
      source_type: sourceDef.source_type,
      base_url: sourceDef.base_url,
      feed_url: sourceDef.feed_url || null,
      trust_level: "official",
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }
  return inserted?.id || null;
}

async function createSyncJob(admin, sourceId, triggerType = "cron") {
  const { data, error } = await admin
    .from("fiqh_council_sync_jobs")
    .insert({
      source_id: sourceId,
      trigger_type: triggerType,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }
  return data?.id || null;
}

async function finishSyncJob(admin, jobId, result) {
  await admin
    .from("fiqh_council_sync_jobs")
    .update({
      status: result.error_count > 0 && result.inserted_count + result.updated_count === 0 ? "failed" : result.error_count > 0 ? "partial" : "completed",
      finished_at: new Date().toISOString(),
      total_fetched: result.total_fetched,
      inserted_count: result.inserted_count,
      updated_count: result.updated_count,
      skipped_count: result.skipped_count,
      duplicate_count: result.duplicate_count,
      error_count: result.error_count,
      summary: result.summary || {},
      error_log: result.errors || [],
    })
    .eq("id", jobId);
}

async function writeSyncLog(admin, jobId, sourceId, entry) {
  await admin.from("fiqh_council_sync_logs").insert({
    job_id: jobId,
    source_id: sourceId,
    external_id: entry.external_id || null,
    item_id: entry.item_id || null,
    action: entry.action,
    message: entry.message || null,
    payload: entry.payload || {},
  });
}

async function recordDuplicate(admin, itemId, candidateId, match) {
  await admin.from("fiqh_council_duplicates").upsert({
    item_id: itemId,
    candidate_id: candidateId,
    similarity_score: match.score,
    match_reasons: match.reasons,
    status: "pending",
  }, { onConflict: "item_id,candidate_id" });
}

async function upsertItem(admin, sourceId, jobId, raw, existingPool = []) {
  const cleaned = {
    external_id: String(raw.external_id).trim(),
    title: stripHtml(raw.title),
    slug: slugify(raw.slug || raw.external_id || raw.title),
    type: raw.type,
    category: raw.category,
    summary: stripHtml(raw.summary || "").slice(0, 500),
    content: stripHtml(raw.content || raw.summary || ""),
    ruling_text: stripHtml(raw.ruling_text || ""),
    source_name: stripHtml(raw.source_name),
    source_url: String(raw.source_url).trim(),
    session_date: raw.session_date || null,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
  };

  const validation = validateItem(cleaned);
  if (!validation.valid) {
    return { action: "validate_fail", errors: validation.errors };
  }

  const hash = contentHash([cleaned.external_id, cleaned.title, cleaned.source_url, cleaned.summary]);

  const { data: existing } = await admin
    .from("fiqh_council_items")
    .select("id, content_hash, status")
    .eq("source_id", sourceId)
    .eq("external_id", cleaned.external_id)
    .maybeSingle();

  if (existing?.id && existing.content_hash === hash) {
    return { action: "skip", item_id: existing.id, reason: "unchanged" };
  }

  const dupMatches = findPotentialDuplicates(
    { ...cleaned, content_hash: hash },
    existingPool.filter((e) => !(e.source_id === sourceId && e.external_id === cleaned.external_id)),
  );

  if (!existing?.id && dupMatches.length > 0 && dupMatches[0].score >= 0.85) {
    return {
      action: "duplicate",
      item_id: dupMatches[0].candidateId,
      duplicate_of: dupMatches[0].candidateSlug,
      score: dupMatches[0].score,
      reasons: dupMatches[0].reasons,
    };
  }

  const { data, error } = await admin.rpc("fiqh_council_sync_upsert", {
    p_source_id: sourceId,
    p_external_id: cleaned.external_id,
    p_title: cleaned.title,
    p_slug: cleaned.slug,
    p_type: cleaned.type,
    p_category: cleaned.category,
    p_summary: cleaned.summary,
    p_content: cleaned.content,
    p_ruling_text: cleaned.ruling_text,
    p_source_name: cleaned.source_name,
    p_source_url: cleaned.source_url,
    p_session_date: cleaned.session_date,
    p_tags: cleaned.tags,
    p_content_hash: hash,
    p_sync_job_id: jobId,
    p_subcategory: cleaned.subcategory || null,
    p_decision_number: cleaned.decision_number || null,
    p_nawazil_topic: cleaned.nawazil_topic || null,
    p_imported_content: cleaned.content,
  });

  if (error) {
    if (isMissingTableError(error)) {
      return { action: "error", errors: ["جدول fiqh_council_items غير موجود"] };
    }
    return { action: "error", errors: [String(error.message || error)] };
  }

  const action = data?.action || (existing?.id ? "update" : "insert");
  const itemId = data?.id;

  if (itemId && dupMatches.length > 0) {
    for (const m of dupMatches.slice(0, 3)) {
      await recordDuplicate(admin, itemId, m.candidateId, m);
    }
  }

  return { action, item_id: itemId, hash, duplicate_matches: dupMatches };
}

async function syncSource(admin, sourceDef, triggerType = "cron") {
  const sourceId = await ensureSourceRow(admin, sourceDef);
  if (!sourceId) {
    return { ok: false, skipped: true, reason: "sources_table_missing", slug: sourceDef.slug };
  }

  const jobId = await createSyncJob(admin, sourceId, triggerType);
  if (!jobId) {
    return { ok: false, skipped: true, reason: "sync_jobs_table_missing", slug: sourceDef.slug };
  }

  let rawItems = [];
  if (sourceDef.source_type === "json_manifest" && sourceDef.manifest_file) {
    rawItems = await loadManifest(sourceDef.manifest_file);
  } else if (sourceDef.source_type === "rss" && sourceDef.feed_url) {
    rawItems = await fetchRssItems(sourceDef.feed_url);
  }

  const { data: existingItems } = await admin
    .from("fiqh_council_items")
    .select("id, slug, title, source_url, session_number, session_date, tags, content_hash, external_id, source_id")
    .limit(500);

  const existingPool = existingItems || [];

  const result = {
    slug: sourceDef.slug,
    total_fetched: rawItems.length,
    inserted_count: 0,
    updated_count: 0,
    skipped_count: 0,
    duplicate_count: 0,
    error_count: 0,
    errors: [],
    summary: { source: sourceDef.slug, fetched: rawItems.length },
  };

  for (const raw of rawItems) {
    try {
      const outcome = await upsertItem(admin, sourceId, jobId, raw, existingPool);
      if (outcome.action === "insert") {
        result.inserted_count += 1;
        await writeSyncLog(admin, jobId, sourceId, { action: "insert", external_id: raw.external_id, item_id: outcome.item_id });
      } else if (outcome.action === "update") {
        result.updated_count += 1;
        await writeSyncLog(admin, jobId, sourceId, { action: "update", external_id: raw.external_id, item_id: outcome.item_id });
      } else if (outcome.action === "duplicate") {
        result.duplicate_count += 1;
        await writeSyncLog(admin, jobId, sourceId, {
          action: "duplicate",
          external_id: raw.external_id,
          item_id: outcome.item_id,
          message: `تشابه مع ${outcome.duplicate_of}`,
          payload: { score: outcome.score, reasons: outcome.reasons },
        });
      } else if (outcome.action === "skip") {
        result.skipped_count += 1;
        await writeSyncLog(admin, jobId, sourceId, { action: "skip", external_id: raw.external_id, message: outcome.reason });
      } else if (outcome.action === "validate_fail") {
        result.error_count += 1;
        result.errors.push({ external_id: raw.external_id, errors: outcome.errors });
        await writeSyncLog(admin, jobId, sourceId, { action: "validate_fail", external_id: raw.external_id, payload: { errors: outcome.errors } });
      } else if (outcome.action === "error") {
        result.error_count += 1;
        result.errors.push({ external_id: raw.external_id, errors: outcome.errors });
        await writeSyncLog(admin, jobId, sourceId, { action: "error", external_id: raw.external_id, payload: { errors: outcome.errors } });
      }
    } catch (err) {
      result.error_count += 1;
      result.errors.push({ external_id: raw.external_id, errors: [String(err?.message || err)] });
    }
  }

  await finishSyncJob(admin, jobId, result);
  await syncSessionsFromImportedItems(admin, sourceId);

  await admin
    .from("fiqh_council_sources")
    .update({
      last_sync_at: new Date().toISOString(),
      last_sync_status: result.error_count > 0 ? "partial" : "completed",
      last_sync_summary: result.summary,
      items_imported_count: result.inserted_count + result.updated_count,
      last_error_log: result.errors?.length ? result.errors : [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", sourceId);

  log("source-done", result);
  return { ok: result.error_count === 0 || result.inserted_count + result.updated_count > 0, jobId, ...result };
}

/** يجمّع الجلسات من العناصر المستوردة — لا ينشر تلقائياً */
async function syncSessionsFromImportedItems(admin, sourceId) {
  try {
    const { data: items } = await admin
      .from("fiqh_council_items")
      .select("session_number, session_date, title, type, source_name, source_url")
      .eq("source_id", sourceId)
      .not("session_number", "is", null);

    if (!items?.length) return;

    const groups = new Map();
    for (const item of items) {
      const key = `${item.session_number}:${item.session_date || "unknown"}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }

    for (const [key, group] of groups) {
      const [session_number, start_date] = key.split(":");
      const slug = `session-${session_number}-${(start_date !== "unknown" ? start_date : "draft").slice(0, 4)}`;
      await admin.from("fiqh_council_sessions").upsert({
        slug,
        session_title: `الدورة ${session_number} — المجمع الفقهي`,
        session_number,
        status: "completed",
        start_date: start_date !== "unknown" ? start_date : null,
        official_source_url: group[0]?.source_url || null,
        verification_status: "pending",
        publish_status: "needs_review",
        resolutions_count: group.filter((i) => i.type === "resolution").length,
        recommendations_count: group.filter((i) => i.type === "recommendation").length,
        fatwas_count: group.filter((i) => i.type === "fatwa").length,
        topics: [...new Set(group.map((i) => i.title).slice(0, 5))],
        updated_at: new Date().toISOString(),
      }, { onConflict: "slug" });

      await admin.from("fiqh_council_admin_alerts").insert({
        alert_type: "new_session",
        title: `جلسة جديدة بانتظار المراجعة: ${session_number}`,
        message: `${group.length} عنصر مرتبط`,
        severity: "info",
      });
    }
  } catch {
    /* optional — ignore if tables missing */
  }
}

/** Main entry — sync all official sources. Safe to call from cron. */
export async function runFiqhCouncilSync(options = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, skipped: true, reason: "no_supabase_admin", sources: [] };
  }

  const triggerType = options.triggerType || "cron";
  const sourceSlugs = options.sourceSlugs || null;

  const sources = sourceSlugs
    ? OFFICIAL_SOURCES.filter((s) => sourceSlugs.includes(s.slug))
    : OFFICIAL_SOURCES;

  const results = [];
  for (const source of sources) {
    try {
      const r = await syncSource(admin, source, triggerType);
      results.push(r);
    } catch (err) {
      log("source-error", { slug: source.slug, error: String(err?.message || err) });
      results.push({ ok: false, slug: source.slug, error: String(err?.message || err) });
    }
  }

  const ok = results.some((r) => r.ok) || results.every((r) => r.skipped);
  return { ok, at: new Date().toISOString(), sources: results };
}

export { OFFICIAL_SOURCES, validateItem, stripHtml, slugify };
