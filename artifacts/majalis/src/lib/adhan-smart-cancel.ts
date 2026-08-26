/**
 * إلغاء ذكي لسلسلة مقاطع الأذان (iOS) واستئناف بالمشغّل الداخلي.
 *
 * القواعد:
 *  - فتح التطبيق أو ضغط أي إشعار من السلسلة → إلغاء بقية المقاطع فورًا
 *  - عند الإلغاء داخل التطبيق → إكمال الأذان من المشغّل الداخلي (لا إشعارات)
 *  - لا سلسلة > 4؛ لا سلسلتان متداخلتان (يُلغى السابق عند الجدولة)
 *  - احترام الوضع الصامت مع خيار تجاوز صريح
 */

import { isNative } from "./capacitor-utils";
import { getEffectiveMuezzinId, loadAdhanPrefs, PRAYER_ARABIC, type PrayerKey } from "./adhan-preferences";
import { getMuezzin, playAdhan } from "./adhan-audio";
import { ADHAN_IOS_MAX_SEGMENTS } from "./adhan-ios-segments";
import { ADHAN_EVENT_NAME, type AdhanEvent } from "./adhan-events";

const RESUME_STORE_KEY = "majalis-adhan-resume-v1";

export type AdhanResumeContext = {
  prayerKey: PrayerKey;
  muezzinId: string;
  isFajr: boolean;
  /** فهرس المقطع الذي أُلغي عنده (0-based) — للاستئناف من منتصف السلسلة تقريبًا */
  cancelledAtSegment: number;
  storedAt: number;
};

let _listenersAttached = false;
let _busy = false;
/** احتياطي عند غياب sessionStorage (Node/اختبارات) */
let _memoryResume: AdhanResumeContext | null = null;

function storageGet(key: string): string | null {
  try {
    if (typeof sessionStorage !== "undefined") return sessionStorage.getItem(key);
  } catch {
    /* ignore */
  }
  return null;
}

function storageSet(key: string, value: string | null) {
  try {
    if (typeof sessionStorage === "undefined") return;
    if (value == null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function readResume(): AdhanResumeContext | null {
  try {
    const raw = storageGet(RESUME_STORE_KEY);
    if (raw) return JSON.parse(raw) as AdhanResumeContext;
  } catch {
    /* ignore */
  }
  return _memoryResume;
}

function writeResume(ctx: AdhanResumeContext | null) {
  _memoryResume = ctx;
  storageSet(RESUME_STORE_KEY, ctx ? JSON.stringify(ctx) : null);
}

/** يخزّن سياق الاستئناف قبل/أثناء سلسلة الإشعارات */
export function rememberAdhanResumeContext(
  ctx: Omit<AdhanResumeContext, "storedAt" | "cancelledAtSegment"> & {
    cancelledAtSegment?: number;
  },
): void {
  writeResume({
    prayerKey: ctx.prayerKey,
    muezzinId: ctx.muezzinId,
    isFajr: ctx.isFajr,
    cancelledAtSegment: ctx.cancelledAtSegment ?? 0,
    storedAt: Date.now(),
  });
}

export function clearAdhanResumeContext(): void {
  writeResume(null);
}

export function getAdhanResumeContext(): AdhanResumeContext | null {
  return readResume();
}

/** هل يُسمح بتجاوز الوضع الصامت/عدم الإزعاج؟ */
export function shouldBypassSilentMode(): boolean {
  return loadAdhanPrefs().bypassSilentMode === true;
}

/**
 * يلغي سلسلة مقاطع iOS (+ أندرويد إن وُجد الجسر) ويعيد عدد المعرّفات الملغاة.
 * إن resumeInternal=true يشغّل الأذان كاملًا داخل التطبيق بعد الإلغاء.
 */
export async function cancelAdhanNotificationChain(opts?: {
  resumeInternal?: boolean;
  cancelledAtSegment?: number;
}): Promise<{ cancelledIds: number[]; resumed: boolean }> {
  if (_busy) return { cancelledIds: [], resumed: false };
  _busy = true;
  try {
    let cancelledIds: number[] = [];
    try {
      const { cancelAdhanIosSegmentChain } = await import("./adhan-ios-segments");
      cancelledIds = await cancelAdhanIosSegmentChain();
    } catch {
      /* ignore */
    }

    // أندرويد: إلغاء منبّهات الصلوات إن وُجد الجسر
    try {
      const android = await import("./adhan-android-alarm");
      const keys: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
      await Promise.all(keys.map((k) => android.cancelAndroidFullAdhan(k)));
    } catch {
      /* غير أصلي */
    }

    let resumed = false;
    if (opts?.resumeInternal) {
      resumed = await resumeAdhanInternally({
        cancelledAtSegment: opts.cancelledAtSegment,
      });
    } else {
      clearAdhanResumeContext();
    }
    return { cancelledIds, resumed };
  } finally {
    _busy = false;
  }
}

/** يشغّل الأذان من المشغّل الداخلي بعد إلغاء سلسلة الإشعارات */
export async function resumeAdhanInternally(opts?: {
  cancelledAtSegment?: number;
}): Promise<boolean> {
  const prefs = loadAdhanPrefs();
  if (!prefs.globalEnabled) {
    clearAdhanResumeContext();
    return false;
  }
  if (prefs.playbackMode === "silent") {
    clearAdhanResumeContext();
    return false;
  }

  const ctx = readResume();
  const prayerKey = ctx?.prayerKey;
  if (!prayerKey || !prefs.prayers[prayerKey]?.enabled) {
    clearAdhanResumeContext();
    return false;
  }

  const muezzinId = ctx?.muezzinId || getEffectiveMuezzinId(prefs, prayerKey);
  const muezzin = getMuezzin(muezzinId);
  const isFajr = ctx?.isFajr ?? prayerKey === "fajr";

  if (opts?.cancelledAtSegment != null && ctx) {
    writeResume({ ...ctx, cancelledAtSegment: opts.cancelledAtSegment });
  }

  // بيئة بلا HTMLAudioElement (اختبارات Node) — نُلغي السياق دون تشغيل
  if (typeof Audio === "undefined") {
    clearAdhanResumeContext();
    return false;
  }

  try {
    const { ensureNativePlaybackAudioSession } = await import("./native-playback-audio");
    await ensureNativePlaybackAudioSession({
      title: "الأذان",
      artist: muezzin.name,
    });
  } catch {
    /* ويب أو فشل الجلسة — نكمل بـ HTMLAudio */
  }

  const audio = playAdhan(muezzin, isFajr, "full", prefs.volume ?? 1);
  if (audio && typeof window !== "undefined") {
    const event: AdhanEvent = {
      type: "adhan",
      prayerKey,
      prayerName: PRAYER_ARABIC[prayerKey] ?? prayerKey,
    };
    window.dispatchEvent(new CustomEvent(ADHAN_EVENT_NAME, { detail: event }));
  }
  clearAdhanResumeContext();
  return Boolean(audio);
}

/** تفاعل مع إشعار مقطع أذان — إلغاء البقية + استئناف داخلي */
export async function onAdhanSegmentNotificationInteraction(extra: unknown): Promise<boolean> {
  if (!extra || typeof extra !== "object") return false;
  const e = extra as { adhanSegment?: unknown; prayerKey?: unknown; segmentIndex?: unknown };
  if (!e.adhanSegment) return false;
  const segmentIndex =
    typeof e.segmentIndex === "number" && Number.isFinite(e.segmentIndex)
      ? Math.max(0, Math.min(ADHAN_IOS_MAX_SEGMENTS - 1, e.segmentIndex))
      : 0;
  await cancelAdhanNotificationChain({
    resumeInternal: true,
    cancelledAtSegment: segmentIndex,
  });
  return true;
}

/**
 * يربط مستمعي فتح التطبيق ونقر الإشعار مرة واحدة.
 * يُستدعى من bootstrap الإشعارات الأصلية.
 */
export async function attachAdhanSmartCancelListeners(): Promise<void> {
  if (!isNative || _listenersAttached) return;
  _listenersAttached = true;

  try {
    const { App } = await import("@capacitor/app");
    await App.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) return;
      // فتح التطبيق أثناء سلسلة → ألغِ البقية وأكمل داخليًا إن وُجد سياق
      const ctx = readResume();
      void cancelAdhanNotificationChain({ resumeInternal: Boolean(ctx) });
    });
  } catch {
    /* ignore */
  }

  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.addListener("localNotificationActionPerformed", (event) => {
      void onAdhanSegmentNotificationInteraction(event.notification?.extra);
    });
  } catch {
    /* ignore */
  }
}

/** بوابة اختبار: الحد الأقصى للسلسلة */
export function adhanSmartCancelMaxSegments(): number {
  return ADHAN_IOS_MAX_SEGMENTS;
}
