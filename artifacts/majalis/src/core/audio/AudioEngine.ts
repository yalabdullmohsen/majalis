/**
 * AudioEngine — ayah-synced HTML5 Audio for the Quran Engine.
 *
 * Features: play / pause / seek · repeat ayah|surah · teach/student · ayah events
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

function ayahCount(surah: number): number {
  return getSurahMeta(surah).ayahs;
}

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

  onAyahChange(listener: AyahChangeListener): () => void {
    this.ayahListeners.add(listener);
    return () => this.ayahListeners.delete(listener);
  }

  onSnapshot(listener: SnapshotListener): () => void {
    this.snapListeners.add(listener);
    return () => this.snapListeners.delete(listener);
  }

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

  setRepeatMode(mode: RepeatMode): void {
    this.repeatMode = mode;
    if (mode === "surah" && this.surah != null && this.ayah != null) {
      this.surahRepeatStart = { surah: this.surah, ayah: 1 };
    }
    if (mode === "off") this.surahRepeatStart = null;
    this.emitSnapshot();
  }

  /** Teacher plays once, then student gap (pause) before optional continue. */
  setTeachMode(enabled: boolean): void {
    this.teachEnabled = enabled;
    this.teachPhase = enabled ? "teacher" : "idle";
    this.emitSnapshot();
  }

  async playAyah(surah: number, ayah: number, reciterId?: string): Promise<void> {
    if (reciterId) this.reciterId = reciterId;
    this.surah = surah;
    this.ayah = ayah;
    if (this.repeatMode === "surah" && !this.surahRepeatStart) {
      this.surahRepeatStart = { surah, ayah: 1 };
    }
    this.emitAyahChange();

    const el = this.ensureAudio();
    const url = getAyahAudioUrl(surah, ayah, this.reciterId);
    this.setPlayerState("loading");
    if (this.teachEnabled) this.teachPhase = "teacher";

    el.src = url;
    try {
      await el.play();
      this.setPlayerState("playing");
    } catch {
      this.setPlayerState("error");
    }
  }

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
        } catch {
          this.setPlayerState("error");
        }
      }
      return;
    }
    await this.playAyah(surah, ayah);
  }

  async seekToAyah(surah: number, ayah: number): Promise<void> {
    await this.playAyah(surah, ayah);
  }

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

  private async onEnded(): Promise<void> {
    if (this.teachEnabled && this.teachPhase === "teacher") {
      this.teachPhase = "student";
      this.setPlayerState("paused");
      // Student gap — auto-resume teacher on next ayah after short delay
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
      // End of surah → restart from ayah 1
      const start = this.surahRepeatStart ?? { surah: this.surah, ayah: 1 };
      await this.playAyah(start.surah, start.ayah);
      return;
    }

    // Advance once when not repeating
    if (this.surah != null && this.ayah != null) {
      const next = nextAyah(this.surah, this.ayah);
      if (next) {
        await this.playAyah(next.surah, next.ayah);
        return;
      }
    }
    this.setPlayerState("idle");
  }
}

export function getAudioEngine(): AudioEngine {
  return AudioEngine.getInstance();
}

export default getAudioEngine;
