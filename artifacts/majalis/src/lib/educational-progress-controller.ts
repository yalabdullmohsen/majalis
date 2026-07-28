/**
 * Web port of Flutter `EducationalProgressController extends ChangeNotifier`.
 * Course progress bars + daily Adhkar checkboxes — local SSOT (no network).
 */

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

export class EducationalProgressController {
  private courseProgress: Record<string, number> = { ...DEFAULT_COURSES };
  private dailyAdhkar: Record<string, boolean> = { ...DEFAULT_ADHKAR };
  private listeners = new Set<Listener>();
  private snap: EducationalProgressSnapshot = this.buildSnap();

  private buildSnap(): EducationalProgressSnapshot {
    return {
      courseProgress: { ...this.courseProgress },
      dailyAdhkar: { ...this.dailyAdhkar },
    };
  }

  private notify(): void {
    this.snap = this.buildSnap();
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
    if (!(adhkarTitle in this.dailyAdhkar)) return;
    this.dailyAdhkar[adhkarTitle] = !this.dailyAdhkar[adhkarTitle];
    this.notify();
  }

  setAdhkar(adhkarTitle: string, done: boolean): void {
    if (!(adhkarTitle in this.dailyAdhkar)) return;
    if (this.dailyAdhkar[adhkarTitle] === done) return;
    this.dailyAdhkar[adhkarTitle] = done;
    this.notify();
  }
}

export function createEducationalProgressController(): EducationalProgressController {
  return new EducationalProgressController();
}
