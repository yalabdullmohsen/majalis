/**
 * AKP v3 — Daily Content Goals (enforce quotas with extra fetch).
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { DAILY_QUOTAS, WEEKLY_QUOTAS, CONTENT_PIPELINES } from "../config.mjs";
import { kuwaitDateString, periodStart } from "../normalize.mjs";
import { runContentPipeline } from "../pipelines/index.mjs";
import { healWithRetry } from "./self-healing.mjs";

export async function getDailyGoalProgress(day = kuwaitDateString()) {
  const admin = getSupabaseAdmin();
  const progress = {};

  for (const [type, pipeline] of Object.entries(CONTENT_PIPELINES)) {
    const target = pipeline.quotaPeriod === "weekly" ? WEEKLY_QUOTAS[type] || pipeline.quota : DAILY_QUOTAS[type] || pipeline.quota;
    const since = pipeline.quotaPeriod === "weekly" ? periodStart("weekly") : periodStart("daily");

    let produced = 0;
    if (admin) {
      try {
        const { count } = await admin
          .from(pipeline.targetTable)
          .select("id", { count: "exact", head: true })
          .gte("created_at", since);
        produced = count || 0;
      } catch {
        produced = 0;
      }
    }

    const status = produced >= target ? "met" : "in_progress";
    progress[type] = { target, produced, gap: Math.max(0, target - produced), status, label: pipeline.label };

    if (admin) {
      await admin.from("akp_daily_goal_progress").upsert(
        {
          day,
          content_type: type,
          target_count: target,
          produced_count: produced,
          published_count: produced,
          status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "day,content_type" },
      ).catch(() => {});
    }
  }

  const totalGap = Object.values(progress).reduce((a, p) => a + p.gap, 0);
  return { ok: true, day, progress, totalGap, allMet: totalGap === 0 };
}

export async function enforceDailyGoals(opts = {}) {
  const maxExtraRuns = opts.maxExtraRuns || 3;
  const goals = await getDailyGoalProgress();
  const results = [];

  const unmet = Object.entries(goals.progress).filter(([, p]) => p.gap > 0);
  if (!unmet.length) {
    return { ok: true, allMet: true, results: [] };
  }

  let runs = 0;
  for (const [type, prog] of unmet) {
    if (runs >= maxExtraRuns) break;
    runs += 1;

    const result = await healWithRetry(
      () => runContentPipeline(type, { triggerType: "goal_enforcement", targetGap: prog.gap }),
      { component: `pipeline:${type}`, metadata: { gap: prog.gap } },
    );

    results.push({ type, gap: prog.gap, ...result });
  }

  const after = await getDailyGoalProgress();
  return {
    ok: true,
    before: goals,
    after,
    extraRuns: runs,
    results,
  };
}
