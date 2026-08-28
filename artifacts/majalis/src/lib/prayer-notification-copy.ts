/**
 * نصوص إشعارات الصلاة.
 * للتنبيهات المجدوَلة: النص يُشتق من الوقت الفعلي عند الجدولة (يحمل ساعة الصلاة).
 * القوالب الدورية تبقى للمسارات القديمة/الاختبارات دون ادعاء «ربع ساعة» كاذب.
 */

export type PrayerNotifKind =
  | "pre-15"
  | "pre-10"
  | "pre-5"
  | "enter"
  | "after"
  | "post-soft";

export type PrayerNotifCopy = {
  title: string;
  body: string;
};

type Template = {
  title: string;
  /** يُستبدل {{name}} و {{mins}} */
  body: string;
};

const STORE_KEY = "majalis-prayer-notif-copy-idx-v1";

const TEMPLATES: Record<PrayerNotifKind, Template[]> = {
  enter: [
    { title: "أذان {{name}}", body: "حان وقت صلاة {{name}}" },
    { title: "أذان {{name}}", body: "حيّ على الصلاة، {{name}}" },
    { title: "أذان {{name}}", body: "دخل وقت {{name}}، تقبل الله" },
    { title: "أذان {{name}}", body: "حان الآن وقت صلاة {{name}}" },
  ],
  "pre-15": [
    { title: "اقترب وقت {{name}}", body: "بقي {{mins}} دقيقة على صلاة {{name}}" },
    { title: "اقترب وقت {{name}}", body: "اقترب وقت {{name}}، استعد للصلاة" },
    { title: "اقترب وقت {{name}}", body: "صلاة {{name}} بعد {{mins}} دقيقة" },
  ],
  "pre-10": [
    { title: "اقترب وقت {{name}}", body: "بقي {{mins}} دقائق على صلاة {{name}}" },
    { title: "اقترب وقت {{name}}", body: "اقترب وقت {{name}}، استعد" },
    { title: "اقترب وقت {{name}}", body: "صلاة {{name}} بعد عشر دقائق" },
  ],
  "pre-5": [
    { title: "اقترب وقت {{name}}", body: "بقي {{mins}} دقائق على صلاة {{name}}" },
    { title: "اقترب وقت {{name}}", body: "صلاة {{name}} بعد قليل، استعد" },
    { title: "اقترب وقت {{name}}", body: "اقتربت صلاة {{name}}" },
  ],
  after: [
    { title: "وقت الصلاة", body: "دخل وقت {{name}}، تقبل الله" },
    { title: "وقت الصلاة", body: "لا تنس صلاة {{name}}" },
    { title: "وقت الصلاة", body: "صلاة {{name}} قائمة، بارك الله فيك" },
  ],
  "post-soft": [
    { title: "تذكير خفيف", body: "هل أديت صلاة {{name}}؟" },
    { title: "تذكير بالصلاة", body: "تذكير لطيف بصلاة {{name}}" },
    { title: "تذكير خفيف", body: "لا تنس صلاة {{name}}" },
  ],
};

const FALLBACK: PrayerNotifCopy = {
  title: "تنبيه الصلاة",
  body: "حان وقت الصلاة",
};

function fill(template: string, name: string, mins: number): string {
  return template
    .replaceAll("{{name}}", name)
    .replaceAll("{{mins}}", String(mins))
    .replace(/\s*—\s*/g, "، ")
    .replace(/\s+/g, " ")
    .trim();
}

function loadIndexMap(): Record<string, number> {
  try {
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
    localStorage.setItem(STORE_KEY, JSON.stringify(map));
  } catch {
    /* تجاهل */
  }
}

/** أقرب مجموعة نصوص حسب دقائق التنبيه المسبق. */
export function preAlertKindForMinutes(minutes: number): "pre-15" | "pre-10" | "pre-5" {
  if (minutes <= 5) return "pre-5";
  if (minutes <= 10) return "pre-10";
  return "pre-15";
}

/**
 * نص مجدول يحمل وقت الصلاة صراحةً — أي انحراف مستقبلي يظهر فورًا للمستخدم.
 * العنوان: استعد للصلاة / أذان …
 * الجسم: المغرب ٦:٢٧ م · بعد ١٥ دقيقة
 */
/** صياغة عربية لعدد الدقائق في نص التنبيه المسبق. */
export function formatPreAlertMinutesPhrase(minutes: number): string {
  const mins = Math.max(1, Math.round(minutes));
  if (mins === 1) return "دقيقة واحدة";
  if (mins === 2) return "دقيقتين";
  if (mins >= 3 && mins <= 10) return `${mins} دقائق`;
  return `${mins} دقيقة`;
}

export function buildScheduledPrayerNotificationCopy(opts: {
  kind: "pre" | "enter" | "post";
  prayerName: string;
  prayerTimeLabel: string;
  minutesBefore?: number;
}): PrayerNotifCopy {
  const name = opts.prayerName;
  const clock = opts.prayerTimeLabel;
  if (opts.kind === "pre") {
    const mins = Math.max(1, Math.round(opts.minutesBefore ?? 15));
    return {
      title: `اقترب وقت ${name}`,
      body: `بقي ${formatPreAlertMinutesPhrase(mins)} على صلاة ${name}`,
    };
  }
  if (opts.kind === "enter") {
    return {
      title: `أذان ${name}`,
      body: `حان وقت صلاة ${name}`,
    };
  }
  return {
    title: `تذكير ${name}`,
    body: `هل أديت صلاة ${name}؟ (${clock})`,
  };
}

/**
 * يختار نصًا دوريًا لنوع الإشعار، مع تجنّب إعادة آخر نص فورًا عند توفر بدائل.
 * عند الفشل يرجع fallback آمنًا بلا شرطة طويلة.
 */
export function pickPrayerNotificationCopy(
  kind: PrayerNotifKind,
  prayerName: string,
  minutes = 0,
): PrayerNotifCopy {
  try {
    const pool = TEMPLATES[kind];
    if (!pool?.length) {
      return {
        title: FALLBACK.title,
        body: fill("حان وقت صلاة {{name}}", prayerName, minutes) || FALLBACK.body,
      };
    }

    const map = loadIndexMap();
    const prev = map[kind] ?? -1;
    let next = (prev + 1) % pool.length;
    if (pool.length > 1 && next === prev) {
      next = (next + 1) % pool.length;
    }
    map[kind] = next;
    saveIndexMap(map);

    const tpl = pool[next] ?? pool[0];
    return {
      title: fill(tpl.title, prayerName, minutes),
      body: fill(tpl.body, prayerName, minutes),
    };
  } catch {
    return {
      title: FALLBACK.title,
      body: fill("اقتربت صلاة {{name}}، متبقي {{mins}} دقيقة", prayerName, minutes) || FALLBACK.body,
    };
  }
}

/** للاختبارات: كل القوالب بلا شرطة طويلة وبلا فراغات ركيكة. */
export function listPrayerNotificationTemplates(): Record<PrayerNotifKind, Template[]> {
  return TEMPLATES;
}
