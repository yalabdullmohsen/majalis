/** نصوص واجهة موحّدة — لا تكرّر العبارات يدويًا في المكونات. */
export const BRAND_NAME = "سُنّة";

export const BUTTON = {
  start: "ابدأ",
  details: "عرض التفاصيل",
  retry: "إعادة المحاولة",
  askAssistant: "اسأل",
} as const;

export const EMPTY = {
  generic: "لا يتوفر محتوى هنا الآن. تصفّح قسمًا آخر أو عد لاحقًا.",
  search: "لم نجد نتيجة مطابقة. جرّب كلمات أوضح.",
  searchShort: "لم نجد نتيجة مطابقة.",
  competitions: "لا مسابقات جارية الآن.",
  data: "لا يتوفر محتوى هنا الآن.",
  citations: "احفظ المواد المهمة لتعود إليها بسهولة.",
  continueEmpty: "ابدأ من المصحف أو الدروس.",
  bookmarks: "لم تحفظ مواد بعد.",
  downloads: "لا مواد منزّلة على هذا الجهاز.",
  offline: "أنت غير متصل، سيتم عرض المحتوى المحفوظ",
  /** أقسام بلا سجلات منشورة للعامة — بلا enums ولا طوابير مراجعة */
  sectionPreparing:
    "هذا القسم قيد الإعداد. يُعرض للعامة ما اكتملت مراجعته واعتماده فقط.",
  recordNotPublic:
    "هذا السجل غير متاح للعامة بعد. تصفّح الأقسام الأخرى أو عد لاحقًا.",
} as const;

export const SEARCH = {
  placeholder: "ابحث عن درس، حديث، حكم، أو عالم",
  global: "ابحث في المحتوى…",
} as const;

export const STATUS = {
  loadError: "تعذّر تحميل المحتوى. أعد المحاولة.",
  networkError: "تعذّر الاتصال. تحقق من الشبكة ثم أعد المحاولة.",
  contentLoading: "تجهيز…",
  updating: "تجهيز…",
} as const;

export const ACTION = {
  browseAll: "استعرض الدروس",
  retry: "إعادة المحاولة",
  discoverMore: "المزيد في هذا القسم",
  continueListening: "أكمل استماعك",
  clearSearchHistory: "امسح سجل البحث",
  browseContent: "استعرض المحتوى",
  clearSearch: "مسح البحث",
} as const;
