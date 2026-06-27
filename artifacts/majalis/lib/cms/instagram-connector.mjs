/**
 * Instagram source discovery — og:tags only; graceful fallback when blocked.
 */
import { importFromUrl } from "./url-importer.mjs";

export const INSTAGRAM_CONNECTOR_HINTS = [
  "ربط Instagram Graph API رسمي (Meta Business)",
  "رفع صورة الإعلان يدويًا عبر /admin/content-import/image",
  "إدخال رابط المنشور + صورة عبر /admin/content-import/url",
  "استخدام RSS أو الموقع الرسمي إن وُجد في config.website_url",
];

export function isInstagramBlocked(imported, err) {
  if (err) return true;
  const body = String(imported?.rawText || imported?.description || "").toLowerCase();
  const title = String(imported?.title || "").toLowerCase();
  if (title.includes("login") || title.includes("instagram")) return true;
  if (body.includes("login • instagram") || body.includes("log in to instagram")) return true;
  if (!imported?.title && !imported?.description && !imported?.imageUrl) return true;
  return false;
}

export async function discoverInstagramSource(source) {
  const config = source.config || {};
  const handle = config.handle || source.url.replace(/.*instagram\.com\//, "").replace(/\/$/, "");
  const profileUrl = source.url.includes("instagram.com") ? source.url : `https://instagram.com/${handle}`;

  let imported;
  let fetchError;
  try {
    imported = await importFromUrl(profileUrl);
  } catch (err) {
    fetchError = err;
  }

  if (isInstagramBlocked(imported, fetchError)) {
    const websiteUrl = config.website_url;
    if (websiteUrl) {
      try {
        const site = await importFromUrl(websiteUrl);
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
          hint: `Instagram محدود — تم استخدام الموقع الرسمي: ${websiteUrl}`,
        };
      } catch {
        // fall through
      }
    }

    return {
      items: [
        {
          title: source.name,
          link: profileUrl,
          description: config.description || "",
          imageUrl: "",
          connectorPending: true,
        },
      ],
      connectorRequired: true,
      instagramLimited: true,
      hint: INSTAGRAM_CONNECTOR_HINTS.join(" · "),
      fetchError: fetchError ? String(fetchError.message || fetchError) : "instagram_og_limited",
    };
  }

  return {
    items: [
      {
        title: imported.title || source.name,
        link: imported.finalUrl || profileUrl,
        description: imported.description || config.description || "",
        imageUrl: imported.imageUrl || "",
        handle,
      },
    ],
    connectorRequired: false,
    instagramLimited: false,
    hint: null,
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
