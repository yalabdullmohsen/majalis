import { BookOpen, List, Search, Settings2 } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { MUSHAF_PAGE_MAX, MUSHAF_PAGE_MIN, parseMushafPageQuery } from "@/lib/quran-last-page";

type Props = {
  open: boolean;
  persist?: boolean;
  /** إظهار زر الخروج حتى عند إخفاء شريط الأدوات (مثل لوحة الآية) */
  exitAlwaysVisible?: boolean;
  pageNumber: number;
  onExit: () => void;
  onIndex: () => void;
  onPrev: () => void;
  onNext: () => void;
  onGoto: (page: number) => void;
  onSearch?: () => void;
  onSettings?: () => void;
  onToggleTheme?: () => void;
  themeLabel?: string;
};

/** أرقام غربية/عربية/فارسية فقط أثناء الكتابة */
const PAGE_DIGIT_RE = /[0-9٠-٩۰-۹]/g;

function sanitizePageDraft(raw: string): string {
  return (raw.match(PAGE_DIGIT_RE) ?? []).join("");
}

/** أدوات المصحف — شريط أيقونات علوي خفيف. */
export function MushafControls({
  open,
  persist = false,
  exitAlwaysVisible = false,
  pageNumber,
  onExit,
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const visible = open || persist || gotoOpen;
  const showExit = open || exitAlwaysVisible;

  useEffect(() => {
    if (!visible && !gotoOpen) {
      setGotoError(null);
    }
  }, [visible, gotoOpen]);

  useEffect(() => {
    setDraft(String(pageNumber));
    setGotoError(null);
  }, [pageNumber]);

  useEffect(() => {
    if (!gotoOpen) return;
    setDraft(String(pageNumber));
    setGotoError(null);
    const id = window.requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      el.select();
    });
    return () => window.cancelAnimationFrame(id);
  }, [gotoOpen, pageNumber]);

  const openGoto = () => {
    setGotoError(null);
    setGotoOpen(true);
  };

  const closeGoto = () => {
    inputRef.current?.blur();
    setGotoOpen(false);
    setGotoError(null);
  };

  const handleGoToPage = (e?: FormEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const n = parseMushafPageQuery(draft);
    if (n == null || n < MUSHAF_PAGE_MIN || n > MUSHAF_PAGE_MAX) {
      setGotoError(`أدخل رقمًا بين ${MUSHAF_PAGE_MIN} و${MUSHAF_PAGE_MAX}`);
      inputRef.current?.focus({ preventScroll: true });
      return;
    }
    setGotoError(null);
    inputRef.current?.blur();
    onGoto(n);
    setGotoOpen(false);
  };

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    handleGoToPage();
  };

  return (
    <div
      className="mm-controls"
      data-open={visible ? "1" : "0"}
      data-exit={showExit ? "1" : "0"}
      data-testid="mushaf-controls"
    >
      <button type="button" className="mm-controls__exit" onClick={onExit} aria-label="خروج من المصحف">
        × خروج
      </button>
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
            onClick={openGoto}
            aria-label={`الصفحة ${pageNumber} من ${MUSHAF_PAGE_MAX} — انتقال`}
          >
            <BookOpen size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="mm-controls__icon"
            onClick={() => (onSearch ? onSearch() : openGoto())}
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
          onClick={openGoto}
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
          data-testid="mushaf-goto-form"
          action="#"
          method="get"
          noValidate
          onSubmit={handleGoToPage}
        >
          <h2 id={titleId} className="mm-goto__title">
            انتقال إلى صفحة
          </h2>
          {/*
            iOS: inputMode=numeric يعرض لوحة أرقام بلا زر Go/بحث.
            نستخدم text + enterKeyHint=search ليظهر «بحث» مع قبول الأرقام فقط.
          */}
          <input
            ref={inputRef}
            type="text"
            name="mushaf-page"
            inputMode="text"
            enterKeyHint="search"
            pattern="[0-9٠-٩۰-۹]*"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={draft}
            onChange={(e) => {
              setDraft(sanitizePageDraft(e.target.value));
              setGotoError(null);
            }}
            onKeyDown={onInputKeyDown}
            dir="ltr"
            aria-label="رقم الصفحة"
            aria-invalid={gotoError ? true : undefined}
            aria-describedby={gotoError ? `${titleId}-err` : undefined}
            data-testid="mushaf-goto-input"
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
            <button type="button" data-primary="0" onClick={closeGoto}>
              إلغاء
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
