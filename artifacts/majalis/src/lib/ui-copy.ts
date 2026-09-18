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
  generic: "لا يتوفر محتوى هنا الآن. تصفّح قسمًا آخر أو عد لاحقًا.",
  search: "لم نجد نتيجة مطابقة. جرّب كلمات أوضح أو أقل تقييدًا.",
  searchShort: "لم نجد نتيجة مطابقة.",
  lessonsCategory: "لا دروس في هذا التصنيف. جرّب تصنيفًا آخر.",
  competitions: "لا مسابقات جارية الآن.",
  data: "لا يتوفر محتوى هنا الآن.",
  library: "لا كتب معروضة في هذا القسم الآن.",
  librarySearch: "لم نجد كتابًا مطابقًا. جرّب كلمة أخرى أو أزل التصفية.",
  notifications: "لا إشعارات جديدة.",
  notificationsArchived: "لا إشعارات مؤرشفة.",
  citations: "احفظ المواد المهمة لتعود إليها بسهولة.",
  folders: "لم تُنشئ مجلدات بعد.",
  continue: "تابع من حيث توقفت",
  continueEmpty: "ابدأ من المصحف أو الدروس.",
  savedEmpty: "احفظ المواد المهمة لتعود إليها بسهولة.",
  bookmarks: "لم تحفظ مواد بعد.",
  downloads: "لا مواد منزّلة على هذا الجهاز.",
  seriesLessons: "لا دروس منشورة في هذه السلسلة الآن.",
  offline: "تعذّر الاتصال. يمكنك متابعة المحتوى المحفوظ.",
  fiqhSearch: "لا نتائج داخل الفقه — جرّب كلمة أخرى.",
  fiqhCategory: "لا كتب في هذا التصنيف الآن.",
  learningPath: "المقررات غير منشورة هنا. تصفّح الدروس للمتابعة.",
  tafsirAyah: "لا تفسير متاح لهذه الآية في المصدر المعتمد حاليًا.",
} as const;

export const SEARCH = {
  placeholder: "ابحث عن درس، حديث، حكم، أو عالم",
  fiqh: "ابحث في الكتب والأبواب والمسائل…",
  global: "ابحث في المحتوى…",
  lessons: "ابحث في الدروس…",
  hadith: "ابحث في الحديث…",
  adhkar: "ابحث في الأذكار…",
} as const;

export const STATUS = {
  pageUnavailable: "هذه الصفحة غير متاحة حاليًا.",
  sectionDisabled: "هذا القسم غير مفعّل في الواجهة العامة.",
  loadError: "تعذّر تحميل المحتوى. أعد المحاولة.",
  networkError: "تعذّر الاتصال. تحقق من الشبكة ثم أعد المحاولة.",
  contentLoading: "تجهيز المحتوى…",
  updating: "تجهيز المحتوى…",
} as const;

export const ACTION = {
  continueWhereLeft: "متابعة من حيث توقفت",
  browseAllLessons: "استعرض جميع الدروس",
  openSeries: "انتقل إلى السلسلة",
  viewAllLectures: "عرض جميع المحاضرات",
  exploreSection: "استكشف محتوى هذا القسم",
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

export const SECTION_LEAD = {
  home: "منصة علمية موثّقة: مصحف، دروس، فقه، حديث، وعبادة يومية.",
  fiqh: "كتب فقه مرتّبة: كتاب ← باب ← مسائل موثّقة على المذهب الحنبلي.",
  fiqhNote: "محتوى تعليمي موثّق على المذهب الحنبلي — للفهم والتعلّم، وليس فتوى شخصية من المنصة.",
  lessons: "دروس علمية مرتّبة للحضور أو المتابعة لاحقًا.",
  hadith: "أحاديث وشروح ومصطلح الحديث بمصادر معتمدة.",
  prayer: "أوقات الصلاة والقبلة وتنبيه الأذان لموقعك.",
  adhkar: "أذكار الصباح والمساء وما بينهما.",
  quran: "مصحف وتلاوة وتجويد وحفظ — من موضعك الأخير.",
  sections: "عقيدة وحديث وسيرة ومكتبة وأدوات طالب العلم.",
  search: "ابحث في الدروس والحديث والفقه والمصحف دفعة واحدة.",
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
  sectionNote: "للتنبيه والتمييز — لا يُعمل بالضعيف في الأحكام.",
} as const;
