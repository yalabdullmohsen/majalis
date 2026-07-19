/**
 * مزامنة حسابات Instagram المعتمدة الخمسة → تصنيف تلقائي → دروس (عبر خط
 * الأنابيب القائم processAutomationItem) أو دورات/فعاليات/فوائد/إعلانات
 * (في auto_imported_content الموسَّع). لا نشر تلقائي إطلاقًا — كل مادة
 * تُحفظ pending_review بانتظار اعتماد بشري (نفس حوكمة auto-content-sync.mjs).
 *
 * الربط: discoverInstagramSource() الموجودة فعليًا (Graph API → OG fallback
 * → Manual Assist) — لا سحب (scraping) هش ولا تسجيل دخول آلي لإنستغرام.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { listTrustedSources, updateSourceCheckStatus } from "./trusted-sources.mjs";
import { discoverInstagramSource } from "./instagram-connector.mjs";
import { processAutomationItem } from "./lesson-source-monitor.mjs";
import { classifyInstagramPost, extractExplicitPersonName } from "./instagram-content-classifier.mjs";
import { createExternalKey, ensureUniqueSlug, generateSeoMetadata } from "../auto-content/auto-content-utils.mjs";
import crypto from "node:crypto";

function normalizeForHash(text) {
  return String(text || "")
    .replace(/[ً-ٰٟ]/g, "") // إزالة التشكيل
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function contentHashOf(sourceAccount, text) {
  return crypto.createHash("sha256").update(`${sourceAccount}|${normalizeForHash(text)}`).digest("hex");
}

/** يستخرج موعد الفعالية إن ذُكر بصيغة واضحة (يوم-شهر-سنة) — لا تخمين؛
 * إن لم يكن واضحًا تبقى event_start_at فارغة وتُعلَّم المادة لمراجعة إدارية. */
function tryExtractEventDate(text) {
  const isoLike = text.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoLike) {
    const [, y, m, d] = isoLike;
    const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return null;
}

function resolveAttribution(source, caption) {
  const cfg = source.config || {};
  if (source.attribute_to_person !== false) {
    return { attributionName: source.default_attribution_name || null, organizationName: source.default_organization_name || null };
  }
  const explicit = extractExplicitPersonName(caption);
  if (explicit) return { attributionName: explicit, organizationName: source.default_organization_name || cfg.organization || null };
  return { attributionName: null, organizationName: source.default_organization_name || cfg.organization || source.name };
}

export async function upsertUnifiedContentItem(supabase, { source, item, contentType }) {
  const caption = item.description || item.title || "";
  const postId = String(item.id || item.link || "").slice(0, 200);
  const externalKey = createExternalKey(source.name, item.link || postId, item.title || caption.slice(0, 60));
  const hash = contentHashOf(source.config?.handle || source.name, caption);

  // منع التكرار: external_key، أو (حساب+معرّف منشور)، أو بصمة نص متطابقة لنفس الحساب
  const { data: dup } = await supabase
    .from("auto_imported_content")
    .select("id")
    .or(`external_key.eq.${externalKey},content_hash.eq.${hash}`)
    .limit(1)
    .maybeSingle();
  if (dup) return { action: "skipped", reason: "duplicate" };

  if (!caption.trim() && !item.imageUrl) return { action: "skipped", reason: "empty_post" };

  const { attributionName, organizationName } = resolveAttribution(source, caption);
  if (contentType !== "benefit" && !item.title && !caption) return { action: "skipped", reason: "missing_title" };

  const title = (item.title || caption.slice(0, 70) || source.name).trim();
  const slug = await ensureUniqueSlug(supabase, title);
  const summary = caption.slice(0, 500);
  const { seoTitle, seoDescription, structuredData } = generateSeoMetadata({
    title,
    summary,
    category: contentType,
    slug,
    sourceName: attributionName || organizationName || source.name,
  });

  const eventStartAt = contentType === "event" ? tryExtractEventDate(caption) : null;
  // لا تاريخ نهاية موثوق في نص المنشور غالبًا — نعتبر الفعالية منتهية بعد
  // يوم كامل من موعدها المُستخرَج (لا تخمين لموعد النهاية نفسه، فقط نافذة
  // معقولة لإخفائها تلقائيًا من القوائم النشطة بعد انقضائها فعليًا).
  const expiresAt = eventStartAt ? new Date(new Date(eventStartAt).getTime() + 24 * 60 * 60 * 1000).toISOString() : null;

  const record = {
    external_key: externalKey,
    title,
    slug,
    content_type: contentType,
    category: contentType,
    summary,
    content: caption,
    source_name: attributionName || organizationName || source.name,
    source_url: source.url,
    original_url: item.link || source.url,
    tags: [],
    source_verified: true,
    status: "needs_review",
    verification_status: "pending_review",
    review_status: "pending_review",
    pipeline_stage: "ready_for_review",
    seo_title: seoTitle,
    seo_description: seoDescription,
    structured_data: structuredData,
    quality_score: item.imageUrl ? 60 : 40,
    source_account: source.config?.handle || source.name,
    source_post_id: postId || null,
    source_published_at: item.timestamp || null,
    attribution_name: attributionName,
    organization_name: organizationName,
    image_url: item.imageUrl || null,
    registration_url: source.config?.website_url || null,
    event_start_at: eventStartAt,
    expires_at: expiresAt,
    content_hash: hash,
  };
  if (contentType === "event" && !eventStartAt) {
    record.review_status = "needs_date_review";
  }

  const { data, error } = await supabase.from("auto_imported_content").insert(record).select("id").single();
  if (error) return { action: "failed", reason: error.message };
  return { action: "imported", id: data.id, contentType };
}

export async function runInstagramMultiTypeSync({ runId = null } = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, error: "Supabase not configured", imported: 0, skipped: 0, failed: 0, sourceResults: [] };

  const allSources = await listTrustedSources({ activeOnly: true });
  const igSources = allSources.filter((s) => s.source_type === "instagram" || s.platform === "instagram");

  let imported = 0;
  let skipped = 0;
  let failed = 0;
  let ignored = 0;
  const sourceResults = [];

  for (const enriched of igSources) {
    const allowedTypes = new Set(enriched.content_types_allowed || ["lesson"]);

    let sImported = 0;
    let sSkipped = 0;
    let sFailed = 0;
    try {
      const discovery = await discoverInstagramSource(enriched, { runId });
      const items = discovery.items || [];

      for (const item of items) {
        const caption = item.description || item.title || "";
        const contentType = classifyInstagramPost({ caption, sourceAccount: enriched.config?.handle });

        if (contentType === "ignored" || !allowedTypes.has(contentType)) {
          ignored++;
          continue;
        }

        if (contentType === "lesson") {
          try {
            const outcome = await processAutomationItem({ source: enriched, item, connectorHint: null, runId });
            if (outcome?.decision === "duplicate") sSkipped++;
            else sImported++;
          } catch {
            sFailed++;
          }
          continue;
        }

        const result = await upsertUnifiedContentItem(supabase, { source: enriched, item, contentType, runId });
        if (result.action === "imported") sImported++;
        else if (result.action === "skipped") sSkipped++;
        else sFailed++;
      }

      await updateSourceCheckStatus(enriched.id, { success: true });
      sourceResults.push({ name: enriched.name, ok: true, imported: sImported, skipped: sSkipped, failed: sFailed, manualAssistMode: Boolean(discovery.manualAssistMode) });
    } catch (err) {
      sFailed++;
      await updateSourceCheckStatus(enriched.id, { success: false, error: err.message });
      sourceResults.push({ name: enriched.name, ok: false, reason: err.message });
    }

    imported += sImported;
    skipped += sSkipped;
    failed += sFailed;
  }

  return { ok: true, imported, skipped, failed, ignored, sourcesChecked: igSources.length, sourceResults };
}

/** أرشفة الفعاليات المنتهية — لا حذف، فقط استبعاد من القوائم النشطة. */
export async function archiveExpiredEvents() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, archived: 0 };

  const { data, error } = await supabase
    .from("auto_imported_content")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("content_type", "event")
    .lt("expires_at", new Date().toISOString())
    .neq("status", "archived")
    .select("id");

  if (error) return { ok: false, archived: 0, error: error.message };
  return { ok: true, archived: data?.length || 0 };
}
