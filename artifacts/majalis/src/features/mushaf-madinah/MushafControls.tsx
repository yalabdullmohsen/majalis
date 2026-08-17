import { useEffect, useId, useState } from "react";
import { MUSHAF_PAGE_MAX, MUSHAF_PAGE_MIN } from "@/lib/quran-last-page";

type Props = {
  open: boolean;
  pageNumber: number;
  onExit: () => void;
  onIndex: () => void;
  onPrev: () => void;
  onNext: () => void;
  onGoto: (page: number) => void;
  onSearch?: () => void;
  onToggleTheme?: () => void;
  themeLabel?: string;
};

/** أدوات المصحف — شريط سفلي وخروج؛ قلب الصفحة عبر الحواف/السحب. */
export function MushafControls({
  open,
  pageNumber,
  onExit,
  onIndex,
  onPrev,
  onNext,
  onGoto,
  onSearch,
  onToggleTheme,
  themeLabel = "المصحف الورقي",
}: Props) {
  const [gotoOpen, setGotoOpen] = useState(false);
  const [draft, setDraft] = useState(String(pageNumber));
  const titleId = useId();

  useEffect(() => {
    if (!open) setGotoOpen(false);
  }, [open]);

  useEffect(() => {
    setDraft(String(pageNumber));
  }, [pageNumber]);

  const showExit = open;

  return (
    <div
      className="mm-controls"
      data-open={open ? "1" : "0"}
      data-exit={showExit ? "1" : "0"}
      data-testid="mushaf-controls"
    >
      <button
        type="button"
        className="mm-controls__exit"
        onClick={onExit}
        aria-label="خروج"
        data-visible={showExit ? "1" : "0"}
      >
        × خروج
      </button>

      <div className="mm-controls__bar" role="toolbar" aria-label="أدوات المصحف">
        <button type="button" className="mm-controls__btn" onClick={onIndex}>
          فهرس
        </button>
        <button
          type="button"
          className="mm-controls__btn"
          onClick={onPrev}
          disabled={pageNumber <= MUSHAF_PAGE_MIN}
          aria-label="الصفحة السابقة"
        >
          السابق
        </button>
        <button
          type="button"
          className="mm-controls__btn mm-controls__page"
          onClick={() => setGotoOpen(true)}
          aria-label={`الصفحة ${pageNumber} — انتقال`}
          dir="ltr"
        >
          {pageNumber} / {MUSHAF_PAGE_MAX}
        </button>
        <button
          type="button"
          className="mm-controls__btn"
          onClick={onNext}
          disabled={pageNumber >= MUSHAF_PAGE_MAX}
          aria-label="الصفحة التالية"
        >
          التالي
        </button>
        <button
          type="button"
          className="mm-controls__btn"
          onClick={() => (onSearch ? onSearch() : setGotoOpen(true))}
        >
          بحث
        </button>
        {onToggleTheme ? (
          <button type="button" className="mm-controls__btn" onClick={onToggleTheme} aria-label="إعدادات المصحف">
            إعدادات
          </button>
        ) : null}
      </div>
      {open && onToggleTheme ? (
        <p className="mm-controls__theme-hint" aria-live="polite">
          {themeLabel}
        </p>
      ) : null}

      {gotoOpen ? (
        <form
          className="mm-goto"
          aria-labelledby={titleId}
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number.parseInt(draft, 10);
            if (Number.isFinite(n)) {
              onGoto(n);
              setGotoOpen(false);
            }
          }}
        >
          <div id={titleId}>انتقل إلى صفحة (١–٦٠٤)</div>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
            aria-label="رقم الصفحة"
          />
          <div className="mm-goto__actions">
            <button type="button" data-primary="0" onClick={() => setGotoOpen(false)}>
              إلغاء
            </button>
            <button type="submit" data-primary="1">
              انتقال
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
