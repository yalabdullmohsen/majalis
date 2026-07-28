/**
 * معلم/طالب — الترديد والتعليم: بعد تلاوة الآية يُفتح صمت قابل للضبط ليردّ الطالب.
 */
export type TeachRepeatConfig = {
  enabled: boolean;
  /** صمت بعد انتهاء تلاوة المقرئ (ملّي ثانية) */
  studentPauseMs: number;
  /** إعادة تشغيل آية المقرئ بعد انتهاء صمت الطالب */
  replayTeacher: boolean;
};

export const DEFAULT_TEACH_CONFIG: TeachRepeatConfig = {
  enabled: false,
  studentPauseMs: 4000,
  replayTeacher: false,
};

export type TeachPhase = "idle" | "teacher" | "student-pause" | "done";

export type TeachAdvance =
  | { action: "wait-student"; pauseMs: number }
  | { action: "replay-teacher"; ayah: number }
  | { action: "next-ayah"; ayah: number }
  | { action: "done" };

/**
 * بعد انتهاء آية المقرئ في وضع الترديد.
 * Pure — المؤقّتات في المشغّل.
 */
export function advanceAfterTeacherEnded(
  cfg: TeachRepeatConfig,
  justFinishedAyah: number,
  totalAyahs: number,
  /** هل اكتمل صمت الطالب لهذه الآية؟ */
  studentTurnDone: boolean,
): TeachAdvance {
  if (!cfg.enabled) {
    if (justFinishedAyah < totalAyahs) return { action: "next-ayah", ayah: justFinishedAyah + 1 };
    return { action: "done" };
  }
  if (!studentTurnDone) {
    return { action: "wait-student", pauseMs: Math.max(500, Math.min(30_000, cfg.studentPauseMs)) };
  }
  if (cfg.replayTeacher) {
    return { action: "replay-teacher", ayah: justFinishedAyah };
  }
  if (justFinishedAyah < totalAyahs) return { action: "next-ayah", ayah: justFinishedAyah + 1 };
  return { action: "done" };
}
