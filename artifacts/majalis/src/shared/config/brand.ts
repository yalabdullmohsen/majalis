/** ثوابت العلامة — مصدر موحّد للطبقات العليا (يُوسَّع في D/F). */
export const BRAND = {
  nameAr: "مجالس العلم",
  domain: "majlisilm.com",
  colorDay: "#1F7A5A",
  colorNight: "#4FB48B",
  surfaceDay: "#F2F4F3",
  surfaceNight: "#101614",
} as const;

export const SEO_DEFAULTS = {
  siteNameAr: BRAND.nameAr,
  locale: "ar",
} as const;
