/**
 * تشغيل/إيقاف عنصر الصوت فقط — بلا كتالوج مؤذنين.
 * يُستورد من شريط الإشعار دون سحب adhan-audio إلى حزمة الدخول.
 * يدعم fade-in وتفضيل المسار المحلي / كاش Cache API.
 */

import { preferLocalAdhanUrl } from "./adhan-offline-assets";

let _current: HTMLAudioElement | null = null;
let _stopTimer: ReturnType<typeof setTimeout> | null = null;
let _fadeRaf: number | null = null;
let _objectUrl: string | null = null;

const FADE_MS = 900;

export type AdhanPlayErrorCode =
  | "missing_file"
  | "load_failed"
  | "autoplay_blocked"
  | "unknown";

export type AdhanPlayResult =
  | { ok: true; audio: HTMLAudioElement }
  | { ok: false; code: AdhanPlayErrorCode; message: string };

function clearStopTimer() {
  if (_stopTimer) {
    clearTimeout(_stopTimer);
    _stopTimer = null;
  }
}

function clearFade() {
  if (_fadeRaf != null && typeof cancelAnimationFrame === "function") {
    cancelAnimationFrame(_fadeRaf);
  }
  _fadeRaf = null;
}

function revokeObjectUrl() {
  if (_objectUrl) {
    try {
      URL.revokeObjectURL(_objectUrl);
    } catch {
      /* ignore */
    }
    _objectUrl = null;
  }
}

function fadeIn(audio: HTMLAudioElement, target: number) {
  clearFade();
  const start = performance.now();
  const from = 0;
  const tick = (now: number) => {
    if (_current !== audio) return;
    const t = Math.min(1, (now - start) / FADE_MS);
    audio.volume = from + (target - from) * t;
    if (t < 1) {
      _fadeRaf = requestAnimationFrame(tick);
    } else {
      _fadeRaf = null;
    }
  };
  audio.volume = 0;
  if (typeof requestAnimationFrame === "function") {
    _fadeRaf = requestAnimationFrame(tick);
  } else {
    audio.volume = target;
  }
}

async function resolvePlayableUrl(url: string): Promise<string> {
  const preferred = preferLocalAdhanUrl(url);
  try {
    const { getCachedAdhanUrl } = await import("./adhan-downloads");
    const cached =
      (await getCachedAdhanUrl(preferred)) ||
      (preferred !== url ? await getCachedAdhanUrl(url) : null);
    if (cached) {
      _objectUrl = cached;
      return cached;
    }
  } catch {
    /* offline-db / cache optional */
  }
  return preferred;
}

function classifyPlayError(err: unknown): { code: AdhanPlayErrorCode; message: string } {
  const name =
    err && typeof err === "object" && "name" in err
      ? String((err as { name: string }).name)
      : "";
  const msg =
    err && typeof err === "object" && "message" in err
      ? String((err as { message: string }).message)
      : "";
  if (
    name === "NotAllowedError" ||
    /user didn't interact|play\(\) failed because|NotAllowed/i.test(msg)
  ) {
    return {
      code: "autoplay_blocked",
      message:
        "الجهاز منع التشغيل قبل تفاعل المستخدم — اضغط «تجربة الصوت» مرة أخرى.",
    };
  }
  if (
    name === "NotSupportedError" ||
    /no supported source|DEMUXER|format/i.test(msg)
  ) {
    return { code: "load_failed", message: "فشل تحميل الصوت أو الصيغة غير مدعومة." };
  }
  return { code: "unknown", message: msg || "تعذّر تشغيل صوت الأذان." };
}

function emitPlayError(code: AdhanPlayErrorCode, message: string, url: string) {
  console.warn("[adhan] play failed:", code, message, url);
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("majalis:adhan-play-error", {
          detail: { code, message, url },
        }),
      );
    }
  } catch {
    /* ignore */
  }
}

/**
 * تشغيل مع انتظار النتيجة — للواجهات التي تعرض سبب الفشل.
 */
export async function playAdhanUrlAsync(
  url: string,
  volume = 1,
  opts?: { maxMs?: number | null; fadeIn?: boolean },
): Promise<AdhanPlayResult> {
  if (!url) {
    return { ok: false, code: "missing_file", message: "ملف الصوت غير موجود." };
  }
  stopAdhan();
  try {
    const { ensureNativePlaybackAudioSession } = await import("@/lib/native-playback-audio");
    await ensureNativePlaybackAudioSession({
      title: "الأذان",
      artist: "المجلس العلمي",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[adhan] native playback session failed:", msg);
    const { isIOS, isNative } = await import("@/lib/capacitor-utils");
    if (isNative && isIOS) {
      const message =
        msg.includes("recording")
          ? "جلسة الصوت مشغولة بالتسجيل — أوقف التلاوة/الكلام ثم أعد المحاولة."
          : "فشل تفعيل جلسة الصوت (AVAudioSession playback).";
      emitPlayError("unknown", message, url);
      return { ok: false, code: "unknown", message };
    }
  }
  const audio = new Audio();
  const targetVol = Math.min(1, Math.max(0, volume));
  const useFade = opts?.fadeIn !== false;
  audio.preload = "auto";
  audio.volume = useFade ? 0 : targetVol;
  _current = audio;

  const maxMs = opts?.maxMs;
  if (typeof maxMs === "number" && maxMs > 0) {
    _stopTimer = setTimeout(() => stopAdhan(), maxMs);
  }

  try {
    const playUrl = await resolvePlayableUrl(url);
    if (_current !== audio) {
      return { ok: false, code: "unknown", message: "أُلغي التشغيل." };
    }
    audio.src = playUrl;

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        audio.removeEventListener("error", onErr);
        audio.removeEventListener("canplaythrough", onReady);
        audio.removeEventListener("loadeddata", onReady);
        fn();
      };
      const onErr = () => finish(() => reject(new Error("media_error")));
      const onReady = () => finish(() => resolve());
      audio.addEventListener("error", onErr);
      audio.addEventListener("canplaythrough", onReady);
      audio.addEventListener("loadeddata", onReady);
      audio.load();
      setTimeout(() => {
        finish(() => {
          if (audio.readyState >= 2) resolve();
          else reject(new Error("load_timeout"));
        });
      }, 10_000);
    });

    if (_current !== audio) {
      return { ok: false, code: "unknown", message: "أُلغي التشغيل." };
    }
    await audio.play();
    if (useFade && _current === audio) fadeIn(audio, targetVol);
    return { ok: true, audio };
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === "media_error" || err.message === "load_timeout")
    ) {
      stopAdhan();
      const code = err.message === "media_error" ? "missing_file" : "load_failed";
      const message =
        err.message === "media_error"
          ? "تعذر تشغيل الصوت، جرّب نوعًا آخر."
          : "تعذر تشغيل الصوت، جرّب نوعًا آخر.";
      emitPlayError(code, message, url);
      return { ok: false, code, message };
    }
    stopAdhan();
    const classified = classifyPlayError(err);
    emitPlayError(classified.code, classified.message, url);
    return { ok: false, ...classified };
  }
}

/**
 * واجهة متوافقة — تعيد عنصر الصوت الفعلي وتُبلّغ عن الأخطاء عبر الحدث.
 */
export function playAdhanUrl(
  url: string,
  volume = 1,
  opts?: { maxMs?: number | null; fadeIn?: boolean },
): HTMLAudioElement {
  stopAdhan();
  const audio = new Audio();
  const targetVol = Math.min(1, Math.max(0, volume));
  const useFade = opts?.fadeIn !== false;
  audio.preload = "auto";
  audio.volume = useFade ? 0 : targetVol;
  _current = audio;

  const maxMs = opts?.maxMs;
  if (typeof maxMs === "number" && maxMs > 0) {
    _stopTimer = setTimeout(() => stopAdhan(), maxMs);
  }

  void (async () => {
    try {
      if (!url) {
        emitPlayError("missing_file", "ملف الصوت غير موجود.", url);
        return;
      }
      const playUrl = await resolvePlayableUrl(url);
      if (_current !== audio) return;
      audio.src = playUrl;
      await audio.play();
      if (useFade && _current === audio) fadeIn(audio, targetVol);
    } catch (err) {
      if (_current !== audio) return;
      const classified = classifyPlayError(err);
      // خطأ تحميل الوسائط
      if (audio.error) {
        emitPlayError("missing_file", "الملف غير موجود أو تعذّر قراءته.", url);
        return;
      }
      emitPlayError(classified.code, classified.message, url);
    }
  })();

  return audio;
}

export function stopAdhan() {
  clearStopTimer();
  clearFade();
  if (_current) {
    try {
      _current.pause();
      _current.currentTime = 0;
      _current.removeAttribute("src");
      _current.load();
    } catch {
      /* ignore */
    }
    _current = null;
  }
  revokeObjectUrl();
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("majalis:adhan-stopped"));
    }
  } catch {
    /* ignore */
  }
}

export function isAdhanPlaying() {
  return !!_current && !_current.paused;
}
