const PUBLIC_BODY_FONT = "/fonts/ui/ibm-plex-sans-ar-400-ar.woff2";

let publicFontsBootstrapped = false;

/** يحمّل خطوط الصفحات الخارجية عند الطلب فقط — بلا تأثير على الصفحات الداخلية. */
export function bootstrapPublicFonts(): void {
  if (publicFontsBootstrapped || typeof document === "undefined") return;
  publicFontsBootstrapped = true;

  void import("@/styles/fonts-public.css");
  void import("@/styles/public-layout.css");

  if (document.querySelector(`link[rel="preload"][href="${PUBLIC_BODY_FONT}"]`)) return;
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "font";
  link.type = "font/woff2";
  link.crossOrigin = "anonymous";
  link.href = PUBLIC_BODY_FONT;
  document.head.appendChild(link);
}
