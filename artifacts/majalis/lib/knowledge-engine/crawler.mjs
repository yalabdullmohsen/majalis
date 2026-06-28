/**
 * Crawler — fetches new content from RSS, manifests, and internal seeds.
 */

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../data");

function log(scope, data) {
  console.info(`[knowledge-crawler:${scope}]`, JSON.stringify({ at: new Date().toISOString(), ...data }));
}

function stripHtml(text) {
  return String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function hashContent(parts) {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32);
}

function parseRssItems(xml) {
  const items = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const block of itemBlocks) {
    const title = stripHtml(block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
    const link = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim()
      || block.match(/<link[^>]+\/>/i)?.[0]?.match(/href="([^"]+)"/)?.[1]
      || "";
    const desc = stripHtml(
      block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]
      || block.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i)?.[1]
      || "",
    );
    const guid = block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)?.[1]?.trim() || link || title;
    const pubDate = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || "";
    if (title && (link || desc)) {
      items.push({ external_id: hashContent([guid]), title, link, description: desc, pubDate });
    }
  }
  return items;
}

async function fetchRss(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "MajlisIlm-KnowledgeBot/1.0 (+https://majlisilm.com)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    return parseRssItems(xml);
  } finally {
    clearTimeout(timer);
  }
}

async function loadManifest(filename) {
  try {
    const raw = await readFile(resolve(DATA_DIR, filename), "utf8");
    const json = JSON.parse(raw);
    return Array.isArray(json.items) ? json.items : [];
  } catch (err) {
    log("manifest-miss", { file: filename, error: String(err.message || err) });
    return [];
  }
}

async function loadInternalSeeds() {
  const seeds = [];
  const seedFiles = [
    { file: "../src/lib/fawaid-curated-seed.ts", kind: "fawaid", parse: parseTsSeedArray },
    { file: "../src/lib/library-seed.ts", kind: "book", parse: parseTsSeedArray },
    { file: "../src/lib/miracles-seed.ts", kind: "miracle", parse: parseTsSeedArray },
    { file: "../src/lib/sheikhs-seed.ts", kind: "sheikh", parse: parseTsSeedArray },
  ];

  for (const { file, kind, parse } of seedFiles) {
    try {
      const raw = await readFile(resolve(__dirname, file), "utf8");
      const items = parse(raw, kind);
      seeds.push(...items);
    } catch {
      /* seed optional */
    }
  }
  return seeds;
}

function parseTsSeedArray(raw, kind) {
  const items = [];
  const idMatches = raw.matchAll(/id:\s*["'`]([^"'`]+)["'`]/g);
  const titleMatches = raw.matchAll(/title:\s*["'`]([^"'`]+)["'`]/g);
  const textMatches = raw.matchAll(/text:\s*["'`]([^"'`]+)["'`]/g);
  const descMatches = raw.matchAll(/description:\s*["'`]([^"'`]+)["'`]/g);
  const nameMatches = raw.matchAll(/name:\s*["'`]([^"'`]+)["'`]/g);

  const ids = [...idMatches].map((m) => m[1]);
  const titles = [...titleMatches].map((m) => m[1]);
  const texts = [...textMatches].map((m) => m[1]);
  const descs = [...descMatches].map((m) => m[1]);
  const names = [...nameMatches].map((m) => m[1]);

  for (let i = 0; i < ids.length; i++) {
    const title = titles[i] || texts[i] || names[i] || descs[i];
    if (!title) continue;
    items.push({
      external_id: ids[i],
      title,
      description: descs[i] || texts[i] || "",
      link: `https://majlisilm.com/${kind}`,
      content_kind: kind,
      source_attribution: "المجلس العلمي — بذور موثقة",
    });
  }
  return items;
}

async function loadKuwaitLessonsImport() {
  try {
    const raw = await readFile(resolve(DATA_DIR, "import/02-kuwait-lessons.json"), "utf8");
    const rows = JSON.parse(raw);
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    log("kuwait-lessons-import-miss", { error: String(err.message || err) });
    return [];
  }
}

function kuwaitLessonExternalId(row) {
  return hashContent([
    "kuwait-lessons",
    row.title,
    row.mosque,
    row.day_of_week,
    row.lesson_time,
    row.speaker_name || row.sheikh_name,
  ]);
}

export async function crawlSource(source, existingHashes = new Set()) {
  const results = [];
  const errors = [];

  if (source.seed_only) {
    if (source.slug === "kuwait-lessons") {
      const rows = await loadKuwaitLessonsImport();
      const now = new Date().toISOString();
      for (const row of rows) {
        if (!row?.title) continue;
        const external_id = `kuwait-lessons:${kuwaitLessonExternalId(row)}`;
        const h = hashContent([external_id, row.title]);
        if (existingHashes.has(h)) continue;
        results.push({
          external_id,
          content_kind: row.is_course ? "course" : "lesson",
          raw_title: row.title,
          raw_body: row.description || row.schedule || "",
          raw_url: row.source_url || `https://www.majlisilm.com/lessons/${external_id}`,
          source_attribution: row.speaker_name || row.sheikh_name || source.name,
          source_url: source.official_url,
          content_hash: h,
          published_at: now,
          raw_payload: {
            ...row,
            speaker_name: row.speaker_name || row.sheikh_name,
            day_of_week: row.day_of_week,
            lesson_time: row.lesson_time,
            mosque: row.mosque,
            city: row.city,
            region: row.region,
            category: row.category,
            _source: "kuwait-lessons-import",
          },
        });
      }
      return { items: results, errors };
    }

    const seeds = await loadInternalSeeds();
    for (const item of seeds) {
      const h = hashContent([item.external_id, item.title]);
      if (existingHashes.has(h)) continue;
      results.push({
        external_id: item.external_id,
        content_kind: item.content_kind || source.allowed_kinds?.[0] || "article",
        raw_title: item.title,
        raw_body: item.description || "",
        raw_url: item.link,
        source_attribution: item.source_attribution || source.name,
        source_url: source.official_url,
        content_hash: h,
      });
    }
    return { items: results, errors };
  }

  if (source.manifest_file) {
    const manifest = await loadManifest(source.manifest_file);
    for (const raw of manifest) {
      const h = hashContent([raw.external_id, raw.title, raw.source_url]);
      if (existingHashes.has(h)) continue;
      if (!raw.source_url || !raw.title) continue;
      results.push({
        external_id: raw.external_id,
        content_kind: raw.type === "resolution" ? "fiqh_decision" : "fiqh_decision",
        raw_title: raw.title,
        raw_body: stripHtml(raw.summary || raw.content || ""),
        raw_url: raw.source_url,
        source_attribution: raw.source_name || source.name,
        source_url: raw.source_url,
        content_hash: h,
        raw_payload: raw,
      });
    }
  }

  if (source.rss_url) {
    try {
      const rssItems = await fetchRss(source.rss_url);
      for (const item of rssItems) {
        const h = hashContent([item.external_id, item.title, item.link]);
        if (existingHashes.has(h)) continue;
        results.push({
          external_id: item.external_id,
          content_kind: source.allowed_kinds?.includes("news") ? "news" : "article",
          raw_title: item.title,
          raw_body: item.description,
          raw_url: item.link,
          source_attribution: source.name,
          source_url: item.link,
          content_hash: h,
          raw_payload: { pubDate: item.pubDate },
        });
      }
    } catch (err) {
      errors.push({ source: source.slug, error: String(err.message || err) });
      log("rss-fail", { slug: source.slug, error: String(err.message || err) });
    }
  }

  return { items: results, errors };
}

export async function crawlAllSources(sources, existingHashes = new Set()) {
  const allItems = [];
  const allErrors = [];
  for (const source of sources) {
    const { items, errors } = await crawlSource(source, existingHashes);
    allItems.push(...items.map((i) => ({ ...i, source_slug: source.slug })));
    allErrors.push(...errors);
  }
  return { items: allItems, errors: allErrors };
}

export { hashContent, stripHtml };
