/**
 * Core audio types for the Quran AudioEngine (no React).
 */
export type PlayerState =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "error"
  | "buffering";

export type TeachPhase = "idle" | "teacher" | "student-pause";

/** Repeat policy for memorization / continuous listening. */
export type RepeatMode = "none" | "ayah" | "surah" | "range";

export type RepeatRange = {
  surah: number;
  startAyah: number;
  endAyah: number;
};

export type AyahTiming = {
  ayah: number;
  /** Seconds from start of the media asset. */
  start: number;
  /** Seconds from start of the media asset (exclusive end). */
  end: number;
};

/** Synchronization map for continuous surah audio (optional JSON). */
export type SurahSyncMap = {
  surah: number;
  reciterId: string;
  /** Source hint: continuous surah file vs per-ayah clips. */
  mode: "continuous" | "per-ayah";
  ayahs: AyahTiming[];
};

export type AudioEngineSnapshot = {
  surah: number | null;
  ayah: number | null;
  reciterId: string;
  playerState: PlayerState;
  teachPhase: TeachPhase;
  repeatMode: RepeatMode;
  currentTime: number;
  duration: number;
  downloadProgress: DownloadProgress | null;
};

export type DownloadProgress = {
  reciterId: string;
  surah: number;
  /** 0–1 fraction of bytes received for the current surah file. */
  fraction: number;
  status: "pending" | "downloading" | "completed" | "failed";
  bytesReceived?: number;
  bytesTotal?: number;
};

export type AyahChangeEvent = {
  surah: number;
  ayah: number;
  verseKey: string;
  source: "play" | "seek" | "advance" | "sync";
};

export type AudioEngineEvents = {
  onAyahChange: AyahChangeEvent;
  onStateChange: AudioEngineSnapshot;
  onDownloadProgress: DownloadProgress;
  onError: { message: string; surah?: number; ayah?: number };
};

export type AudioEngineEventName = keyof AudioEngineEvents;

export type TeachConfig = {
  enabled: boolean;
  studentPauseMs: number;
  replayTeacher: boolean;
};
