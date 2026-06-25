import { createClient } from "@supabase/supabase-js";

const TIMEOUT_MS = 8000;

function getAdminClient() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function checkUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "MajlisIlm-FiqhLinkChecker/1.0" },
    });
    clearTimeout(timer);
    const finalUrl = res.url !== url ? res.url : null;
    if (res.status >= 200 && res.status < 400) {
      return { status: finalUrl ? "redirect" : "ok", http_status: res.status, redirect_url: finalUrl };
    }
    if (res.status >= 400) {
      return { status: "broken", http_status: res.status, redirect_url: null };
    }
    return { status: "ok", http_status: res.status, redirect_url: finalUrl };
  } catch (err) {
    clearTimeout(timer);
    const msg = String(err?.name || err?.message || err);
    if (msg.includes("abort")) return { status: "timeout", http_status: null, redirect_url: null };
    return { status: "broken", http_status: null, redirect_url: null };
  }
}

export async function runFiqhLinkCheck(opts = {}) {
  const admin = getAdminClient();
  if (!admin) {
    return { ok: false, message: "Supabase service role غير مهيأ." };
  }

  const limit = opts.limit || 40;
  const { data: items, error } = await admin
    .from("fiqh_council_items")
    .select("id, slug, title, source_url, status")
    .not("source_url", "is", null)
    .neq("source_url", "")
    .in("status", ["published", "approved", "needs_review", "imported", "review"])
    .order("link_checked_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) throw error;

  let checked = 0;
  let broken = 0;
  let redirected = 0;

  for (const item of items || []) {
    if (!item.source_url?.startsWith("http")) continue;
    const result = await checkUrl(item.source_url);
    checked += 1;
    if (result.status === "broken" || result.status === "timeout") broken += 1;
    if (result.status === "redirect") redirected += 1;

    const updates = {
      link_status: result.status,
      link_checked_at: new Date().toISOString(),
      redirect_url: result.redirect_url,
      updated_at: new Date().toISOString(),
    };

    if (result.status === "broken" || result.status === "timeout") {
      updates.status = item.status === "published" ? "needs_review" : item.status;
      await admin.from("fiqh_council_admin_alerts").insert({
        alert_type: "broken_link",
        title: `رابط مصدر معطل: ${item.title}`,
        message: item.source_url,
        entity_type: "fiqh_council_item",
        entity_id: item.id,
        severity: "warning",
      });
    }

    await admin.from("fiqh_council_items").update(updates).eq("id", item.id);
    await admin.from("fiqh_link_checks").insert({
      item_id: item.id,
      url: item.source_url,
      status: result.status,
      redirect_url: result.redirect_url,
      http_status: result.http_status,
    });

    await admin.from("fiqh_review_logs").insert({
      item_id: item.id,
      action: "link_check",
      notes: `${result.status}${result.redirect_url ? ` → ${result.redirect_url}` : ""}`,
      verification_issues: [],
    });
  }

  return {
    ok: true,
    checked,
    broken,
    redirected,
    at: new Date().toISOString(),
  };
}
