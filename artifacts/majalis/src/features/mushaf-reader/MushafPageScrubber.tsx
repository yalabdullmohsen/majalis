import { memo, useCallback, useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { toArabicDigits } from "@/lib/utils";
import {
  clampMushafPage,
  MUSHAF_PAGE_MAX,
  MUSHAF_PAGE_MIN,
} from "@/lib/quran-last-page";

type Props = {
  page: number;
  juzNumber: number;
  visible: boolean;
  busy?: boolean;
  onGoto: (page: number) => void;
};

/**
 * شريط تنقّل صفحات احترافي — يظهر مع Reader Chrome فقط.
 * خارج Geometry المصحف؛ لا يحرّك نص القرآن.
 */
export const MushafPageScrubber = memo(function MushafPageScrubber({
  page,
  juzNumber,
  visible,
  busy = false,
  onGoto,
}: Props) {
  const labelId = useId();
  const [draft, setDraft] = useState(page);
  const scrubbingRef = useRef(false);

  useEffect(() => {
    if (!scrubbingRef.current) setDraft(page);
  }, [page]);

  const commit = useCallback(
    (raw: number) => {
      const next = clampMushafPage(raw);
      setDraft(next);
      if (next !== page) onGoto(next);
    },
    [onGoto, page],
  );

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.target.value);
    if (!Number.isFinite(n)) return;
    scrubbingRef.current = true;
    setDraft(clampMushafPage(n));
  };

  const onCommit = () => {
    scrubbingRef.current = false;
    if (busy) {
      setDraft(page);
      return;
    }
    commit(draft);
  };

  return (
    <div
      className="nm-page-scrubber"
      data-testid="mushaf-page-scrubber"
      data-visible={visible ? "1" : "0"}
      data-busy={busy ? "1" : "0"}
      aria-hidden={!visible}
    >
      <div className="nm-page-scrubber__meta" id={labelId}>
        <span className="nm-page-scrubber__page" dir="ltr">
          {toArabicDigits(draft)}
          <span className="nm-page-scrubber__of">/{toArabicDigits(MUSHAF_PAGE_MAX)}</span>
        </span>
        <span className="nm-page-scrubber__juz">
          الجزء {toArabicDigits(Math.max(1, Math.min(30, juzNumber || 1)))}
        </span>
      </div>
      <input
        type="range"
        className="nm-page-scrubber__range"
        data-testid="mushaf-page-scrubber-range"
        min={MUSHAF_PAGE_MIN}
        max={MUSHAF_PAGE_MAX}
        step={1}
        value={draft}
        dir="ltr"
        disabled={!visible || busy}
        tabIndex={visible && !busy ? 0 : -1}
        aria-labelledby={labelId}
        aria-valuemin={MUSHAF_PAGE_MIN}
        aria-valuemax={MUSHAF_PAGE_MAX}
        aria-valuenow={draft}
        aria-valuetext={`الصفحة ${draft}، الجزء ${juzNumber}`}
        onChange={onInput}
        onPointerUp={onCommit}
        onKeyUp={(e) => {
          if (e.key === "Enter" || e.key === " ") onCommit();
        }}
        onBlur={onCommit}
        onPointerDown={(e) => e.stopPropagation()}
      />
    </div>
  );
});
