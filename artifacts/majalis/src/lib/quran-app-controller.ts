/**
 * Web port of Flutter `QuranAppController extends ChangeNotifier`:
 *
 * ```dart
 * class QuranAppController extends ChangeNotifier {
 *   double fontSize = 28.0;
 *   bool isDarkMode = false;
 *   Color backgroundColor = Color(0xFFF5F5DC);
 *   int? selectedVerseIndex;
 *   bool isPlayingAudio = false;
 *   int? currentPlayingVerse;
 *   void updateFontSize(double newSize) { … notifyListeners(); }
 *   void toggleTheme(bool dark) { … }
 *   void selectVerse(int index) { … }
 *   void toggleAudio(int index) { … }
 * }
 * ```
 *
 * Single SSOT for immersive reader prefs + verse/audio UI state.
 * Real AudioEngine wired via optional callbacks (loose coupling).
 */

import { IMMERSIVE_PAPER_BG } from "@/lib/quran-immersive";
import { getLocalStorageService } from "@/lib/majlis-local-storage-service";

/** Flutter ImmersiveQuranApp Slider min/max. */
export const QURAN_APP_FONT_MIN = 20;
export const QURAN_APP_FONT_MAX = 42;
export const QURAN_APP_FONT_DEFAULT = 28;
/** Flutter `height: 2.1`. */
export const QURAN_APP_LINE_HEIGHT = 2.1;

export const QURAN_APP_DARK_BG = "#1A1A1A";
export const QURAN_APP_LIGHT_BG = IMMERSIVE_PAPER_BG;

/** Flutter `Colors.amber.withOpacity(0.3)` — currently recited. */
export const VERSE_PLAYING_BG = "rgba(255, 193, 7, 0.3)";

/** Flutter `Colors.brown.withOpacity(0.15)` — selected (this sketch). */
export const VERSE_SELECTED_SOFT_BG = "rgba(121, 85, 72, 0.15)";

export type QuranAppControllerSnapshot = {
  fontSize: number;
  isDarkMode: boolean;
  backgroundColor: string;
  selectedVerseIndex: number | null;
  isPlayingAudio: boolean;
  currentPlayingVerse: number | null;
  textColor: string;
};

type Listener = () => void;

function clampFont(size: number): number {
  if (!Number.isFinite(size)) return QURAN_APP_FONT_DEFAULT;
  return Math.min(QURAN_APP_FONT_MAX, Math.max(QURAN_APP_FONT_MIN, size));
}

export class QuranAppController {
  fontSize = QURAN_APP_FONT_DEFAULT;
  isDarkMode = false;
  backgroundColor: string = QURAN_APP_LIGHT_BG;
  selectedVerseIndex: number | null = null;
  isPlayingAudio = false;
  currentPlayingVerse: number | null = null;

  private listeners = new Set<Listener>();
  private snap: QuranAppControllerSnapshot = this.buildSnap();

  private buildSnap(): QuranAppControllerSnapshot {
    return {
      fontSize: this.fontSize,
      isDarkMode: this.isDarkMode,
      backgroundColor: this.backgroundColor,
      selectedVerseIndex: this.selectedVerseIndex,
      isPlayingAudio: this.isPlayingAudio,
      currentPlayingVerse: this.currentPlayingVerse,
      textColor: this.isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.87)",
    };
  }

  private notifyListeners(): void {
    this.snap = this.buildSnap();
    for (const l of this.listeners) {
      try {
        l();
      } catch {
        /* ignore */
      }
    }
  }

  getSnapshot(): QuranAppControllerSnapshot {
    return this.snap;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Flutter `updateFontSize` — no page reload. */
  updateFontSize(newSize: number): void {
    const next = clampFont(newSize);
    if (next === this.fontSize) return;
    this.fontSize = next;
    this.notifyListeners();
  }

  /** Flutter `toggleTheme(bool dark)`. */
  toggleTheme(dark: boolean): void {
    if (this.isDarkMode === dark) return;
    this.isDarkMode = dark;
    this.backgroundColor = dark ? QURAN_APP_DARK_BG : QURAN_APP_LIGHT_BG;
    this.notifyListeners();
  }

  /** Flutter `selectVerse`. */
  selectVerse(index: number): void {
    this.selectedVerseIndex = index;
    this.notifyListeners();
  }

  /**
   * Flutter `toggleAudio(index)` — stop if same verse playing, else play + track.
   */
  toggleAudio(index: number): void {
    if (this.currentPlayingVerse === index && this.isPlayingAudio) {
      this.isPlayingAudio = false;
    } else {
      this.isPlayingAudio = true;
      this.currentPlayingVerse = index;
    }
    this.notifyListeners();
  }

  stopAudio(): void {
    if (!this.isPlayingAudio) return;
    this.isPlayingAudio = false;
    this.notifyListeners();
  }
}

export function createQuranAppController(opts?: {
  /** Load font/theme from LocalStorageService (default true). */
  hydrate?: boolean;
  /** Persist on every notifyListeners (default true when hydrate). */
  persist?: boolean;
}): QuranAppController {
  const c = new QuranAppController();
  const hydrate = opts?.hydrate !== false;
  const persist = opts?.persist ?? hydrate;
  const ls = getLocalStorageService();

  if (hydrate) {
    c.updateFontSize(ls.getFontSizeSync());
    c.toggleTheme(ls.getDarkModeSync());
    void ls.getLastVerseIndex().then((idx) => {
      if (idx != null) c.selectVerse(idx);
    });
  }

  if (persist) {
    c.subscribe(() => {
      void ls.persistController(c);
    });
  }

  return c;
}

/** Al-Fatiha sample used in Flutter ImmersiveQuranApp. */
export const SAMPLE_FATIHA_VERSES = [
  "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
  "الرَّحْمَٰنِ الرَّحِيمِ",
  "مَالِكِ يَوْمِ الدِّينِ",
  "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
  "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
  "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
] as const;
