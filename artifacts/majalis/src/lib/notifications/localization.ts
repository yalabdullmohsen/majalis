/**
 * localization — نصوص إشعارات سُنّة (مركزية).
 *
 * قواعد الصياغة:
 * - عربية فصحى سهلة، هادئة، قصيرة.
 * - لا افتراض لفعل المستخدم، لا أوامر جافة، لا دعاية.
 * - لا تكرار بلا حاجة لاسم الصلاة أو الوقت بين العنوان والمتن.
 * - لا تعديل لنص قرآني أو حديث أو ذكر شرعي ثابت.
 * - تنويع دوري عبر pickLocalizedNotification.
 */

export type LocalizedNotification = {
  title: string;
  body: string;
};

export type NotificationTemplate = {
  title: string;
  body: string;
};

/** مفاتيح القوالب الموحّدة. */
export type NotificationCatalogKey =
  | "prayerPre"
  | "prayerAdhan"
  | "prayerPost"
  | "prayerIqamah"
  | "prayerRespect"
  | "jumuah"
  | "adhkarMorning"
  | "adhkarEvening"
  | "learning"
  | "lessonFollowup"
  | "general"
  | "quranDaily"
  | "flashcards"
  | "streak"
  | "khatmah";

const STORE_KEY = "ssunnah-notif-locale-idx-v1";

/**
 * قوالب موحّدة — placeholders:
 * {{name}} اسم الصلاة · {{mins}} رقم · {{minsPhrase}} عبارة دقائق
 * {{clock}} وقت الساعة · {{count}} عدد · {{item}} عنصر متابعة
 */
export const NOTIFICATION_CATALOG: Record<NotificationCatalogKey, readonly NotificationTemplate[]> = {
  /** تنبيه قبل الصلاة */
  prayerPre: [
    { title: "تنبيه {{name}}", body: "الصلاة بعد {{minsPhrase}}." },
    { title: "اقترب الموعد", body: "صلاة {{name}} بعد {{minsPhrase}}." },
    { title: "تنبيه الصلاة", body: "بقي {{minsPhrase}} على {{name}}." },
    { title: "وقت قريب", body: "{{name}} بعد {{minsPhrase}}." },
  ],

  /** أذان الصلاة */
  prayerAdhan: [
    { title: "أذان {{name}}", body: "دخل الوقت." },
    { title: "أذان {{name}}", body: "حان الأذان." },
    { title: "وقت الصلاة", body: "دخل وقت صلاة {{name}}." },
    { title: "أذان {{name}}", body: "تقبل الله طاعتكم." },
    { title: "أذان {{name}}", body: "نسأل الله لكم القبول." },
  ],

  /** التذكير بعد الأذان */
  prayerPost: [
    { title: "وقت الصلاة", body: "تذكير بصلاة {{name}}." },
    { title: "وقت الصلاة", body: "تقبل الله طاعتكم في صلاة {{name}}." },
    { title: "تذكير هادئ", body: "صلاة {{name}} ما زالت في وقتها." },
    { title: "وقت الصلاة", body: "نسأل الله لكم القبول في صلاة {{name}}." },
  ],

  /** إقامة */
  prayerIqamah: [
    { title: "إقامة {{name}}", body: "قد قامت الصلاة." },
    { title: "الإقامة", body: "إقامة صلاة {{name}}." },
    { title: "إقامة {{name}}", body: "حيّ على الفلاح." },
  ],

  /** هدوء الجوال وقت الصلاة — بلا افتراض أن المستخدم يصلّي */
  prayerRespect: [
    { title: "وقت الصلاة", body: "يُستحسن وضع الجوال على الصامت." },
    { title: "وقت الصلاة", body: "الصامت أرفق بك وبمن حولك." },
    { title: "وقت الصلاة", body: "هدوء الجوال يعين على الخشوع." },
    { title: "وقت الصلاة", body: "أغلق الجوال أو اجعله على الصامت." },
  ],

  /** الجمعة */
  jumuah: [
    { title: "يوم الجمعة", body: "تذكير بصلاة الجمعة." },
    { title: "الجمعة", body: "وقت فاضل؛ أكثر من الصلاة على النبي ﷺ." },
    { title: "تذكير الجمعة", body: "سورة الكهف من سنن هذا اليوم." },
    { title: "يوم الجمعة", body: "تقبل الله طاعتكم." },
  ],

  /** أذكار الصباح — لا نلمس نص الأذكار نفسها */
  adhkarMorning: [
    { title: "أذكار الصباح", body: "ورد الصباح في انتظارك." },
    { title: "أذكار الصباح", body: "وقت مناسب لورد الصباح." },
    { title: "ورد الصباح", body: "ابدأ يومك بذكر الله." },
  ],

  /** أذكار المساء */
  adhkarEvening: [
    { title: "أذكار المساء", body: "ورد المساء في انتظارك." },
    { title: "أذكار المساء", body: "وقت مناسب لورد المساء." },
    { title: "ورد المساء", body: "اختم يومك بذكر الله." },
  ],

  /** التنبيهات التعليمية */
  learning: [
    { title: "فائدة جديدة", body: "أُضيفت فائدة علمية جديدة." },
    { title: "علم جديد", body: "محتوى علمي بانتظار مطالعتك." },
    { title: "تنبيه علمي", body: "لديك إضافة علمية جديدة." },
  ],

  /** متابعة الدروس */
  lessonFollowup: [
    { title: "متابعة الدرس", body: "يمكنك متابعة «{{item}}» من حيث توقفت." },
    { title: "درس بانتظارك", body: "«{{item}}» لم يُكمل بعد." },
    { title: "متابعة", body: "عد إلى «{{item}}» متى شئت." },
  ],

  /** التنبيهات العامة */
  general: [
    { title: "تذكير", body: "حافظ على صلواتك وأذكارك." },
    { title: "تذكير هادئ", body: "لحظة خير في يومك." },
    { title: "تذكير", body: "نسأل الله لكم التوفيق." },
  ],

  /** ورد القرآن اليومي */
  quranDaily: [
    { title: "ورد القرآن", body: "وقت مناسب لوردك اليومي." },
    { title: "وقت القراءة", body: "ورد القرآن بانتظارك." },
    { title: "ورد يومي", body: "آيات تُتلى متى تيسّر." },
  ],

  /** البطاقات التعليمية */
  flashcards: [
    { title: "مراجعة البطاقات", body: "{{count}} بطاقة بانتظار المراجعة." },
    { title: "بطاقات مستحقة", body: "لديك {{count}} بطاقة للمراجعة." },
    { title: "مراجعة هادئة", body: "{{count}} بطاقة جاهزة اليوم." },
  ],

  /** السلسلة */
  streak: [
    { title: "تذكير السلسلة", body: "نشاط قصير يكفي للحفاظ على سلسلتك." },
    { title: "سلسلتك اليوم", body: "لم يُسجَّل نشاط بعد؛ دقيقة واحدة تكفي." },
    { title: "تذكير هادئ", body: "أكمل وردًا يسيرًا اليوم إن تيسّر." },
  ],

  /** الختمة */
  khatmah: [
    { title: "ورد الختمة", body: "تقدمك اليوم أقل من المعتاد قليلاً." },
    { title: "الختمة", body: "دقائق قصيرة تعوّض الصفحات المتأخرة." },
    { title: "تذكير الختمة", body: "ورد اليوم ما زال بانتظارك." },
  ],
} as const;

/** تذكيرات موسمية/عامة — بلا أوامر جافة ولا دعاية. */
export const SEASONAL_NOTIFICATION_POOL = {
  ramadanLate: [
    { title: "العشر الأواخر", body: "أيام فاضلة؛ القيام والدعاء مما يُستحب." },
    { title: "رمضان", body: "اللهم إنك عفو تحب العفو فاعفُ عنّا." },
  ],
  ramadan: [
    { title: "رمضان", body: "شهر الصيام والقرآن." },
    { title: "ورد القرآن", body: "وقت مناسب للتلاوة في رمضان." },
  ],
  dhulHijjah: [
    { title: "أيام ذي الحجة", body: "أيام فاضلة؛ الذكر والصيام مما يُستحب." },
    { title: "عشر ذي الحجة", body: "أيام عظيمة عند الله." },
  ],
  ashura: [
    { title: "عاشوراء", body: "صيام هذا اليوم من السنن الفاضلة." },
  ],
  shawwal: [
    { title: "ستّ شوال", body: "إتمام ستّة أيام من شوال سنة ثابتة." },
  ],
  daily: [
    { title: "الصلوات", body: "المحافظة على الصلاة في وقتها من أعظم العمل." },
    { title: "الأذكار", body: "أذكار الصباح والمساء حصن يومي." },
    { title: "ورد القرآن", body: "حزب يومي يسير خير من انقطاع." },
    { title: "صيام النفل", body: "الاثنين والخميس من السنن الثابتة." },
    { title: "صدقة", body: "صدقة ولو يسيرة تترك أثرًا." },
    { title: "الاستغفار", body: "الاستغفار باب رزق وفرج." },
  ],
} as const;

type FillVars = {
  name?: string;
  mins?: number | string;
  minsPhrase?: string;
  clock?: string;
  count?: number | string;
  item?: string;
};

function loadIndexMap(): Record<string, number> {
  try {
    if (typeof localStorage === "undefined") return {};
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveIndexMap(map: Record<string, number>): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORE_KEY, JSON.stringify(map));
  } catch {
    /* تجاهل */
  }
}

export function fillNotificationTemplate(template: string, vars: FillVars = {}): string {
  return template
    .replaceAll("{{name}}", vars.name ?? "")
    .replaceAll("{{mins}}", String(vars.mins ?? ""))
    .replaceAll("{{minsPhrase}}", vars.minsPhrase ?? String(vars.mins ?? ""))
    .replaceAll("{{clock}}", vars.clock ?? "")
    .replaceAll("{{count}}", String(vars.count ?? ""))
    .replaceAll("{{item}}", vars.item ?? "")
    .replace(/\s*—\s*/g, "، ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.،])/g, "$1")
    .trim();
}

/** اختيار دوري من مجموعة قوالب مع تجنّب إعادة آخر عنصر فورًا. */
export function pickFromPool(
  poolKey: string,
  pool: readonly NotificationTemplate[],
  vars: FillVars = {},
): LocalizedNotification {
  if (!pool.length) {
    return { title: "تذكير", body: "نسأل الله لكم التوفيق." };
  }
  try {
    const map = loadIndexMap();
    const prev = map[poolKey] ?? -1;
    let next = (prev + 1) % pool.length;
    if (pool.length > 1 && next === prev) next = (next + 1) % pool.length;
    map[poolKey] = next;
    saveIndexMap(map);
    const tpl = pool[next] ?? pool[0]!;
    return {
      title: fillNotificationTemplate(tpl.title, vars),
      body: fillNotificationTemplate(tpl.body, vars),
    };
  } catch {
    const tpl = pool[0]!;
    return {
      title: fillNotificationTemplate(tpl.title, vars),
      body: fillNotificationTemplate(tpl.body, vars),
    };
  }
}

export function pickLocalizedNotification(
  key: NotificationCatalogKey,
  vars: FillVars = {},
): LocalizedNotification {
  return pickFromPool(key, NOTIFICATION_CATALOG[key], vars);
}

/** صياغة عربية لعدد دقائق التنبيه المسبق. */
export function formatNotificationMinutesPhrase(minutes: number): string {
  const mins = Math.max(1, Math.round(minutes));
  if (mins === 1) return "دقيقة واحدة";
  if (mins === 2) return "دقيقتين";
  if (mins >= 3 && mins <= 10) return `${mins} دقائق`;
  return `${mins} دقيقة`;
}

/**
 * يلحق الساعة بالمتن مرة واحدة إن وُجدت، دون تكرارها في العنوان.
 * لا يضيف الساعة إن كان المتن يذكرها أصلًا.
 */
export function withOptionalClock(body: string, clock?: string): string {
  const c = (clock || "").trim();
  if (!c) return body;
  if (body.includes(c)) return body;
  return `${body} · ${c}`;
}

/** بناء إشعار صلاة مجدول (قبل / أذان / بعد / إقامة). */
export function buildPrayerLocalizedCopy(opts: {
  kind: "pre" | "enter" | "post" | "iqamah";
  prayerName: string;
  prayerTimeLabel?: string;
  minutesBefore?: number;
}): LocalizedNotification {
  const name = opts.prayerName;
  const clock = (opts.prayerTimeLabel || "").trim();

  if (opts.kind === "pre") {
    const mins = Math.max(1, Math.round(opts.minutesBefore ?? 15));
    const minsPhrase = formatNotificationMinutesPhrase(mins);
    const copy = pickLocalizedNotification("prayerPre", {
      name,
      mins,
      minsPhrase,
    });
    return { title: copy.title, body: withOptionalClock(copy.body, clock) };
  }

  if (opts.kind === "enter") {
    const copy = pickLocalizedNotification("prayerAdhan", { name });
    return { title: copy.title, body: withOptionalClock(copy.body, clock) };
  }

  if (opts.kind === "iqamah") {
    const copy = pickLocalizedNotification("prayerIqamah", { name });
    return { title: copy.title, body: withOptionalClock(copy.body, clock) };
  }

  const copy = pickLocalizedNotification("prayerPost", { name });
  return { title: copy.title, body: withOptionalClock(copy.body, clock) };
}
