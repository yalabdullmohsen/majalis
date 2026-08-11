/**
 * جسر تقرير جلسة التسميع → تقدّم الحفظ المحلي (وحدة ١٤ / mj-quran-hifz-v1).
 * يعمل بلا حساب — لا يرسل شيئًا للسحابة.
 */
import { getSurahMeta } from "@/lib/quran-api";
import {
  getHifzSurah,
  saveHifzSurah,
  type HifzSurahProgress,
} from "@/lib/quran-personal";
import type { AlignmentEvent, ReferenceWord } from "./types";

export const TASMEE_LAST_REPORT_KEY = "mj-tasmee-last-report-v1";

export type TasmeeStopPosition = {
  surah: number;
  ayah: number;
  wordIndex: number;
  heardWord?: string;
};

export type TasmeeSessionReport = {
  surahNumber: number;
  ayahCount: number;
  stopPositions: TasmeeStopPosition[];
  masteryPct: number;
  correctWords: number;
  totalWords: number;
  completedAt: string;
};

/** يستخرج مواضع التوقّف (أخطاء + يحتاج إعادة) من أحداث الجلسة. */
export function extractStopPositions(events: AlignmentEvent[]): TasmeeStopPosition[] {
  const out: TasmeeStopPosition[] = [];
  for (const e of events) {
    if (e.kind === "error" && e.ref) {
      out.push({
        surah: e.ref.surah,
        ayah: e.ref.ayah,
        wordIndex: e.ref.wordIndex,
        heardWord: e.heardWord ?? undefined,
      });
    } else if (e.kind === "needs_repeat") {
      out.push({
        surah: e.ref.surah,
        ayah: e.ref.ayah,
        wordIndex: e.ref.wordIndex,
        heardWord: e.heardWord ?? undefined,
      });
    }
  }
  return out;
}

export function buildTasmeeSessionReport(
  referenceWords: ReferenceWord[],
  events: AlignmentEvent[],
): TasmeeSessionReport {
  const correctWords = events.filter((e) => e.kind === "correct").length;
  const totalWords = referenceWords.length;
  const masteryPct = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;
  const ayahs = new Set(referenceWords.map((w) => `${w.surah}:${w.ayah}`));
  const surahNumber = referenceWords[0]?.surah ?? 1;
  return {
    surahNumber,
    ayahCount: ayahs.size,
    stopPositions: extractStopPositions(events),
    masteryPct,
    correctWords,
    totalWords,
    completedAt: new Date().toISOString(),
  };
}

export function saveTasmeeLastReport(report: TasmeeSessionReport): void {
  try {
    localStorage.setItem(TASMEE_LAST_REPORT_KEY, JSON.stringify(report));
  } catch {
    /* quota */
  }
}

export function readTasmeeLastReport(): TasmeeSessionReport | null {
  try {
    const raw = localStorage.getItem(TASMEE_LAST_REPORT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TasmeeSessionReport;
  } catch {
    return null;
  }
}

/**
 * يحدّث تقدّم الحفظ المحلي من تقرير التسميع.
 * - إتقان ≥٨٠٪: يرفع عدد الآيات المحفوظة ضمن النطاق المُسمَّع.
 * - دون ذلك: يبقي الحالة memorizing ويحدّث lastReviewedAt.
 */
export function applyTasmeeReportToHifz(
  report: TasmeeSessionReport,
  referenceWords: ReferenceWord[],
): HifzSurahProgress {
  const meta = getSurahMeta(report.surahNumber);
  const existing = getHifzSurah(report.surahNumber);
  const ayahsInSession = new Set(
    referenceWords.filter((w) => w.surah === report.surahNumber).map((w) => w.ayah),
  );
  const erroredAyahs = new Set(
    report.stopPositions
      .filter((p) => p.surah === report.surahNumber)
      .map((p) => p.ayah),
  );
  const cleanAyahs = [...ayahsInSession].filter((a) => !erroredAyahs.has(a));

  const prevMemorized = existing?.memorizedAyahs ?? 0;
  let memorizedAyahs = prevMemorized;
  if (report.masteryPct >= 80 && cleanAyahs.length > 0) {
    memorizedAyahs = Math.min(meta.ayahs, prevMemorized + cleanAyahs.length);
    if (ayahsInSession.size >= meta.ayahs && erroredAyahs.size === 0 && report.masteryPct >= 90) {
      memorizedAyahs = meta.ayahs;
    }
  }

  const status =
    memorizedAyahs >= meta.ayahs
      ? "memorized"
      : memorizedAyahs > 0 || report.masteryPct > 0
        ? "memorizing"
        : existing?.status ?? "not_started";

  const progress: HifzSurahProgress = {
    surahNum: report.surahNumber,
    status: status === "memorized" ? "memorized" : status === "not_started" ? "not_started" : "memorizing",
    memorizedAyahs,
    totalAyahs: meta.ayahs,
    lastReviewedAt: Date.now(),
    nextReviewAt: Date.now() + (report.masteryPct >= 80 ? 3 : 1) * 86400000,
    intervalDays: existing?.intervalDays ?? (report.masteryPct >= 80 ? 3 : 1),
    easeFactor: existing?.easeFactor ?? 2.5,
    repetitions: (existing?.repetitions ?? 0) + 1,
  };

  saveHifzSurah(progress);
  saveTasmeeLastReport(report);
  return progress;
}
