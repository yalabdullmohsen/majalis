import fs from 'node:fs';
import { buildExternalKey, normalizeArabic } from './utils.mjs';
import { normalizeRawItem } from './normalize.mjs';

function applyManifestFilter(items, filter) {
  if (!filter) return items;
  return items.filter((item) => {
    if (filter.speaker_prefix) {
      const speaker = item.sheikh_name ?? item.speaker_name ?? item.sheikh ?? '';
      return String(speaker).startsWith(filter.speaker_prefix);
    }
    return true;
  });
}

function mapManifestFields(item, source) {
  return {
    ...item,
    source_id: source.id,
    source_url: item.source_url ?? item.url ?? item.websiteUrl ?? item.registrationUrl ?? source.official_url ?? null,
    external_key: item.external_key ?? item.id ?? null,
    sheikh: item.sheikh ?? item.sheikh_name ?? item.speaker_name,
    mosque: item.mosque ?? item.venue ?? item.location,
    lesson_time: item.lesson_time ?? item.time,
    day_of_week: item.day_of_week ?? item.day,
  };
}

export async function fetchManifestSource(source) {
  const manifestPath = source.manifest_path;
  if (!manifestPath) {
    return { ok: false, items: [], error: 'missing_manifest_path' };
  }

  if (!fs.existsSync(manifestPath)) {
    return { ok: false, items: [], error: `missing_file:${manifestPath}` };
  }

  const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const items = Array.isArray(parsed) ? parsed : parsed.items ?? parsed.lessons ?? [];
  const filtered = applyManifestFilter(items, source.manifest_filter);
  const enriched = filtered.map((item) => mapManifestFields(item, source));

  return {
    ok: true,
    items: enriched,
    meta: { path: manifestPath, count: enriched.length, total: items.length },
  };
}

export async function fetchPendingOfficialSource(source) {
  return {
    ok: true,
    items: [],
    skipped: true,
    reason: 'pending_official_connector',
    message: source.notes ?? 'Awaiting official API/RSS integration',
  };
}

export async function fetchRssSource(source) {
  const feedUrl = source.rss_url ?? source.feed_url;
  if (!feedUrl) {
    return { ok: false, items: [], error: 'missing_rss_url' };
  }

  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'MajalisScientific/1.0 (+https://majlisilm.com)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { ok: false, items: [], error: `rss_http_${response.status}` };
    }

    const xml = await response.text();
    const items = parseSimpleRss(xml, source);
    return { ok: true, items, meta: { feed_url: feedUrl, count: items.length } };
  } catch (error) {
    return {
      ok: false,
      items: [],
      error: error instanceof Error ? error.message : 'rss_fetch_failed',
    };
  }
}

function parseSimpleRss(xml, source) {
  const entries = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

  for (const block of itemBlocks) {
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link');
    const description = extractTag(block, 'description');
    const pubDate = extractTag(block, 'pubDate');

    if (!title) continue;

    entries.push({
      title,
      description: stripHtml(description),
      source_url: link,
      date: pubDate ? new Date(pubDate).toISOString().slice(0, 10) : null,
      source_id: source.id,
      category: 'تأصيل',
      sheikh: source.name,
      location: source.name,
      city: 'الكويت',
      time: '—',
    });
  }

  return entries;
}

function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!match) return '';
  return decodeXml(match[1].trim());
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

function stripHtml(value) {
  return String(value ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchOfficialSiteSource(source) {
  const url = source.official_url;
  if (!url) {
    return { ok: false, items: [], error: 'missing_official_url' };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MajalisScientific/1.0 (+https://majlisilm.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { ok: false, items: [], error: `site_http_${response.status}` };
    }

    const html = await response.text();
    const items = extractEventsFromHtml(html, source);
    return {
      ok: true,
      items,
      meta: { url, count: items.length, method: 'html_heuristic' },
    };
  } catch (error) {
    return {
      ok: false,
      items: [],
      error: error instanceof Error ? error.message : 'site_fetch_failed',
    };
  }
}

function extractEventsFromHtml(html, source) {
  const items = [];
  const titleMatches = html.match(/<h[1-4][^>]*>([^<]{4,120})<\/h[1-4]>/gi) ?? [];

  for (const block of titleMatches.slice(0, 20)) {
    const title = block.replace(/<[^>]+>/g, '').trim();
    if (!title || title.length < 4) continue;
    if (/menu|nav|footer|header|login|subscribe/i.test(title)) continue;

    items.push({
      title,
      source_url: source.official_url,
      source_id: source.id,
      sheikh: source.name,
      location: source.name,
      city: 'الكويت',
      time: '—',
      category: 'درس',
      description: '',
    });
  }

  return items;
}

export async function fetchSource(source) {
  switch (source.type) {
    case 'manifest':
      return fetchManifestSource(source);
    case 'rss':
      return fetchRssSource(source);
    case 'official_site':
      return fetchOfficialSiteSource(source);
    case 'pending_official':
      return fetchPendingOfficialSource(source);
    default:
      return { ok: false, items: [], error: `unsupported_source_type:${source.type}` };
  }
}

export function normalizeFetchedItems(source, rawItems) {
  return rawItems.map((raw) => normalizeRawItem(source, raw));
}

export function dedupeDrafts(drafts, existingKeys = new Set()) {
  const seen = new Set();
  const unique = [];
  const duplicates = [];

  for (const draft of drafts) {
    const key = draft.external_key ?? buildExternalKey(draft.source_id, draft);
    if (seen.has(key) || existingKeys.has(key)) {
      duplicates.push({ draft, reason: existingKeys.has(key) ? 'existing' : 'batch' });
      continue;
    }
    seen.add(key);
    unique.push({ ...draft, external_key: key });
  }

  return { unique, duplicates };
}

export function fingerprintDraft(draft) {
  return buildExternalKey(draft.source_id, {
    title: normalizeArabic(draft.title),
    sheikh: normalizeArabic(draft.sheikh),
    date: draft.date,
    day: draft.day,
    time: draft.time,
    location: normalizeArabic(draft.location),
    city: normalizeArabic(draft.city),
  });
}

export function diffDraft(existing, incoming) {
  const fields = ['title', 'sheikh', 'date', 'day', 'time', 'location', 'city', 'description', 'source_url'];
  const changes = [];

  for (const field of fields) {
    const before = normalizeArabic(existing[field] ?? '');
    const after = normalizeArabic(incoming[field] ?? '');
    if (before !== after) {
      changes.push({ field, before: existing[field], after: incoming[field] });
    }
  }

  return changes;
}
