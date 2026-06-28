/**
 * Source fetch — RSS, Atom, JSON API, internal Supabase with failover.
 */
import { extractRssItems } from "../auto-content/auto-content-utils.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { PERFORMANCE } from "../majlis-knowledge-engine/config.mjs";
import { checkSourceHealth, pickWorkingEndpoint, HEALTH_STATUS } from "./source-health.mjs";
import { logStructured } from "./monitoring.mjs";

const FETCH_TIMEOUT = PERFORMANCE.fetchTimeoutMs || 20000;

async function fetchUrl(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs || FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "MajlisIlm-AKP/2.0 (+https://www.majlisilm.com)",
        Accept: opts.accept || "application/rss+xml, application/json, application/xml, text/xml, */*",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapRssItem(item, contentType) {
  const body = stripHtml(item.content || item.description || item.summary || "");
  const base = {
    title: item.title || "",
    body,
    text: body,
    summary: item.summary || body.slice(0, 300),
    source_url: item.link || item.url,
    link: item.link || item.url,
    source_name: item.source || null,
    category: item.category || null,
    published_at: item.pubDate || item.published || null,
  };

  switch (contentType) {
    case "benefits":
      return { text: body || item.title, author_name: item.author, category: item.category || "فوائد" };
    case "questions":
      return {
        question: item.title,
        answer: body,
        category_name: item.category || "الفقه",
        reference: item.link,
      };
    case "hadith":
      return {
        text: body || item.title,
        title: item.title,
        source_name: item.source || "سنة",
        source_url: item.link,
        narrator: item.author || null,
        grade: item.category || null,
        explanation: body.length > 100 ? body.slice(0, 200) : null,
      };
    case "rulings":
      return {
        title: item.title,
        body,
        summary: body.slice(0, 300),
        category: item.category || "فقه عام",
      };
    case "stories":
      return {
        title: item.title,
        body,
        topic: item.category,
        summary: body.slice(0, 200),
      };
    case "articles":
      return {
        title: item.title,
        content: body,
        author: item.author,
        category: item.category || "مقالات",
      };
    default:
      return base;
  }
}

function parseHadithJson(raw, source, limit = 25) {
  const json = JSON.parse(raw);
  const hadiths = json.hadiths || {};
  const keys = Object.keys(hadiths).sort((a, b) => Number(a) - Number(b));
  const offset = Number(source.metadata?.cursor_offset || source.metadata?.offset || 0);
  const slice = keys.slice(offset, offset + limit);
  const collection = source.metadata?.collection || json.metadata?.name || "hadith";

  return slice.map((k) => {
    const h = hadiths[k];
    const text = Array.isArray(h) ? h[0] : String(h);
    return {
      text,
      title: `حديث ${k}`,
      source_name: collection,
      source_url: `${source.source_url}#${k}`,
      collection,
      hadith_number: k,
      grade: "صحيح",
    };
  });
}

function parseQuranAyahJson(raw, source, limit = 20) {
  const json = JSON.parse(raw);
  const surahCursor = Number(source.metadata?.quran_surah_cursor || 1);
  const ayahs = json.data?.surahs?.[0]?.ayahs || json.data?.ayahs || [];
  const surahName = json.data?.surahs?.[0]?.name || json.data?.name || `سورة ${surahCursor}`;

  return ayahs.slice(0, limit).map((a) => ({
    text: a.text,
    author_name: "القرآن الكريم",
    category: surahName,
    source_url: `https://quran.com/${surahCursor}/${a.numberInSurah || a.number}`,
    title: `${surahName} — ${a.numberInSurah || a.number}`,
  }));
}

async function fetchInternalFawaid(source, limit = 30) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  const offset = Number(source.metadata?.offset || 0);
  const { data } = await admin
    .from("fawaid")
    .select("id, text, author_name, category, source")
    .eq("status", "approved")
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);
  return (data || []).map((row) => ({
    text: row.text,
    author_name: row.author_name,
    category: row.category,
    source_name: row.source || source.name,
    source_url: `fawaid:${row.id}`,
    external_key: row.id,
  }));
}

async function fetchInternalQa(source, limit = 30) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  const offset = Number(source.metadata?.offset || 0);
  const { data } = await admin
    .from("qa_questions")
    .select("id, question, answer, reference, qa_categories(name)")
    .eq("status", "published")
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);
  return (data || []).map((row) => ({
    question: row.question,
    answer: row.answer,
    category_name: row.qa_categories?.name || "عام",
    reference: row.reference,
    source_url: `qa:${row.id}`,
    external_key: row.id,
  }));
}

async function fetchInternalRulings(source, limit = 20) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  const offset = Number(source.metadata?.offset || 0);
  const { data } = await admin
    .from("sharia_rulings")
    .select("id, title, body, summary, category")
    .eq("status", "approved")
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);
  return (data || []).map((row) => ({
    title: row.title,
    body: row.body,
    summary: row.summary || row.body?.slice(0, 300),
    category: row.category || "فقه عام",
    source_url: `ruling:${row.id}`,
    external_key: row.external_key || row.id,
  }));
}

async function fetchWithFailover(source) {
  const health = await checkSourceHealth(source);
  const url = pickWorkingEndpoint(source, health);
  const endpoints = [url, ...(source.fallback_urls || []), source.source_url].filter(Boolean);
  const unique = [...new Set(endpoints)];

  let lastError = null;
  for (const endpoint of unique) {
    try {
      const body = await fetchUrl(endpoint);
      return { ok: true, body, url: endpoint, health: health.best };
    } catch (err) {
      lastError = err;
      await logStructured({
        level: "warn",
        component: "fetch",
        event: "endpoint_failed",
        message: String(err.message || err),
        metadata: { source: source.slug, endpoint },
      });
    }
  }
  return { ok: false, error: String(lastError?.message || "all_endpoints_failed"), health: health.best };
}

export async function fetchFromSource(source, contentType) {
  const started = Date.now();
  try {
    let items = [];
    let usedUrl = source.source_url;

    if (source.parser === "internal_fawaid" || source.source_type === "internal" && contentType === "benefits") {
      items = await fetchInternalFawaid(source);
    } else if (source.parser === "internal_qa" || source.source_type === "internal" && contentType === "questions") {
      items = await fetchInternalQa(source);
    } else if (source.parser === "internal_rulings" || source.source_type === "internal" && contentType === "rulings") {
      items = await fetchInternalRulings(source);
    } else if (source.parser === "hadith_json") {
      const result = await fetchWithFailover(source);
      if (!result.ok) throw new Error(result.error);
      usedUrl = result.url;
      items = parseHadithJson(result.body, source);
    } else if (source.parser === "quran_ayah_json") {
      const surah = Number(source.metadata?.quran_surah_cursor || 1);
      const surahUrl = `https://api.alquran.cloud/v1/surah/${surah}/quran-uthmani`;
      const body = await fetchUrl(surahUrl);
      items = parseQuranAyahJson(body, source);
      usedUrl = surahUrl;
    } else if (source.parser === "rss" || source.source_type === "rss") {
      const result = await fetchWithFailover(source);
      if (!result.ok) throw new Error(result.error);
      usedUrl = result.url;
      const rssItems = extractRssItems(result.body);
      items = (rssItems || []).map((item) => mapRssItem(item, contentType));
    } else {
      const result = await fetchWithFailover(source);
      if (!result.ok) throw new Error(result.error);
      usedUrl = result.url;
      items = [{ title: source.name, body: stripHtml(result.body).slice(0, 2000), text: stripHtml(result.body).slice(0, 2000) }];
    }

    await logStructured({
      level: "info",
      component: "fetch",
      event: "source_fetched",
      pipeline: contentType,
      durationMs: Date.now() - started,
      metadata: { source: source.slug, items: items.length, url: usedUrl },
    });

    return { ok: true, items, durationMs: Date.now() - started, url: usedUrl };
  } catch (err) {
    await logStructured({
      level: "error",
      component: "fetch",
      event: "fetch_failed",
      pipeline: contentType,
      message: String(err.message || err),
      metadata: { source: source.slug, reason: err.message },
    });
    return { ok: false, error: String(err.message || err), items: [], reason: err.message };
  }
}

export async function fetchAllDueSources(contentType = null) {
  const { listContentSources, markSourceFetch } = await import("./sources.mjs");
  const sources = await listContentSources({ activeOnly: true, contentType });
  const now = Date.now();
  const results = [];

  for (const source of sources) {
    const intervalMs = (source.fetch_interval_hours || 1) * 3600_000;
    const lastFetch = source.last_fetch_at ? new Date(source.last_fetch_at).getTime() : 0;
    if (lastFetch && now - lastFetch < intervalMs) continue;

    const types = contentType ? [contentType] : source.content_types;
    for (const type of types) {
      const fetchResult = await fetchFromSource(source, type);
      await markSourceFetch(source.id, { ok: fetchResult.ok, error: fetchResult.error });
      results.push({ source: source.slug, contentType: type, ...fetchResult });
      if (!fetchResult.ok) {
        await logStructured({
          level: "warn",
          component: "fetch",
          event: "source_skipped",
          pipeline: type,
          metadata: { source: source.slug, error: fetchResult.error },
        });
      }
    }
  }

  const succeeded = results.filter((r) => r.ok).length;
  return { ok: succeeded > 0 || results.length === 0, results, sourcesFetched: results.length, succeeded, failed: results.length - succeeded };
}

export { HEALTH_STATUS };
