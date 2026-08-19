/**
 * AudioEngine — ayah-synced HTML5 Audio for the Quran Engine.
 *
 * Features: play / pause / seek · repeat ayah|surah · teach/student · ayah events
 *
 * Design notes:
 * - Singleton so React trees and non-React callers share one player.
 * - Never throws into UI for media failures — sets `playerState: "error"` instead.
 * - Listeners are isolated with try/catch so a bad subscriber cannot crash playback.
 */
import { listAyahAudioUrls, loadPlaybackRate, normalizePlaybackRate, savePlaybackRate } from "@/lib/quran-audio";
import { getSurahMeta } from "@/lib/quran-api";
import {
  advanceAfterAyahEnded,
  createLoopRuntime,
  normalizeLoopConfig,
  type AyahLoopConfig,
  type AyahLoopRuntime,
} from "@/lib/ayah-loop-controller";

export type RepeatMode = "off" | "ayah" | "surah";
export type TeachPhase = "idle" | "teacher" | "student" | "waiting";
export type PlayerState = "idle" | "loading" | "playing" | "paused" | "buffering" | "error";

export type AudioEngineSnapshot = {
  playerState: PlayerState;
  teachPhase: TeachPhase;
  repeatMode: RepeatMode;
  reciterId: string;
  /** Current playback rate (0.5–2) — RN setRateAsync. */
  playbackRate: number;
  surah: number | null;
  ayah: number | null;
  currentTime: number;
  duration: number;
  /** وضع الحفظ النشط (نطاق آيات) إن وُجد */
  loopConfig: AyahLoopConfig | null;
  /** رسالة مفهومة عند playerState === "error" */
  errorMessage: string | null;
};

export type AyahChangePayload = {
  surah: number;
  ayah: number;
  reciterId: string;
};

type AyahChangeListener = (payload: AyahChangePayload) => void;
type SnapshotListener = (snap: AudioEngineSnapshot) => void;

/** Ayah count for a surah (1–114) via local metadata — no network. */
function ayahCount(surah: number): number {
  return getSurahMeta(surah).ayahs;
}

/**
 * Next verse after `(surah, ayah)`, advancing across surah boundaries.
 * Returns `null` at the end of the mushaf (114:6).
 */
function nextAyah(surah: number, ayah: number): { surah: number; ayah: number } | null {
  const max = ayahCount(surah);
  if (ayah < max) return { surah, ayah: ayah + 1 };
  if (surah < 114) return { surah: surah + 1, ayah: 1 };
  return null;
}

function prevAyah(surah: number, ayah: number): { surah: number; ayah: number } | null {
  if (ayah > 1) return { surah, ayah: ayah - 1 };
  if (surah > 1) {
    const prevSurah = surah - 1;
    return { surah: prevSurah, ayah: ayahCount(prevSurah) };
  }
  return null;
}

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  /** عنصران للتبديل — يقلّل الفجوة بين الآيات (double-buffer). */
  private slotA: HTMLAudioElement | null = null;
  private slotB: HTMLAudioElement | null = null;
  private activeSlot: "a" | "b" = "a";
  /** مرادف للعنصر النشط — للتوافق مع getSound(). */
  private audio: HTMLAudioElement | null = null;
  private preloadKey: string | null = null;
  private reciterId = "alafasy";
  private playbackRate = 1;
  private rateHydrated = false;
  private surah: number | null = null;
  private ayah: number | null = null;
  private playerState: PlayerState = "idle";
  private errorMessage: string | null = null;
  private teachPhase: TeachPhase = "idle";
  private repeatMode: RepeatMode = "off";
  private teachEnabled = false;
  private ayahListeners = new Set<AyahChangeListener>();
  private snapListeners = new Set<SnapshotListener>();
  private surahRepeatStart: { surah: number; ayah: number } | null = null;
  /** يحدّ من إعادة الرسم أثناء timeupdate دون فقدان إحساس التقدم. */
  private lastTimeEmitMs = 0;
  private loopSurah: number | null = null;
  private loopRuntime: AyahLoopRuntime | null = null;
  private loopDelayTimer: ReturnType<typeof setTimeout> | null = null;
  private interruptionBound = false;
  private interruptionCleanups: Array<() => void> = [];
  /** يمنع حدث error القديم من مسار URL سابق من إفساد تشغيل ناجح */
  private playGeneration = 0;

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) AudioEngine.instance = new AudioEngine();
    return AudioEngine.instance;
  }

  /** Test helper — tears down the singleton without deleting user data. */
  static __resetInstanceForTests(): void {
    try {
      AudioEngine.instance?.clearLoopConfig();
      AudioEngine.instance?.pause();
      AudioEngine.instance?.audio?.removeAttribute("src");
    } catch {
      /* ignore */
    }
    AudioEngine.instance = null;
  }

  private constructor() {
    /* singleton — rate hydrated lazily (localStorage may be unavailable in SSR). */
  }

  private hydrateRate(): void {
    if (this.rateHydrated) return;
    this.rateHydrated = true;
    try {
      this.playbackRate = loadPlaybackRate();
    } catch {
      this.playbackRate = 1;
    }
  }

  private preloadKeyFor(surah: number, ayah: number, reciterId: string): string {
    return `${reciterId}:${surah}:${ayah}`;
  }

  private getActiveEl(): HTMLAudioElement {
    this.hydrateRate();
    if (typeof Audio === "undefined") {
      throw new Error("HTMLAudioElement unavailable");
    }
    if (!this.slotA) {
      this.slotA = this.createAudioSlot();
      this.slotB = this.createAudioSlot();
      this.audio = this.getActiveElRef();
    }
    return this.getActiveElRef();
  }

  private getActiveElRef(): HTMLAudioElement {
    return this.activeSlot === "a" ? this.slotA! : this.slotB!;
  }

  private getIdleElRef(): HTMLAudioElement {
    return this.activeSlot === "a" ? this.slotB! : this.slotA!;
  }

  private swapActiveSlot(): void {
    this.activeSlot = this.activeSlot === "a" ? "b" : "a";
    this.audio = this.getActiveElRef();
  }

  private createAudioSlot(): HTMLAudioElement {
    const el = new Audio();
    el.preload = "auto";
    el.playbackRate = this.playbackRate;
    try {
      el.setAttribute("playsinline", "true");
      (el as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
    } catch {
      /* ignore */
    }
    el.addEventListener("playing", () => {
      if (el !== this.getActiveElRef()) return;
      this.setPlayerState("playing");
    });
    el.addEventListener("pause", () => {
      if (el !== this.getActiveElRef()) return;
      if (this.playerState !== "loading") this.setPlayerState("paused");
    });
    el.addEventListener("waiting", () => {
      if (el !== this.getActiveElRef()) return;
      this.setPlayerState("buffering");
    });
    el.addEventListener("error", () => {
      if (el !== this.getActiveElRef()) return;
      if (this.playerState === "playing" || this.playerState === "loading") {
        return;
      }
      this.setPlayerState("error", "تعذّر تحميل ملف التلاوة. أعد المحاولة أو غيّر القارئ.");
    });
    el.addEventListener("timeupdate", () => {
      if (el !== this.getActiveElRef()) return;
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      if (now - this.lastTimeEmitMs < 200) return;
      this.lastTimeEmitMs = now;
      this.emitSnapshot();
    });
    el.addEventListener("ended", () => {
      if (el !== this.getActiveElRef()) return;
      void this.onEnded();
    });
    return el;
  }

  /** يحمّل الآية التالية مسبقاً في العنصر الخامل لتقليل الفجوة. */
  private preloadNextAyah(surah: number, ayah: number, gen: number): void {
    const next = nextAyah(surah, ayah);
    if (!next || !this.slotB) {
      this.preloadKey = null;
      return;
    }
    const urls = listAyahAudioUrls(next.surah, next.ayah, this.reciterId);
    if (!urls.length) {
      this.preloadKey = null;
      return;
    }
    const key = this.preloadKeyFor(next.surah, next.ayah, this.reciterId);
    const idle = this.getIdleElRef();
    this.preloadKey = key;
    try {
      idle.pause();
      idle.src = urls[0]!;
      idle.playbackRate = this.playbackRate;
      idle.load();
    } catch {
      this.preloadKey = null;
    }
    void gen;
  }

  /** تشغيل من العنصر المُحمَّل مسبقاً إن وُجد — يُعيد true عند النجاح. */
  private async tryPlayFromPreload(
    surah: number,
    ayah: number,
    gen: number,
  ): Promise<boolean> {
    const key = this.preloadKeyFor(surah, ayah, this.reciterId);
    if (this.preloadKey !== key || !this.slotB) return false;
    const idle = this.getIdleElRef();
    if (idle.readyState < 2) return false;
    if (gen !== this.playGeneration) return false;
    try {
      this.getActiveElRef().pause();
      this.swapActiveSlot();
      this.preloadKey = null;
      const el = this.getActiveElRef();
      el.playbackRate = this.playbackRate;
      await this.activatePlaybackSession();
      await el.play();
      if (gen !== this.playGeneration) return false;
      this.setPlayerState("playing");
      this.preloadNextAyah(surah, ayah, gen);
      return true;
    } catch {
      this.swapActiveSlot();
      this.preloadKey = null;
      return false;
    }
  }

  /**
   * Lazily create the shared audio slots and wire media events.
   * @throws if `Audio` is unavailable (SSR / non-browser). Callers should catch.
   */
  private ensureAudio(): HTMLAudioElement {
    return this.getActiveEl();
  }

  private async activatePlaybackSession(): Promise<void> {
    try {
      const { ensureNativePlaybackAudioSession } = await import("@/lib/native-playback-audio");
      await ensureNativePlaybackAudioSession();
    } catch (err) {
      console.warn("[AudioEngine] native playback session:", err);
    }
    this.bindInterruptionListeners();
  }

  /** استئناف بعد المكالمة / إيقاف عند نزع السمّاعة — عبر الجسر الأصلي. */
  private bindInterruptionListeners(): void {
    if (this.interruptionBound) return;
    this.interruptionBound = true;
    void import("@/lib/native-playback-audio").then(({ getNativePlaybackPlugin }) => {
      void getNativePlaybackPlugin().then((plugin) => {
        if (!plugin?.addListener) return;
        void plugin.addListener("audioInterruption", (data) => {
          const type = String(data.type ?? "");
          if (type === "began") {
            this.pause();
            return;
          }
          if (type === "ended" && data.shouldResume === true) {
            const el = this.audio;
            if (!el || this.surah == null || this.ayah == null) return;
            void el.play().then(() => this.setPlayerState("playing")).catch(() => {
              this.setPlayerState("error");
            });
          }
        }).then((handle) => {
          this.interruptionCleanups.push(() => {
            void handle.remove();
          });
        });
        void plugin.addListener("audioRouteChange", (data) => {
          // AVAudioSession.RouteChangeReason.oldDeviceUnavailable == 2
          const reasonNum = Number(data.reason);
          const reason = String(data.reason ?? data.type ?? "");
          if (
            reasonNum === 2 ||
            /oldDeviceUnavailable|headphones|unplug|disconnect/i.test(reason)
          ) {
            this.pause();
          }
        }).then((handle) => {
          this.interruptionCleanups.push(() => {
            void handle.remove();
          });
        });
      });
    });
  }

  private async releasePlaybackSession(): Promise<void> {
    try {
      const { deactivateNativeAudioSession } = await import("@/lib/native-playback-audio");
      await deactivateNativeAudioSession();
    } catch (err) {
      console.warn("[AudioEngine] native session deactivate:", err);
    }
  }

  private setPlayerState(state: PlayerState, errorMessage: string | null = null): void {
    this.playerState = state;
    this.errorMessage = state === "error" ? errorMessage : null;
    this.emitSnapshot();
  }

  private emitAyahChange(): void {
    if (this.surah == null || this.ayah == null) return;
    const payload: AyahChangePayload = {
      surah: this.surah,
      ayah: this.ayah,
      reciterId: this.reciterId,
    };
    for (const l of this.ayahListeners) {
      try {
        l(payload);
      } catch {
        /* ignore */
      }
    }
  }

  private emitSnapshot(): void {
    const snap = this.getSnapshot();
    for (const l of this.snapListeners) {
      try {
        l(snap);
      } catch {
        /* ignore */
      }
    }
  }

  /**
   * Subscribe to verse changes (fires when a new ayah starts loading/playing).
   * @returns unsubscribe function
   */
  onAyahChange(listener: AyahChangeListener): () => void {
    this.ayahListeners.add(listener);
    return () => this.ayahListeners.delete(listener);
  }

  /**
   * Subscribe to full player snapshots (state, time, repeat, teach phase).
   * @returns unsubscribe function
   */
  onSnapshot(listener: SnapshotListener): () => void {
    this.snapListeners.add(listener);
    return () => this.snapListeners.delete(listener);
  }

  /** Immutable snapshot of the current player for UI binding. */
  getSnapshot(): AudioEngineSnapshot {
    this.hydrateRate();
    return {
      playerState: this.playerState,
      teachPhase: this.teachPhase,
      loopConfig: this.loopRuntime?.active ? this.loopRuntime.config : null,
      repeatMode: this.repeatMode,
      reciterId: this.reciterId,
      playbackRate: this.playbackRate,
      surah: this.surah,
      ayah: this.ayah,
      currentTime: this.audio?.currentTime ?? 0,
      duration: this.audio?.duration && Number.isFinite(this.audio.duration) ? this.audio.duration : 0,
      errorMessage: this.errorMessage,
    };
  }

  setReciter(reciterId: string): void {
    this.reciterId = reciterId || "alafasy";
    this.emitSnapshot();
  }

  /** Live HTMLAudioElement (RN `sound`) — null until first play. */
  getSound(): HTMLAudioElement | null {
    return this.audio;
  }

  /**
   * RN `setRateAsync(newRate, true)` / `setPlaybackSpeed`.
   * Applies immediately if a sound is loaded; persists for the next play.
   */
  setPlaybackRate(newRate: number): number {
    this.hydrateRate();
    this.playbackRate = normalizePlaybackRate(newRate);
    savePlaybackRate(this.playbackRate);
    if (this.audio) {
      try {
        this.audio.playbackRate = this.playbackRate;
      } catch {
        /* ignore */
      }
    }
    this.emitSnapshot();
    return this.playbackRate;
  }

  /** Alias matching RN `changeSpeed`. */
  async changeSpeed(newRate: number): Promise<number> {
    return this.setPlaybackRate(newRate);
  }

  /**
   * Play an arbitrary audio URL (RN `Audio.Sound.createAsync({ uri })`).
   * Clears surah/ayah tracking — use {@link playAyah} for verse-synced playback.
   */
  async playUrl(url: string): Promise<void> {
    let el: HTMLAudioElement;
    try {
      el = this.ensureAudio();
    } catch (err) {
      console.warn("[AudioEngine] ensureAudio:", err);
      this.setPlayerState("error");
      return;
    }
    this.surah = null;
    this.ayah = null;
    this.setPlayerState("loading");
    try {
      el.src = url;
      el.playbackRate = this.playbackRate;
      await this.activatePlaybackSession();
      await el.play();
      this.setPlayerState("playing");
    } catch (err) {
      console.warn("[AudioEngine] playUrl:", err);
      this.setPlayerState("error");
    }
  }

  /**
   * Configure repeat behaviour:
   * - `off` — play through then advance once
   * - `ayah` — loop the current ayah
   * - `surah` — loop the current surah from ayah 1 after the last ayah
   */
  setRepeatMode(mode: RepeatMode): void {
    this.repeatMode = mode;
    if (mode === "surah" && this.surah != null && this.ayah != null) {
      this.surahRepeatStart = { surah: this.surah, ayah: 1 };
    }
    if (mode === "off") this.surahRepeatStart = null;
    if (mode !== "off") this.clearLoopConfig();
    this.emitSnapshot();
  }

  private clearLoopDelay(): void {
    if (this.loopDelayTimer != null) {
      clearTimeout(this.loopDelayTimer);
      this.loopDelayTimer = null;
    }
  }

  private clearLoopConfig(): void {
    this.clearLoopDelay();
    this.loopRuntime = null;
    this.loopSurah = null;
  }

  /**
   * وضع الحفظ: نطاق آيات + تكرار + فاصل صمت.
   * يُعطّل repeatMode البسيط. مرّر null للإلغاء.
   */
  setLoopConfig(
    surah: number,
    cfg: (Partial<AyahLoopConfig> & { startAyah: number }) | null,
  ): AyahLoopConfig | null {
    this.clearLoopDelay();
    if (!cfg) {
      this.clearLoopConfig();
      this.emitSnapshot();
      return null;
    }
    const total = ayahCount(surah);
    const normalized = normalizeLoopConfig(cfg, total);
    this.loopSurah = surah;
    this.loopRuntime = createLoopRuntime(normalized);
    this.repeatMode = "off";
    this.surahRepeatStart = null;
    this.emitSnapshot();
    return normalized;
  }

  getLoopConfig(): AyahLoopConfig | null {
    return this.loopRuntime?.active ? this.loopRuntime.config : null;
  }

  /**
   * Teacher/student drill: after teacher audio ends, pause (~1.5s) for the
   * student to repeat before advancing according to `repeatMode`.
   */
  setTeachMode(enabled: boolean): void {
    this.teachEnabled = enabled;
    this.teachPhase = enabled ? "teacher" : "idle";
    this.emitSnapshot();
  }

  /**
   * Load and play a specific ayah for the active (or provided) reciter.
   * On media failure sets `playerState` to `"error"` and resolves (does not throw).
   */
  async playAyah(surah: number, ayah: number, reciterId?: string): Promise<void> {
    try {
      const { claimAudio, registerAudioStopper } = await import("@/lib/exclusive-audio-bus");
      registerAudioStopper("tilawa", () => {
        this.stop();
      });
      await claimAudio("tilawa");
    } catch {
      /* ignore bus */
    }
    if (reciterId) this.reciterId = reciterId;
    this.surah = surah;
    this.ayah = ayah;
    if (this.repeatMode === "surah" && !this.surahRepeatStart) {
      this.surahRepeatStart = { surah, ayah: 1 };
    }
    this.emitAyahChange();

    let el: HTMLAudioElement;
    try {
      el = this.ensureAudio();
    } catch (err) {
      console.warn("[AudioEngine] ensureAudio:", err);
      this.setPlayerState("error", "تعذّر تهيئة مشغّل الصوت على هذا الجهاز.");
      return;
    }

    const urls = listAyahAudioUrls(surah, ayah, this.reciterId);
    if (!urls.length) {
      this.setPlayerState(
        "error",
        "هذا القارئ لا يدعم تلاوة الآية آيةً آية. اختر قارئًا آخر أو شغّل السورة كاملة.",
      );
      return;
    }
    const gen = ++this.playGeneration;
    this.setPlayerState("loading");
    if (this.teachEnabled) this.teachPhase = "teacher";

    if (await this.tryPlayFromPreload(surah, ayah, gen)) {
      void import("@/lib/quran-mini-player").then((m) => m.showMiniPlayer()).catch(() => undefined);
      return;
    }

    let lastErr: unknown = null;
    for (const url of urls) {
      if (gen !== this.playGeneration) return;
      try {
        el.pause();
        el.src = url;
        el.playbackRate = this.playbackRate;
        await this.activatePlaybackSession();
        await new Promise<void>((resolve, reject) => {
          let settled = false;
          const finish = (fn: () => void) => {
            if (settled) return;
            settled = true;
            cleanup();
            fn();
          };
          const onReady = () => finish(() => resolve());
          const onError = () => finish(() => reject(new Error("media_element_error")));
          const cleanup = () => {
            el.removeEventListener("canplay", onReady);
            el.removeEventListener("loadeddata", onReady);
            el.removeEventListener("error", onError);
          };
          el.addEventListener("canplay", onReady, { once: true });
          el.addEventListener("loadeddata", onReady, { once: true });
          el.addEventListener("error", onError, { once: true });
          try {
            el.load();
          } catch (e) {
            finish(() => reject(e));
            return;
          }
          window.setTimeout(() => {
            if (!settled && el.readyState >= 2) onReady();
            else if (!settled) onError();
          }, 8000);
        });
        if (gen !== this.playGeneration) return;
        await el.play();
        if (gen !== this.playGeneration) return;
        this.setPlayerState("playing");
        this.preloadNextAyah(surah, ayah, gen);
        void import("@/lib/quran-mini-player").then((m) => m.showMiniPlayer()).catch(() => undefined);
        return;
      } catch (err) {
        lastErr = err;
        if (import.meta.env.DEV) {
          console.warn("[AudioEngine] playAyah candidate failed:", url, err);
        }
      }
    }

    if (gen !== this.playGeneration) return;
    if (import.meta.env.DEV) {
      console.warn("[AudioEngine] playAyah:", lastErr);
    }
    const name =
      lastErr && typeof lastErr === "object" && "name" in lastErr
        ? String((lastErr as { name: string }).name)
        : "";
    if (name === "NotAllowedError") {
      this.setPlayerState(
        "error",
        "الجهاز منع التشغيل قبل تفاعل المستخدم — اضغط زر التلاوة مرة أخرى.",
      );
      return;
    }
    const offline =
      typeof navigator !== "undefined" && navigator.onLine === false
        ? "تحقق من الاتصال بالشبكة ثم أعد المحاولة."
        : "تعذّر تشغيل التلاوة. أعد المحاولة أو غيّر القارئ.";
    this.setPlayerState("error", offline);
  }

  /**
   * Toggle play/pause for the given ayah.
   * If a different ayah is requested (or nothing is loaded), starts fresh playback.
   */
  async togglePlay(surah: number, ayah: number): Promise<void> {
    const el = this.audio;
    if (
      el &&
      this.surah === surah &&
      this.ayah === ayah &&
      (this.playerState === "playing" || this.playerState === "paused")
    ) {
      if (this.playerState === "playing") {
        el.pause();
        this.setPlayerState("paused");
      } else {
        try {
          await el.play();
          this.setPlayerState("playing");
        } catch (err) {
          console.warn("[AudioEngine] resume:", err);
          this.setPlayerState("error", "تعذّر استئناف التلاوة. أعد المحاولة.");
        }
      }
      return;
    }
    await this.playAyah(surah, ayah);
  }

  /** Jump to another ayah and start playback (alias of {@link playAyah}). */
  async seekToAyah(surah: number, ayah: number): Promise<void> {
    await this.playAyah(surah, ayah);
  }

  /** Seek within the current track; no-op when duration is unknown. */
  seek(seconds: number): void {
    const el = this.audio;
    if (!el || !Number.isFinite(el.duration)) return;
    el.currentTime = Math.min(el.duration, Math.max(0, seconds));
    this.emitSnapshot();
  }

  /** الآية التالية (عبر حدود السور). */
  async skipNext(): Promise<void> {
    if (this.surah == null || this.ayah == null) return;
    const next = nextAyah(this.surah, this.ayah);
    if (next) await this.playAyah(next.surah, next.ayah);
  }

  /** الآية السابقة. */
  async skipPrev(): Promise<void> {
    if (this.surah == null || this.ayah == null) return;
    const prev = prevAyah(this.surah, this.ayah);
    if (prev) await this.playAyah(prev.surah, prev.ayah);
  }

  /** دورة سرعات وضع الحفظ/المصغّر: 0.75 → 1 → 1.25 → 0.75 */
  cycleMiniPlayerRate(): number {
    const cycle = [0.75, 1, 1.25] as const;
    const cur = normalizePlaybackRate(this.playbackRate);
    const idx = cycle.findIndex((r) => Math.abs(r - cur) < 0.01);
    const next = cycle[(idx + 1) % cycle.length] ?? 1;
    return this.setPlaybackRate(next);
  }

  pause(): void {
    this.clearLoopDelay();
    this.audio?.pause();
    this.setPlayerState("paused");
  }

  /**
   * Stop playback (RN `sound.stopAsync` equivalent) — pauses and rewinds.
   * Keeps the element for a quick resume/re-play of another ayah.
   */
  stop(): void {
    this.clearLoopDelay();
    const el = this.audio;
    if (!el) {
      this.setPlayerState("idle");
      void this.releasePlaybackSession();
      return;
    }
    try {
      el.pause();
      el.currentTime = 0;
    } catch {
      /* ignore */
    }
    this.setPlayerState("idle");
    this.emitSnapshot();
    void this.releasePlaybackSession();
  }

  /**
   * Full teardown (RN `sound.unloadAsync`) — pause, clear `src`, drop element.
   * Call on leaving the reading screen so media resources are released.
   */
  stopAndUnload(): void {
    this.clearLoopConfig();
    this.preloadKey = null;
    for (const el of [this.slotA, this.slotB]) {
      if (!el) continue;
      try {
        el.pause();
        el.removeAttribute("src");
        el.load();
      } catch {
        /* ignore */
      }
    }
    this.slotA = null;
    this.slotB = null;
    this.audio = null;
    this.activeSlot = "a";
    this.surah = null;
    this.ayah = null;
    this.teachPhase = "idle";
    this.surahRepeatStart = null;
    this.setPlayerState("idle");
    for (const c of this.interruptionCleanups) {
      try {
        c();
      } catch {
        /* ignore */
      }
    }
    this.interruptionCleanups = [];
    this.interruptionBound = false;
    void this.releasePlaybackSession();
  }

  /**
   * Handle track end: hifz loop → teach gap → repeat ayah/surah → or advance once.
   * Failures in nested `playAyah` already surface as `playerState: "error"`.
   */
  private async onEnded(): Promise<void> {
    try {
      if (
        this.loopRuntime?.active &&
        this.loopSurah != null &&
        this.surah === this.loopSurah &&
        this.ayah != null
      ) {
        const { runtime, next } = advanceAfterAyahEnded(this.loopRuntime, this.ayah);
        this.loopRuntime = runtime;
        this.emitSnapshot();
        if (next.action === "done") {
          this.clearLoopConfig();
          this.setPlayerState("idle");
          return;
        }
        const delay = next.delayMs;
        const playNext = () => {
          this.loopDelayTimer = null;
          void this.playAyah(this.loopSurah!, next.ayah);
        };
        if (delay > 0) {
          this.setPlayerState("paused");
          this.loopDelayTimer = setTimeout(playNext, delay);
        } else {
          playNext();
        }
        return;
      }

      if (this.teachEnabled && this.teachPhase === "teacher") {
        this.teachPhase = "student";
        this.setPlayerState("paused");
        await new Promise((r) => setTimeout(r, 1500));
        this.teachPhase = "teacher";
      }

      if (this.repeatMode === "ayah" && this.surah != null && this.ayah != null) {
        await this.playAyah(this.surah, this.ayah);
        return;
      }

      if (this.repeatMode === "surah" && this.surah != null && this.ayah != null) {
        const next = nextAyah(this.surah, this.ayah);
        if (next && next.surah === this.surah) {
          await this.playAyah(next.surah, next.ayah);
          return;
        }
        const start = this.surahRepeatStart ?? { surah: this.surah, ayah: 1 };
        await this.playAyah(start.surah, start.ayah);
        return;
      }

      if (this.surah != null && this.ayah != null) {
        const next = nextAyah(this.surah, this.ayah);
        if (next) {
          await this.playAyah(next.surah, next.ayah);
          return;
        }
      }
      this.setPlayerState("idle");
    } catch (err) {
      console.warn("[AudioEngine] onEnded:", err);
      this.setPlayerState("error");
    }
  }
}

export function getAudioEngine(): AudioEngine {
  return AudioEngine.getInstance();
}

export default getAudioEngine;
