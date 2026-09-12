/**
 * منسّق الصوت الوحيد — Single Active Audio.
 */
import {
  APP_AUDIO_PRIORITY,
  IDLE_AUDIO_SNAPSHOT,
  type AppAudioKind,
  type AppAudioPlayRequest,
  type AppAudioSnapshot,
} from "./app-audio-types";

type Listener = (snap: AppAudioSnapshot) => void;

let snap: AppAudioSnapshot = { ...IDLE_AUDIO_SNAPSHOT };
let tokenSeq = 0;
let el: HTMLAudioElement | null = null;
let maxTimer: ReturnType<typeof setTimeout> | null = null;
let chain: Promise<void> = Promise.resolve();
const listeners = new Set<Listener>();

function emit(): void {
  const copy = { ...snap };
  for (const l of listeners) {
    try { l(copy); } catch { /* ignore */ }
  }
}

function setSnap(patch: Partial<AppAudioSnapshot>): void {
  snap = { ...snap, ...patch };
  emit();
}

function clearMaxTimer(): void {
  if (maxTimer) {
    clearTimeout(maxTimer);
    maxTimer = null;
  }
}

function destroyElement(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  try {
    audio.onended = null;
    audio.onerror = null;
    audio.onloadedmetadata = null;
    audio.ontimeupdate = null;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  } catch { /* ignore */ }
}

async function stopInternal(
  reason: "replace" | "user" | "ended" | "leave" | "interrupt",
): Promise<void> {
  clearMaxTimer();
  const current = el;
  el = null;
  if (snap.phase === "idle" && !current) {
    if (reason === "interrupt") {
      setSnap({ ...IDLE_AUDIO_SNAPSHOT, requestToken: snap.requestToken, phase: "interrupted" });
    }
    return;
  }
  setSnap({ phase: "stopping" });
  destroyElement(current);
  if (reason === "interrupt") {
    setSnap({
      ...IDLE_AUDIO_SNAPSHOT,
      requestToken: snap.requestToken,
      phase: "interrupted",
      lastError: null,
    });
    return;
  }
  setSnap({ ...IDLE_AUDIO_SNAPSHOT, requestToken: snap.requestToken });
}

function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = chain.then(job, job);
  chain = run.then(() => undefined, () => undefined);
  return run;
}

async function stopForeignEngines(except: AppAudioKind | null): Promise<void> {
  const keepTilawa =
    except === "quranRecitation" || except === "miniPlayer" || except === "tafsir";
  const keepAdhan = except === "adhanPreview";
  const keepLesson = except === "lessonAudio";

  if (!keepTilawa) {
    try {
      const { getAudioEngine } = await import("@/core/audio/AudioEngine");
      getAudioEngine().stop();
    } catch { /* ignore */ }
    try {
      const { hideMiniPlayer } = await import("@/lib/quran-mini-player");
      hideMiniPlayer();
    } catch { /* ignore */ }
  }
  if (!keepAdhan) {
    try {
      const { stopAdhan } = await import("@/lib/adhan-playback");
      stopAdhan();
    } catch { /* ignore */ }
    try {
      const { stopAdhanPreview } = await import("@/lib/adhan-audio-service");
      stopAdhanPreview();
    } catch { /* ignore */ }
  }
  if (!keepLesson) {
    try {
      const { getMajlisAudioService } = await import("@/lib/majlis-audio-service");
      await getMajlisAudioService().stop();
    } catch { /* ignore */ }
  }
}

function busOwnerForKind(
  kind: AppAudioKind,
): "tilawa" | "tafsir" | "adhan" | "majlis" | "recitation" | "lesson" | "other" {
  if (kind === "adhanPreview" || kind === "prayerPrompt" || kind === "notificationPreview") {
    return "adhan";
  }
  if (kind === "lessonAudio") return "lesson";
  if (kind === "tafsir") return "tafsir";
  if (kind === "quranRecitation" || kind === "miniPlayer") return "tilawa";
  return "other";
}

export function getAppAudioSnapshot(): AppAudioSnapshot {
  return { ...snap };
}

/** عنصر التشغيل النشط (إن وُجد) — للتوافق مع واجهات تحتاج مرجع HTMLAudioElement. */
export function getAppAudioElement(): HTMLAudioElement | null {
  return el;
}

export function subscribeAppAudio(listener: Listener): () => void {
  listeners.add(listener);
  listener({ ...snap });
  return () => { listeners.delete(listener); };
}

export function isAppAudioSourcePlaying(sourceId: string): boolean {
  return snap.phase === "playing" && snap.activeSourceId === sourceId;
}

export function playAppAudio(req: AppAudioPlayRequest): Promise<AppAudioSnapshot> {
  return enqueue(async () => {
    if (!req.url?.trim()) {
      setSnap({
        ...IDLE_AUDIO_SNAPSHOT,
        phase: "failed",
        lastError: "ملف الصوت غير متاح أو غير مرخّص للتشغيل.",
        requestToken: snap.requestToken,
      });
      return { ...snap };
    }

    if (
      snap.activeSourceId === req.sourceId &&
      (snap.phase === "playing" || snap.phase === "preparing")
    ) {
      await stopInternal("user");
      return { ...snap };
    }

    const token = ++tokenSeq;
    await stopInternal("replace");
    await stopForeignEngines(req.kind);

    setSnap({
      phase: "preparing",
      activeSourceId: req.sourceId,
      activeKind: req.kind,
      activeScreen: req.screenId ?? null,
      startedAt: Date.now(),
      playbackPosition: 0,
      duration: 0,
      requestToken: token,
      userInitiated: req.userInitiated !== false,
      mayResumeAfterInterruption: Boolean(req.mayResumeAfterInterruption),
      lastError: null,
    });

    try {
      const { claimAudio } = await import("@/lib/exclusive-audio-bus");
      await claimAudio(busOwnerForKind(req.kind), { skipCoordinatorStop: true });
    } catch { /* optional */ }

    if (typeof Audio === "undefined") {
      setSnap({
        ...IDLE_AUDIO_SNAPSHOT,
        phase: "failed",
        lastError: "بيئة بلا مشغّل صوت",
        requestToken: token,
      });
      return { ...snap };
    }
    if (snap.requestToken !== token) return { ...snap };

    const audio = new Audio(req.url);
    el = audio;
    audio.preload = "auto";
    audio.volume = Math.max(0.2, Math.min(1, req.volume ?? 0.85));
    (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;

    audio.onloadedmetadata = () => {
      if (snap.requestToken !== token) return;
      setSnap({ duration: Number.isFinite(audio.duration) ? audio.duration : 0 });
    };
    audio.ontimeupdate = () => {
      if (snap.requestToken !== token) return;
      setSnap({ playbackPosition: audio.currentTime || 0 });
    };
    audio.onended = () => {
      if (snap.requestToken !== token) return;
      void enqueue(() => stopInternal("ended"));
    };
    audio.onerror = () => {
      if (snap.requestToken !== token) return;
      destroyElement(audio);
      if (el === audio) el = null;
      setSnap({
        ...IDLE_AUDIO_SNAPSHOT,
        phase: "failed",
        lastError: "تعذّر تشغيل الملف الصوتي.",
        requestToken: token,
      });
    };

    try {
      await audio.play();
    } catch (err) {
      if (snap.requestToken !== token) return { ...snap };
      destroyElement(audio);
      if (el === audio) el = null;
      setSnap({
        ...IDLE_AUDIO_SNAPSHOT,
        phase: "failed",
        lastError: err instanceof Error ? err.message : "تشغيل الصوت محظور",
        requestToken: token,
      });
      return { ...snap };
    }

    if (snap.requestToken !== token) {
      destroyElement(audio);
      return { ...snap };
    }

    setSnap({ phase: "playing" });
    if (req.maxMs && req.maxMs > 0) {
      clearMaxTimer();
      maxTimer = setTimeout(() => {
        if (snap.requestToken !== token) return;
        void enqueue(() => stopInternal("ended"));
      }, req.maxMs);
    }
    return { ...snap };
  });
}

export function stopAppAudio(reason: "user" | "leave" | "interrupt" = "user"): Promise<void> {
  return enqueue(() =>
    stopInternal(reason === "interrupt" ? "interrupt" : reason === "leave" ? "leave" : "user"),
  );
}

/**
 * إيقاف فوري بلا طابور — للاستخدام من exclusive-audio-bus أثناء claim
 * حتى لا يحدث deadlock مع playAppAudio الجاري.
 */
export function forceStopAppAudioSync(): void {
  clearMaxTimer();
  const current = el;
  el = null;
  destroyElement(current);
  snap = { ...IDLE_AUDIO_SNAPSHOT, requestToken: snap.requestToken };
  emit();
}

export function stopAllAppAudio(): Promise<void> {
  return enqueue(async () => {
    await stopInternal("user");
    await stopForeignEngines(null);
  });
}

type LongFormKind =
  | "quranRecitation"
  | "lessonAudio"
  | "miniPlayer"
  | "tafsir"
  | "videoAudio";

export function beginLongFormAudio(
  kind: LongFormKind,
  sourceId: string,
  opts?: { screenId?: string; mayResumeAfterInterruption?: boolean },
): Promise<void> {
  return enqueue(async () => {
    const token = ++tokenSeq;
    await stopInternal("replace");
    await stopForeignEngines(kind);
    setSnap({
      phase: "playing",
      activeSourceId: sourceId,
      activeKind: kind,
      activeScreen: opts?.screenId ?? null,
      startedAt: Date.now(),
      playbackPosition: 0,
      duration: 0,
      requestToken: token,
      userInitiated: true,
      mayResumeAfterInterruption: opts?.mayResumeAfterInterruption !== false,
      lastError: null,
    });
  });
}

export function endLongFormAudio(sourceId?: string): void {
  if (sourceId && snap.activeSourceId && snap.activeSourceId !== sourceId) return;
  const kind = snap.activeKind;
  if (
    kind === "quranRecitation" ||
    kind === "lessonAudio" ||
    kind === "miniPlayer" ||
    kind === "tafsir" ||
    kind === "videoAudio"
  ) {
    setSnap({ ...IDLE_AUDIO_SNAPSHOT, requestToken: snap.requestToken });
  }
}

export function canAutoDuckForKind(incoming: AppAudioKind): boolean {
  const current = snap.activeKind;
  if (!current || snap.phase === "idle") return true;
  if (
    (incoming === "dhikrPrompt" || incoming === "tasbeehPrompt" || incoming === "prayerPrompt") &&
    (current === "quranRecitation" || current === "lessonAudio" || current === "miniPlayer") &&
    snap.userInitiated
  ) {
    return false;
  }
  return APP_AUDIO_PRIORITY[incoming] >= APP_AUDIO_PRIORITY[current];
}

export function __resetAppAudioCoordinatorForTests(): void {
  clearMaxTimer();
  destroyElement(el);
  el = null;
  snap = { ...IDLE_AUDIO_SNAPSHOT };
  tokenSeq = 0;
  chain = Promise.resolve();
  listeners.clear();
}
