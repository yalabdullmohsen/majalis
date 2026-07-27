/**
 * pair-timed-refs.ts
 * يربط كلمات مسموعة ذات طوابع زمنية بأحداث المحاذاة الصحيحة لتمريرها إلى
 * analyzeTajweedTimings — مطابقة بالتطبيع القرآني لا بالترتيب الأعمى فقط.
 */
import { normalizeQuranWord } from "./quran-normalize";
import type { TimedHeardWord } from "./tajweed-timing";
import type { AlignmentEvent, ReferenceWord } from "./types";

export type TimedPair = { ref: ReferenceWord; heard: TimedHeardWord };

export function pairCorrectEventsWithTimedWords(
  events: AlignmentEvent[],
  timedWords: TimedHeardWord[],
): TimedPair[] {
  const correct = events.filter((e): e is Extract<AlignmentEvent, { kind: "correct" }> => e.kind === "correct");
  const pairs: TimedPair[] = [];
  let ti = 0;
  for (const ev of correct) {
    const want = ev.ref.normalized || normalizeQuranWord(ev.ref.raw);
    while (ti < timedWords.length) {
      const heard = timedWords[ti++];
      const got = normalizeQuranWord(heard.word);
      if (got && want && got === want) {
        pairs.push({ ref: ev.ref, heard });
        break;
      }
    }
  }
  return pairs;
}
