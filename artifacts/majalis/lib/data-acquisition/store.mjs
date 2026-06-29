import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { SEED_SOURCES } from "./sources-seed.mjs";
import { randomUUID } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data/data-acquisition");

function ensureDir() {
  mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(name, fallback) {
  ensureDir();
  const p = join(DATA_DIR, name);
  if (!existsSync(p)) return fallback;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(name, data) {
  ensureDir();
  writeFileSync(join(DATA_DIR, name), JSON.stringify(data, null, 2), "utf8");
}

export function useSupabase() {
  return Boolean(getSupabaseAdmin());
}

export async function listSources({ activeOnly = false } = {}) {
  const admin = getSupabaseAdmin();
  if (admin) {
    let q = admin.from("da_sources").select("*").order("name");
    if (activeOnly) q = q.eq("status", "active");
    const { data, error } = await q;
    if (!error && data?.length) return data;
  }
  let sources = readJson("sources.json", null);
  if (!sources) {
    sources = SEED_SOURCES.map((s) => ({ id: randomUUID(), ...s, created_at: new Date().toISOString() }));
    writeJson("sources.json", sources);
  }
  return activeOnly ? sources.filter((s) => s.status === "active") : sources;
}

export async function upsertSource(input) {
  const admin = getSupabaseAdmin();
  const row = { ...input, updated_at: new Date().toISOString() };
  if (admin) {
    const { data, error } = await admin.from("da_sources").upsert(row, { onConflict: "slug" }).select().maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true, source: data };
  }
  const sources = await listSources();
  const idx = sources.findIndex((s) => s.slug === row.slug || s.id === row.id);
  if (idx >= 0) sources[idx] = { ...sources[idx], ...row };
  else sources.push({ id: row.id || randomUUID(), ...row, created_at: new Date().toISOString() });
  writeJson("sources.json", sources);
  return { ok: true, source: sources[idx >= 0 ? idx : sources.length - 1] };
}

export async function listItems({ status, limit = 500 } = {}) {
  const admin = getSupabaseAdmin();
  if (admin) {
    let q = admin.from("da_items").select("*").order("created_at", { ascending: false }).limit(limit);
    if (status) q = q.eq("status", status);
    const { data } = await q;
    if (data) return data;
  }
  let items = readJson("items.json", []);
  if (status) items = items.filter((i) => i.status === status);
  return items.slice(0, limit);
}

export async function saveItem(item) {
  const admin = getSupabaseAdmin();
  const row = { ...item, updated_at: new Date().toISOString() };
  if (admin) {
    const { data, error } = await admin.from("da_items").upsert(row).select().maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true, item: data };
  }
  const items = readJson("items.json", []);
  const idx = items.findIndex((i) => i.id === row.id || (i.external_id === row.external_id && i.source_id === row.source_id));
  if (idx >= 0) items[idx] = { ...items[idx], ...row };
  else items.unshift({ id: row.id || randomUUID(), ...row, created_at: new Date().toISOString() });
  writeJson("items.json", items);
  return { ok: true, item: items[idx >= 0 ? idx : 0] };
}

export async function createRun(run) {
  const admin = getSupabaseAdmin();
  const row = { id: randomUUID(), ...run, started_at: new Date().toISOString() };
  if (admin) {
    await admin.from("da_runs").insert(row);
  } else {
    const runs = readJson("runs.json", []);
    runs.unshift(row);
    writeJson("runs.json", runs.slice(0, 100));
  }
  return row;
}

export async function finishRun(runId, patch) {
  const admin = getSupabaseAdmin();
  const row = { ...patch, finished_at: new Date().toISOString() };
  if (admin) {
    await admin.from("da_runs").update(row).eq("id", runId);
  } else {
    const runs = readJson("runs.json", []);
    const idx = runs.findIndex((r) => r.id === runId);
    if (idx >= 0) runs[idx] = { ...runs[idx], ...row };
    writeJson("runs.json", runs);
  }
}

export async function addLog(entry) {
  const admin = getSupabaseAdmin();
  const row = { id: randomUUID(), ...entry, created_at: new Date().toISOString() };
  if (admin) {
    await admin.from("da_logs").insert(row);
  } else {
    const logs = readJson("logs.json", []);
    logs.unshift(row);
    writeJson("logs.json", logs.slice(0, 200));
  }
}

export async function addMergeLog(entry) {
  const admin = getSupabaseAdmin();
  if (admin) await admin.from("da_merge_log").insert(entry);
  else {
    const logs = readJson("merge-log.json", []);
    logs.unshift({ id: randomUUID(), ...entry, created_at: new Date().toISOString() });
    writeJson("merge-log.json", logs.slice(0, 100));
  }
}

export async function addReviewQueue(entry) {
  const admin = getSupabaseAdmin();
  if (admin) await admin.from("da_review_queue").insert(entry);
  else {
    const q = readJson("review-queue.json", []);
    q.unshift({ id: randomUUID(), ...entry, status: "pending", created_at: new Date().toISOString() });
    writeJson("review-queue.json", q);
  }
}

export async function updateSourceStats(sourceId, patch) {
  const admin = getSupabaseAdmin();
  if (admin) {
    await admin.from("da_sources").update({ ...patch, last_checked_at: new Date().toISOString() }).eq("id", sourceId);
    return;
  }
  const sources = await listSources();
  const idx = sources.findIndex((s) => s.id === sourceId);
  if (idx >= 0) {
    sources[idx] = { ...sources[idx], ...patch, last_checked_at: new Date().toISOString() };
    writeJson("sources.json", sources);
  }
}

export async function listRuns(limit = 20) {
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data } = await admin.from("da_runs").select("*").order("started_at", { ascending: false }).limit(limit);
    if (data) return data;
  }
  return readJson("runs.json", []).slice(0, limit);
}

export async function listLogs(limit = 50) {
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data } = await admin.from("da_logs").select("*").order("created_at", { ascending: false }).limit(limit);
    if (data) return data;
  }
  return readJson("logs.json", []).slice(0, limit);
}

export async function listReviewQueue(limit = 50) {
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data } = await admin.from("da_review_queue").select("*").eq("status", "pending").limit(limit);
    if (data) return data;
  }
  return readJson("review-queue.json", []).filter((q) => q.status === "pending").slice(0, limit);
}

export async function seedSourcesIfEmpty() {
  const sources = await listSources();
  if (sources.length >= SEED_SOURCES.length) return { seeded: false, count: sources.length };
  for (const s of SEED_SOURCES) {
    await upsertSource(s);
  }
  return { seeded: true, count: SEED_SOURCES.length };
}
