/**
 * Instagram source discovery — Graph API first, OG fallback, Manual Assist when unconfigured.
 */
import { importFromUrl } from "./url-importer.mjs";
import {
  isInstagramGraphConfigured,
  fetchInstagramMediaForSource,
  getInstagramGraphStatus,
  getMockInstagramPosts,
} from "./instagram-graph-api.mjs";
import { logAutomationStep } from "./automation-step-logs.mjs";

export const INSTAGRAM_CONNECTOR_HINTS = [
  "ربط Instagram Graph API من /admin/integrations/instagram",
  "رفع صورة الإعلان يدويًا (Manual Assist) من /admin/sources",
  "إدخال رابط المنشور + صورة",
  "استخدام RSS أو الموقع الرسمي إن وُجد في config.website_url",
];

export const MANUAL_ASSIST_MODES = ["upload", "url", "caption"];

export function isInstagramBlocked(imported, err) {
  if (err) return true;
  const body = String(imported?.rawText || imported?.description || "").toLowerCase();
  const title = String(imported?.title || "").trim().toLowerCase();
  // عنوان صفحة الحظر الفعلية لإنستغرام هو "Instagram" وحدها أو "Login • Instagram"
  // — بلا "photos and videos" ولا اسم حساب. عنوان أي ملف شخصي عام ناجح يتضمّن
  // "Instagram" دومًا ضمن الصيغة القياسية "… • Instagram photos and videos"، لذلك
  // فحص substring وحده ("instagram" ضمن العنوان) كان يُصنِّف كل ملف شخصي ناجح
  // كمحظور خطأً (رُصد فعليًا: جلب حقيقي ناجح بعدد متابعين/منشورات حقيقي، مصنَّف
  // "blocked" رغم ذلك) — الفحص الآن يستهدف صيغة صفحة الحظر تحديدًا.
  if (title === "instagram" || title.startsWith("login")) return true;
  if (body.includes("login • instagram") || body.includes("log in to instagram")) return true;
  if (!imported?.title && !imported?.description && !imported?.imageUrl) return true;
  return false;
}

export async function discoverInstagramSource(source, { runId } = {}) {
  const config = source.config || {};
  const handle = config.handle || source.url.replace(/.*instagram\.com\//, "").replace(/\/$/, "");
  const profileUrl = source.url.includes("instagram.com") ? source.url : `https://instagram.com/${handle}`;

  await logAutomationStep({
    runId,
    sourceId: source.id,
    step: "connector_status",
    status: isInstagramGraphConfigured() ? "ok" : "warn",
    detail: isInstagramGraphConfigured() ? "graph_api_configured" : "instagram_connector_not_configured",
  });

  if (process.env.INSTAGRAM_GRAPH_MOCK === "1") {
    const items = getMockInstagramPosts(handle);
    return {
      items,
      connectorRequired: false,
      graphApi: true,
      manualAssistMode: false,
      hint: null,
    };
  }

  if (isInstagramGraphConfigured()) {
    const graphResult = await fetchInstagramMediaForSource(source, { limit: 15, runId });
    if (graphResult.items?.length) {
      return {
        items: graphResult.items,
        connectorRequired: false,
        graphApi: true,
        manualAssistMode: false,
        instagramLimited: false,
        hint: null,
      };
    }
    if (graphResult.error) {
      return {
        items: [],
        connectorRequired: false,
        manualAssistMode: true,
        graphApiAttempted: true,
        instagramLimited: true,
        hint: `Graph API: ${graphResult.error} — استخدم Manual Assist`,
      };
    }
  }

  let imported;
  let fetchError;
  try {
    imported = await importFromUrl(profileUrl);
  } catch (err) {
    fetchError = err;
  }

  if (!isInstagramBlocked(imported, fetchError) && imported?.imageUrl) {
    return {
      items: [
        {
          title: imported.title || source.name,
          link: imported.finalUrl || profileUrl,
          description: imported.description || config.description || "",
          imageUrl: imported.imageUrl,
          handle,
        },
      ],
      connectorRequired: false,
      instagramLimited: true,
      hint: null,
    };
  }

  const websiteUrl = config.website_url;
  if (isInstagramBlocked(imported, fetchError) && websiteUrl) {
    try {
      const site = await importFromUrl(websiteUrl);
      if (site.imageUrl || site.description) {
        return {
          items: [
            {
              title: site.title || source.name,
              link: websiteUrl,
              description: site.description || config.description || "",
              imageUrl: site.imageUrl || "",
              fromWebsite: true,
            },
          ],
          connectorRequired: false,
          instagramLimited: true,
          hint: `Instagram محدود — الموقع الرسمي: ${websiteUrl}`,
        };
      }
    } catch {
      /* fall through */
    }
  }

  const graphStatus = getInstagramGraphStatus();
  return {
    items: [],
    connectorRequired: false,
    manualAssistMode: true,
    instagramLimited: true,
    instagramNotConfigured: !graphStatus.configured,
    hint: graphStatus.configured
      ? "لا منشورات من Graph API — استخدم Manual Assist من صفحة المصادر"
      : "Instagram connector not configured — Manual Assist Mode",
    fetchError: fetchError ? String(fetchError.message || fetchError) : "instagram_og_limited",
  };
}

export function enrichParsedFromSourceConfig(parsed, source) {
  const config = source.config || {};
  const out = { ...parsed };
  if (!out.organizer && source.name) out.organizer = source.name;
  if (!out.mosque && config.source_subtype?.includes("mosque")) out.mosque = source.name;
  if (!out.description && config.description) out.description = config.description;
  if (config.website_url && !out.registration_url) out.registration_url = config.website_url;
  return out;
}

export { getInstagramGraphStatus, isInstagramGraphConfigured };
