/**
 * GET /api/search-autocomplete?q=… — grouped autocomplete for edge caches.
 * Prefer client `runAutocomplete` for <100ms; this endpoint mirrors groups for SSR/tools.
 */
import { sendJson } from "../api/_http.mjs";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

const GROUP_LABELS = {
  quran: "آيات قرآنية",
  hadith: "أحاديث نبوية",
  books: "كتب وفقه",
  scholars: "ترجمة علماء",
};

const KIND_TO_GROUP = {
  surah: "quran",
  quran: "quran",
  ayah: "quran",
  page: "quran",
  tafsir: "quran",
  hadith: "hadith",
  book: "books",
  library: "books",
  lesson: "books",
  fatwa: "books",
  qa: "books",
  fiqh: "books",
  ruling: "books",
  scholar: "scholars",
  sheikh: "scholars",
  person: "scholars",
};

function normalizeAr(s) {
  return String(s || "")
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function loadIndexDocs() {
  const path = join(ROOT, "public/data/search/index.json");
  if (!existsSync(path)) return [];
  try {
    const raw = JSON.parse(readFileSync(path, "utf8"));
    const docs = Array.isArray(raw) ? raw : raw.docs || raw.items || [];
    return docs.map((d) => ({
      id: String(d.id || d.href || ""),
      kind: String(d.kind || d.type || "app"),
      titleAr: String(d.titleAr || d.title || ""),
      href: String(d.href || d.url || ""),
      meta: d.meta || d.summary || "",
      norm: normalizeAr(d.titleAr || d.title || d.norm || ""),
    }));
  } catch {
    return [];
  }
}

let cachedDocs = null;
function docs() {
  if (!cachedDocs) cachedDocs = loadIndexDocs();
  return cachedDocs;
}

const SWR =
  "public, s-maxage=60, stale-while-revalidate=300, max-age=30";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  const t0 = Date.now();
  const q = String(req.query?.q || req.query?.query || "").trim();
  if (!q) {
    sendJson(res, 400, { ok: false, error: "query_required" }, { "Cache-Control": SWR });
    return;
  }

  const nq = normalizeAr(q);
  const perGroup = Math.min(8, Math.max(1, Number(req.query?.perGroup || 5)));
  const buckets = { quran: [], hadith: [], books: [], scholars: [] };

  for (const d of docs()) {
    if (!d.norm || !d.href || !d.titleAr) continue;
    if (!d.norm.includes(nq) && !nq.includes(d.norm.slice(0, Math.min(nq.length, 12)))) {
      continue;
    }
    const gid = KIND_TO_GROUP[d.kind];
    if (!gid || buckets[gid].length >= perGroup) continue;
    buckets[gid].push({
      id: d.id || d.href,
      kind: d.kind,
      title: d.titleAr,
      href: d.href,
      summary: d.meta || undefined,
    });
  }

  const order = ["quran", "hadith", "books", "scholars"];
  const groups = order
    .filter((id) => buckets[id].length > 0)
    .map((id) => ({
      id,
      label: GROUP_LABELS[id],
      items: buckets[id],
    }));

  sendJson(
    res,
    200,
    {
      ok: true,
      query: q,
      groups,
      responseMs: Date.now() - t0,
      source: "server-index",
    },
    { "Cache-Control": SWR },
  );
}
