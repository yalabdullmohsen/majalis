/**
 * Wire progress-batch flush → daily reading + scroll persistence + audio flush.
 * Called once at boot. Logic-only — no UI.
 */

import { onProgressFlush, type ProgressMetric } from "@/lib/progress-batch";
import { recordDailyReading } from "@/lib/quran-personal";
import {
  markReadingProgress,
  type ReadingSection,
} from "@/lib/reading-progress";
import { flushAudioResumeState } from "@/lib/quran-audio-resume";

const SECTIONS = new Set([
  "adhkar",
  "qa",
  "fawaid",
  "hadith",
  "rulings",
  "stories",
  "assistant",
]);

let bound = false;

function applyBatch(batch: ProgressMetric[]): void {
  let ayahs = 0;
  let dwellMs = 0;
  const scrollBySection = new Map<string, number>();

  for (const m of batch) {
    if (m.kind === "ayah-read") ayahs += m.count ?? 1;
    else if (m.kind === "surah-dwell") dwellMs += m.ms;
    else if (m.kind === "scroll-section") scrollBySection.set(m.section, m.scrollY);
  }

  if (ayahs > 0 || dwellMs > 0) {
    const minutes = Math.max(0, Math.round(dwellMs / 60_000));
    try {
      recordDailyReading(ayahs, 0, minutes);
    } catch {
      /* ignore */
    }
  }

  for (const [section, y] of scrollBySection) {
    if (!SECTIONS.has(section)) continue;
    try {
      markReadingProgress(section as ReadingSection, {
        id: `scroll-${section}`,
        title: section,
        scrollY: y,
      });
    } catch {
      /* ignore */
    }
  }

  flushAudioResumeState();
}

export function initProgressBatchBridge(): void {
  if (bound || typeof window === "undefined") return;
  bound = true;
  onProgressFlush(applyBatch);
}
