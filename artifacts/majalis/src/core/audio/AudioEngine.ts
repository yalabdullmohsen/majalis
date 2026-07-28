/**
 * AudioEngine — high-quality Quran recitation playback (HTML5 Audio).
 *
 * - Per-ayah clips (everyayah) by default; optional continuous sync maps
 * - Play / Pause / Seek without blocking the UI thread
 * - onAyahChange listener (clip boundaries or sync JSON timestamps)
 * - Repeat: none | ayah | surah | range
 * - Teacher/Student mode (pause after each ayah for user recite)
 * - Prefetch next verse while current plays
 * - Offline surah download progress → DatabaseManager.offline_assets_store
 *
 * No React — singleton via `getAudioEngine()`.
 */
import { getSurahMeta } from "@/lib/quran-api";
import {
  getAyahAudioUrl,
  getSurahAudioUrl,
  loadReciterId,
  saveReciterId,
  loadPlaybackRate,
  savePlaybackRate,
} from "@/lib/quran-audio";
import {
  prefetchNextAyahs,
  peekCachedAyahObjectUrl,
  resolveAyahAudioSrc,
  warmAyahObjectUrl,
} from "@/lib/ayah-audio-prefetch";
import { getOfflineSurahUrl } from "@/lib/quran-audio-downloads";
import {
  advanceAfterTeacherEnded,
  DEFAULT_TEACH_CONFIG,
} from "@/lib/teach-repeat-controller";
import { getDatabaseManager } from "@/core/quran/DatabaseManager";
import { ayahAtTime, findAyahTiming, loadSurahSyncMap } from "@/core/audio/sync-loader";
import type {
  AudioEngineEventName,
  AudioEngineEvents,
  AudioEngineSnapshot,
  DownloadProgress,
  PlayerState,
  RepeatMode,
  RepeatRange,
  SurahSyncMap,
  TeachConfig,
  TeachPhase,
} from "@/core/audio/types";

type Listener<T> = (payload: T) => void;

function clampAyah(n: number, total: number): number {
  return Math.min(Math.max(1, Math.floor(n) || 1), Math.max(1, total));
}

export class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private reciterId = loadReciterId();
  private playbackRate = loadPlaybackRate();
  private surah: number | null = null;
  private ayah: number | null = null;
  private playerState: PlayerState = "idle";
  private teachPhase: TeachPhase = "idle";
  private repeatMode: RepeatMode = "none";
  private repeatRange: RepeatRange | null = null;
  private teachConfig: TeachConfig = { ...DEFAULT_TEACH_CONFIG, enabled: false };
  private studentDone = false;
  private pendingTeachAyah: number | null = null;
  private delayTimer: number | null = null;
  private syncMap: SurahSyncMap | null = null;
  private usingContinuous = false;
  private downloadProgress: DownloadProgress | null = null;
  private rafId: number | null = null;
  private lastEmittedAyah: number | null = null;
  private disposed = false;

  private listeners: {
    [K in AudioEngineEventName]: Set<Listener<AudioEngineEvents[K]>>;
  } = {
    onAyahChange: new Set(),
    onStateChange: new Set(),
    onDownloadProgress: new Set(),
    onError: new Set(),
  };

  /** Lazily create the shared HTMLAudioElement (never blocks UI). */
  private ensureAudio(): HTMLAudioElement {
    if (this.audio) return this.audio;
    const el = new Audio();
    el.preload = "auto";
    el.playbackRate = this.playbackRate;
    el.addEventListener("playing", () => this.setPlayerState("playing"));
    el.addEventListener("waiting", () => {
      if (this.playerState === "playing" || this.playerState === "loading") {
        this.setPlayerState("buffering");
      }
    });
    el.addEventListener("pause", () => {
      if (this.disposed || el.ended) return;
      if (this.playerState !== "idle" && this.teachPhase !== "student-pause") {
        this.setPlayerState("paused");
      }
    });
    el.addEventListener("ended", () => void this.onEnded());
    el.addEventListener("error", () => {
      this.setPlayerState("error");
      this.emit("onError", {
        message: "تعذّر تشغيل التلاوة",
        surah: this.surah ?? undefined,
        ayah: this.ayah ?? undefined,
      });
    });
    el.addEventListener("timeupdate", () => this.onTimeUpdate());
    this.audio = el;
    return el;
  }

  getSnapshot(): AudioEngineSnapshot {
    const audio = this.audio;
    return {
      surah: this.surah,
      ayah: this.ayah,
      reciterId: this.reciterId,
      playerState: this.playerState,
      teachPhase: this.teachPhase,
      repeatMode: this.repeatMode,
      currentTime: audio?.currentTime ?? 0,
      duration: audio && Number.isFinite(audio.duration) ? audio.duration : 0,
      downloadProgress: this.downloadProgress,
    };
  }

  on<K extends AudioEngineEventName>(
    event: K,
    listener: Listener<AudioEngineEvents[K]>,
  ): () => void {
    this.listeners[event].add(listener);
    return () => this.listeners[event].delete(listener);
  }

  private emit<K extends AudioEngineEventName>(
    event: K,
    payload: AudioEngineEvents[K],
  ): void {
    for (const fn of this.listeners[event]) {
      try {
        fn(payload);
      } catch {
        /* never break playback for a bad listener */
      }
    }
  }

  private notifyState(): void {
    this.emit("onStateChange", this.getSnapshot());
  }

  private setPlayerState(state: PlayerState): void {
    if (this.playerState === state) return;
    this.playerState = state;
    this.notifyState();
  }

  private clearDelay(): void {
    if (this.delayTimer != null) {
      globalThis.clearTimeout(this.delayTimer);
      this.delayTimer = null;
    }
  }

  private totalAyahs(surah: number): number {
    return getSurahMeta(surah).ayahs;
  }

  private emitAyahChange(
    surah: number,
    ayah: number,
    source: "play" | "seek" | "advance" | "sync",
  ): void {
    if (this.lastEmittedAyah === ayah && this.surah === surah && source === "sync") {
      return;
    }
    this.lastEmittedAyah = ayah;
    this.surah = surah;
    this.ayah = ayah;
    this.emit("onAyahChange", {
      surah,
      ayah,
      verseKey: `${surah}:${ayah}`,
      source,
    });
    this.notifyState();
  }

  setReciter(reciterId: string): void {
    this.reciterId = reciterId;
    saveReciterId(reciterId);
    this.syncMap = null;
    this.notifyState();
  }

  getReciter(): string {
    return this.reciterId;
  }

  setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
    savePlaybackRate(rate);
    if (this.audio) this.audio.playbackRate = rate;
    this.notifyState();
  }

  setRepeatMode(mode: RepeatMode, range?: RepeatRange): void {
    this.repeatMode = mode;
    if (mode === "range" && range) {
      const total = this.totalAyahs(range.surah);
      this.repeatRange = {
        surah: range.surah,
        startAyah: clampAyah(range.startAyah, total),
        endAyah: clampAyah(Math.max(range.startAyah, range.endAyah), total),
      };
    } else {
      this.repeatRange = null;
    }
    if (mode !== "none") {
      this.teachConfig = { ...this.teachConfig, enabled: false };
      this.teachPhase = "idle";
    }
    this.notifyState();
  }

  getRepeatMode(): RepeatMode {
    return this.repeatMode;
  }

  setTeachMode(patch: Partial<TeachConfig>): void {
    this.teachConfig = { ...this.teachConfig, ...patch };
    if (this.teachConfig.enabled) {
      this.repeatMode = "none";
      this.repeatRange = null;
    } else {
      this.teachPhase = "idle";
      this.studentDone = false;
      this.pendingTeachAyah = null;
      this.clearDelay();
    }
    this.notifyState();
  }

  finishStudentPause(): void {
    this.clearDelay();
    const ayah = this.pendingTeachAyah;
    const surah = this.surah;
    if (ayah == null || surah == null) {
      this.teachPhase = "idle";
      this.notifyState();
      return;
    }
    this.studentDone = true;
    this.teachPhase = "teacher";
    const next = advanceAfterTeacherEnded(
      this.teachConfig,
      ayah,
      this.totalAyahs(surah),
      true,
    );
    if (next.action === "replay-teacher" || next.action === "next-ayah") {
      this.studentDone = false;
      void this.playAyah(surah, next.ayah);
    } else {
      this.ayah = null;
      this.teachPhase = "idle";
      this.pendingTeachAyah = null;
      this.setPlayerState("idle");
    }
  }

  /**
   * Play a specific ayah. Prefetches the next verse in the background.
   * Uses continuous sync map when available; otherwise per-ayah clips.
   */
  async playAyah(surah: number, ayah: number, opts?: { seekOnly?: boolean }): Promise<void> {
    if (typeof window === "undefined") return;
    const total = this.totalAyahs(surah);
    const target = clampAyah(ayah, total);
    this.clearDelay();

    // Warm sync map (non-blocking preference — fall back to per-ayah)
    if (!this.syncMap || this.syncMap.surah !== surah || this.syncMap.reciterId !== this.reciterId) {
      this.syncMap = await loadSurahSyncMap(surah, this.reciterId).catch(() => null);
    }

    const audio = this.ensureAudio();
    this.setPlayerState("loading");

    if (this.syncMap && this.syncMap.mode === "continuous") {
      await this.playContinuous(surah, target, opts?.seekOnly === true);
    } else {
      await this.playPerAyah(surah, target, opts?.seekOnly === true);
    }

    // Prefetch next while current is playing (never await on critical path beyond play)
    this.prefetchAround(surah, target);

    if (this.teachConfig.enabled) {
      this.studentDone = false;
      this.pendingTeachAyah = target;
      this.teachPhase = "teacher";
      this.notifyState();
    }

    void audio; // keep lint calm — ensureAudio used above
  }

  private async playPerAyah(surah: number, ayah: number, seekOnly: boolean): Promise<void> {
    this.usingContinuous = false;
    const audio = this.ensureAudio();
    const wasPlaying =
      this.playerState === "playing" || this.playerState === "buffering";
    const src =
      peekCachedAyahObjectUrl(surah, ayah, this.reciterId) ??
      (await resolveAyahAudioSrc(surah, ayah, this.reciterId).catch(() =>
        getAyahAudioUrl(surah, ayah, this.reciterId),
      ));

    this.emitAyahChange(surah, ayah, seekOnly ? "seek" : "play");

    if (!audio.src || audio.src !== src) {
      audio.src = src;
      audio.load();
    }
    audio.playbackRate = this.playbackRate;
    try {
      audio.currentTime = 0;
    } catch {
      /* ignore */
    }
    warmAyahObjectUrl(surah, ayah, this.reciterId);

    if (seekOnly && !wasPlaying) {
      this.setPlayerState("paused");
      return;
    }

    try {
      await audio.play();
      this.setPlayerState("playing");
    } catch {
      this.setPlayerState("error");
      this.emit("onError", { message: "تعذّر تشغيل التلاوة", surah, ayah });
    }
  }

  private async playContinuous(
    surah: number,
    ayah: number,
    seekOnly: boolean,
  ): Promise<void> {
    this.usingContinuous = true;
    const audio = this.ensureAudio();
    const wasPlaying =
      this.playerState === "playing" || this.playerState === "buffering";
    const timing = this.syncMap ? findAyahTiming(this.syncMap, ayah) : null;
    const offline = await getOfflineSurahUrl(this.reciterId, surah).catch(() => null);
    const src = offline ?? getSurahAudioUrl(surah, this.reciterId);

    if (!audio.src || audio.src !== src) {
      audio.src = src;
      audio.load();
    }
    audio.playbackRate = this.playbackRate;

    const startAt = timing?.start ?? 0;
    const applySeek = () => {
      try {
        audio.currentTime = startAt;
      } catch {
        /* ignore seek before metadata */
      }
    };

    if (audio.readyState >= 1) applySeek();
    else {
      audio.addEventListener("loadedmetadata", applySeek, { once: true });
    }

    this.emitAyahChange(surah, ayah, seekOnly ? "seek" : "play");
    this.startSyncWatch();

    if (seekOnly && !wasPlaying) {
      this.setPlayerState("paused");
      return;
    }

    try {
      await audio.play();
      this.setPlayerState("playing");
    } catch {
      this.setPlayerState("error");
      this.emit("onError", { message: "تعذّر تشغيل التلاوة", surah, ayah });
    }
  }

  /** Seek to an ayah. Keeps playing if already playing; otherwise positions without audible start. */
  async seekToAyah(surah: number, ayah: number): Promise<void> {
    const active =
      this.playerState === "playing" ||
      this.playerState === "buffering" ||
      this.playerState === "loading" ||
      this.playerState === "paused";
    if (active) {
      await this.playAyah(surah, ayah, { seekOnly: true });
      return;
    }
    this.surah = surah;
    this.ayah = clampAyah(ayah, this.totalAyahs(surah));
    this.emitAyahChange(surah, this.ayah, "seek");
    warmAyahObjectUrl(surah, this.ayah, this.reciterId);
    this.prefetchAround(surah, this.ayah);
  }

  pause(): void {
    this.clearDelay();
    this.audio?.pause();
    this.setPlayerState("paused");
  }

  async resume(): Promise<void> {
    const audio = this.ensureAudio();
    try {
      await audio.play();
      this.setPlayerState("playing");
    } catch {
      this.setPlayerState("error");
    }
  }

  async togglePlay(surah: number, ayah: number): Promise<void> {
    if (
      this.surah === surah &&
      this.ayah === ayah &&
      (this.playerState === "playing" || this.playerState === "buffering")
    ) {
      this.pause();
      return;
    }
    if (
      this.surah === surah &&
      this.ayah === ayah &&
      this.playerState === "paused"
    ) {
      await this.resume();
      return;
    }
    await this.playAyah(surah, ayah);
  }

  stop(): void {
    this.clearDelay();
    this.stopSyncWatch();
    const audio = this.audio;
    if (audio) {
      audio.pause();
      try {
        audio.removeAttribute("src");
        audio.load();
      } catch {
        /* ignore */
      }
    }
    this.ayah = null;
    this.teachPhase = "idle";
    this.pendingTeachAyah = null;
    this.setPlayerState("idle");
  }

  private prefetchAround(surah: number, ayah: number): void {
    const total = this.totalAyahs(surah);
    prefetchNextAyahs(surah, ayah, total, this.reciterId, 3);
    for (let i = 1; i <= 3; i++) {
      if (ayah + i <= total) warmAyahObjectUrl(surah, ayah + i, this.reciterId);
    }
  }

  private onTimeUpdate(): void {
    if (!this.usingContinuous || !this.syncMap || !this.audio) return;
    const hit = ayahAtTime(this.syncMap, this.audio.currentTime);
    if (!hit) return;
    if (hit.ayah !== this.ayah) {
      this.emitAyahChange(this.syncMap.surah, hit.ayah, "sync");
      this.prefetchAround(this.syncMap.surah, hit.ayah);
    }
  }

  private startSyncWatch(): void {
    this.stopSyncWatch();
    if (typeof requestAnimationFrame !== "function") return;
    const tick = () => {
      this.onTimeUpdate();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopSyncWatch(): void {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private async onEnded(): Promise<void> {
    this.stopSyncWatch();
    const surah = this.surah;
    const ayah = this.ayah;
    if (surah == null || ayah == null) {
      this.setPlayerState("idle");
      return;
    }
    const total = this.totalAyahs(surah);

    if (this.teachConfig.enabled) {
      const next = advanceAfterTeacherEnded(
        this.teachConfig,
        ayah,
        total,
        this.studentDone,
      );
      if (next.action === "wait-student") {
        this.pendingTeachAyah = ayah;
        this.teachPhase = "student-pause";
        this.setPlayerState("paused");
        this.delayTimer = globalThis.setTimeout(() => {
          this.finishStudentPause();
        }, next.pauseMs) as unknown as number;
        return;
      }
      if (next.action === "replay-teacher" || next.action === "next-ayah") {
        this.studentDone = false;
        await this.playAyah(surah, next.ayah);
        return;
      }
      this.teachPhase = "idle";
      this.setPlayerState("idle");
      return;
    }

    if (this.repeatMode === "ayah") {
      await this.playAyah(surah, ayah);
      return;
    }

    if (this.repeatMode === "range" && this.repeatRange) {
      const { startAyah, endAyah, surah: rs } = this.repeatRange;
      if (surah === rs) {
        if (ayah < endAyah) {
          await this.playAyah(surah, ayah + 1);
          return;
        }
        await this.playAyah(surah, startAyah);
        return;
      }
    }

    if (this.repeatMode === "surah") {
      if (ayah < total) {
        await this.playAyah(surah, ayah + 1);
        return;
      }
      await this.playAyah(surah, 1);
      return;
    }

    // none — advance once through the surah then stop
    if (ayah < total) {
      await this.playAyah(surah, ayah + 1);
      return;
    }
    this.setPlayerState("idle");
  }

  /**
   * Download a full surah for offline use and track progress in OfflineAssetsStore.
   */
  async downloadSurahOffline(
    surah: number,
    reciterId = this.reciterId,
  ): Promise<boolean> {
    const db = getDatabaseManager();
    const assetId = `audio_surah:${reciterId}:${surah}`;

    const progress = (patch: Partial<DownloadProgress>) => {
      this.downloadProgress = {
        reciterId,
        surah,
        fraction: 0,
        status: "downloading",
        ...this.downloadProgress,
        ...patch,
      };
      this.emit("onDownloadProgress", this.downloadProgress);
      this.notifyState();
    };

    try {
      await db.initialize();
      await db.upsertAsset({
        asset_id: assetId,
        type: "audio_surah",
        reciter_id: reciterId,
        surah_id: surah,
        download_status: "downloading",
      });
      progress({ status: "downloading", fraction: 0 });

      const url = getSurahAudioUrl(surah, reciterId);
      const res = await fetch(url, { mode: "cors", credentials: "omit" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const total = Number(res.headers.get("content-length") || 0);
      const reader = res.body?.getReader();
      let received = 0;
      const chunks: Uint8Array[] = [];

      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.byteLength;
            const fraction = total > 0 ? Math.min(1, received / total) : 0;
            progress({
              status: "downloading",
              fraction,
              bytesReceived: received,
              bytesTotal: total || undefined,
            });
            // Yield so UI stays responsive during large downloads
            await new Promise<void>((r) => setTimeout(r, 0));
          }
        }
      } else {
        const blobFallback = await res.blob();
        chunks.push(new Uint8Array(await blobFallback.arrayBuffer()));
        received = blobFallback.size;
      }

      const blob = new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
      const { cacheSurahBlob } = await import("@/lib/quran-audio-downloads");
      await cacheSurahBlob(reciterId, surah, blob);

      await db.registerSurahAudio({
        reciterId,
        surahId: surah,
        status: "completed",
        file_reference: blob,
        size_bytes: blob.size,
        pinned: true,
      });

      progress({ status: "completed", fraction: 1, bytesReceived: blob.size, bytesTotal: blob.size });
      return true;
    } catch (err) {
      await db
        .setAssetDownloadStatus(assetId, "failed")
        .catch(() => undefined);
      progress({ status: "failed", fraction: this.downloadProgress?.fraction ?? 0 });
      this.emit("onError", {
        message: err instanceof Error ? err.message : "فشل تنزيل التلاوة",
        surah,
      });
      return false;
    }
  }

  /** Expose underlying element for MediaSession / word-sync hooks. */
  getAudioElement(): HTMLAudioElement | null {
    return this.audio;
  }

  dispose(): void {
    this.disposed = true;
    this.stop();
    this.audio = null;
    for (const set of Object.values(this.listeners)) set.clear();
  }
}

let singleton: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!singleton) singleton = new AudioEngine();
  return singleton;
}

/** Test helper. */
export function __resetAudioEngineForTests(): void {
  singleton?.dispose();
  singleton = null;
}
