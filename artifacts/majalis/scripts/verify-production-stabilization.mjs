#!/usr/bin/env node
/**
 * Production stabilization audit — crons, content engines, connectors, lessons.
 *
 * Usage:
 *   node scripts/verify-production-stabilization.mjs
 *   node scripts/verify-production-stabilization.mjs --base=https://www.majlisilm.com
 */
const BASE = process.argv.find((a) => a.startsWith("--base="))?.split("=")[1] || "https://www.majlisilm.com";

async function api(path, { method = "GET", timeoutMs = 65000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(new URL(path, BASE), {
      method,
      headers: { "x-vercel-cron": "1", "content-type": "application/json" },
      signal: controller.signal,
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text.slice(0, 500) };
    }
    return { status: res.status, ok: res.ok, json, durationMs: null };
  } catch (err) {
    return { status: 0, ok: false, json: { error: err.message }, timeout: err.name === "AbortError" };
  } finally {
    clearTimeout(timer);
  }
}

const CRONS = [
  { name: "content-engines", path: "/api/cron/content-engines", maxMs: 60000 },
  { name: "content-engines-drain", path: "/api/cron/content-engines-drain", maxMs: 60000 },
  { name: "ake-queue-drain", path: "/api/cron/ake-queue-drain", maxMs: 60000 },
  { name: "ake-monitoring-eval", path: "/api/cron/ake-monitoring-eval", maxMs: 30000 },
  { name: "apply-migrations", path: "/api/cron/apply-migrations?scope=ake-v2", maxMs: 30000 },
];

const ENGINES = [
  "articles",
  "backfill",
  "benefits",
  "quiz",
  "lesson-notes",
  "instagram",
];

function grade(entry) {
  if (entry.status === 504 || entry.json?.error === "handler_timeout" || entry.timeout) return "FAILED";
  if (entry.status >= 500 || entry.status === 0) return "FAILED";
  if (entry.status === 401) return "WARNING";
  if (entry.status >= 400) return "WARNING";
  return "PASS";
}

async function main() {
  const report = {
    ok: false,
    base: BASE,
    at: new Date().toISOString(),
    crons: [],
    engines: [],
    lessons: null,
    publicConfig: null,
    summary: { pass: 0, warning: 0, failed: 0 },
  };

  for (const cron of CRONS) {
    const started = Date.now();
    const result = await api(cron.path, { timeoutMs: cron.maxMs });
    result.durationMs = Date.now() - started;
    const status = grade(result);
    report.crons.push({ ...cron, status, http: result.status, durationMs: result.durationMs, body: result.json });
    report.summary[status.toLowerCase()]++;
  }

  for (const engine of ENGINES) {
    const started = Date.now();
    const result = await api(`/api/cron/content-engines?engine=${engine}`, { timeoutMs: 65000 });
    result.durationMs = Date.now() - started;
    const status = grade(result);
    report.engines.push({
      engine,
      status,
      http: result.status,
      durationMs: result.durationMs,
      published: result.json?.stats?.items_published,
      error: result.json?.error,
    });
    report.summary[status.toLowerCase()]++;
  }

  const pub = await api("/api/public-config", { timeoutMs: 10000 });
  report.publicConfig = { status: pub.status, ok: pub.json?.ok, auth: pub.json?.auth };

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  if (supabaseUrl && anon) {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/lessons?status=eq.approved&select=id,title,external_key&order=created_at.desc&limit=20`,
      { headers: { apikey: anon, Authorization: `Bearer ${anon}` } },
    );
    report.lessons = await res.json();
  }

  const realLessons = Array.isArray(report.lessons)
    ? report.lessons.filter((l) => String(l.external_key || "").startsWith("kuwait-lessons:"))
    : [];

  report.realLessonCount = realLessons.length;
  report.has504 = [...report.crons, ...report.engines].some((e) => e.http === 504 || e.error === "handler_timeout");
  report.ok = !report.has504 && report.summary.failed === 0 && realLessons.length > 0;

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
