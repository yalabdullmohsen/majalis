// Web Notifications API wrapper — إشعارات محلية في المتصفح

const STORAGE_KEY = "majalis_notif_prefs_v1";

export type NotifPrefs = {
  enabled: boolean;
  flashcardsReminder: boolean;   // مراجعة البطاقات المستحقة
  resumeReminder: boolean;       // الدرس الذي لم يُكتمل
  prayerReminder: boolean;       // قبل الصلاة بـ 10 دقائق
  reminderHour: number;          // الساعة المفضلة للتذكير (0-23)
  reminderMinute: number;
};

const DEFAULTS: NotifPrefs = {
  enabled: false,
  flashcardsReminder: true,
  resumeReminder: true,
  prayerReminder: false,
  reminderHour: 8,
  reminderMinute: 0,
};

export function loadNotifPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveNotifPrefs(prefs: NotifPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function getPermissionStatus(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export function sendLocalNotification(
  title: string,
  options?: { body?: string; icon?: string; tag?: string },
): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body: options?.body,
      icon: options?.icon ?? "/logo.png",
      tag: options?.tag,
      dir: "rtl",
      lang: "ar",
    });
  } catch {
    // Safari may throw if page is not focused
  }
}

// ── جدولة التذكيرات عند تحميل الصفحة ──────────────────────────────────────

const SCHED_KEY = "majalis_notif_sched_v1";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function alreadySentToday(tag: string): boolean {
  try {
    const raw = localStorage.getItem(SCHED_KEY);
    const sent: Record<string, string> = raw ? JSON.parse(raw) : {};
    return sent[tag] === todayKey();
  } catch {
    return false;
  }
}

function markSentToday(tag: string): void {
  try {
    const raw = localStorage.getItem(SCHED_KEY);
    const sent: Record<string, string> = raw ? JSON.parse(raw) : {};
    sent[tag] = todayKey();
    localStorage.setItem(SCHED_KEY, JSON.stringify(sent));
  } catch { /* localStorage unavailable */ }
}

export function scheduleFlashcardsReminder(dueCount: number): void {
  if (dueCount === 0 || alreadySentToday("flashcards")) return;
  sendLocalNotification("📇 لديك بطاقات مستحقة", {
    body: `${dueCount} بطاقة تنتظر مراجعتك اليوم في المجلس العلمي.`,
    tag: "flashcards",
  });
  markSentToday("flashcards");
}

export function scheduleResumeReminder(title: string): void {
  if (!title || alreadySentToday("resume")) return;
  sendLocalNotification("📍 تابع من حيث توقفت", {
    body: `لم تُكمل: "${title}" — استمر الآن.`,
    tag: "resume",
  });
  markSentToday("resume");
}

export function schedulePrayerReminder(prayerName: string, minutesLeft: number): void {
  if (minutesLeft > 12 || minutesLeft < 8) return;
  if (alreadySentToday(`prayer-${prayerName}`)) return;
  sendLocalNotification(`🕌 ${prayerName} بعد ${minutesLeft} دقائق`, {
    body: "استعدّ لصلاتك.",
    tag: `prayer-${prayerName}`,
  });
  markSentToday(`prayer-${prayerName}`);
}

// ── تذكير العبادات الإسلامية حسب التقويم الهجري ────────────────────────────

type IslamicRemindersPool = { icon: string; title: string; body: string }[];

function getIslamicReminders(): IslamicRemindersPool {
  try {
    const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      timeZone: "Asia/Kuwait",
      day: "numeric",
      month: "numeric",
    });
    const parts = formatter.formatToParts(new Date());
    const month = parseInt(parts.find((p) => p.type === "month")?.value ?? "0", 10);
    const day   = parseInt(parts.find((p) => p.type === "day")?.value ?? "0", 10);

    // رمضان
    if (month === 9) {
      if (day >= 21) return [
        { icon: "✨", title: "ليلة القدر في انتظارك", body: "العشر الأواخر من رمضان — ابحث عن ليلة القدر بالقيام والدعاء." },
        { icon: "🤲", title: "دعاء العشر الأواخر",   body: "اللهم إنك عفو تحب العفو فاعفُ عنّا." },
      ];
      return [
        { icon: "🌙", title: "صُم يومك احتساباً",    body: "رمضان المبارك — الصيام والتلاوة والقيام والصدقة." },
        { icon: "📖", title: "ورد القرآن اليومي",    body: "خصّص ساعة للتلاوة اليوم — رمضان شهر القرآن." },
      ];
    }

    // عشر ذي الحجة
    if (month === 12 && day <= 9) return [
      { icon: "⭐", title: "أفضل أيام الدنيا",       body: `يوم ${day} من ذي الحجة — أكثر من التكبير والصيام والذكر.` },
      { icon: "🌙", title: "صيام التسع",             body: "صيام الأيام التسع من أفضل الأعمال — لا تُفوّتها." },
    ];

    // عاشوراء
    if (month === 1 && day <= 10) return [
      { icon: "🌙", title: "صيام عاشوراء",           body: day === 10 ? "اليوم عاشوراء — صيامه يُكفّر السنة الماضية." : `تبقّى ${10 - day} أيام على عاشوراء.` },
    ];

    // ست شوال
    if (month === 10 && day <= 6) return [
      { icon: "🌙", title: "الست من شوال لا تزال",   body: "من صام رمضان وأتبعه ستاً من شوال كصيام الدهر." },
    ];

    // تذكيرات يومية عامة
    const general: IslamicRemindersPool = [
      { icon: "🕌", title: "لا تُفوّت صلاة الجماعة",   body: "المحافظة على الصلوات في أوقاتها أعظم الأعمال." },
      { icon: "📿", title: "أذكار الصباح والمساء",      body: "لا تبدأ يومك دون أذكار الصباح — هي حصنك اليومي." },
      { icon: "📖", title: "ورد القرآن اليومي",          body: "اجعل لك حزباً يومياً من القرآن لا تُخلّ به." },
      { icon: "🌙", title: "صيام الاثنين والخميس",       body: "سنّة النبي ﷺ — وفيهما تُعرض الأعمال على الله." },
      { icon: "💝", title: "تصدّق اليوم",               body: "الصدقة تدفع البلاء وتُطفئ غضب الرب." },
      { icon: "🤲", title: "الاستغفار",                  body: "أكثر من الاستغفار — فللمستغفرين من الله رزق وفرج." },
    ];
    const pick = general[new Date().getDay() % general.length];
    return [pick];
  } catch {
    return [{ icon: "🕌", title: "تذكير", body: "حافظ على صلواتك وأذكارك اليومية." }];
  }
}

export function scheduleIslamicReminder(): void {
  if (alreadySentToday("islamic-reminder")) return;
  const pool = getIslamicReminders();
  if (!pool.length) return;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  sendLocalNotification(`${pick.icon} ${pick.title}`, {
    body: pick.body,
    tag: "islamic-reminder",
  });
  markSentToday("islamic-reminder");
}
