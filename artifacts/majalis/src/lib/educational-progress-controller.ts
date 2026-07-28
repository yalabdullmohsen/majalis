/**
 * Web port of Flutter `EducationalProgressController extends ChangeNotifier`.
 * Course progress + daily Adhkar — optional persist via LocalStorageService (shared_preferences).
 */

import type { LocalStorageService } from "@/lib/majlis-local-storage-service";

export type EducationalProgressSnapshot = {
  courseProgress: Record<string, number>;
  dailyAdhkar: Record<string, boolean>;
};

type Listener = () => void;

const DEFAULT_COURSES: Record<string, number> = {
  "مسار العقيدة والمفهوم الشامل": 0.65,
  "فقه العبادات للمبتدئين": 0.3,
  "السيرة النبوية العطرة": 0.85,
};

const DEFAULT_ADHKAR: Record<string, boolean> = {
  "أذكار الصباح": true,
  "أذكار المساء": false,
  "أذكار النوم": false,
};

export type EducationalProgressControllerOptions = {
  storage?: LocalStorageService;
  /** When true, load + save course/adhkar via LocalStorageService. Default true if storage given. */
  persist?: boolean;
};

export class EducationalProgressController {
  private courseProgress: Record<string, number> = { ...DEFAULT_COURSES };
  private dailyAdhkar: Record<string, boolean> = { ...DEFAULT_ADHKAR };
  private listeners = new Set<Listener>();
  private snap: EducationalProgressSnapshot = this.buildSnap();
  private readonly storage: LocalStorageService | null;
  private readonly persistEnabled: boolean;

  constructor(options: EducationalProgressControllerOptions = {}) {
    this.storage = options.storage ?? null;
    this.persistEnabled = options.persist ?? Boolean(options.storage);
    if (this.persistEnabled && this.storage) {
      this.hydrateFromStorage();
    }
  }

  private hydrateFromStorage(): void {
    if (!this.storage) return;
    const courses = this.storage.loadCourseProgress();
    const adhkar = this.storage.loadDailyAdhkar();
    if (courses && Object.keys(courses).length > 0) {
      this.courseProgress = { ...DEFAULT_COURSES, ...courses };
    }
    if (adhkar && Object.keys(adhkar).length > 0) {
      this.dailyAdhkar = { ...DEFAULT_ADHKAR, ...adhkar };
    }
    this.snap = this.buildSnap();
  }

  private persistNow(): void {
    if (!this.persistEnabled || !this.storage) return;
    this.storage.saveCourseProgress(this.courseProgress);
    this.storage.saveDailyAdhkar(this.dailyAdhkar);
  }

  private buildSnap(): EducationalProgressSnapshot {
    return {
      courseProgress: { ...this.courseProgress },
      dailyAdhkar: { ...this.dailyAdhkar },
    };
  }

  private notify(): void {
    this.snap = this.buildSnap();
    this.persistNow();
    for (const l of this.listeners) {
      try {
        l();
      } catch {
        /* ignore */
      }
    }
  }

  getSnapshot(): EducationalProgressSnapshot {
    return this.snap;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Flutter `updateCourseProgress`. */
  updateCourseProgress(courseTitle: string, progress: number): void {
    const clamped = Math.min(1, Math.max(0, progress));
    if (this.courseProgress[courseTitle] === clamped) return;
    this.courseProgress[courseTitle] = clamped;
    this.notify();
  }

  /** Flutter `toggleAdhkar`. */
  toggleAdhkar(adhkarTitle: string): void {
    if (!(adhkarTitle in this.dailyAdhkar)) {
      this.dailyAdhkar[adhkarTitle] = true;
      this.notify();
      return;
    }
    this.dailyAdhkar[adhkarTitle] = !this.dailyAdhkar[adhkarTitle];
    this.notify();
  }

  setAdhkar(adhkarTitle: string, done: boolean): void {
    if (this.dailyAdhkar[adhkarTitle] === done) return;
    this.dailyAdhkar[adhkarTitle] = done;
    this.notify();
  }
}

export function createEducationalProgressController(
  options?: EducationalProgressControllerOptions,
): EducationalProgressController {
  return new EducationalProgressController(options);
}
