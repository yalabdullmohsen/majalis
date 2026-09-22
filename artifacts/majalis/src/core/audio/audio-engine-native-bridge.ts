/**
 * Native bridge hooks for AudioEngine — loaded only when tilawa starts.
 * Kept out of the critical entry chunk.
 */
import { getSurahMeta } from "@/lib/quran-api";

export type NativeBridgeHost = {
  pause: () => void;
  stop: () => void;
  skipNext: () => Promise<void>;
  skipPrev: () => Promise<void>;
  togglePlay: (surah: number, ayah: number) => Promise<void>;
  getPlayerState: () => string;
  getSurah: () => number | null;
  getAyah: () => number | null;
  getAudioEl: () => HTMLAudioElement | null;
  getPlaybackRate: () => number;
  setPlayerState: (state: "playing" | "paused" | "error" | "idle") => void;
  activatePlaybackSession: (meta?: { title?: string; artist?: string }) => Promise<void>;
  addCleanup: (fn: () => void) => void;
};

function metaFor(surah: number, ayah: number): { title: string; artist: string } {
  return { title: `${getSurahMeta(surah).name} · آية ${ayah}`, artist: "سُنّة" };
}

export function syncNativeNowPlaying(host: NativeBridgeHost, playing: boolean): void {
  const surah = host.getSurah();
  const ayah = host.getAyah();
  if (surah == null || ayah == null) return;
  const meta = metaFor(surah, ayah);
  const el = host.getAudioEl();
  void import("@/lib/native-playback-audio").then(({ updateNativeNowPlaying }) => {
    void updateNativeNowPlaying({
      ...meta,
      album: "تلاوة القرآن",
      playing,
      elapsed: el?.currentTime,
      duration: el && Number.isFinite(el.duration) ? el.duration : undefined,
      playbackRate: host.getPlaybackRate(),
    });
  });
}

export function bindAudioEngineNative(host: NativeBridgeHost): void {
  void import("@/lib/native-playback-audio").then(({ getNativePlaybackPlugin }) => {
    void getNativePlaybackPlugin().then((plugin) => {
      if (!plugin?.addListener) return;
      void plugin.addListener("audioInterruption", (data) => {
        const type = String(data.type ?? "");
        if (type === "began") {
          host.pause();
          return;
        }
        if (type === "ended" && data.shouldResume === true) {
          const el = host.getAudioEl();
          const surah = host.getSurah();
          const ayah = host.getAyah();
          if (!el || surah == null || ayah == null) return;
          void host.activatePlaybackSession(metaFor(surah, ayah)).then(() =>
            el
              .play()
              .then(() => {
                host.setPlayerState("playing");
                syncNativeNowPlaying(host, true);
              })
              .catch(() => {
                host.setPlayerState("error");
              }),
          );
        }
      }).then((handle) => {
        host.addCleanup(() => {
          void handle.remove();
        });
      });
      void plugin.addListener("audioRouteChange", (data) => {
        const reasonNum = Number(data.reason);
        const reason = String(data.reason ?? data.type ?? "");
        if (
          reasonNum === 2 ||
          /oldDeviceUnavailable|headphones|unplug|disconnect/i.test(reason)
        ) {
          host.pause();
        }
      }).then((handle) => {
        host.addCleanup(() => {
          void handle.remove();
        });
      });
      void plugin.addListener("remoteCommand", (data) => {
        const action = String(data.action ?? "");
        if (action === "play") {
          const el = host.getAudioEl();
          if (!el) return;
          const surah = host.getSurah();
          const ayah = host.getAyah();
          void host
            .activatePlaybackSession(
              surah != null && ayah != null ? metaFor(surah, ayah) : undefined,
            )
            .then(() =>
              el
                .play()
                .then(() => {
                  host.setPlayerState("playing");
                  syncNativeNowPlaying(host, true);
                })
                .catch(() => undefined),
            );
          return;
        }
        if (action === "pause") {
          host.pause();
          return;
        }
        if (action === "stop") {
          host.stop();
          return;
        }
        if (action === "toggle") {
          if (host.getPlayerState() === "playing") host.pause();
          else {
            const surah = host.getSurah();
            const ayah = host.getAyah();
            if (surah != null && ayah != null) void host.togglePlay(surah, ayah);
          }
          return;
        }
        if (action === "next") void host.skipNext();
        if (action === "previous") void host.skipPrev();
      }).then((handle) => {
        host.addCleanup(() => {
          void handle.remove();
        });
      });
    });
  });
}
