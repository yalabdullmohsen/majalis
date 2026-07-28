import { useEffect } from "react";
import { applyPageSeo, type PageSeoOptions } from "@/lib/seo";

export type MetaHeadProps = PageSeoOptions & {
  /** Explicit social share image path or absolute URL. */
  ogImage?: string;
};

/**
 * Declarative SEO/OG head manager for route views.
 * Wraps imperative `applyPageSeo` so pages can mount premium share cards
 * (WhatsApp / Telegram / X) without duplicating head mutation logic.
 */
export function MetaHead({ ogImage, image, ...seo }: MetaHeadProps) {
  useEffect(() => {
    applyPageSeo({
      ...seo,
      image: ogImage || image,
      ogType: seo.ogType || "website",
    });
  }, [
    seo.path,
    seo.title,
    seo.description,
    seo.robots,
    seo.ogType,
    seo.canonicalPath,
    image,
    ogImage,
    // keywords/jsonLd identity: stringify for stable dep when arrays/objects
    JSON.stringify(seo.keywords ?? null),
    JSON.stringify(seo.jsonLd ?? null),
  ]);

  return null;
}

export default MetaHead;
