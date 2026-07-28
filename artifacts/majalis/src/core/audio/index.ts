/**
 * Core audio façade — Quran recitation engine (no UI).
 */
export {
  AudioEngine,
  getAudioEngine,
  __resetAudioEngineForTests,
} from "@/core/audio/AudioEngine";
export {
  loadSurahSyncMap,
  ayahAtTime,
  findAyahTiming,
  __clearSurahSyncCacheForTests,
} from "@/core/audio/sync-loader";
export type {
  PlayerState,
  TeachPhase,
  RepeatMode,
  RepeatRange,
  AyahTiming,
  SurahSyncMap,
  AudioEngineSnapshot,
  DownloadProgress,
  AyahChangeEvent,
  AudioEngineEvents,
  AudioEngineEventName,
  TeachConfig,
} from "@/core/audio/types";
