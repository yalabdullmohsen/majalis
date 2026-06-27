/**
 * Source fetch — RSS and website parsers.
 */
import { extractRssItems } from "../auto-content/auto-content-utils.mjs";
import { PERFORMANCE } from "../majlis-knowledge-engine/config.mjs";
import { logStructured } from "./monitoring.mjs";

const FETCH_TIMEOUT = PERFORMANCE.fetchTimeoutMs || 20000;

async function fetchUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "MajlisIlm-AKP/2.0 (+https://www.majlisilm.com)" },
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

export async function fetchFromSource(source, contentType) {
  const started = Date.now();
  try {
    let items = [];
    if (source.parser === "rss" || source.source_type === "rss") {
      const xml = await fetchUrl(source.source_url);
      const rssItems = await extractRssItems(xml, source.source_url);
      items = (rssItems || []).map((item) => mapRssItem(item, contentType));
    } else {
      const html = await fetchUrl(source.source_url);
      items = [{
        title: source.name,
        body: stripHtml(html).slice(0, 2000),
        text: stripHtml(html).slice(0, 2000),
      }];
    }

    await logStructured({
      level: "info",
      component: "fetch",
      event: "source_fetched",
      pipeline: contentType,
      durationMs: Date.now() - started,
      metadata: { source: source.slug, items: items.length },
    });

    return { ok: true, items, durationMs: Date.now() - started };
  } catch (err) {
    await logStructured({
      level: "error",
      component: "fetch",
      event: "fetch_failed",
      pipeline: contentType,
      message: String(err.message || err),
      metadata: { source: source.slug },
    });
    return { ok: false, error: String(err.message || err), items: [] };
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
    }
  }

  return { ok: true, results, sourcesFetched: results.length };
}
