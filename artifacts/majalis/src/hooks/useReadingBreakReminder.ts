/**
 * Reading break reminder — web port of the RN FullScreenQuranReader sketch:
 * after 30 minutes on the reading screen, prompt a short rest; clear the
 * timer on unmount so it never fires after the user leaves.
 */
import { useCallback, useEffect, useState } from "react";

/** 30 minutes — same duration as the RN sketch (`30 * 60 * 1000`). */
export const READING_BREAK_MS = 30 * 60 * 1000;

export const READING_BREAK_TITLE = "استراحة قصيرة";
export const READING_BREAK_MESSAGE =
  "لقد قضيت 30 دقيقة في القراءة. هل تود أخذ استراحة؟";

export type UseReadingBreakReminderOptions = {
  /** When false, the timer is not scheduled (e.g. dashboard mode). Default true. */
  enabled?: boolean;
  /** Override duration — useful for tests. Defaults to READING_BREAK_MS. */
  durationMs?: number;
};

export function useReadingBreakReminder(options: UseReadingBreakReminderOptions = {}) {
  const { enabled = true, durationMs = READING_BREAK_MS } = options;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setOpen(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setOpen(true);
    }, durationMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [enabled, durationMs]);

  const dismiss = useCallback(() => setOpen(false), []);

  return { open, dismiss, title: READING_BREAK_TITLE, message: READING_BREAK_MESSAGE };
}
