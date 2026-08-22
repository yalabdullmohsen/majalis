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
const ADHAN_PLAY_TIMEOUT_MS = 10_000;
const ADHAN_FAIL_MSG = "تعذر تشغيل الصوت، جرّب نوعًا آخر.";

export async function playAdhanUrlAsync(
  url: string,
  volume = 1,
  opts?: { maxMs?: number | null; fadeIn?: boolean },
): Promise<AdhanPlayResult> {
  if (!url) {
    return { ok: false, code: "missing_file", message: ADHAN_FAIL_MSG };
  }
  stopAdhan();
  const audio = new Audio();
  try {
    audio.setAttribute("playsinline", "true");
    (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
  } catch {
    /* ignore */
  }
  const targetVol = Math.min(1, Math.max(0, volume));
  const useFade = opts?.fadeIn !== false;
  audio.preload = "auto";
  audio.volume = useFade ? 0 : targetVol;
  _current = audio;
  audio.src = preferLocalAdhanUrl(url);

  const maxMs = opts?.maxMs;
  if (typeof maxMs === "number" && maxMs > 0) {
    _stopTimer = setTimeout(() => stopAdhan(), maxMs);
  }

  void import("@/lib/native-playback-audio")
    .then((m) =>
      m.ensureNativePlaybackAudioSession({
        title: "الأذان",
        artist: "المجلس العلمي",
      }),
    )
    .catch((e) => console.warn("[adhan] native playback session:", e));

  try {
    const playPromise = audio.play();
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        audio.removeEventListener("playing", onPlaying);
        audio.removeEventListener("error", onErr);
        window.clearTimeout(timer);
        fn();
      };
      const onPlaying = () => finish(() => resolve());
      const onErr = () => finish(() => reject(new Error("media_error")));
      const timer = window.setTimeout(
        () => finish(() => reject(new Error("load_timeout"))),
        ADHAN_PLAY_TIMEOUT_MS,
      );
      audio.addEventListener("playing", onPlaying);
      audio.addEventListener("error", onErr);
      if (playPromise && typeof playPromise.then === "function") {
        playPromise.catch((err) => finish(() => reject(err)));
      }
    });
    if (_current !== audio) {
      return { ok: false, code: "unknown", message: "أُلغي التشغيل." };
    }
    if (useFade && _current === audio) fadeIn(audio, targetVol);
    void resolvePlayableUrl(url).catch(() => undefined);
    return { ok: true, audio };
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === "media_error" || err.message === "load_timeout")
    ) {
      stopAdhan();
      const code = err.message === "media_error" ? "missing_file" : "load_failed";
      emitPlayError(code, ADHAN_FAIL_MSG, url);
      return { ok: false, code, message: ADHAN_FAIL_MSG };
    }
    stopAdhan();
    const classified = classifyPlayError(err);
    const message =
      classified.code === "autoplay_blocked" ? classified.message : ADHAN_FAIL_MSG;
    emitPlayError(classified.code, message, url);
    return { ok: false, code: classified.code, message };
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

  audio.src = preferLocalAdhanUrl(url);
  void import("@/lib/native-playback-audio")
    .then((m) =>
      m.ensureNativePlaybackAudioSession({
        title: "الأذان",
        artist: "المجلس العلمي",
      }),
    )
    .catch(() => undefined);
  void (async () => {
    try {
      if (!url) {
        emitPlayError("missing_file", ADHAN_FAIL_MSG, url);
        return;
      }
      await audio.play();
      if (useFade && _current === audio) fadeIn(audio, targetVol);
    } catch (err) {
      if (_current !== audio) return;
      const classified = classifyPlayError(err);
      emitPlayError(
        audio.error ? "missing_file" : classified.code,
        classified.code === "autoplay_blocked" ? classified.message : ADHAN_FAIL_MSG,
        url,
      );
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
