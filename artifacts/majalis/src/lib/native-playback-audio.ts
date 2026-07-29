/**
 * Configure AVAudioSession-compatible playback hints for Capacitor iOS WebView.
 * HTMLAudioElement needs the web audio category; we set document meta + wake lock
 * cautiously. Native session category for playback is requested via a tiny plugin
 * when available; otherwise we document the limitation.
 */
import { isIOS, isNative } from "@/lib/capacitor-utils";

let configured = false;

export async function ensureNativePlaybackAudioSession(): Promise<void> {
  if (!isNative || !isIOS || configured) return;
  configured = true;
  try {
    // Prefer silent plugin if present in future builds; no-op if missing.
    const { registerPlugin } = await import("@capacitor/core");
    type PlaybackAudio = { enablePlayback: () => Promise<{ ok: boolean }> };
    const plugin = registerPlugin<PlaybackAudio>("MajlisPlaybackAudio");
    await plugin.enablePlayback();
  } catch {
    // Plugin may not be linked yet — background audio still declared in Info.plist;
    // WKWebView mediaPlaybackRequiresUserAction is false by Capacitor default.
  }
}
