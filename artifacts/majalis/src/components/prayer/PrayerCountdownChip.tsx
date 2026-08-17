import {
  memo,
  useCallback,
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { AppBottomSheet } from "@/components/ui/AppBottomSheet";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { buildPrayerChipCopy } from "@/lib/prayer-ticker-copy";
import { formatTime12, type PrayerSlot } from "@/lib/prayer-times";
import { formatArabicNumber } from "@/lib/numerals";
import "@/styles/components/prayer-countdown-chip.css";

function displayTime12(p: PrayerSlot): string {
  const labeled = (p.time || "").trim();
  if (labeled && /[صم]/.test(labeled)) return labeled;
  const raw = (p.time24 || labeled).trim();
  return raw ? formatTime12(raw) : "—";
}

function PrayerTimesSheetList({ prayers }: { prayers: PrayerSlot[] }) {
  const obligatory = prayers.filter((p) =>
    ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].includes(p.key),
  );
  return (
    <ul className="prayer-chip-sheet__list">
      {obligatory.map((p) => (
        <li key={p.key} className="prayer-chip-sheet__row">
          <span className="prayer-chip-sheet__name">{p.name}</span>
          <span className="prayer-chip-sheet__time" dir="ltr">
            {formatArabicNumber(displayTime12(p))}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * شريحة عدّاد الصلاة — مكوّن مستقل (memo).
 * يملك اشتراك العدّاد؛ لا يُمرَّر العدّ من الأب حتى لا يُعاد رسم الشريط كل ثانية.
 */
function PrayerCountdownChipInner() {
  const { countdown: cd, data } = usePrayerCountdown();
  const [sheetOpen, setSheetOpen] = useState(false);
  const titleId = useId();

  const copy = useMemo(() => {
    if (!cd?.next) return null;
    const remainingSeconds = Math.max(0, Math.round(cd.remainingMs / 1000));
    return buildPrayerChipCopy({
      prayerName: cd.next.name,
      remainingSeconds,
      sinceSeconds: cd.sinceSeconds,
      nextPrayerName: cd.graceNextSlot?.name ?? null,
      nextRemainingSeconds: cd.graceNextSeconds,
    });
  }, [cd]);

  const openSheet = useCallback((e: MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  if (!copy) return null;

  return (
    <>
      <button
        type="button"
        className="prayer-countdown-chip__hit"
        aria-labelledby={titleId}
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
        data-testid="header-prayer-countdown"
        onClick={openSheet}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") openSheet(e);
        }}
      >
        <span
          className={[
            "prayer-countdown-chip",
            copy.isNow ? "prayer-countdown-chip--now" : "",
            copy.urgent ? "prayer-countdown-chip--urgent" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span className="prayer-countdown-chip__dot" aria-hidden="true" />
          <span id={titleId} className="prayer-countdown-chip__body">
            {copy.isNow ? (
              <span className="prayer-countdown-chip__now-text">{copy.text}</span>
            ) : (
              <>
                <span className="prayer-countdown-chip__name">{copy.prayerName}</span>
                {copy.timeText ? (
                  <span className="prayer-countdown-chip__time" aria-live="off">
                    {copy.timeText}
                  </span>
                ) : null}
              </>
            )}
          </span>
        </span>
      </button>

      <AppBottomSheet
        open={sheetOpen}
        onClose={closeSheet}
        title="مواقيت الصلاة"
        snap="half"
        closeLabel="إغلاق"
      >
        {data?.prayers?.length ? (
          <PrayerTimesSheetList prayers={data.prayers} />
        ) : (
          <p className="prayer-chip-sheet__empty">جاري تحميل المواقيت…</p>
        )}
        {data?.city ? (
          <p className="prayer-chip-sheet__meta">{data.city}</p>
        ) : null}
      </AppBottomSheet>
    </>
  );
}

export const PrayerCountdownChip = memo(PrayerCountdownChipInner);
