import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sendJson } from "../api/_http.mjs";
import { getEnvStatus } from "../env-config.mjs";
import { validateAdminAuth } from "../env-config.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "../../data/feature-registry.json");

const TABLE_CHECKS = [
  "qa_categories",
  "qa_questions",
  "lessons",
  "trusted_lesson_sources",
  "lesson_import_drafts",
  "automation_runs",
  "mke_runs",
  "mke_decisions",
  "kg_nodes",
  "kg_edges",
  "sharia_rulings",
];

async function probeUrl(base, pathname) {
  try {
    const res = await fetch(`${base}${pathname}`, { redirect: "follow" });
    const text = await res.text();
    return {
      status: res.status,
      ok: res.status === 200 && !text.includes("تعذر عرض هذه الصفحة"),
    };
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

async function probeApi(base, pathname, method = "GET", body) {
  try {
    const res = await fetch(`${base}${pathname}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* ignore */
    }
    return { status: res.status, ok: res.status < 400 && json?.ok !== false, detail: json || text.slice(0, 120) };
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

export default async function handler(req, res) {
  if (!validateAdminAuth(req)) {
    return sendJson(res, 401, { ok: false, error: "Unauthorized" });
  }

  const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
  const base = registry.productionUrl || "https://www.majlisilm.com";
  const env = getEnvStatus();

  const tables = {};
  try {
    const admin = getSupabaseAdmin();
    for (const table of TABLE_CHECKS) {
      const { error } = await admin.from(table).select("*").limit(0);
      tables[table] = error ? error.message : "ok";
    }
  } catch (err) {
    tables._error = err.message;
  }

  const routeChecks = {};
  for (const f of registry.features) {
    for (const r of f.routes || []) {
      if (!routeChecks[r]) routeChecks[r] = await probeUrl(base, r);
    }
  }

  const apiChecks = {
    healthz: await probeApi(base, "/api/healthz"),
    assistantHealth: await probeApi(base, "/api/assistant/health"),
    assistantPost: await probeApi(base, "/api/assistant", "POST", { question: "ما حكم الوضوء؟" }),
    knowledgeSearch: await probeApi(base, "/api/knowledge-search?q=صلاة"),
  };

  let bundleMarker = null;
  try {
    const html = await fetch(`${base}/`).then((r) => r.text());
    const m = html.match(/\/assets\/index-[^"]+\.js/);
    if (m) {
      const js = await fetch(`${base}${m[0]}`).then((r) => r.text());
      bundleMarker = {
        hasQuranV2: js.includes("quran-v2"),
        hasLessonsV2: js.includes("lessons-page-v2"),
        hasQaV2: js.includes("qa-page-v2"),
        hasMousou3a: js.includes("موسوعة قصص"),
        hasQuranStoriesLabel: js.includes("قصص القرآن"),
        vercelPr: js.match(/VITE_VERCEL_GIT_PULL_REQUEST_ID:"(\d+)"/)?.[1] || null,
      };
    }
  } catch {
    /* ignore */
  }

  return sendJson(res, 200, {
    ok: true,
    at: new Date().toISOString(),
    productionUrl: base,
    env,
    tables,
    routeChecks,
    apiChecks,
    bundleMarker,
    features: registry.features,
  });
}
