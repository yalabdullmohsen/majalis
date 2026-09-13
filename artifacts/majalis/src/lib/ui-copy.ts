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
  generic: "لا يتوفر محتوى هنا الآن؛ جرّب قسمًا آخر أو عد لاحقًا.",
  search: "لم نجد نتيجة مطابقة. جرّب كلمات بحث أخرى.",
  searchShort: "لم نجد نتيجة مطابقة.",
  lessonsCategory: "لا دروس في هذا التصنيف بعد.",
  competitions: "لا مسابقات معلنة الآن.",
  data: "لا بيانات معروضة هنا الآن.",
  library: "لا كتب في هذا التصنيف بعد.",
  librarySearch: "لم نجد نتيجة مطابقة. جرّب كلمة أخرى أو أزل التصفية.",
  notifications: "لا إشعارات جديدة.",
  notificationsArchived: "لا إشعارات في الأرشيف.",
  citations: "احفظ المواد المهمة لتعود إليها بسهولة.",
  folders: "لم تُنشئ مجلدات بعد.",
  continue: "تابع من حيث توقفت",
  continueEmpty: "ابدأ رحلتك في طلب العلم",
  savedEmpty: "احفظ المواد المهمة لتعود إليها بسهولة.",
  bookmarks: "لم تحفظ مواد بعد.",
  downloads: "لا مواد منزّلة بعد.",
  seriesLessons: "لا دروس في هذه السلسلة بعد.",
  offline: "تعذر الاتصال. يمكنك متابعة المحتوى المحفوظ.",
} as const;

export const SEARCH = {
  placeholder: "ابحث عن درس، محاضرة، سلسلة أو عالم",
} as const;

export const STATUS = {
  pageUnavailable: "هذه الصفحة غير متاحة حاليًا.",
  sectionDisabled: "هذا القسم غير مفعل حاليًا.",
  loadError: "تعذر تحميل المحتوى حاليًا.",
  networkError: "تعذر الاتصال. تحقق من الشبكة ثم أعد المحاولة.",
  contentLoading: "تحديث المحتوى",
  updating: "تحديث المحتوى",
} as const;

export const ACTION = {
  continueWhereLeft: "متابعة من حيث توقفت",
  browseAllLessons: "استعرض جميع الدروس",
  openSeries: "انتقل إلى السلسلة",
  viewAllLectures: "عرض جميع المحاضرات",
  exploreSection: "اكتشف محتوى هذا القسم",
  retry: "إعادة المحاولة",
  refreshContent: "تحديث المحتوى",
  clearFilter: "مسح التصفية",
  openSystemSettings: "فتح إعدادات النظام",
  customizeAlerts: "تخصيص التنبيهات",
  previewSound: "معاينة الصوت",
  viewDetails: "عرض التفاصيل",
  saveForLater: "حفظ للرجوع إليه",
  removeFromSaved: "إزالة من المحفوظات",
  browseAll: "استعرض جميع الدروس",
  discoverMore: "اكتشف المزيد في هذا القسم",
  continueListening: "أكمل استماعك",
  viewSeries: "انتقل إلى السلسلة",
  clearSearchHistory: "امسح سجل البحث",
  browseContent: "استعرض المحتوى",
  clearSearch: "مسح البحث",
  browseMaterials: "استعرض المواد",
  retryConnection: "إعادة المحاولة",
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
