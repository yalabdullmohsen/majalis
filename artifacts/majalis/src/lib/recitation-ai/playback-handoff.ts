/**
 * تسليم جلسة التلاوة عند دخول/خروج وضع التسميع.
 * يمنع تعارض AVAudioSession: التسجيل والتشغيل لا يعملان معًا.
 */
export const TASMEE_PLAYBACK_RESUME_KEY = "mj-tasmee-playback-resume-v1";

export type PlaybackResumeSnapshot = {
  surah: number;
  ayah: number;
  reciterId: string;
  wasPlaying: boolean;
};

export async function pausePlaybackForTasmee(): Promise<PlaybackResumeSnapshot | null> {
  try {
    const { getAudioEngine } = await import("@/core/audio/AudioEngine");
    const engine = getAudioEngine();
    const snap = engine.getSnapshot();
    const resume: PlaybackResumeSnapshot | null =
      snap.surah && snap.ayah
        ? {
            surah: snap.surah,
            ayah: snap.ayah,
            reciterId: snap.reciterId || "alafasy",
            wasPlaying: snap.playerState === "playing" || snap.playerState === "loading",
          }
        : null;
    if (resume?.wasPlaying) {
      try {
        localStorage.setItem(TASMEE_PLAYBACK_RESUME_KEY, JSON.stringify(resume));
      } catch {
        /* ignore */
      }
    } else {
      try {
        localStorage.removeItem(TASMEE_PLAYBACK_RESUME_KEY);
      } catch {
        /* ignore */
      }
    }
    engine.stop();
    return resume;
  } catch {
    return null;
  }
}

export async function stopAuxiliaryAudioForTasmee(): Promise<void> {
  try {
    const { getMajlisAudioService } = await import("@/lib/majlis-audio-service");
    await getMajlisAudioService().stop();
  } catch {
    /* ignore */
  }
}

/** يستأنف التلاوة إن وُجدت لقطة محفوظة عند الخروج من التسميع. */
export async function resumePlaybackAfterTasmee(): Promise<boolean> {
  let snap: PlaybackResumeSnapshot | null = null;
  try {
    const raw = localStorage.getItem(TASMEE_PLAYBACK_RESUME_KEY);
    if (raw) snap = JSON.parse(raw) as PlaybackResumeSnapshot;
    localStorage.removeItem(TASMEE_PLAYBACK_RESUME_KEY);
  } catch {
    snap = null;
  }
  if (!snap?.wasPlaying || !snap.surah || !snap.ayah) return false;
  try {
    const { getAudioEngine } = await import("@/core/audio/AudioEngine");
    const engine = getAudioEngine();
    if (snap.reciterId) engine.setReciter(snap.reciterId);
    await engine.playAyah(snap.surah, snap.ayah, snap.reciterId);
    return true;
  } catch {
    return false;
  }
}

/** تشغيل تلقين: آية الكلمة المتوقعة (صوت القارئ). يوقف الميكروفون أولًا عبر المستدعي. */
export async function playTalqinAyah(
  surah: number,
  ayah: number,
  signal?: { cancelled: boolean },
): Promise<void> {
  const { getAyahAudioUrl, loadReciterId } = await import("@/lib/quran-audio");
  const url = getAyahAudioUrl(surah, ayah, loadReciterId());
  const audio = new Audio(url);
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      audio.onended = null;
      audio.onerror = null;
      try {
        audio.pause();
      } catch {
        /* ignore */
      }
    };
    audio.onended = () => {
      cleanup();
      resolve();
    };
    audio.onerror = () => {
      cleanup();
      reject(new Error("تعذّر تشغيل تلقين الكلمة"));
    };
    void audio.play().then(() => {
      if (signal?.cancelled) {
        cleanup();
        resolve();
      }
    }).catch((err) => {
      cleanup();
      reject(err);
    });
  });
}
