/**
 * مشغّل سورة كاملة — أوفلاين أولاً ثم البث (Capacitor/HTML5).
 * بديل react-native-sound — HTML5 Audio + getOfflineSurahUrl.
 */
import { claimAudio, registerAudioStopper, releaseAudio } from "@/lib/exclusive-audio-bus";
import { getSurahAudioUrl } from "@/lib/quran-audio";
import { getOfflineSurahUrl } from "@/lib/quran-audio-downloads";
import { attachAudioStallRecovery, type StallRecoveryHandle } from "@/lib/audio-stall-recovery";
import { classifyPlaybackNetworkError } from "@/lib/playback-network-error";
import {
  deactivateNativeAudioSession,
  ensureNativePlaybackAudioSession,
} from "@/lib/native-playback-audio";

export type { AyahTiming } from "@/lib/surah-ayah-timing";

export type PlaybackSource = "offline" | "stream";

export type OfflinePlayerState = "idle" | "loading" | "playing" | "paused" | "ended" | "error";

export type OfflinePlayerCallbacks = {
  onTimeUpdate?: (currentTime: number) => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
  onSourceResolved?: (source: PlaybackSource) => void;
  onStateChange?: (state: OfflinePlayerState) => void;
};

export type ResolvedSurahPlayback = {
  url: string;
  source: PlaybackSource;
  revokeOnCleanup?: boolean;
};

export async function resolveSurahPlaybackUrl(
  reciterId: string,
  surahNumber: number,
): Promise<ResolvedSurahPlayback> {
  const offline = await getOfflineSurahUrl(reciterId, surahNumber);
  if (offline) {
    return {
      url: offline,
      source: "offline",
      revokeOnCleanup: offline.startsWith("blob:"),
    };
  }
  return {
    url: getSurahAudioUrl(surahNumber, reciterId),
    source: "stream",
  };
}

export class OfflineQuranPlayer {
  private static active: OfflineQuranPlayer | null = null;

  private audio: HTMLAudioElement | null = null;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private stallHandle: StallRecoveryHandle | null = null;
  private stopUnregister: (() => void) | null = null;
  private callbacks: OfflinePlayerCallbacks = {};
  private state: OfflinePlayerState = "idle";
  private source: PlaybackSource = "stream";
  private hadOfflineAttempt = false;
  private revokeUrl: (() => void) | null = null;
  private generation = 0;

  static getActive(): OfflineQuranPlayer | null {
    return OfflineQuranPlayer.active;
  }

  getState(): OfflinePlayerState {
    return this.state;
  }

  getSource(): PlaybackSource {
    return this.source;
  }

  getCurrentTime(): number {
    const t = this.audio?.currentTime;
    return Number.isFinite(t) ? t! : 0;
  }

  getDuration(): number {
    const d = this.audio?.duration;
    return Number.isFinite(d) ? d! : 0;
  }

  async playSurah(
    reciterId: string,
    surahNumber: number,
    callbacks: OfflinePlayerCallbacks = {},
  ): Promise<void> {
    await this.stop();
    OfflineQuranPlayer.active = this;
    this.callbacks = callbacks;
    this.generation += 1;
    const gen = this.generation;

    this.setState("loading");
    await claimAudio("tilawa");

    const offlineUrl = await getOfflineSurahUrl(reciterId, surahNumber);
    this.hadOfflineAttempt = Boolean(offlineUrl);

    let resolved: ResolvedSurahPlayback;
    if (offlineUrl) {
      resolved = { url: offlineUrl, source: "offline", revokeOnCleanup: offlineUrl.startsWith("blob:") };
    } else {
      resolved = { url: getSurahAudioUrl(surahNumber, reciterId), source: "stream" };
    }

    if (gen !== this.generation) return;

    this.source = resolved.source;
    this.callbacks.onSourceResolved?.(resolved.source);

    if (resolved.revokeOnCleanup) {
      this.revokeUrl = () => URL.revokeObjectURL(resolved.url);
    }

    const audio = new Audio();
    this.audio = audio;
    this.stopUnregister = registerAudioStopper("tilawa", () => {
      void this.stop();
    });

    this.stallHandle = attachAudioStallRecovery(audio, {
      shouldRecover: () => this.state === "playing" || this.state === "loading",
      onPhaseChange: (phase) => {
        if (phase === "buffering" || phase === "recovering") this.setState("loading");
        if (phase === "idle" && !audio.paused && !audio.ended) this.setState("playing");
      },
    });

    audio.addEventListener("ended", () => {
      this.clearTick();
      this.setState("ended");
      this.callbacks.onEnd?.();
    });

    audio.addEventListener("error", () => {
      if (gen !== this.generation) return;
      const classified = classifyPlaybackNetworkError(
        audio.error ?? new Error("audio_error"),
        this.source,
        this.hadOfflineAttempt,
      );
      this.setState("error");
      this.callbacks.onError?.(classified.message);
    });

    try {
      audio.src = resolved.url;
      audio.preload = "auto";
      await ensureNativePlaybackAudioSession();
      await audio.play();
      if (gen !== this.generation) return;
      this.setState("playing");
      this.startTick();
    } catch (err) {
      if (gen !== this.generation) return;
      const classified = classifyPlaybackNetworkError(err, this.source, this.hadOfflineAttempt);
      this.setState("error");
      this.callbacks.onError?.(classified.message);
    }
  }

  seekToAyah(timeInSeconds: number): void {
    if (!this.audio) return;
    try {
      const dur = this.audio.duration;
      const target = Number.isFinite(dur) && dur > 0
        ? Math.min(Math.max(timeInSeconds, 0), Math.max(0, dur - 0.05))
        : Math.max(timeInSeconds, 0);
      this.audio.currentTime = target;
      this.callbacks.onTimeUpdate?.(target);
    } catch {
      /* metadata not ready */
    }
  }

  togglePlayPause(isPlaying: boolean, onStatusChange?: (status: boolean) => void): void {
    if (!this.audio) return;
    if (isPlaying) {
      this.audio.pause();
      this.clearTick();
      this.setState("paused");
      onStatusChange?.(false);
      return;
    }
    void this.audio.play().then(() => {
      this.setState("playing");
      this.startTick();
      onStatusChange?.(true);
    }).catch((err) => {
      const classified = classifyPlaybackNetworkError(err, this.source, this.hadOfflineAttempt);
      this.setState("error");
      this.callbacks.onError?.(classified.message);
      onStatusChange?.(false);
    });
  }

  async stop(): Promise<void> {
    this.generation += 1;
    this.clearTick();
    this.stallHandle?.dispose();
    this.stallHandle = null;
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.removeAttribute("src");
        this.audio.load();
      } catch {
        /* ignore */
      }
      this.audio = null;
    }
    this.revokeUrl?.();
    this.revokeUrl = null;
    this.stopUnregister?.();
    this.stopUnregister = null;
    releaseAudio("tilawa");
    void deactivateNativeAudioSession();
    if (OfflineQuranPlayer.active === this) OfflineQuranPlayer.active = null;
    this.setState("idle");
  }

  private setState(next: OfflinePlayerState): void {
    if (this.state === next) return;
    this.state = next;
    this.callbacks.onStateChange?.(next);
  }

  private startTick(): void {
    this.clearTick();
    this.tickTimer = setInterval(() => {
      if (!this.audio || this.audio.paused || this.audio.ended) return;
      const t = this.audio.currentTime;
      if (Number.isFinite(t)) this.callbacks.onTimeUpdate?.(t);
    }, 100);
  }

  private clearTick(): void {
    if (this.tickTimer != null) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }
}

/** نسخة مشتركة — مطابقة لسلوك RN static class. */
export const offlineQuranPlayer = new OfflineQuranPlayer();
