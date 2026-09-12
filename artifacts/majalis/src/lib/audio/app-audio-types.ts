/**
 * أنواع الصوت المركزي — Single Active Audio Policy.
 */
export type AppAudioKind =
  | "adhanPreview"
  | "prayerPrompt"
  | "dhikrPrompt"
  | "tasbeehPrompt"
  | "notificationPreview"
  | "quranRecitation"
  | "lessonAudio"
  | "videoAudio"
  | "miniPlayer"
  | "tafsir"
  | "audioReader"
  | "systemInterruption"
  | "other";

export type AppAudioPhase =
  | "idle"
  | "preparing"
  | "playing"
  | "paused"
  | "stopping"
  | "interrupted"
  | "failed";

export const APP_AUDIO_PRIORITY: Record<AppAudioKind, number> = {
  systemInterruption: 100,
  quranRecitation: 80,
  lessonAudio: 80,
  audioReader: 78,
  miniPlayer: 75,
  videoAudio: 70,
  tafsir: 65,
  adhanPreview: 60,
  notificationPreview: 55,
  prayerPrompt: 50,
  dhikrPrompt: 40,
  tasbeehPrompt: 35,
  other: 10,
};

export type AppAudioLicenseStatus =
  | "project_original"
  | "licensed_bundle"
  | "needs_recording"
  | "needs_license"
  | "development_only";

export type AppAudioPlayRequest = {
  sourceId: string;
  kind: AppAudioKind;
  url: string;
  shortLived?: boolean;
  userInitiated?: boolean;
  mayResumeAfterInterruption?: boolean;
  screenId?: string;
  volume?: number;
  maxMs?: number;
  transcript?: string;
};

export type AppAudioSnapshot = {
  phase: AppAudioPhase;
  activeSourceId: string | null;
  activeKind: AppAudioKind | null;
  activeScreen: string | null;
  startedAt: number | null;
  playbackPosition: number;
  duration: number;
  requestToken: number;
  userInitiated: boolean;
  mayResumeAfterInterruption: boolean;
  lastError: string | null;
};

export const IDLE_AUDIO_SNAPSHOT: AppAudioSnapshot = {
  phase: "idle",
  activeSourceId: null,
  activeKind: null,
  activeScreen: null,
  startedAt: null,
  playbackPosition: 0,
  duration: 0,
  requestToken: 0,
  userInitiated: false,
  mayResumeAfterInterruption: false,
  lastError: null,
};
