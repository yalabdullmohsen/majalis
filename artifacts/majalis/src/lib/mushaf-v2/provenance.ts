/**
 * توثيق مصادر مصحف سُنّة — نص/خط/تخطيط فقط من أصول مرخّصة وموثّقة في المستودع.
 * لا يُستورد أي أصل أو كود من تطبيقات طرف ثالث.
 */

export const MUSHAF_PROVENANCE = {
  mushafId: 1 as const,
  label: "QCF V2 / hafs v2",
  pageDataPath: "public/data/quran-v2/pages/page-NNN.json",
  sourceManifest: "public/data/quran-v2/SOURCE.json",
  fontPathPattern: "public/fonts/qpc-v2/p{n}.woff2",
  fontUpstream: "https://quran.com/fonts/quran/hafs/v2/woff2/p{n}.woff2",
  apiUpstream:
    "https://api.qurancdn.com/api/qdc/verses/by_page/{n}?mushaf=1&words=true",
  policyAr:
    "المصحف المعتمد الوحيد = mushaf=1. يُمنع تعديل النص القرآني أو التشكيل أو علامات الوقف. يُمنع مزامنة mushaf≠1.",
  forbiddenMushafIds: [2] as const,
  displayMode: "qpc-v2-text" as const,
  pageImagesInProduction: false,
  originalUiNoteAr:
    "واجهة سُنّة أصلية (ألوان/أدوات/حركة translate). لا نسخ واجهة أو زخارف أو أصول تطبيق آخر.",
} as const;

export type MushafProvenance = typeof MUSHAF_PROVENANCE;
