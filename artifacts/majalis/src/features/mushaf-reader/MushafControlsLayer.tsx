import { memo, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { getSurahMeta } from "@/lib/quran-api";
import { toArabicDigits } from "@/lib/utils";
import { parseVerseKey } from "@/features/mushaf-madinah/mushaf-page-for-ayah";
import {
  MUSHAF_PAGE_MAX,
  MUSHAF_PAGE_MIN,
  parseMushafPageQuery,
} from "@/lib/quran-last-page";

/** أرقام غربية/عربية/فارسية فقط أثناء الكتابة */
const PAGE_DIGIT_RE = /[0-9٠-٩۰-۹]/g;

function sanitizePageDraft(raw: string): string {
  return (raw.match(PAGE_DIGIT_RE) ?? []).join("");
}

type ControlsProps = {
  chromeOpen: boolean;
  pageNumber: number;
  gotoOpen: boolean;
  onGotoOpenChange: (open: boolean) => void;
  onGoto: (page: number) => void;
  onExit: () => void;
  onSearch: () => void;
  onIndex: () => void;
  onPlayPage?: () => void;
  /** وضع القراءة الكامل — يخفي كل الـchrome عدا المصحف */
  focusReadingMode?: boolean;
  onToggleFocusReadingMode?: () => void;
  /** تفضيل أسهم تقليب الصفحات */
  pageArrowsEnabled?: boolean;
  onPageArrowsEnabledChange?: (enabled: boolean) => void;
  moreOpen?: boolean;
  onMoreOpenChange?: (open: boolean) => void;
};

/** طبقة أدوات القراءة — شريط مضغوط فوق المصحف (خارج Geometry) */
export const MushafControlsLayer = memo(function MushafControlsLayer({
  chromeOpen,
  pageNumber,
  gotoOpen,
  onGotoOpenChange,
  onGoto,
  onExit,
  onSearch,
  onIndex,
  onPlayPage,
  focusReadingMode = false,
  onToggleFocusReadingMode,
  pageArrowsEnabled = true,
  onPageArrowsEnabledChange,
  moreOpen = false,
  onMoreOpenChange,
}: ControlsProps) {
  const [draft, setDraft] = useState(String(pageNumber));
  const [gotoError, setGotoError] = useState<string | null>(null);
  const titleId = useId();
  const moreTitleId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  const closeGoto = () => {
    inputRef.current?.blur();
    onGotoOpenChange(false);
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
    onGotoOpenChange(false);
  };

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    handleGoToPage();
  };

  return (
    <div
      className="nm-controls nm-controls--compact"
      data-open={chromeOpen ? "1" : "0"}
      data-focus-reading={focusReadingMode ? "1" : "0"}
      aria-hidden={!chromeOpen && !gotoOpen}
    >
      <div className="nm-controls__bar" data-testid="nm-controls-bar" role="toolbar" aria-label="أدوات المصحف">
        <button
          type="button"
          className="nm-controls__btn nm-controls__exit"
          data-testid="mushaf-toolbar-exit"
          aria-label="الخروج من المصحف"
          title="الخروج من المصحف"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onExit();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span className="sr-only">خروج</span>
        </button>
        {onToggleFocusReadingMode ? (
          <button
            type="button"
            className="nm-controls__btn nm-controls__focus"
            data-testid="mushaf-focus-reading-toggle"
            aria-label={focusReadingMode ? "إظهار أدوات المصحف" : "إخفاء أدوات المصحف"}
            aria-pressed={focusReadingMode}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFocusReadingMode();
            }}
          >
            {focusReadingMode ? "إظهار" : "قراءة"}
          </button>
        ) : null}
        <button
          type="button"
          className="nm-controls__page"
          onClick={() => onGotoOpenChange(true)}
          aria-label={`الصفحة ${pageNumber} من ${MUSHAF_PAGE_MAX} — انتقال`}
          dir="ltr"
        >
          {toArabicDigits(pageNumber)}
        </button>
        <div className="nm-controls__actions">
          <button type="button" className="nm-controls__btn" aria-label="بحث في القرآن" onClick={onSearch}>
            بحث
          </button>
          <button type="button" className="nm-controls__btn" aria-label="فهرس السور" onClick={onIndex}>
            فهرس
          </button>
          {onPlayPage ? (
            <button type="button" className="nm-controls__btn" aria-label="تشغيل الصفحة" onClick={onPlayPage}>
              تشغيل
            </button>
          ) : null}
          {onPageArrowsEnabledChange && onMoreOpenChange ? (
            <button
              type="button"
              className="nm-controls__btn nm-controls__more"
              data-testid="mushaf-controls-more"
              aria-label="المزيد من إعدادات المصحف"
              aria-expanded={moreOpen}
              aria-controls={moreOpen ? moreTitleId : undefined}
              onClick={(e) => {
                e.stopPropagation();
                onMoreOpenChange(!moreOpen);
              }}
            >
              المزيد
            </button>
          ) : null}
        </div>
      </div>

      {moreOpen && onPageArrowsEnabledChange ? (
        <div
          className="nm-controls-more"
          data-testid="mushaf-controls-more-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={moreTitleId}
        >
          <h2 id={moreTitleId} className="nm-controls-more__title">
            إعدادات المصحف
          </h2>
          <label className="nm-controls-more__row">
            <span>إظهار أسهم تقليب الصفحات</span>
            <input
              type="checkbox"
              data-testid="mushaf-page-arrows-toggle"
              checked={pageArrowsEnabled}
              aria-label="إظهار أسهم تقليب الصفحات"
              onChange={(e) => onPageArrowsEnabledChange(e.target.checked)}
            />
          </label>
          <button
            type="button"
            className="nm-controls-more__close"
            onClick={() => onMoreOpenChange?.(false)}
          >
            إغلاق
          </button>
        </div>
      ) : null}

      {gotoOpen ? (
        <form
          className="nm-goto"
          aria-labelledby={titleId}
          data-testid="mushaf-goto-form"
          action="#"
          method="get"
          noValidate
          onSubmit={handleGoToPage}
        >
          <h2 id={titleId} className="nm-goto__title">
            انتقال إلى صفحة
          </h2>
          {/*
            iOS: inputMode=numeric يخفي زر البحث.
            text + enterKeyHint=search يظهر «بحث» مع قبول الأرقام فقط.
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
            <p className="nm-goto__error" id={`${titleId}-err`} role="alert">
              {gotoError}
            </p>
          ) : null}
          <div className="nm-goto__actions">
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
});

type MenuProps = {
  verseKey: string;
  status: string | null;
  onPlay: () => void;
  onTafsir: () => void;
  onCopy: () => void;
  onBookmark: () => void;
  onClose: () => void;
};

/** قائمة آية مختصرة: تلاوة · تفسير · نسخ · حفظ */
export const MushafVerseMenu = memo(function MushafVerseMenu({
  verseKey,
  status,
  onPlay,
  onTafsir,
  onCopy,
  onBookmark,
  onClose,
}: MenuProps) {
  const parsed = parseVerseKey(verseKey);
  const label = parsed
    ? `${getSurahMeta(parsed.surah).name} · آية ${toArabicDigits(parsed.ayah)}`
    : verseKey;

  return (
    <div
      className="nm-verse-menu"
      data-testid="nm-verse-menu"
      role="dialog"
      aria-label="إجراءات الآية"
    >
      <div className="nm-verse-menu__head">
        <button
          type="button"
          className="nm-verse-menu__close"
          onClick={onClose}
          aria-label="إغلاق"
        >
          إغلاق
        </button>
        <span className="nm-verse-menu__label">{label}</span>
      </div>
      <div className="nm-verse-menu__grid">
        <button type="button" className="nm-verse-menu__action" onClick={onPlay}>
          استماع
        </button>
        <button type="button" className="nm-verse-menu__action" onClick={onTafsir}>
          تفسير
        </button>
        <button type="button" className="nm-verse-menu__action" onClick={onCopy}>
          نسخ
        </button>
        <button type="button" className="nm-verse-menu__action" onClick={onBookmark}>
          حفظ
        </button>
      </div>
      <div className="nm-verse-menu__status" aria-live="polite">
        {status ?? ""}
      </div>
    </div>
  );
});
