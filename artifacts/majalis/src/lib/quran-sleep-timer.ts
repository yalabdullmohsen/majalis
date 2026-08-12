/**
 * مؤقّت إيقاف التلاوة — منطق نقي قابل للاختبار.
 * عند انتهاء الوقت: إنهاء الآية الجارية ثم الإيقاف (لا قطع وسط الآية).
 */

export type SleepTimerOption = "off" | 15 | 30 | 60 | "end_of_surah";

export const SLEEP_TIMER_OPTIONS: readonly SleepTimerOption[] = [
  "off",
  15,
  30,
  60,
  "end_of_surah",
] as const;

export type SleepTimerState = {
  option: SleepTimerOption;
  /** موعد الانتهاء بالميلي ثانية (للدقائق فقط) */
  deadlineMs: number | null;
  /** انتهت المدة أثناء التشغيل — أوقف بعد نهاية الآية الحالية */
  stopAfterCurrent: boolean;
};

export function createSleepTimerState(
  option: SleepTimerOption,
  now = Date.now(),
): SleepTimerState {
  if (option === "off" || option === "end_of_surah") {
    return { option, deadlineMs: null, stopAfterCurrent: false };
  }
  return { option, deadlineMs: now + option * 60_000, stopAfterCurrent: false };
}

export function sleepTimerLabelAr(option: SleepTimerOption): string {
  switch (option) {
    case "off":
      return "بدون مؤقّت";
    case 15:
      return "١٥ دقيقة";
    case 30:
      return "٣٠ دقيقة";
    case 60:
      return "٦٠ دقيقة";
    case "end_of_surah":
      return "نهاية السورة";
    default:
      return "مؤقّت";
  }
}

/** هل يجب الإيقاف بدل التقدّم/التكرار بعد انتهاء الآية؟ */
export function shouldStopAfterAyahEnd(
  state: SleepTimerState,
  ayah: number,
  totalAyahs: number,
): boolean {
  if (state.option === "off") return false;
  if (state.stopAfterCurrent) return true;
  if (state.option === "end_of_surah" && ayah >= totalAyahs) return true;
  return false;
}

export function markSleepTimerFired(state: SleepTimerState): SleepTimerState {
  if (state.option === "off" || state.option === "end_of_surah") return state;
  return { ...state, stopAfterCurrent: true, deadlineMs: null };
}
