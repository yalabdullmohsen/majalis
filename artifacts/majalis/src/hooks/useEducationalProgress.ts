/**
 * React binding for `EducationalProgressController`.
 */
import { useMemo, useSyncExternalStore } from "react";
import {
  createEducationalProgressController,
  type EducationalProgressController,
  type EducationalProgressSnapshot,
} from "@/lib/educational-progress-controller";

export type UseEducationalProgressResult = EducationalProgressSnapshot & {
  controller: EducationalProgressController;
  updateCourseProgress: (title: string, progress: number) => void;
  toggleAdhkar: (title: string) => void;
};

export function useEducationalProgress(
  external?: EducationalProgressController,
): UseEducationalProgressResult {
  const controller = useMemo(
    () => external ?? createEducationalProgressController(),
    [external],
  );

  const snap = useSyncExternalStore(
    (cb) => controller.subscribe(cb),
    () => controller.getSnapshot(),
    () => controller.getSnapshot(),
  );

  return {
    ...snap,
    controller,
    updateCourseProgress: (t, p) => controller.updateCourseProgress(t, p),
    toggleAdhkar: (t) => controller.toggleAdhkar(t),
  };
}

export default useEducationalProgress;
