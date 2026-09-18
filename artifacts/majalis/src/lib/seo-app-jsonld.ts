/** تطبيق تعليمي — بدون installUrl حتى يتوفر رابط App Store إنتاجي موثّق.
 * ملف منفصل حتى لا يدخل مسار الـentry (seo.ts → defaultSiteJsonLd).
 */
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, DEFAULT_IMAGE } from "./site-config";
import { hasIosAppStoreUrl, IOS_APP_STORE_URL } from "./ios-app-store";

function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function softwareApplicationJsonLd() {
  const payload: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "EducationalApplication",
    operatingSystem: hasIosAppStoreUrl() ? "Web, iOS" : "Web",
    inLanguage: "ar",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    image: absoluteUrl(DEFAULT_IMAGE),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
  if (hasIosAppStoreUrl()) {
    payload.installUrl = IOS_APP_STORE_URL;
    payload.downloadUrl = IOS_APP_STORE_URL;
  }
  return payload;
}
