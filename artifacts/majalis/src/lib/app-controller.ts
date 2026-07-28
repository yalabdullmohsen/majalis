/**
 * Flutter-style `AppController extends ChangeNotifier` — system chrome /
 * wakelock / immersive lifecycle (Master Prompt §2 Unified System Controls).
 *
 * Does not own Quran reading state (`QuranController`) — loose coupling.
 */
import { IMMERSIVE_PAPER_BG } from "@/lib/quran-immersive";

export type AppControllerSnapshot = {
  /** Screen stay-awake (Wakelock / Wake Lock API). */
  keepAwake: boolean;
  /** SystemUiMode.immersiveSticky active. */
  immersive: boolean;
  /** Optional lock — `"portrait"` | `"landscape"` | `"any"`. */
  orientation: "portrait" | "landscape" | "any";
  paperBg: string;
};

type Listener = () => void;

export class AppController {
  keepAwake = true;
  immersive = false;
  orientation: AppControllerSnapshot["orientation"] = "any";
  paperBg = IMMERSIVE_PAPER_BG;

  private listeners = new Set<Listener>();
  private snap: AppControllerSnapshot = {
    keepAwake: true,
    immersive: false,
    orientation: "any",
    paperBg: IMMERSIVE_PAPER_BG,
  };

  private notify(): void {
    this.snap = {
      keepAwake: this.keepAwake,
      immersive: this.immersive,
      orientation: this.orientation,
      paperBg: this.paperBg,
    };
    for (const l of this.listeners) {
      try {
        l();
      } catch {
        /* ignore */
      }
    }
  }

  getSnapshot(): AppControllerSnapshot {
    return this.snap;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setKeepAwake(enabled: boolean): void {
    if (this.keepAwake === enabled) return;
    this.keepAwake = enabled;
    this.notify();
  }

  setPaperBg(color: string): void {
    if (this.paperBg === color) return;
    this.paperBg = color;
    this.notify();
  }

  setOrientation(orientation: AppControllerSnapshot["orientation"]): void {
    if (this.orientation === orientation) return;
    this.orientation = orientation;
    this.notify();
    void applyOrientationLock(orientation);
  }

  /** Request immersive sticky — System UI applied by `useAppController`. */
  async enterImmersive(paperBg?: string): Promise<void> {
    if (paperBg && paperBg !== this.paperBg) this.paperBg = paperBg;
    if (this.immersive) {
      this.notify();
      return;
    }
    this.immersive = true;
    this.notify();
  }

  /** Leave immersive — System UI restored by `useAppController` cleanup. */
  async exitImmersive(): Promise<void> {
    if (!this.immersive) return;
    this.immersive = false;
    this.notify();
  }
}

async function applyOrientationLock(
  orientation: AppControllerSnapshot["orientation"],
): Promise<void> {
  try {
    const so = screen.orientation as ScreenOrientation & {
      lock?: (o: string) => Promise<void>;
      unlock?: () => void;
    };
    if (orientation === "any") {
      so.unlock?.();
      return;
    }
    await so.lock?.(orientation);
  } catch {
    /* browser / PWA without orientation lock */
  }
}

let singleton: AppController | null = null;

export function getAppController(): AppController {
  if (!singleton) singleton = new AppController();
  return singleton;
}

export function createAppController(): AppController {
  return new AppController();
}

/** Test helper. */
export function __resetAppControllerForTests(): void {
  singleton = null;
}
