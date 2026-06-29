import { fetchResource } from "../http/fetch-layer.mjs";
import { extractRssItems } from "../auto-content/auto-content-utils.mjs";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, "../../data/data-acquisition/fixtures");

/** Respect robots.txt best-effort — skip if disallowed */
export async function checkRobotsAllowed(url) {
  try {
    const u = new URL(url);
    const robotsUrl = `${u.origin}/robots.txt`;
    const res = await fetchResource(robotsUrl, { timeoutMs: 8000, useCache: true });
    if (!res.ok) return { allowed: true, reason: "no_robots" };
    const body = await res.text();
    const path = u.pathname || "/";
    const lines = body.split("\n");
    let active = false;
    for (const line of lines) {
      const t = line.trim();
      if (t.toLowerCase().startsWith("user-agent:")) {
        const agent = t.split(":")[1]?.trim();
        active = agent === "*" || /majlis|bot/i.test(agent);
      }
      if (active && t.toLowerCase().startsWith("disallow:")) {
        const dis = t.split(":").slice(1).join(":").trim();
        if (dis && path.startsWith(dis)) return { allowed: false, reason: "robots_disallow" };
      }
    }
    return { allowed: true };
  } catch {
    return { allowed: true, reason: "robots_check_failed" };
  }
}

export async function fetchSource(source) {
  const url = source.source_url;
  const fixturePath = join(FIXTURES, `${source.slug}.json`);
  if (existsSync(fixturePath)) {
    return { ok: true, body: readFileSync(fixturePath, "utf8"), contentType: "application/json", fromFixture: true };
  }

  const robots = await checkRobotsAllowed(url);
  if (!robots.allowed) {
    return { ok: false, error: "robots_disallowed", robots };
  }

  try {
    const res = await fetchResource(url, { timeoutMs: 20000, label: source.slug });
    if (!res.ok) return { ok: false, error: `http_${res.status}`, status: res.status };
    const body = await res.text();
    const ct = res.headers?.get?.("content-type") || "";
    return { ok: true, body, contentType: ct, status: res.status };
  } catch (err) {
    return { ok: false, error: err.message || "fetch_failed" };
  }
}

export function parseFetched(source, fetchResult) {
  if (!fetchResult.ok) return { ok: false, error: fetchResult.error, records: [] };

  const { body } = fetchResult;
  const type = source.source_type;

  if (type === "rss" || type === "journal" || type === "mosque") {
    const items = extractRssItems(body);
    return { ok: true, records: items.map((it) => ({ raw: it, format: "rss_item" })) };
  }

  if (type === "json" || body.trim().startsWith("{") || body.trim().startsWith("[")) {
    try {
      const data = JSON.parse(body);
      const arr = Array.isArray(data) ? data : data.items || data.records || [data];
      return { ok: true, records: arr.map((r) => ({ raw: r, format: "json" })) };
    } catch {
      return { ok: false, error: "invalid_json", records: [] };
    }
  }

  if (type === "csv") {
    return { ok: true, records: parseCsv(body).map((r) => ({ raw: r, format: "csv" })) };
  }

  if (type === "web" || type === "official" || type === "university") {
    return { ok: true, records: parseHtmlLinks(body, source.source_url).map((r) => ({ raw: r, format: "html" })) };
  }

  if (type === "pdf") {
    return { ok: true, records: [{ raw: { title: source.name, url: source.source_url, text: body.slice(0, 5000) }, format: "pdf" }] };
  }

  if (type === "youtube_playlist" || type === "telegram" || type === "instagram" || type === "google_drive" || type === "excel") {
    return { ok: true, records: [{ raw: { title: source.name, url: source.source_url, note: "requires_api_or_fixture" }, format: type }] };
  }

  return { ok: true, records: [{ raw: { title: source.name, body: body.slice(0, 3000) }, format: "text" }] };
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const row = {};
    header.forEach((h, i) => { row[h] = cols[i] || ""; });
    return row;
  });
}

function parseHtmlLinks(html, baseUrl) {
  const links = [];
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) && links.length < 30) {
    const href = m[1];
    const title = m[2].replace(/<[^>]+>/g, "").trim();
    if (!title || title.length < 5) continue;
    try {
      const url = new URL(href, baseUrl).href;
      links.push({ title, url, description: "" });
    } catch { /* skip */ }
  }
  return links;
}
