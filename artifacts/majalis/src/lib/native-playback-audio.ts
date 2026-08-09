/**
 * Capacitor bridge for MajlisPlaybackAudioPlugin.
 * Activates AVAudioSession only when playback/recording is requested — never at cold start.
 */
import { isIOS, isNative } from "@/lib/capacitor-utils";

export type NativeAudioMode = "inactive" | "playback" | "recording";

type PlaybackAudioPlugin = {
  enablePlayback: () => Promise<{ ok: boolean; mode: NativeAudioMode }>;
  enableRecording: () => Promise<{ ok: boolean; mode: NativeAudioMode }>;
  deactivate: () => Promise<{ ok: boolean; mode: NativeAudioMode }>;
  currentMode: () => Promise<{ mode: NativeAudioMode }>;
  addListener?: (
    event: "audioInterruption" | "audioRouteChange",
    cb: (data: Record<string, unknown>) => void,
  ) => Promise<{ remove: () => Promise<void> }>;
};

let pluginPromise: Promise<PlaybackAudioPlugin | null> | null = null;
let activeMode: NativeAudioMode = "inactive";
let playbackRefCount = 0;

async function getPlugin(): Promise<PlaybackAudioPlugin | null> {
  if (!isNative || !isIOS) return null;
  if (!pluginPromise) {
    pluginPromise = (async () => {
      const { registerPlugin } = await import("@capacitor/core");
      return registerPlugin<PlaybackAudioPlugin>("MajlisPlaybackAudio");
    })().catch((err: unknown) => {
      console.warn("[native-playback-audio] plugin unavailable:", err);
      pluginPromise = null;
      return null;
    });
  }
  return pluginPromise;
}

/** للاشتراك في أحداث المقاطعة/تغيير المسار من طبقة التشغيل. */
export function getNativePlaybackPlugin(): Promise<PlaybackAudioPlugin | null> {
  return getPlugin();
}

/** Call immediately before HTMLAudioElement.play() that needs background audio. */
export async function ensureNativePlaybackAudioSession(): Promise<void> {
  const plugin = await getPlugin();
  if (!plugin) return;
  if (activeMode === "recording") {
    throw new Error("audio_session_busy_recording");
  }
  const result = await plugin.enablePlayback();
  if (!result?.ok) {
    throw new Error("audio_session_playback_failed");
  }
  activeMode = "playback";
  playbackRefCount += 1;
}

/** Switch to recording before speech / recitation capture. */
export async function ensureNativeRecordingAudioSession(): Promise<void> {
  const plugin = await getPlugin();
  if (!plugin) return;
  const result = await plugin.enableRecording();
  if (!result?.ok) {
    throw new Error("audio_session_recording_failed");
  }
  activeMode = "recording";
  playbackRefCount = 0;
}

/** Release session when no playback/recording is needed. */
export async function deactivateNativeAudioSession(): Promise<void> {
  const plugin = await getPlugin();
  if (!plugin) return;
  playbackRefCount = Math.max(0, playbackRefCount - 1);
  if (playbackRefCount > 0 && activeMode === "playback") return;
  const result = await plugin.deactivate();
  if (!result?.ok) {
    throw new Error("audio_session_deactivate_failed");
  }
  activeMode = "inactive";
  playbackRefCount = 0;
}

export function getNativeAudioMode(): NativeAudioMode {
  return activeMode;
}

/** Test helper — reset module state without touching the native session. */
export function __resetNativeAudioSessionStateForTests(): void {
  activeMode = "inactive";
  playbackRefCount = 0;
  pluginPromise = null;
}
