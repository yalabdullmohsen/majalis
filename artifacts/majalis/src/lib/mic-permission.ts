/**
 * فحوصات استباقية لإذن الميكروفون قبل تشغيل محرك التسميع.
 */

export type MicPermissionState = "granted" | "denied" | "prompt" | "unsupported";

export type MicEnsureResult = {
  ok: boolean;
  state: MicPermissionState;
  /** رسالة عربية مختصرة للواجهة */
  message?: string;
};

function mapPermissionState(raw: string | undefined): MicPermissionState {
  if (raw === "granted") return "granted";
  if (raw === "denied") return "denied";
  if (raw === "prompt") return "prompt";
  return "prompt";
}

/** قراءة حالة الإذن دون طلب — عبر Permissions API إن توفّرت. */
export async function queryMicPermission(): Promise<MicPermissionState> {
  if (typeof navigator === "undefined") return "unsupported";
  if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
  try {
    const perms = navigator.permissions;
    if (perms?.query) {
      const status = await perms.query({ name: "microphone" as PermissionName });
      return mapPermissionState(status.state);
    }
  } catch {
    /* Safari قد يرفض query(microphone) */
  }
  return "prompt";
}

/**
 * يجهّز AudioContext بهدوء (إن أمكن) ثم يطلب الميكروفون عند الحاجة.
 * يغلق المسارات فورًا — الهدف التحقق فقط لا التسجيل.
 */
export async function ensureMicPermission(): Promise<MicEnsureResult> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return {
      ok: false,
      state: "unsupported",
      message: "هذا المتصفح لا يدعم الوصول إلى الميكروفون.",
    };
  }

  const prior = await queryMicPermission();
  if (prior === "denied") {
    return {
      ok: false,
      state: "denied",
      message: "إذن الميكروفون مرفوض. فعّله من إعدادات المتصفح ثم أعد المحاولة.",
    };
  }

  try {
    // إحماء AudioContext اختياري — يقلّل تأخير أول إطار صوتي بعد المنح
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        if (ctx.state === "suspended") await ctx.resume().catch(() => undefined);
        void ctx.close().catch(() => undefined);
      }
    } catch {
      /* غير حرج */
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    for (const track of stream.getTracks()) track.stop();
    return { ok: true, state: "granted" };
  } catch (err) {
    const name = err instanceof DOMException ? err.name : "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return {
        ok: false,
        state: "denied",
        message: "إذن الميكروفون مرفوض. فعّله من إعدادات المتصفح ثم أعد المحاولة.",
      };
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return {
        ok: false,
        state: "unsupported",
        message: "لم يُعثر على ميكروفون متّصل بهذا الجهاز.",
      };
    }
    return {
      ok: false,
      state: "prompt",
      message: "تعذّر التحقق من إذن الميكروفون. أعد المحاولة.",
    };
  }
}

export type MicHelpPlatform = "ios" | "android" | "chrome" | "safari" | "edge" | "firefox" | "web";

/** يستنتج منصة الإرشاد من UA / Capacitor. */
export function detectMicHelpPlatform(opts?: {
  isNative?: boolean;
  isIOS?: boolean;
  isAndroid?: boolean;
}): MicHelpPlatform {
  if (opts?.isNative && opts.isIOS) return "ios";
  if (opts?.isNative && opts.isAndroid) return "android";
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) return "edge";
  if (/Firefox\//i.test(ua)) return "firefox";
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua) && !/Chromium\//i.test(ua)) return "safari";
  if (/Chrome\//i.test(ua) || /Chromium\//i.test(ua)) return "chrome";
  return "web";
}

export function micHelpSteps(platform: MicHelpPlatform): string {
  switch (platform) {
    case "ios":
      return "افتح إعدادات آيفون ← مرِّر لتطبيق «المجلس العلمي» ← فعِّل «الميكروفون» و«التعرّف على الكلام»، ثم عد وحاول مجددًا.";
    case "android":
      return "افتح إعدادات الجهاز ← التطبيقات ← «المجلس العلمي» ← الأذونات ← فعِّل «الميكروفون»، ثم عد وحاول مجددًا.";
    case "safari":
      return "في سفاري: اضغط على «اأ» أو أيقونة الموقع بجانب العنوان ← موقع ويب ← الميكروفون ← اسمح، ثم أعد تحميل الصفحة.";
    case "edge":
      return "في Edge: اضغط أيقونة القفل 🔒 بجانب العنوان ← أذونات الموقع ← الميكروفون ← اسمح، ثم أعد تحميل الصفحة.";
    case "firefox":
      return "في Firefox: اضغط أيقونة القفل بجانب العنوان ← الصلاحيات ← الميكروفون ← اسمح، ثم أعد تحميل الصفحة.";
    case "chrome":
    case "web":
    default:
      return "اضغط أيقونة القفل 🔒 بجانب عنوان الموقع في المتصفح ← اسمح بإذن «الميكروفون» لهذا الموقع، ثم أعد تحميل الصفحة.";
  }
}
