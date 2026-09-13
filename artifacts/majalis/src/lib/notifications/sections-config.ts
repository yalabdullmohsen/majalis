/**
 * أقسام الإشعارات الموحّدة — بدون تسمية «الإشعارات الإسلامية».
 * كل قسم: تفعيل، عدد يومي، فترة، أيام أسبوع، معاينة، ورسائل قصيرة فصيحة.
 */

export type NotifSectionId =
  | "prayer"
  | "quran"
  | "adhkar"
  | "salawat"
  | "istighfar"
  | "lessons"
  | "seekingKnowledge"
  | "fridayOccasions";

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // أحد…السبت

export type NotifSectionPrefs = {
  enabled: boolean;
  /** عدد الإشعارات يوميًا (1–20 حسب القسم) */
  dailyCount: number;
  /** بداية الفترة HH */
  windowStartHour: number;
  /** نهاية الفترة HH */
  windowEndHour: number;
  /** أيام التفعيل؛ فارغ = كل الأيام */
  weekdays: Weekday[];
};

export type NotifMessage = { title: string; body: string };

export type NotifSectionMeta = {
  id: NotifSectionId;
  title: string;
  description: string;
  /** مسار تفصيلي اختياري (مثل إعدادات الأذان) */
  href?: string;
  defaults: NotifSectionPrefs;
  /** حدود العدد اليومي المسموح */
  countMin: number;
  countMax: number;
  /** خيارات عدد سريعة (للصلاة على النبي / الاستغفار) */
  countPresets?: number[];
  messages: readonly NotifMessage[];
};

const ALL_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

const baseDay = (partial?: Partial<NotifSectionPrefs>): NotifSectionPrefs => ({
  enabled: false,
  dailyCount: 1,
  windowStartHour: 8,
  windowEndHour: 20,
  weekdays: [...ALL_DAYS],
  ...partial,
});

/** رسائل الصلاة — العنوان يحمل الحدث؛ المتن ساعة فقط بصيغة ص/م دون تكرار الاسم أو الوقت في الجملة. */
export const PRAYER_MESSAGE_POOL = {
  adhan: [
    { title: "أذان الفجر", body: "ص {{clock}}" },
    { title: "أذان الظهر", body: "ص {{clock}}" },
    { title: "أذان العصر", body: "م {{clock}}" },
    { title: "أذان المغرب", body: "م {{clock}}" },
    { title: "أذان العشاء", body: "م {{clock}}" },
  ],
  pre: [
    { title: "اقترب أذان الفجر", body: "ص {{clock}}" },
    { title: "اقترب أذان الظهر", body: "ص {{clock}}" },
    { title: "اقترب أذان العصر", body: "م {{clock}}" },
    { title: "اقترب أذان المغرب", body: "م {{clock}}" },
    { title: "اقترب أذان العشاء", body: "م {{clock}}" },
  ],
  post: [
    { title: "تذكير بصلاة الفجر", body: "ص {{clock}}" },
    { title: "تذكير بصلاة الظهر", body: "ص {{clock}}" },
    { title: "تذكير بصلاة العصر", body: "م {{clock}}" },
    { title: "تذكير بصلاة المغرب", body: "م {{clock}}" },
    { title: "تذكير بصلاة العشاء", body: "م {{clock}}" },
  ],
} as const;

export const NOTIF_SECTIONS: readonly NotifSectionMeta[] = [
  {
    id: "prayer",
    title: "الصلاة",
    description: "تذكير قبل الأذان وعند حلوله وبعده لكل فرض",
    href: "/adhan-settings",
    defaults: baseDay({ enabled: true, dailyCount: 5, windowStartHour: 4, windowEndHour: 23 }),
    countMin: 1,
    countMax: 15,
    messages: [
      { title: "أذان الفجر", body: "ص ٤:١١" },
      { title: "اقترب أذان الفجر", body: "ص ٤:١١" },
      { title: "تذكير بصلاة الفجر", body: "ص ٤:١١" },
      { title: "أذان الظهر", body: "ص ١٢:٠٥" },
      { title: "اقترب أذان الظهر", body: "ص ١٢:٠٥" },
      { title: "أذان العصر", body: "م ٣:٣٠" },
      { title: "اقترب أذان العصر", body: "م ٣:٣٠" },
      { title: "أذان المغرب", body: "م ٦:١٥" },
      { title: "اقترب أذان المغرب", body: "م ٦:١٥" },
      { title: "أذان العشاء", body: "م ٧:٤٥" },
      { title: "اقترب أذان العشاء", body: "م ٧:٤٥" },
      { title: "تذكير بصلاة الظهر", body: "ص ١٢:٠٥" },
      { title: "تذكير بصلاة العصر", body: "م ٣:٣٠" },
      { title: "تذكير بصلاة المغرب", body: "م ٦:١٥" },
      { title: "تذكير بصلاة العشاء", body: "م ٧:٤٥" },
    ],
  },
  {
    id: "quran",
    title: "القرآن",
    description: "تذكير بورد التلاوة والمتابعة من آخر موضع",
    defaults: baseDay({ enabled: true, dailyCount: 2, windowStartHour: 9, windowEndHour: 21 }),
    countMin: 1,
    countMax: 6,
    messages: [
      { title: "ورد القرآن", body: "خصص وقتاً لوردك اليومي." },
      { title: "متابعة التلاوة", body: "تابع من آخر موضع وصلت إليه." },
      { title: "ورد اليوم", body: "آية اليوم في انتظارك." },
      { title: "ختمة مستمرة", body: "أكمل صفحتك من المصحف." },
      { title: "تلاوة هادئة", body: "افتح المصحف ولو لآيات قليلة." },
      { title: "مراجعة الحفظ", body: "راجع ما حفظته اليوم." },
      { title: "تدبّر آية", body: "اقرأ آية بتأنٍّ." },
      { title: "ورد المساء", body: "وقت مناسب لوردك." },
      { title: "ورد الصباح", body: "ابدأ يومك بآيات." },
      { title: "الاستماع", body: "استمع لتلاوة قصيرة." },
      { title: "سورة قصيرة", body: "اختر سورة وأتممها." },
      { title: "صفحة من المصحف", body: "أكمل صفحة واحدةً واحدةً." },
      { title: "تثبيت الحفظ", body: "أعد قراءة ما ثبت لديك." },
      { title: "متابعة الحزب", body: "أكمل حزب يومك." },
      { title: "فتح المصحف", body: "عُد إلى موضعك المحفوظ." },
    ],
  },
  {
    id: "adhkar",
    title: "الأذكار",
    description: "أذكار الصباح والمساء والنوم في أوقاتها",
    defaults: baseDay({ enabled: true, dailyCount: 3, windowStartHour: 6, windowEndHour: 22 }),
    countMin: 1,
    countMax: 6,
    messages: [
      { title: "أذكار الصباح", body: "ورد الصباح جاهز." },
      { title: "أذكار المساء", body: "ورد المساء جاهز." },
      { title: "أذكار النوم", body: "أذكار قبل النوم." },
      { title: "أذكار الصباح", body: "حان وقت ورد الصباح." },
      { title: "أذكار المساء", body: "حان وقت ورد المساء." },
      { title: "أذكار النوم", body: "اختم يومك بالذكر." },
      { title: "أذكار الصباح", body: "ابدأ بذكر الله." },
      { title: "أذكار المساء", body: "احفظ ورد المساء." },
      { title: "أذكار النوم", body: "أذكار النوم قصيرة وميسّرة." },
      { title: "أذكار الصباح", body: "لا يفوتك ورد الصباح." },
      { title: "أذكار المساء", body: "أتمم أذكار المساء." },
      { title: "أذكار النوم", body: "وقت مناسب لأذكار النوم." },
      { title: "أذكار الصباح", body: "ورد الصباح بين يديك." },
      { title: "أذكار المساء", body: "ورد المساء بين يديك." },
      { title: "أذكار النوم", body: "ذكّر نفسك قبل النوم." },
    ],
  },
  {
    id: "salawat",
    title: "الصلاة على النبي ﷺ",
    description: "تذكير يومي بالصلاة على النبي ﷺ بالعدد الذي اخترته",
    defaults: baseDay({ enabled: true, dailyCount: 3, windowStartHour: 8, windowEndHour: 21 }),
    countMin: 1,
    countMax: 20,
    countPresets: [1, 2, 3, 5, 10],
    messages: [
      { title: "الصلاة على النبي ﷺ", body: "اللهم صلِّ على محمد." },
      { title: "الصلاة على النبي ﷺ", body: "أكثر من الصلاة عليه ﷺ." },
      { title: "الصلاة على النبي ﷺ", body: "وقت للصلاة على النبي ﷺ." },
      { title: "الصلاة على النبي ﷺ", body: "صلِّ عليه وسلم." },
      { title: "الصلاة على النبي ﷺ", body: "ذكّر نفسك بالصلاة عليه." },
      { title: "الصلاة على النبي ﷺ", body: "أتمم ورد الصلاة عليه ﷺ." },
      { title: "الصلاة على النبي ﷺ", body: "لا تنسَ الصلاة عليه ﷺ." },
      { title: "الصلاة على النبي ﷺ", body: "اللهم صلِّ وسلِّم عليه." },
      { title: "الصلاة على النبي ﷺ", body: "أتمم وردك من الصلاة عليه." },
      { title: "الصلاة على النبي ﷺ", body: "صلِّ عليه عددًا يسيرًا الآن." },
      { title: "الصلاة على النبي ﷺ", body: "تذكير بالصلاة على النبي ﷺ." },
      { title: "الصلاة على النبي ﷺ", body: "اللهم صلِّ على نبينا محمد." },
      { title: "الصلاة على النبي ﷺ", body: "أكثر من الصلاة والتسليم." },
      { title: "الصلاة على النبي ﷺ", body: "وقت مناسب للصلاة عليه." },
      { title: "الصلاة على النبي ﷺ", body: "صلِّ عليه ﷺ بقلب حاضر." },
    ],
  },
  {
    id: "istighfar",
    title: "الاستغفار",
    description: "تذكير يومي بورد الاستغفار بالعدد الذي اخترته",
    defaults: baseDay({ enabled: true, dailyCount: 3, windowStartHour: 8, windowEndHour: 21 }),
    countMin: 1,
    countMax: 20,
    countPresets: [1, 2, 3, 5, 10],
    messages: [
      { title: "الاستغفار", body: "أستغفر الله." },
      { title: "الاستغفار", body: "أكثر من الاستغفار." },
      { title: "الاستغفار", body: "وقت للاستغفار." },
      { title: "الاستغفار", body: "أستغفر الله وأتوب إليه." },
      { title: "الاستغفار", body: "ذكّر نفسك بالاستغفار." },
      { title: "الاستغفار", body: "استغفار يسير الآن." },
      { title: "الاستغفار", body: "لا تنسَ الاستغفار." },
      { title: "الاستغفار", body: "أتمم ورد الاستغفار." },
      { title: "الاستغفار", body: "تذكير بورد الاستغفار." },
      { title: "الاستغفار", body: "أستغفر الله العظيم." },
      { title: "الاستغفار", body: "أكثر من قول أستغفر الله." },
      { title: "الاستغفار", body: "وقت مناسب للاستغفار." },
      { title: "الاستغفار", body: "استغفر لذنبك بصدق." },
      { title: "الاستغفار", body: "أدرج الاستغفار بين أعمالك." },
      { title: "الاستغفار", body: "اختم ساعتك باستغفار." },
    ],
  },
  {
    id: "lessons",
    title: "الدروس",
    description: "تذكير بدرس اليوم وجدول الغد ومراجعة الأسبوع",
    defaults: baseDay({ enabled: true, dailyCount: 2, windowStartHour: 9, windowEndHour: 21 }),
    countMin: 1,
    countMax: 8,
    messages: [
      { title: "درس اليوم", body: "درسك اليوم جاهز." },
      { title: "دروس الغد", body: "اطّلع على جدول الغد." },
      { title: "دروس الأسبوع", body: "راجع دروس هذا الأسبوع." },
      { title: "قبل الدرس", body: "الدرس يقترب." },
      { title: "بدء الدرس", body: "حان وقت الدرس." },
      { title: "درس اليوم", body: "أكمل درس يومك." },
      { title: "دروس الغد", body: "حضّر لدروس الغد." },
      { title: "دروس الأسبوع", body: "خطة الأسبوع بين يديك." },
      { title: "قبل الدرس", body: "استعد للدرس القادم." },
      { title: "بدء الدرس", body: "ابدأ الدرس الآن." },
      { title: "درس اليوم", body: "تابع درس اليوم." },
      { title: "دروس الغد", body: "دروس الغد مجدولة." },
      { title: "دروس الأسبوع", body: "لا تفوّت دروس الأسبوع." },
      { title: "قبل الدرس", body: "تذكير قبل بدء الدرس." },
      { title: "بدء الدرس", body: "الدرس يبدأ." },
    ],
  },
  {
    id: "seekingKnowledge",
    title: "طلب العلم",
    description: "متابعة البرامج العلمية والسلاسل من موضعك",
    defaults: baseDay({ enabled: false, dailyCount: 2, windowStartHour: 10, windowEndHour: 20 }),
    countMin: 1,
    countMax: 6,
    messages: [
      { title: "البرامج العلمية", body: "تابع برنامجك العلمي." },
      { title: "السلاسل", body: "أكمل سلسلتك الحالية." },
      { title: "متابعة التعلّم", body: "لديك درس لم تُكمله بعد." },
      { title: "المحفوظات", body: "راجع محفوظاتك." },
      { title: "البرامج العلمية", body: "درس من برنامجك بانتظارك." },
      { title: "السلاسل", body: "الحلقة التالية جاهزة." },
      { title: "عودة للدرس", body: "عُد إلى ما توقفت عنده." },
      { title: "المحفوظات", body: "محفوظاتك تحتاج مراجعة." },
      { title: "البرامج العلمية", body: "استمر في برنامجك." },
      { title: "السلاسل", body: "سلسلة لم تُكمل بعد." },
      { title: "أكمل مسارك", body: "أكمل ما بدأته من العلم." },
      { title: "المحفوظات", body: "ثبّت ما حفظته." },
      { title: "البرامج العلمية", body: "وقت لمتابعة العلم." },
      { title: "السلاسل", body: "تابع السلسلة من موضعك." },
      { title: "درس معلّق", body: "موضع قراءتك ينتظر عودتك." },
    ],
  },
  {
    id: "fridayOccasions",
    title: "الجمعة والمناسبات",
    description: "سنن الجمعة وسورة الكهف وتذكير المواسم الفاضلة",
    defaults: baseDay({
      enabled: true,
      dailyCount: 2,
      windowStartHour: 7,
      windowEndHour: 18,
      weekdays: [5],
    }),
    countMin: 1,
    countMax: 5,
    messages: [
      { title: "يوم الجمعة", body: "تذكير بصلاة الجمعة وسننها." },
      { title: "سورة الكهف", body: "اقرأ سورة الكهف أو ما تيسّر منها." },
      { title: "المواسم الشرعية", body: "موسم فاضل؛ زد من العمل المشروع." },
      { title: "يوم الجمعة", body: "أكثر من الصلاة على النبي ﷺ." },
      { title: "سورة الكهف", body: "سورة الكهف من أعمال يوم الجمعة الثابتة." },
      { title: "المواسم الشرعية", body: "أيام يُرجى فيها مضاعفة العمل الصالح." },
      { title: "يوم الجمعة", body: "تهيأ لصلاة الجمعة قبل النداء." },
      { title: "سورة الكهف", body: "وقت مناسب لإتمام ورد الكهف." },
      { title: "المواسم الشرعية", body: "اغتنم الموسم بما ثبت دون غلو." },
      { title: "يوم الجمعة", body: "راجع سنن الجمعة اليسيرة." },
      { title: "سورة الكهف", body: "لا يؤخَّر ورد الكهف عن يومه." },
      { title: "المواسم الشرعية", body: "ذكّر نفسك بالطاعة في هذا الموسم." },
      { title: "يوم الجمعة", body: "بكّر إلى الجمعة إن تيسّر." },
      { title: "سورة الكهف", body: "اقرأ ما تيسّر من الكهف بخشوع." },
      { title: "المواسم الشرعية", body: "موسم خير؛ التزم الثابت من العمل." },
    ],
  },
];

export function getNotifSection(id: NotifSectionId): NotifSectionMeta {
  const found = NOTIF_SECTIONS.find((s) => s.id === id);
  if (!found) throw new Error(`unknown notif section: ${id}`);
  return found;
}

export function defaultSectionsPrefs(): Record<NotifSectionId, NotifSectionPrefs> {
  return Object.fromEntries(NOTIF_SECTIONS.map((s) => [s.id, { ...s.defaults, weekdays: [...s.defaults.weekdays] }])) as Record<
    NotifSectionId,
    NotifSectionPrefs
  >;
}

const LAST_MSG_KEY = "ssunnah-notif-section-last-msg-v1";

type LastMsgMap = Partial<Record<NotifSectionId, number>>;

function readLastMap(): LastMsgMap {
  try {
    const raw = localStorage.getItem(LAST_MSG_KEY);
    return raw ? (JSON.parse(raw) as LastMsgMap) : {};
  } catch {
    return {};
  }
}

function writeLastMap(map: LastMsgMap): void {
  try {
    localStorage.setItem(LAST_MSG_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** اختيار رسالة مع منع تكرار نفس الفهرس مرتين متتاليتين. */
export function pickSectionMessage(sectionId: NotifSectionId, pool?: readonly NotifMessage[]): NotifMessage {
  const section = getNotifSection(sectionId);
  const messages = pool && pool.length > 0 ? pool : section.messages;
  if (messages.length === 0) return { title: section.title, body: "" };
  if (messages.length === 1) return messages[0]!;

  const lastMap = readLastMap();
  const last = lastMap[sectionId];
  let idx = Math.floor(Math.random() * messages.length);
  if (last != null && idx === last) {
    idx = (idx + 1 + Math.floor(Math.random() * (messages.length - 1))) % messages.length;
  }
  lastMap[sectionId] = idx;
  writeLastMap(lastMap);
  return messages[idx]!;
}

/** معاينة ثابتة (بدون عشوائية) لواجهة الإعدادات. */
export function previewSectionMessage(sectionId: NotifSectionId): NotifMessage {
  const section = getNotifSection(sectionId);
  return section.messages[0] ?? { title: section.title, body: "" };
}

export function formatSectionStatus(prefs: NotifSectionPrefs): string {
  if (!prefs.enabled) return "متوقف";
  const n = prefs.dailyCount;
  if (n <= 0) return "مفعّل";
  return `${n.toLocaleString("ar-EG")} يوميًا`;
}

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: "أحد",
  1: "إثنين",
  2: "ثلاثاء",
  3: "أربعاء",
  4: "خميس",
  5: "جمعة",
  6: "سبت",
};
