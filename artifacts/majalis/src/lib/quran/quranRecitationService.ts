/**
 * خدمة تلاوة المصحف — غلاف موحّد فوق AudioEngine.
 * لا autoplay؛ يبدأ الصوت فقط بعد تفاعل المستخدم.
 */
import {
  getAudioEngine,
  type AudioEngineSnapshot,
  type PlayerState,
} from "@/core/audio/AudioEngine";
import { defaultReciterId, isReciterEnabled } from "@/config/quranReciters";
import { listAyahAudioUrls, loadReciterId, saveReciterId } from "@/lib/quran-audio";
import { parseVerseKey } from "@/features/mushaf-madinah/mushaf-page-for-ayah";

export type PlaybackMode = "ayah" | "surah" | "page" | "idle";

type PageSegment = { surah: number; startAyah: number; endAyah: number };

export type QuranPlaybackState = AudioEngineSnapshot & {
  mode: PlaybackMode;
  pageSegments: PageSegment[];
  pageSegmentIndex: number;
  iosNeedsForeground: boolean;
};

const USER_ERROR = "تعذر تشغيل التلاوة الآن";
const IOS_FOREGROUND_HINT =
  "للاستماع على هذا الجهاز، يُفضَّل إبقاء التطبيق مفتوحًا أثناء التلاوة.";

let audioUnlocked = false;
let unlockEl: HTMLAudioElement | null = null;

/** فتح قناة الصوت بعد أول تفاعل — مطلوب لـ iOS/Safari. */
export function unlockAudioOnUserGesture(): void {
  if (audioUnlocked || typeof Audio === "undefined") return;
  try {
    if (!unlockEl) {
      unlockEl = new Audio();
      unlockEl.preload = "auto";
      unlockEl.setAttribute("playsinline", "true");
      (unlockEl as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
    }
    unlockEl.src =
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
    const p = unlockEl.play();
    if (p && typeof p.then === "function") {
      p.then(() => {
        unlockEl?.pause();
        audioUnlocked = true;
      }).catch(() => {
        /* سيُعاد المحاولة عند التشغيل الفعلي */
      });
    } else {
      audioUnlocked = true;
    }
  } catch {
    /* لا نعرض خطأ تقني */
  }
}

export class QuranRecitationService {
  private engine = getAudioEngine();
  private mode: PlaybackMode = "idle";
  private pageSegments: PageSegment[] = [];
  private pageSegmentIndex = 0;
  private unsubPage: (() => void) | null = null;
  private activeReciterId = loadReciterId();
  private pageSegmentPlaying = false;

  private groupPageSegments(verseKeys: string[]): PageSegment[] {
    const segments: PageSegment[] = [];
    for (const key of verseKeys) {
      const parsed = parseVerseKey(key);
      if (!parsed) continue;
      const last = segments[segments.length - 1];
      if (last && last.surah === parsed.surah && parsed.ayah === last.endAyah + 1) {
        last.endAyah = parsed.ayah;
      } else {
        segments.push({
          surah: parsed.surah,
          startAyah: parsed.ayah,
          endAyah: parsed.ayah,
        });
      }
    }
    return segments;
  }

  private bindPageSegments(): void {
    if (this.unsubPage) return;
    this.unsubPage = this.engine.onSnapshot((snap) => {
      if (this.mode !== "page" || this.pageSegments.length === 0) return;
      if (
        this.pageSegmentPlaying &&
        (snap.playerState === "idle" || snap.playerState === "ended" || snap.playerState === "error")
      ) {
        this.pageSegmentPlaying = false;
        void this.advancePageSegment(snap.playerState === "error");
      } else if (snap.playerState === "playing") {
        this.pageSegmentPlaying = true;
      }
    });
  }

  private unbindPageSegments(): void {
    this.unsubPage?.();
    this.unsubPage = null;
  }

  private clearPagePlayback(): void {
    this.pageSegments = [];
    this.pageSegmentIndex = 0;
    this.pageSegmentPlaying = false;
    this.mode = "idle";
    this.unbindPageSegments();
    this.engine.setRepeatMode("off");
  }

  private async playPageSegment(index: number): Promise<void> {
    const seg = this.pageSegments[index];
    if (!seg) {
      this.clearPagePlayback();
      this.engine.stop();
      return;
    }
    this.pageSegmentIndex = index;
    this.engine.setLoopConfig(seg.surah, {
      startAyah: seg.startAyah,
      endAyah: seg.endAyah,
      repeatCount: 1,
      delayMs: 0,
    });
    const nextAyah =
      seg.endAyah < seg.startAyah + 100 ? seg.startAyah + 1 : seg.startAyah;
    if (nextAyah <= seg.endAyah) {
      void this.preloadAyah(seg.surah, nextAyah, this.activeReciterId);
    }
    await this.engine.playAyah(seg.surah, seg.startAyah, this.activeReciterId);
  }

  private async advancePageSegment(fromError = false): Promise<void> {
    const snap = this.engine.getSnapshot();
    if (snap.playerState === "playing" || snap.playerState === "loading") return;
    const nextIdx = this.pageSegmentIndex + 1;
    if (nextIdx >= this.pageSegments.length) {
      this.clearPagePlayback();
      if (!fromError) this.engine.stop();
      return;
    }
    await this.playPageSegment(nextIdx);
  }

  getPlaybackState(): QuranPlaybackState {
    const snap = this.engine.getSnapshot();
    const iosNeedsForeground =
      typeof navigator !== "undefined" &&
      /iPhone|iPad|iPod/i.test(navigator.userAgent) &&
      !audioUnlocked &&
      snap.playerState === "error";
    return {
      ...snap,
      mode: this.mode,
      pageSegments: [...this.pageSegments],
      pageSegmentIndex: this.pageSegmentIndex,
      iosNeedsForeground,
    };
  }

  onSnapshot(listener: (state: QuranPlaybackState) => void): () => void {
    return this.engine.onSnapshot(() => listener(this.getPlaybackState()));
  }

  onAyahChange(
    listener: (payload: { surah: number; ayah: number; reciterId: string }) => void,
  ): () => void {
    return this.engine.onAyahChange(listener);
  }

  setReciter(id: string): void {
    const safe = isReciterEnabled(id) ? id : defaultReciterId();
    saveReciterId(safe);
    this.engine.setReciter(safe);
  }

  async changeReciter(id: string): Promise<void> {
    unlockAudioOnUserGesture();
    const safe = isReciterEnabled(id) ? id : defaultReciterId();
    saveReciterId(safe);
    this.engine.setReciter(safe);
    const snap = this.engine.getSnapshot();
    if (snap.surah != null && snap.ayah != null) {
      const playing =
        snap.playerState === "playing" ||
        snap.playerState === "paused" ||
        snap.playerState === "buffering" ||
        snap.playerState === "loading";
      if (playing) {
        await this.engine.playAyah(snap.surah, snap.ayah, safe);
      }
    }
  }

  async playAyah(surah: number, ayah: number, reciterId?: string): Promise<void> {
    unlockAudioOnUserGesture();
    this.clearPagePlayback();
    this.mode = "ayah";
    const id = reciterId && isReciterEnabled(reciterId) ? reciterId : loadReciterId();
    this.activeReciterId = id;
    this.engine.setReciter(id);
    this.engine.setRepeatMode("off");
    void this.preloadNextAyah(surah, ayah);
    await this.engine.playAyah(surah, ayah, id);
  }

  async playSurah(surah: number, reciterId?: string): Promise<void> {
    unlockAudioOnUserGesture();
    this.clearPagePlayback();
    this.mode = "surah";
    const id = reciterId && isReciterEnabled(reciterId) ? reciterId : loadReciterId();
    this.activeReciterId = id;
    this.engine.setReciter(id);
    this.engine.setRepeatMode("surah");
    await this.engine.playAyah(surah, 1, id);
  }

  /**
   * تشغيل آيات الصفحة بالترتيب — يتجاوز المقاطع الفاشلة بهدوء.
   */
  async playPage(verseKeys: string[], reciterId?: string): Promise<void> {
    unlockAudioOnUserGesture();
    const segments = this.groupPageSegments(verseKeys);
    if (segments.length === 0) return;

    const id = reciterId && isReciterEnabled(reciterId) ? reciterId : loadReciterId();
    this.activeReciterId = id;
    this.engine.setReciter(id);
    this.engine.setRepeatMode("off");

    this.pageSegments = segments;
    this.pageSegmentIndex = 0;
    this.mode = "page";
    this.bindPageSegments();
    await this.playPageSegment(0);
  }

  async togglePlay(surah: number, ayah: number): Promise<void> {
    unlockAudioOnUserGesture();
    await this.engine.togglePlay(surah, ayah);
  }

  pause(): void {
    this.engine.pause();
  }

  async resume(): Promise<void> {
    unlockAudioOnUserGesture();
    const snap = this.engine.getSnapshot();
    if (snap.surah != null && snap.ayah != null) {
      await this.engine.togglePlay(snap.surah, snap.ayah);
    }
  }

  stop(): void {
    this.clearPagePlayback();
    this.engine.stop();
  }

  async nextAyah(): Promise<void> {
    unlockAudioOnUserGesture();
    await this.engine.skipNext();
  }

  async previousAyah(): Promise<void> {
    unlockAudioOnUserGesture();
    await this.engine.skipPrev();
  }

  preloadNextAyah(surah: number, ayah: number): void {
    const id = this.engine.getSnapshot().reciterId || this.activeReciterId;
    void this.preloadAyah(surah, ayah + 1, id);
  }

  private preloadAyah(surah: number, ayah: number, reciterId: string): void {
    const urls = listAyahAudioUrls(surah, ayah, reciterId);
    const url = urls[0];
    if (!url || typeof Audio === "undefined") return;
    try {
      const el = new Audio();
      el.preload = "auto";
      el.src = url;
      el.load();
    } catch {
      /* تجاهل */
    }
  }

  seek(seconds: number): void {
    this.engine.seek(seconds);
  }

  setPlaybackRate(rate: number): void {
    this.engine.setPlaybackRate(rate);
  }

  /** رسالة خطأ موحّدة للمستخدم — بلا تفاصيل تقنية */
  static userErrorMessage(raw: string | null | undefined): string {
    if (!raw) return USER_ERROR;
    if (/failed|fetch|error|network|notallowed/i.test(raw)) return USER_ERROR;
    if (/تفاعل|foreground|مفتوح/i.test(raw)) return IOS_FOREGROUND_HINT;
    return raw;
  }

  static readonly USER_ERROR = USER_ERROR;
  static readonly IOS_FOREGROUND_HINT = IOS_FOREGROUND_HINT;
}

let service: QuranRecitationService | null = null;

export function getQuranRecitationService(): QuranRecitationService {
  if (!service) service = new QuranRecitationService();
  return service;
}

export function __resetQuranRecitationServiceForTests(): void {
  service?.stop();
  service = null;
  audioUnlocked = false;
  unlockEl = null;
}

export type { PlayerState, AudioEngineSnapshot };
