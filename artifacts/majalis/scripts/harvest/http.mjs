const USER_AGENT = "MajlisilmHarvest/1.0 (+https://majlisilm.com/sources; contact@majlisilm.com)";

export function harvestUserAgent() {
  return USER_AGENT;
}

export async function fetchText(url, { ifModifiedSince } = {}) {
  const headers = { "User-Agent": USER_AGENT, Accept: "text/html,application/xml,application/rss+xml,*/*" };
  if (ifModifiedSince) headers["If-Modified-Since"] = ifModifiedSince;
  const res = await fetch(url, { headers, redirect: "follow" });
  if (res.status === 304) return { status: 304, text: "", headers: res.headers };
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const text = await res.text();
  return { status: res.status, text, headers: res.headers };
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** @param {string} html */
export function extractOg(html, prop) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re);
  if (m) return m[1];
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
    "i",
  );
  return html.match(re2)?.[1] ?? null;
}

export function stripTags(html) {
  return String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
