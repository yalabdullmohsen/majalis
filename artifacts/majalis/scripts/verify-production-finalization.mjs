#!/usr/bin/env node
/**
 * Production finalization audit — real publishing, Instagram, crons, search.
 *
 * Usage:
 *   node scripts/verify-production-finalization.mjs
 *   node scripts/verify-production-finalization.mjs --archive-verification
 */
const BASE = process.argv.find((a) => a.startsWith("--base="))?.split("=")[1] || "https://www.majlisilm.com";
const ARCHIVE = process.argv.includes("--archive-verification");

async function api(path, opts = {}) {
  const timeoutMs = opts.timeoutMs || 65000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(new URL(path, BASE), {
      method: opts.method || "GET",
      headers: { "x-vercel-cron": "1", "content-type": "application/json" },
      signal: controller.signal,
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text.slice(0, 400) };
    }
    return { status: res.status, ok: res.ok, json };
  } catch (err) {
    return { status: 0, ok: false, json: { error: err.message, timeout: err.name === "AbortError" } };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const report = {
    at: new Date().toISOString(),
    base: BASE,
    ok: false,
    crons: {},
    instagram: null,
    lessons: { approved: [], real: [], verification: [] },
    search: null,
    publishing: {},
    archive: null,
    errors: [],
  };

  const cronPaths = [
    ["autoKnowledgeSync", "/api/cron/auto-knowledge-sync?connector=kuwait-lessons&force=1"],
    ["queueDrain", "/api/cron/ake-queue-drain"],
    ["contentEngines", "/api/cron/content-engines"],
    ["contentEnginesDrain", "/api/cron/content-engines-drain"],
    ["connectorHealth", "/api/cron/connector-health"],
    ["monitoringEval", "/api/cron/ake-monitoring-eval"],
    ["dailyReport", "/api/cron/ake-daily-report"],
    ["systemHealth", "/api/cron/system-health"],
  ];

  for (const [name, path] of cronPaths) {
    const t0 = Date.now();
    const r = await api(path, { timeoutMs: name === "autoKnowledgeSync" ? 70000 : 60000 });
    report.crons[name] = {
      http: r.status,
      ms: Date.now() - t0,
      ok: r.status === 200 && r.json?.error !== "handler_timeout",
      error: r.json?.error,
      published: r.json?.autoKnowledgeEngine?.published ?? r.json?.published,
    };
    if (!report.crons[name].ok) report.errors.push({ area: "cron", name, ...report.crons[name] });
  }

  const health = await api("/api/cron/system-health", { timeoutMs: 30000 });
  report.instagram = health.json?.instagram || null;
  report.publishing = {
    itemsNewToday: health.json?.metrics?.itemsNewToday,
    itemsPublishedToday: health.json?.metrics?.itemsPublishedToday,
    connectorsActive: health.json?.metrics?.connectorsActive,
    queue: health.json?.queue,
  };

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  if (supabaseUrl && anon) {
    const headers = { apikey: anon, Authorization: `Bearer ${anon}` };
    const res = await fetch(
      `${supabaseUrl}/rest/v1/lessons?select=id,title,external_key,status,speaker_name,mosque&order=created_at.desc&limit=20`,
      { headers },
    );
    const rows = await res.json();
    if (Array.isArray(rows)) {
      report.lessons.approved = rows.filter((l) => l.status === "approved");
      report.lessons.real = rows.filter((l) => String(l.external_key || "").startsWith("kuwait-lessons:"));
      report.lessons.verification = rows.filter((l) => String(l.external_key || "").startsWith("verify-production-lesson:"));
    }

    for (const table of ["library_items", "fawaid", "fatwas", "scientific_miracles", "platform_updates"]) {
      try {
        const c = await fetch(
          `${supabaseUrl}/rest/v1/${table}?select=id&status=eq.approved&limit=1`,
          { headers },
        );
        const head = c.headers.get("content-range");
        report.publishing[table] = head || "unknown";
      } catch {
        report.publishing[table] = "error";
      }
    }
  }

  const searchQ = encodeURIComponent("تفسير");
  const search = await api(`/api/knowledge-search?q=${searchQ}&limit=5`, { timeoutMs: 15000 });
  report.search = {
    http: search.status,
    ok: search.ok,
    hits: search.json?.results?.length ?? search.json?.items?.length ?? 0,
    sample: (search.json?.results || search.json?.items || []).slice(0, 3),
  };

  if (ARCHIVE) {
    report.archive = (await api("/api/cron/platform-bootstrap?action=archive-verification")).json;
  }

  const sitemap = await api("/sitemap.xml", { timeoutMs: 15000 });
  report.seo = { sitemap: sitemap.status === 200, sitemapBytes: String(sitemap.json?.raw || "").length || null };

  const has504 = Object.values(report.crons).some((c) => c.http === 504 || c.error === "handler_timeout");
  const hasReal = report.lessons.real.length > 0;
  const verificationHidden =
    report.lessons.verification.length === 0 ||
    report.lessons.verification.every((l) => l.status !== "approved");

  report.ok = !has504 && hasReal && (ARCHIVE ? report.archive?.ok : true);
  report.summary = {
    has504,
    realLessonCount: report.lessons.real.length,
    verificationVisible: report.lessons.verification.filter((l) => l.status === "approved").length,
    instagramConfigured: Boolean(report.instagram?.configured),
    instagramConnected: Boolean(report.instagram?.ok),
    instagramFailureReason: report.instagram?.failureReason || null,
    searchHits: report.search.hits,
  };

  if (!hasReal) report.errors.push({ area: "publishing", error: "no_real_kuwait_lessons" });

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
