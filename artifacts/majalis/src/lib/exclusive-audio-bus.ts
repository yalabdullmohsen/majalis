/**
 * ناقل صوت حصري — تشغيل مصدر واحد يوقف البقية بوضوح.
 * يستخدمه التلاوة / التفسير الصوتي / الأذان / خدمة المجلس / التسميع.
 */
export type AudioBusOwner =
  | "tilawa"
  | "tafsir"
  | "adhan"
  | "majlis"
  | "recitation"
  | "other";

type Stopper = () => void | Promise<void>;

const stoppers = new Map<AudioBusOwner, Stopper>();
let currentOwner: AudioBusOwner | null = null;

export function getAudioBusOwner(): AudioBusOwner | null {
  return currentOwner;
}

/** يسجّل دالة إيقاف لمالك — يُستدعى عند التثبيت في الخطاف/المحرك. */
export function registerAudioStopper(owner: AudioBusOwner, stop: Stopper): () => void {
  stoppers.set(owner, stop);
  return () => {
    if (stoppers.get(owner) === stop) stoppers.delete(owner);
  };
}

async function stopKnownEngines(except: AudioBusOwner): Promise<void> {
  /**
   * لا تُوقف AudioEngine عند ملك التلاوة — كان يُطلق releasePlaybackSession
   * بشكل غير متزامن فيُلغي جلسة iOS أثناء play() فيُصمت الصوت.
   */
  if (except !== "tilawa") {
    try {
      const { getAudioEngine } = await import("@/core/audio/AudioEngine");
      getAudioEngine().stop();
    } catch {
      /* ignore */
    }
    try {
      const { hideMiniPlayer } = await import("@/lib/quran-mini-player");
      hideMiniPlayer();
    } catch {
      /* ignore */
    }
  }
  if (except !== "majlis") {
    try {
      const { getMajlisAudioService } = await import("@/lib/majlis-audio-service");
      await getMajlisAudioService().stop();
    } catch {
      /* ignore */
    }
  }
  if (except !== "adhan") {
    try {
      const { stopAdhan } = await import("@/lib/adhan-playback");
      stopAdhan();
    } catch {
      /* ignore */
    }
  }
}

/** يطلب ملكية التشغيل ويوقف كل المالكين الآخرين. */
export async function claimAudio(owner: AudioBusOwner): Promise<void> {
  for (const [o, stop] of stoppers) {
    if (o === owner) continue;
    try {
      await stop();
    } catch {
      /* ignore */
    }
  }
  await stopKnownEngines(owner);
  currentOwner = owner;
}

export function releaseAudio(owner: AudioBusOwner): void {
  if (currentOwner === owner) currentOwner = null;
}
