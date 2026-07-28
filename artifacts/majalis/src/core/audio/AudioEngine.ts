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
import { getAyahAudioUrl } from "@/lib/quran-audio";
import { getSurahMeta } from "@/lib/quran-api";

export type RepeatMode = "off" | "ayah" | "surah";
export type TeachPhase = "idle" | "teacher" | "student" | "waiting";
export type PlayerState = "idle" | "loading" | "playing" | "paused" | "buffering" | "error";

export type AudioEngineSnapshot = {
  playerState: PlayerState;
  teachPhase: TeachPhase;
  repeatMode: RepeatMode;
  reciterId: string;
  surah: number | null;
  ayah: number | null;
  currentTime: number;
  duration: number;
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

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private audio: HTMLAudioElement | null = null;
  private reciterId = "alafasy";
  private surah: number | null = null;
  private ayah: number | null = null;
  private playerState: PlayerState = "idle";
  private teachPhase: TeachPhase = "idle";
  private repeatMode: RepeatMode = "off";
  private teachEnabled = false;
  private ayahListeners = new Set<AyahChangeListener>();
  private snapListeners = new Set<SnapshotListener>();
  private surahRepeatStart: { surah: number; ayah: number } | null = null;

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) AudioEngine.instance = new AudioEngine();
    return AudioEngine.instance;
  }

  /** Test helper — tears down the singleton without deleting user data. */
  static __resetInstanceForTests(): void {
    try {
      AudioEngine.instance?.pause();
      AudioEngine.instance?.audio?.removeAttribute("src");
    } catch {
      /* ignore */
    }
    AudioEngine.instance = null;
  }

  private constructor() {
    /* singleton */
  }

  /**
   * Lazily create the shared `HTMLAudioElement` and wire media events.
   * @throws if `Audio` is unavailable (SSR / non-browser). Callers should catch.
   */
  private ensureAudio(): HTMLAudioElement {
    if (typeof Audio === "undefined") {
      throw new Error("HTMLAudioElement unavailable");
    }
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = "auto";
      this.audio.addEventListener("playing", () => this.setPlayerState("playing"));
      this.audio.addEventListener("pause", () => {
        if (this.playerState !== "loading") this.setPlayerState("paused");
      });
      this.audio.addEventListener("waiting", () => this.setPlayerState("buffering"));
      this.audio.addEventListener("error", () => this.setPlayerState("error"));
      this.audio.addEventListener("timeupdate", () => this.emitSnapshot());
      this.audio.addEventListener("ended", () => void this.onEnded());
    }
    return this.audio;
  }

  private setPlayerState(state: PlayerState): void {
    this.playerState = state;
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
    return {
      playerState: this.playerState,
      teachPhase: this.teachPhase,
      repeatMode: this.repeatMode,
      reciterId: this.reciterId,
      surah: this.surah,
      ayah: this.ayah,
      currentTime: this.audio?.currentTime ?? 0,
      duration: this.audio?.duration && Number.isFinite(this.audio.duration) ? this.audio.duration : 0,
    };
  }

  setReciter(reciterId: string): void {
    this.reciterId = reciterId || "alafasy";
    this.emitSnapshot();
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
    this.emitSnapshot();
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
      this.setPlayerState("error");
      return;
    }

    const url = getAyahAudioUrl(surah, ayah, this.reciterId);
    this.setPlayerState("loading");
    if (this.teachEnabled) this.teachPhase = "teacher";

    try {
      el.src = url;
      await el.play();
      this.setPlayerState("playing");
    } catch (err) {
      console.warn("[AudioEngine] playAyah:", err);
      this.setPlayerState("error");
    }
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
          this.setPlayerState("error");
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

  pause(): void {
    this.audio?.pause();
    this.setPlayerState("paused");
  }

  /**
   * Handle track end: teach gap → repeat ayah/surah → or advance once.
   * Failures in nested `playAyah` already surface as `playerState: "error"`.
   */
  private async onEnded(): Promise<void> {
    try {
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
