/**
 * Platform settings — quotas and policies from DB (admin-editable).
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { DEFAULT_DAILY_QUOTAS, DEFAULT_WEEKLY_QUOTAS } from "./config.mjs";

const CACHE_TTL_MS = 60_000;
let cache = { at: 0, daily: null, weekly: null, autoPublish: null };

export async function loadPlatformSettings(force = false) {
  const now = Date.now();
  if (!force && cache.at && now - cache.at < CACHE_TTL_MS && cache.daily) {
    return { dailyQuotas: cache.daily, weeklyQuotas: cache.weekly, autoPublish: cache.autoPublish };
  }

  const admin = getSupabaseAdmin();
  let daily = { ...DEFAULT_DAILY_QUOTAS };
  let weekly = { ...DEFAULT_WEEKLY_QUOTAS };
  let autoPublish = { enabled: false, min_trust: 80 };

  if (admin) {
    try {
      const { data } = await admin.from("tkn_platform_settings").select("setting_key, setting_value");
      for (const row of data || []) {
        if (row.setting_key === "daily_quotas" && row.setting_value) {
          daily = { ...daily, ...row.setting_value };
        }
        if (row.setting_key === "weekly_quotas" && row.setting_value) {
          weekly = { ...weekly, ...row.setting_value };
        }
        if (row.setting_key === "auto_publish" && row.setting_value) {
          autoPublish = { ...autoPublish, ...row.setting_value };
        }
      }
    } catch {
      /* table optional until migration */
    }
  }

  cache = { at: now, daily, weekly, autoPublish };
  return { dailyQuotas: daily, weeklyQuotas: weekly, autoPublish };
}

export async function updatePlatformSettings(key, value, updatedBy = "admin") {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  try {
    const { error } = await admin.from("tkn_platform_settings").upsert({
      setting_key: key,
      setting_value: value,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    }, { onConflict: "setting_key" });
    if (error) throw error;
    cache.at = 0;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

export async function getQuotaForPipeline(pipelineId) {
  const { dailyQuotas, weeklyQuotas } = await loadPlatformSettings();
  const pipeline = pipelineId;
  if (pipeline === "articles") return weeklyQuotas.articles ?? DEFAULT_WEEKLY_QUOTAS.articles;
  return dailyQuotas[pipeline] ?? DEFAULT_DAILY_QUOTAS[pipeline] ?? 0;
}
