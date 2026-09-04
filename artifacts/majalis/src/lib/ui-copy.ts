/** نصوص واجهة موحّدة — لا تكرّر العبارات يدويًا في المكونات. */
export const BRAND_NAME = "سُنّة";

export const BUTTON = {
  start: "ابدأ",
  details: "عرض التفاصيل",
  save: "حفظ",
  share: "مشاركة",
  addToCalendar: "أضف للتقويم",
  copy: "نسخ",
  back: "رجوع",
  openMushaf: "فتح المصحف",
  viewLessons: "عرض الدروس",
  retry: "إعادة المحاولة",
  askAssistant: "اسأل",
} as const;

export const EMPTY = {
  generic: "لم يتم العثور على محتوى مطابق.",
  search:
    "لا توجد نتائج الآن، جرّب كلمة أقصر أو اختر من الاقتراحات.",
  searchShort: "لا توجد نتائج مطابقة للبحث الحالي.",
  lessonsCategory: "لا توجد دروس لهذا التصنيف حاليًا.",
  competitions: "لا توجد مسابقات حالية.",
  data: "لا توجد بيانات لعرضها حاليًا.",
  library: "لا توجد كتب في هذا القسم حاليًا.",
  librarySearch: "لا توجد نتائج مطابقة. جرّب كلمة أخرى أو أزل التصفية.",
  notifications: "لا توجد إشعارات جديدة.",
  notificationsArchived: "لا توجد إشعارات مؤرشفة.",
  citations: "لا توجد اقتباسات محفوظة بعد.",
  folders: "لا توجد مجلدات بعد.",
} as const;

export const STATUS = {
  pageUnavailable: "هذه الصفحة غير متاحة حاليًا.",
  sectionDisabled: "هذا القسم غير مفعل حاليًا.",
  loadError: "تعذّر تحميل البيانات مؤقتًا. أعد المحاولة.",
} as const;

export const TERMS = {
  womenAttendanceAvailable: "متاح",
  liveStream: "بث مباشر",
  inPerson: "حضوري",
  remote: "عن بعد",
  source: "المصدر",
  ruling: "الحكم",
  narrator: "الراوي",
  reference: "المرجع",
  lastUpdated: "آخر تحديث",
} as const;

export const WEAK_HADITH = {
  sectionNote: "للتنبيه والتمييز",
} as const;
