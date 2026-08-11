/**
 * GET /api/content-delta — publishable content delta packs for offline sync.
 * Returns packs since ?since=ISO8601 / pack revisions so clients avoid full re-downloads.
 */
import { sendJson } from "../api/_http.mjs";
import { readFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

const SWR = "public, s-maxage=60, stale-while-revalidate=600, max-age=30";

function fileRevision(relPath) {
  const abs = join(ROOT, relPath);
  if (!existsSync(abs)) return null;
  const st = statSync(abs);
  const hash = createHash("sha1").update(`${st.mtimeMs}:${st.size}`).digest("hex").slice(0, 12);
  return { abs, mtime: st.mtime.toISOString(), revision: `r${hash}`, size: st.size };
}

function buildPacks(sinceIso) {
  const sinceMs = sinceIso ? Date.parse(sinceIso) : 0;
  const packs = [];

  const searchIdx = fileRevision("public/data/search/index.json");
  if (searchIdx && (!sinceMs || Date.parse(searchIdx.mtime) > sinceMs)) {
    packs.push({
      packId: "search-index",
      store: "meta",
      baseRevision: "",
      targetRevision: searchIdx.revision,
      ops: [
        {
          op: "set",
          key: "content-rev:search-index",
          value: {
            revision: searchIdx.revision,
            mtime: searchIdx.mtime,
            size: searchIdx.size,
            url: "/data/search/index.json",
          },
        },
      ],
      fetchedAt: new Date().toISOString(),
    });
  }

  const versionPath = existsSync(join(ROOT, "dist/version.json"))
    ? "dist/version.json"
    : existsSync(join(ROOT, "public/version.json"))
      ? "public/version.json"
      : null;
  if (versionPath) {
    const ver = fileRevision(versionPath);
    if (ver && (!sinceMs || Date.parse(ver.mtime) > sinceMs)) {
      let payload = { revision: ver.revision, mtime: ver.mtime };
      try {
        payload = { ...payload, ...JSON.parse(readFileSync(ver.abs, "utf8")) };
      } catch {
        /* ignore */
      }
      packs.push({
        packId: "app-version",
        store: "meta",
        baseRevision: "",
        targetRevision: ver.revision,
        ops: [{ op: "set", key: "content-rev:app-version", value: payload }],
        fetchedAt: new Date().toISOString(),
      });
    }
  }

  /* Lightweight surah list / chapters pointer for mushaf offline warm */
  const chapters = fileRevision("public/data/quran-v2/chapters.json");
  if (chapters && (!sinceMs || Date.parse(chapters.mtime) > sinceMs)) {
    packs.push({
      packId: "quran-chapters",
      store: "meta",
      baseRevision: "",
      targetRevision: chapters.revision,
      ops: [
        {
          op: "set",
          key: "content-rev:quran-chapters",
          value: {
            revision: chapters.revision,
            mtime: chapters.mtime,
            url: "/data/quran-v2/chapters.json",
          },
        },
      ],
      fetchedAt: new Date().toISOString(),
    });
  }

  return packs;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, message: "الطريقة غير مدعومة." });
    return;
  }

  const since = String(req.query?.since || req.query?.last_synced_at || "").trim() || null;
  const packs = buildPacks(since);

  sendJson(
    res,
    200,
    {
      ok: true,
      packs,
      generatedAt: new Date().toISOString(),
      since: since || null,
      protocol: "delta-v1",
    },
    { "Cache-Control": SWR },
  );
}
