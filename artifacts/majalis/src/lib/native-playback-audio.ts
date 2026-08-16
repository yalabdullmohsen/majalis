/**
 * Capacitor bridge for MajlisPlaybackAudioPlugin (iOS) + MajlisMediaPlayback (Android FGS).
 * Activates AVAudioSession / foreground service only when playback is requested — never at cold start.
 */
import { isAndroid, isIOS, isNative } from "@/lib/capacitor-utils";

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

type AndroidMediaPlugin = {
  startForeground: (opts: { title?: string; artist?: string }) => Promise<{ ok: boolean }>;
  stopForeground: () => Promise<{ ok: boolean }>;
};

let pluginPromise: Promise<PlaybackAudioPlugin | null> | null = null;
let androidPluginPromise: Promise<AndroidMediaPlugin | null> | null = null;
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

async function getAndroidMediaPlugin(): Promise<AndroidMediaPlugin | null> {
  if (!isNative || !isAndroid) return null;
  if (!androidPluginPromise) {
    androidPluginPromise = (async () => {
      const { registerPlugin } = await import("@capacitor/core");
      return registerPlugin<AndroidMediaPlugin>("MajlisMediaPlayback");
    })().catch((err: unknown) => {
      console.warn("[native-playback-audio] android media plugin unavailable:", err);
      androidPluginPromise = null;
      return null;
    });
  }
  return androidPluginPromise;
}

/** للاشتراك في أحداث المقاطعة/تغيير المسار من طبقة التشغيل (iOS). */
export function getNativePlaybackPlugin(): Promise<PlaybackAudioPlugin | null> {
  return getPlugin();
}

/** Call immediately before HTMLAudioElement.play() that needs background audio. */
export async function ensureNativePlaybackAudioSession(
  meta?: { title?: string; artist?: string },
): Promise<void> {
  if (activeMode === "recording") {
    throw new Error("audio_session_busy_recording");
  }

  const ios = await getPlugin();
  if (ios) {
    const result = await ios.enablePlayback();
    if (!result?.ok) {
      throw new Error("audio_session_playback_failed");
    }
  }

  const android = await getAndroidMediaPlugin();
  if (android) {
    await android.startForeground({
      title: meta?.title ?? "تلاوة القرآن",
      artist: meta?.artist ?? "المجلس العلمي",
    });
  }

  if (!ios && !android) return;
  activeMode = "playback";
  playbackRefCount += 1;
}

/** Switch to recording before speech / recitation capture. */
export async function ensureNativeRecordingAudioSession(): Promise<void> {
  const plugin = await getPlugin();
  if (!plugin) return;
  const android = await getAndroidMediaPlugin();
  if (android) {
    await android.stopForeground().catch(() => undefined);
  }
  const result = await plugin.enableRecording();
  if (!result?.ok) {
    throw new Error("audio_session_recording_failed");
  }
  activeMode = "recording";
  playbackRefCount = 0;
}

/** Release session when no playback/recording is needed. */
export async function deactivateNativeAudioSession(): Promise<void> {
  playbackRefCount = Math.max(0, playbackRefCount - 1);
  if (playbackRefCount > 0 && activeMode === "playback") return;

  const ios = await getPlugin();
  if (ios) {
    const result = await ios.deactivate();
    if (!result?.ok) {
      throw new Error("audio_session_deactivate_failed");
    }
  }

  const android = await getAndroidMediaPlugin();
  if (android) {
    await android.stopForeground().catch(() => undefined);
  }

  activeMode = "inactive";
  playbackRefCount = 0;
}

export function getNativeAudioMode(): NativeAudioMode {
  return activeMode;
}

let foregroundHookInstalled = false;

/**
 * إعادة تفعيل AVAudioSession عند العودة للمقدمة إذا كانت جلسة التشغيل نشطة.
 * لا يفعّل الجلسة عند الإقلاع البارد.
 */
export function installNativePlaybackForegroundResume(): void {
  if (foregroundHookInstalled || typeof document === "undefined") return;
  foregroundHookInstalled = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    if (activeMode !== "playback") return;
    void ensureNativePlaybackAudioSession().catch((err: unknown) => {
      console.warn("[native-playback-audio] foreground resume failed:", err);
    });
  });
  if (isIOS) {
    void getPlugin().then((plugin) => {
      if (!plugin?.addListener) return;
      void plugin.addListener("audioInterruption", (data) => {
        if (data.type === "ended" && data.shouldResume && activeMode === "playback") {
          void ensureNativePlaybackAudioSession().catch((err: unknown) => {
            console.warn("[native-playback-audio] interruption resume failed:", err);
          });
        }
      });
      void plugin.addListener("audioRouteChange", () => {
        if (activeMode === "playback") {
          void ensureNativePlaybackAudioSession().catch((err: unknown) => {
            console.warn("[native-playback-audio] route-change resume failed:", err);
          });
        }
      });
    });
  }
}

/** Test helper — reset module state without touching the native session. */
export function __resetNativeAudioSessionStateForTests(): void {
  activeMode = "inactive";
  playbackRefCount = 0;
  pluginPromise = null;
  androidPluginPromise = null;
  foregroundHookInstalled = false;
}
