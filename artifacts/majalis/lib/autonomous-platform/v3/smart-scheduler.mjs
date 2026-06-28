/**
 * AKP v3 — Smart Scheduler (dynamic cron intervals).
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { CRON_SCHEDULES, CONTENT_PIPELINES } from "../config.mjs";

const BASE_INTERVALS_MS = {
  fetch: 60 * 60 * 1000,
  validate: 2 * 60 * 60 * 1000,
  health: 30 * 60 * 1000,
  goals: 15 * 60 * 1000,
};

export async function getSchedulerState() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: true, local: true, loadFactor: 1, errorBudget: 1, nextRuns: {} };
  }
  const { data } = await admin.from("akp_scheduler_state").select("*").eq("id", "default").maybeSingle();
  return data || { load_factor: 1, error_budget: 1, next_runs: {} };
}

export async function computeSmartSchedule(metrics = {}) {
  const {
    activeSources = 6,
    pendingJobs = 0,
    recentErrors = 0,
    serverLoad = 0.5,
    goalGap = 0,
  } = metrics;

  let loadFactor = 1;
  if (activeSources > 20) loadFactor += 0.3;
  if (pendingJobs > 50) loadFactor += 0.4;
  if (serverLoad > 0.8) loadFactor += 0.5;
  if (goalGap > 100) loadFactor -= 0.2;

  let errorBudget = Math.max(0.2, 1 - recentErrors * 0.1);

  const nextRuns = {};
  const now = Date.now();

  for (const [mode, baseMs] of Object.entries(BASE_INTERVALS_MS)) {
    const adjusted = Math.round(baseMs * loadFactor / errorBudget);
    nextRuns[mode] = new Date(now + adjusted).toISOString();
  }

  for (const [type, pipeline] of Object.entries(CONTENT_PIPELINES)) {
    const cron = CRON_SCHEDULES[pipeline.cronMode];
    if (cron) {
      nextRuns[pipeline.cronMode] = new Date(now + Math.round(3600000 * loadFactor)).toISOString();
    }
  }

  return { loadFactor, errorBudget, nextRuns, adjustedIntervals: BASE_INTERVALS_MS };
}

export async function persistSchedulerState(schedule) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: true, local: true };

  const { error } = await admin.from("akp_scheduler_state").upsert({
    id: "default",
    next_runs: schedule.nextRuns,
    load_factor: schedule.loadFactor,
    error_budget: schedule.errorBudget,
    metadata: { updatedBy: "smart-scheduler" },
    updated_at: new Date().toISOString(),
  });
  return { ok: !error, error: error?.message };
}

export function shouldRunMode(mode, state, now = Date.now()) {
  const next = state?.next_runs?.[mode] || state?.nextRuns?.[mode];
  if (!next) return true;
  return now >= new Date(next).getTime();
}

export async function planNextRuns(platformMetrics) {
  const schedule = await computeSmartSchedule(platformMetrics);
  await persistSchedulerState(schedule);
  return schedule;
}
