/**
 * Web / Capacitor port of Flutter `just_audio` AudioService.
 * Plays URL-based MP3s (everyayah) and syncs play/pause/stop.
 * Does not own UI state — callers update QuranAppController separately.
 */
import { getAyahAudioUrl } from "@/lib/quran-audio";

export type AudioServiceState = {
  url: string | null;
  playing: boolean;
  loading: boolean;
  error: string | null;
};

type Listener = (state: AudioServiceState) => void;

export class MajlisAudioService {
  private audio: HTMLAudioElement | null = null;
  private url: string | null = null;
  private playing = false;
  private loading = false;
  private error: string | null = null;
  private listeners = new Set<Listener>();

  private ensureAudio(): HTMLAudioElement | null {
    if (typeof Audio === "undefined") return null;
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = "auto";
      this.audio.addEventListener("playing", () => {
        this.playing = true;
        this.loading = false;
        this.emit();
      });
      this.audio.addEventListener("pause", () => {
        this.playing = false;
        this.emit();
      });
      this.audio.addEventListener("ended", () => {
        this.playing = false;
        this.emit();
      });
      this.audio.addEventListener("waiting", () => {
        this.loading = true;
        this.emit();
      });
      this.audio.addEventListener("error", () => {
        this.playing = false;
        this.loading = false;
        this.error = "تعذّر تشغيل التلاوة";
        this.emit();
      });
    }
    return this.audio;
  }

  private emit(): void {
    const snap = this.getState();
    for (const l of this.listeners) {
      try {
        l(snap);
      } catch {
        /* ignore */
      }
    }
  }

  getState(): AudioServiceState {
    return {
      url: this.url,
      playing: this.playing,
      loading: this.loading,
      error: this.error,
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Play an absolute MP3 URL (Flutter just_audio setUrl + play). */
  async playUrl(url: string): Promise<void> {
    const el = this.ensureAudio();
    if (!el) {
      this.error = "HTMLAudioElement غير متاح";
      this.emit();
      return;
    }
    this.error = null;
    this.loading = true;
    this.url = url;
    this.emit();
    try {
      if (el.src !== url) {
        el.src = url;
      }
      try {
        const { ensureNativePlaybackAudioSession } = await import("@/lib/native-playback-audio");
        await ensureNativePlaybackAudioSession();
      } catch (sessionErr) {
        console.warn("[MajlisAudioService] native playback session:", sessionErr);
      }
      await el.play();
      this.playing = true;
      this.loading = false;
      this.emit();
    } catch (err) {
      this.playing = false;
      this.loading = false;
      this.error = err instanceof Error ? err.message : "فشل التشغيل";
      this.emit();
    }
  }

  /** Convenience: everyayah ayah MP3 for reciter (default alafasy). */
  async playAyah(surah: number, ayah: number, reciterId = "alafasy"): Promise<void> {
    const url = getAyahAudioUrl(surah, ayah, reciterId);
    await this.playUrl(url);
  }

  /**
   * Play/pause toggle for an ayah. Returns true if now playing.
   * Same URL while playing → pause; otherwise play that ayah.
   */
  async toggleAyah(
    surah: number,
    ayah: number,
    reciterId = "alafasy",
  ): Promise<boolean> {
    const url = getAyahAudioUrl(surah, ayah, reciterId);
    if (this.playing && this.url === url) {
      await this.pause();
      return false;
    }
    await this.playUrl(url);
    return this.playing;
  }

  async pause(): Promise<void> {
    this.audio?.pause();
    this.playing = false;
    this.emit();
  }

  async stop(): Promise<void> {
    const el = this.audio;
    if (!el) return;
    try {
      el.pause();
      el.currentTime = 0;
    } catch {
      /* ignore */
    }
    this.playing = false;
    this.loading = false;
    this.emit();
  }

  async dispose(): Promise<void> {
    await this.stop();
    if (this.audio) {
      try {
        this.audio.removeAttribute("src");
        this.audio.load();
      } catch {
        /* ignore */
      }
    }
    this.audio = null;
    this.url = null;
    this.listeners.clear();
  }
}

let singleton: MajlisAudioService | null = null;

export function getMajlisAudioService(): MajlisAudioService {
  if (!singleton) singleton = new MajlisAudioService();
  return singleton;
}

export function createMajlisAudioService(): MajlisAudioService {
  return new MajlisAudioService();
}

/** @deprecated alias matching Flutter AudioService name in docs */
export const AudioService = MajlisAudioService;
