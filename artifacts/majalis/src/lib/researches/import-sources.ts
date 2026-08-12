/**
 * مصادر فهرسة مسموح بها من حيث السياسة فقط.
 * لا يُجلب محتوى حي هنا دون اختبار وموافقة — الاستيراد اليومي يعمل كهيكل آمن.
 */
import type { ImportSourceConfig } from "./types";

export const RESEARCH_IMPORT_SOURCES: ImportSourceConfig[] = [
  {
    id: "doaj-hint",
    name: "دليل المجلات المفتوحة (DOAJ) — بيانات وصفية عند توفر API",
    baseUrl: "https://doaj.org/",
    kind: "open_api",
    active: false,
    respectsRobots: true,
    metadataOnly: true,
    requiresApiKey: false,
    notes: "يُفعَّل بعد التحقق من شروط الاستخدام واختبار نقطة النهاية. افتراضيًا متوقف.",
    lastRunAt: null,
    lastResult: null,
  },
  {
    id: "oai-generic",
    name: "حصاد OAI-PMH لمستودعات جامعية مصرّح بها",
    baseUrl: "https://www.openarchives.org/pmh/",
    kind: "oai_pmh",
    active: false,
    respectsRobots: true,
    metadataOnly: true,
    notes: "يتطلب تسجيل مستودع محدد في لوحة الإدارة. لا يُنزَّل النص الكامل.",
    lastRunAt: null,
    lastResult: null,
  },
  {
    id: "rss-journals",
    name: "خلاصات RSS لمجلات شرعية مفتوحة",
    baseUrl: "",
    kind: "rss",
    active: false,
    respectsRobots: true,
    metadataOnly: true,
    notes: "قائمة الخلاصات تُدار من الإدارة. بدون عناوين مفعّلة لن يعمل الجلب.",
    lastRunAt: null,
    lastResult: null,
  },
];

export function listActiveImportSources(sources = RESEARCH_IMPORT_SOURCES): ImportSourceConfig[] {
  return sources.filter((s) => s.active);
}
