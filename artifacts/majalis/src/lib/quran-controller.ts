/**
 * Web port of Flutter `QuranController extends ChangeNotifier`:
 *
 * ```dart
 * class QuranController extends ChangeNotifier {
 *   int? selectedIndex;
 *   bool isPlaying = false;
 *   void selectVerse(int index) { selectedIndex = index; notifyListeners(); }
 *   void togglePlayback() { isPlaying = !isPlaying; notifyListeners(); }
 * }
 * ```
 *
 * UI-only playback flag — wire real audio via `onIsPlayingChange` / parent hooks
 * (loose coupling; does not import AudioEngine).
 */

export type QuranControllerSnapshot = {
  selectedIndex: number | null;
  isPlaying: boolean;
};

type Listener = () => void;

export class QuranController {
  selectedIndex: number | null = null;
  isPlaying = false;

  private listeners = new Set<Listener>();
  /** Stable snapshot for useSyncExternalStore (new object only on change). */
  private snap: QuranControllerSnapshot = {
    selectedIndex: null,
    isPlaying: false,
  };

  /** Flutter `notifyListeners`. */
  private notifyListeners(): void {
    this.snap = {
      selectedIndex: this.selectedIndex,
      isPlaying: this.isPlaying,
    };
    for (const l of this.listeners) {
      try {
        l();
      } catch {
        /* ignore bad subscriber */
      }
    }
  }

  /** Flutter `selectVerse`. */
  selectVerse(index: number): void {
    this.selectedIndex = index;
    this.notifyListeners();
  }

  /** Clear selection (web extra — sheet dismiss / page change). */
  clearSelection(): void {
    if (this.selectedIndex == null) return;
    this.selectedIndex = null;
    this.notifyListeners();
  }

  /** Flutter `togglePlayback`. */
  togglePlayback(): void {
    this.isPlaying = !this.isPlaying;
    this.notifyListeners();
  }

  setPlaying(playing: boolean): void {
    if (this.isPlaying === playing) return;
    this.isPlaying = playing;
    this.notifyListeners();
  }

  getSnapshot(): QuranControllerSnapshot {
    return this.snap;
  }

  /** Flutter `addListener` / `removeListener`. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export function createQuranController(): QuranController {
  return new QuranController();
}
