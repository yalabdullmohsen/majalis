import { BookOpen, List, Search, Settings2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { MUSHAF_PAGE_MAX, MUSHAF_PAGE_MIN, parseMushafPageQuery } from "@/lib/quran-last-page";

type Props = {
  open: boolean;
  pageNumber: number;
  persist?: boolean;
  onIndex: () => void;
  onPrev: () => void;
  onNext: () => void;
  onGoto: (page: number) => void;
  onSearch?: () => void;
  onSettings?: () => void;
  onToggleTheme?: () => void;
  themeLabel?: string;
};

/** أدوات المصحف — شريط أيقونات علوي خفيف. */
export function MushafControls({
  open,
  pageNumber,
  persist = false,
  onIndex,
  onPrev,
  onNext,
  onGoto,
  onSearch,
  onSettings,
  onToggleTheme,
  themeLabel = "المصحف الورقي",
}: Props) {
  const [gotoOpen, setGotoOpen] = useState(false);
  const [draft, setDraft] = useState(String(pageNumber));
  const [gotoError, setGotoError] = useState<string | null>(null);
  const titleId = useId();
  const visible = open || persist || gotoOpen;

  useEffect(() => {
    if (!visible && !gotoOpen) {
      setGotoError(null);
    }
  }, [visible, gotoOpen]);

  useEffect(() => {
    setDraft(String(pageNumber));
    setGotoError(null);
  }, [pageNumber]);

  return (
    <div
      className="mm-controls"
      data-open={visible ? "1" : "0"}
      data-testid="mushaf-controls"
    >
      <div className="mm-controls__bar" role="toolbar" aria-label="أدوات المصحف">
        <div className="mm-controls__cluster mm-controls__cluster--start">
          <button
            type="button"
            className="mm-controls__icon"
            onClick={() => (onSettings ? onSettings() : onToggleTheme?.())}
            aria-label="إعدادات"
          >
            <Settings2 size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="mm-controls__icon"
            onClick={() => {
              setGotoError(null);
              setGotoOpen(true);
            }}
            aria-label={`الصفحة ${pageNumber} من ${MUSHAF_PAGE_MAX} — انتقال`}
          >
            <BookOpen size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="mm-controls__icon"
            onClick={() => (onSearch ? onSearch() : setGotoOpen(true))}
            aria-label="بحث"
          >
            <Search size={22} aria-hidden="true" />
          </button>
          <button type="button" className="mm-controls__icon" onClick={onIndex} aria-label="فهرس">
            <List size={22} aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          className="mm-controls__btn mm-controls__page"
          onClick={() => {
            setGotoError(null);
            setGotoOpen(true);
          }}
          aria-label={`الصفحة ${pageNumber} من ${MUSHAF_PAGE_MAX} — انتقال`}
          dir="ltr"
        >
          {pageNumber} / {MUSHAF_PAGE_MAX}
        </button>
        <div className="mm-controls__cluster mm-controls__cluster--end">
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
            className="mm-controls__btn"
            onClick={onNext}
            disabled={pageNumber >= MUSHAF_PAGE_MAX}
            aria-label="الصفحة التالية"
          >
            التالي
          </button>
        </div>
      </div>
      {visible && onToggleTheme ? (
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
            e.stopPropagation();
            const n = parseMushafPageQuery(draft);
            if (n == null || n < MUSHAF_PAGE_MIN || n > MUSHAF_PAGE_MAX) {
              setGotoError(`أدخل رقمًا بين ${MUSHAF_PAGE_MIN} و ${MUSHAF_PAGE_MAX}`);
              return;
            }
            setGotoError(null);
            onGoto(n);
            setGotoOpen(false);
          }}
        >
          <h2 id={titleId} className="mm-goto__title">
            انتقال إلى صفحة
          </h2>
          <input
            type="text"
            inputMode="numeric"
            enterKeyHint="go"
            pattern="[0-9]*"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setGotoError(null);
            }}
            dir="ltr"
            aria-label="رقم الصفحة"
            aria-invalid={gotoError ? true : undefined}
            aria-describedby={gotoError ? `${titleId}-err` : undefined}
          />
          {gotoError ? (
            <p className="mm-goto__error" id={`${titleId}-err`} role="alert">
              {gotoError}
            </p>
          ) : null}
          <div className="mm-goto__actions">
            <button type="submit" data-primary="1">
              انتقال
            </button>
            <button type="button" data-primary="0" onClick={() => setGotoOpen(false)}>
              إلغاء
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
