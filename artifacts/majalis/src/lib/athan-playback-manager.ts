/**
 * AthanPlaybackManager — مشغّل أذان وحيد على مستوى التطبيق.
 *
 * جلسة الصلاة (prayer): Playing → Completed
 * لا Stopped إلا: user | superseded (أذان جديد) | error | completed.
 * لا تتأثر بالتنقل / unmount / منسّق المعاينات / claim من مالك أجنبي.
 *
 * المعاينة (preview): يجوز maxMs ووقف leave/bus.
 */

import {
  playAdhanUrl,
  playAdhanUrlAsync,
  stopAdhan as stopPlaybackElement,
  isAdhanPlaying as isPlaybackElementPlaying,
  setAdhanElementProtected,
  type AdhanPlayResult,
} from "@/lib/adhan-playback";
import { resolveAdhanClip, type AdhanPlaybackMode } from "@/lib/adhan-playback-modes";
import type { Muezzin } from "@/lib/adhan-audio";

export type AthanPhase = "idle" | "playing" | "completed" | "stopped" | "error";

export type AthanStopReason =
  | "user"
  | "superseded"
  | "error"
  | "completed"
  | "leave"
  | "interrupt"
  | "bus";

export type AthanSessionKind = "prayer" | "preview";

type Session = {
  kind: AthanSessionKind;
  gen: number;
  url: string;
  mode: AdhanPlaybackMode;
  audio: HTMLAudioElement | null;
};

let phase: AthanPhase = "idle";
let session: Session | null = null;
let genSeq = 0;
let endedHandler: ((this: HTMLAudioElement, ev: Event) => void) | null = null;

function setPhase(next: AthanPhase) {
  phase = next;
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("majalis:athan-phase", {
          detail: { phase: next, kind: session?.kind ?? null },
        }),
      );
    }
  } catch {
    /* ignore */
  }
}

function detachEnded(audio: HTMLAudioElement | null) {
  if (audio && endedHandler) {
    try {
      audio.removeEventListener("ended", endedHandler);
    } catch {
      /* ignore */
    }
  }
  endedHandler = null;
}

function hardStopElement() {
  const audio = session?.audio ?? null;
  detachEnded(audio);
  setAdhanElementProtected(false);
  stopPlaybackElement({ force: true });
}

/** هل جلسة أذان الصلاة محمية من الإيقاف الأجنبي؟ */
export function isProtectedAthanSession(): boolean {
  return session?.kind === "prayer" && phase === "playing";
}

export function getAthanPhase(): AthanPhase {
  return phase;
}

export function getAthanSessionKind(): AthanSessionKind | null {
  return session?.kind ?? null;
}

export function isAthanManagerPlaying(): boolean {
  return phase === "playing" && isPlaybackElementPlaying();
}

/**
 * إيقاف — جلسة الصلاة تتجاهل leave/interrupt/bus.
 */
export function stopAthan(reason: AthanStopReason): boolean {
  if (!session && phase === "idle") return false;

  if (session?.kind === "prayer" && phase === "playing") {
    if (reason === "leave" || reason === "interrupt" || reason === "bus") {
      return false;
    }
  }

  hardStopElement();
  session = null;

  if (reason === "completed") {
    setPhase("completed");
  } else if (reason === "error") {
    setPhase("error");
  } else {
    setPhase("stopped");
  }

  const settle = phase;
  queueMicrotask(() => {
    if (phase === settle && !session) setPhase("idle");
  });

  return true;
}

/** محاولة إيقاف من ناقل/منسّق أجنبي — no-op أثناء صلاة محمية */
export function tryStopAthanFromForeignOwner(): boolean {
  return stopAthan("bus");
}

function attachNaturalEnd(audio: HTMLAudioElement, expectedGen: number) {
  detachEnded(audio);
  endedHandler = () => {
    if (session?.gen !== expectedGen) return;
    detachEnded(audio);
    session = null;
    setPhase("completed");
    setAdhanElementProtected(false);
    stopPlaybackElement({ force: true });
    queueMicrotask(() => {
      if (!session && phase === "completed") setPhase("idle");
    });
  };
  audio.addEventListener("ended", endedHandler);
}

async function claimAdhanBus(): Promise<void> {
  try {
    const { claimAudio } = await import("@/lib/exclusive-audio-bus");
    await claimAudio("adhan", { skipCoordinatorStop: true });
  } catch {
    /* ignore */
  }
}

export type PlayAthanOptions = {
  muezzin: Muezzin;
  isFajr?: boolean;
  mode?: AdhanPlaybackMode;
  volume?: number;
  /** prayer = بلا maxMs ومحمي؛ preview = يجوز القصّ الزمني */
  kind: AthanSessionKind;
  maxMs?: number | null;
  fadeIn?: boolean;
};

/**
 * نقطة الدخول الوحيدة لتشغيل الأذان (صلاة أو معاينة).
 */
export async function playAthan(
  opts: PlayAthanOptions,
): Promise<AdhanPlayResult & { phase: AthanPhase }> {
  const mode = opts.mode ?? "full";
  if (mode === "silent") {
    stopAthan("superseded");
    return {
      ok: false,
      code: "missing_file",
      message: "الوضع الصامت — بلا تشغيل صوت.",
      phase: "idle",
    };
  }

  const clip = resolveAdhanClip(opts.muezzin, {
    isFajr: Boolean(opts.isFajr),
    mode,
  });
  if (!clip) {
    return {
      ok: false,
      code: "missing_file",
      message: "لا ملف أذان متاح لهذه الصيغة.",
      phase: getAthanPhase(),
    };
  }

  stopAthan("superseded");

  const myGen = ++genSeq;
  const kind = opts.kind;
  // الصلاة: اكتمال الملف طبيعيًا — ممنوع مؤقّت القصّ
  const maxMs =
    kind === "prayer" ? null : opts.maxMs !== undefined ? opts.maxMs : clip.maxMs;

  session = {
    kind,
    gen: myGen,
    url: clip.url,
    mode,
    audio: null,
  };
  setPhase("playing");

  await claimAdhanBus();

  const vol = Math.min(1, Math.max(0, opts.volume ?? 1));
  const result = await playAdhanUrlAsync(clip.url, vol, {
    maxMs,
    fadeIn: opts.fadeIn,
    force: true,
  });

  if (session?.gen !== myGen) {
    return { ...result, phase: getAthanPhase() };
  }

  if (!result.ok) {
    session = null;
    setAdhanElementProtected(false);
    setPhase("error");
    queueMicrotask(() => {
      if (!session && phase === "error") setPhase("idle");
    });
    return { ...result, phase: "error" };
  }

  session = { ...session, audio: result.audio };
  if (kind === "prayer") setAdhanElementProtected(true);
  attachNaturalEnd(result.audio, myGen);
  return { ...result, phase: "playing" };
}

/** تشغيل أذان دخول وقت الصلاة — محمي حتى اكتمال الملف */
export async function playPrayerAthan(
  muezzin: Muezzin,
  isFajr: boolean,
  mode: AdhanPlaybackMode,
  volume = 1,
): Promise<AdhanPlayResult> {
  const result = await playAthan({
    muezzin,
    isFajr,
    mode,
    volume,
    kind: "prayer",
  });
  return result.ok
    ? { ok: true, audio: result.audio }
    : { ok: false, code: result.code, message: result.message };
}

/**
 * توافق متزامن للمسارات القديمة (scheduler) — بلا maxMs، جلسة prayer محمية.
 */
export function playPrayerAthanSync(
  muezzin: Muezzin,
  isFajr: boolean,
  mode: AdhanPlaybackMode,
  volume = 1,
): HTMLAudioElement | null {
  if (mode === "silent") {
    stopAthan("superseded");
    return null;
  }
  const clip = resolveAdhanClip(muezzin, { isFajr, mode });
  if (!clip) return null;

  stopAthan("superseded");
  const myGen = ++genSeq;
  session = {
    kind: "prayer",
    gen: myGen,
    url: clip.url,
    mode,
    audio: null,
  };
  setPhase("playing");

  void claimAdhanBus();

  const audio = playAdhanUrl(clip.url, volume, { maxMs: null, fadeIn: true, force: true });
  if (session?.gen === myGen) {
    session = { ...session, audio };
    setAdhanElementProtected(true);
    attachNaturalEnd(audio, myGen);
  }
  return audio;
}
