import {
  memo,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { getSurahMeta } from "@/lib/quran-api";
import { toArabicDigits } from "@/lib/utils";
import { parseVerseKey } from "@/features/mushaf-madinah/mushaf-page-for-ayah";
import {
  MUSHAF_PAGE_MAX,
  MUSHAF_PAGE_MIN,
  clampMushafPage,
  parseMushafPageQuery,
} from "@/lib/quran-last-page";
import { MushafDisplayModeControl } from "@/features/mushaf-reader/MushafDisplayModeControl";
import {
  MUSHAF_APPEARANCE_CHANGE_EVENT,
  loadMushafAppearanceMode,
  type MushafAppearanceMode,
} from "@/lib/mushaf-v2/appearance-prefs";
import { QuranSettingsRepository } from "@/lib/mushaf-v2/QuranSettingsRepository";
import "./page-goto-dial.css";
import "@/styles/components/page-goto-visibility.css";

/** أرقام غربية/عربية/فارسية فقط أثناء الكتابة */
const PAGE_DIGIT_RE = /[0-9٠-٩۰-۹]/g;

/** قائمة ثابتة ١…٦٠٤ — تُبنى مرة واحدة خارج المكوّن */
const MUSHAF_PAGE_LIST: readonly number[] = Array.from(
  { length: MUSHAF_PAGE_MAX - MUSHAF_PAGE_MIN + 1 },
  (_, i) => MUSHAF_PAGE_MIN + i,
);

/** ارتفاع عنصر العدّاد — يطابق CSS (--nm-goto-dial-item-h) */
const DIAL_ITEM_H = 44;
const DIAL_OVERSCAN = 8;

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
  const [dialStart, setDialStart] = useState(0);
  const [dialCount, setDialCount] = useState(16);
  const [displayMode, setDisplayMode] = useState<MushafAppearanceMode>(() =>
    loadMushafAppearanceMode(),
  );
  const titleId = useId();
  const moreTitleId = useId();
  const dialId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialRef = useRef<HTMLDivElement | null>(null);

  const syncDialWindow = useCallback(() => {
    const dial = dialRef.current;
    if (!dial) return;
    const viewH = dial.clientHeight || DIAL_ITEM_H * 5;
    const start = Math.max(0, Math.floor(dial.scrollTop / DIAL_ITEM_H) - DIAL_OVERSCAN);
    const count = Math.min(
      MUSHAF_PAGE_LIST.length - start,
      Math.ceil(viewH / DIAL_ITEM_H) + DIAL_OVERSCAN * 2,
    );
    setDialStart((prev) => (prev === start ? prev : start));
    setDialCount((prev) => (prev === count ? prev : count));
  }, []);

  useEffect(() => {
    setDraft(String(pageNumber));
    setGotoError(null);
  }, [pageNumber]);

  useEffect(() => {
    if (moreOpen) setDisplayMode(loadMushafAppearanceMode());
  }, [moreOpen]);

  useEffect(() => {
    const onChange = () => setDisplayMode(loadMushafAppearanceMode());
    window.addEventListener(MUSHAF_APPEARANCE_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(MUSHAF_APPEARANCE_CHANGE_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!gotoOpen) return;
    setDraft(String(pageNumber));
    setGotoError(null);
    /* بلا focus تلقائي — فتح لوحة المفاتيح يبطئ iOS؛ العدّاد يظهر فورًا */
    const id = window.requestAnimationFrame(() => {
      const dial = dialRef.current;
      if (!dial) return;
      const targetTop = (pageNumber - MUSHAF_PAGE_MIN) * DIAL_ITEM_H - (dial.clientHeight - DIAL_ITEM_H) / 2;
      dial.scrollTop = Math.max(0, targetTop);
      syncDialWindow();
    });
    return () => window.cancelAnimationFrame(id);
  }, [gotoOpen, pageNumber, syncDialWindow]);

  const closeGoto = () => {
    inputRef.current?.blur();
    onGotoOpenChange(false);
    setGotoError(null);
  };

  const jumpToPage = useCallback(
    (raw: number) => {
      const n = clampMushafPage(raw);
      if (n < MUSHAF_PAGE_MIN || n > MUSHAF_PAGE_MAX) {
        setGotoError(`أدخل رقمًا بين ${MUSHAF_PAGE_MIN} و${MUSHAF_PAGE_MAX}`);
        return;
      }
      setGotoError(null);
      inputRef.current?.blur();
      onGoto(n);
      onGotoOpenChange(false);
    },
    [onGoto, onGotoOpenChange],
  );

  const handleGoToPage = (e?: FormEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const n = parseMushafPageQuery(draft);
    if (n == null || n < MUSHAF_PAGE_MIN || n > MUSHAF_PAGE_MAX) {
      setGotoError(`أدخل رقمًا بين ${MUSHAF_PAGE_MIN} و${MUSHAF_PAGE_MAX}`);
      inputRef.current?.focus({ preventScroll: true });
      return;
    }
    jumpToPage(n);
  };

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    handleGoToPage();
  };

  const nudgePage = (delta: number) => {
    jumpToPage(pageNumber + delta);
  };

  const dialSlice = MUSHAF_PAGE_LIST.slice(dialStart, dialStart + dialCount);
  const dialSpacerTop = dialStart * DIAL_ITEM_H;
  const dialSpacerBottom = Math.max(0, (MUSHAF_PAGE_LIST.length - dialStart - dialCount) * DIAL_ITEM_H);

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
          <span className="nm-controls__exit-icon" aria-hidden="true">
            ←
          </span>
          <span className="nm-controls__exit-label">إغلاق</span>
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
          <MushafDisplayModeControl
            value={displayMode}
            onChange={(mode) => {
              QuranSettingsRepository.setAppearanceMode(mode);
              QuranSettingsRepository.applyAppearance(mode);
              setDisplayMode(mode);
            }}
            className="nm-controls-more__display-mode"
          />
          <label className="nm-controls-more__row">
            <span>إظهار أسهم تقليب الصفحات</span>
            <input
              type="checkbox"
              data-testid="mushaf-page-arrows-toggle"
              checked={pageArrowsEnabled}
              aria-label="إظهار أسهم تقليب الصفحات"
              onChange={(e) => onPageArrowsEnabledChange?.(e.target.checked)}
            />
          </label>
          <a
            className="nm-controls-more__row"
            href="/mushaf/bookmarks"
            data-testid="mushaf-bookmarks-manager-link"
            onClick={() => onMoreOpenChange?.(false)}
          >
            إدارة الفواصل
          </a>
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

          <div className="nm-goto__stepper" role="group" aria-label="تعديل رقم الصفحة">
            <button
              type="button"
              className="nm-goto__nudge"
              data-testid="mushaf-goto-prev"
              aria-label="الصفحة السابقة"
              disabled={pageNumber <= MUSHAF_PAGE_MIN}
              onClick={(e) => {
                e.preventDefault();
                nudgePage(-1);
              }}
            >
              −
            </button>
            <span className="nm-goto__current" aria-live="polite" dir="ltr">
              {toArabicDigits(pageNumber)}
            </span>
            <button
              type="button"
              className="nm-goto__nudge"
              data-testid="mushaf-goto-next"
              aria-label="الصفحة التالية"
              disabled={pageNumber >= MUSHAF_PAGE_MAX}
              onClick={(e) => {
                e.preventDefault();
                nudgePage(1);
              }}
            >
              +
            </button>
          </div>

          <div
            ref={dialRef}
            id={dialId}
            className="nm-goto__dial"
            data-testid="mushaf-goto-dial"
            role="listbox"
            tabIndex={0}
            aria-label={`اختر صفحة من ${MUSHAF_PAGE_MIN} إلى ${MUSHAF_PAGE_MAX}`}
            aria-activedescendant={`mushaf-goto-page-${pageNumber}`}
            onScroll={syncDialWindow}
          >
            <div className="nm-goto__dial-spacer" style={{ height: dialSpacerTop }} aria-hidden="true" />
            {dialSlice.map((n) => {
              const active = n === pageNumber;
              return (
                <button
                  key={n}
                  type="button"
                  id={`mushaf-goto-page-${n}`}
                  role="option"
                  aria-selected={active}
                  data-page={n}
                  data-active={active ? "1" : undefined}
                  className="nm-goto__dial-item"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    jumpToPage(n);
                  }}
                >
                  {toArabicDigits(n)}
                </button>
              );
            })}
            <div className="nm-goto__dial-spacer" style={{ height: dialSpacerBottom }} aria-hidden="true" />
          </div>

          {/*
            iOS: لا نفتح لوحة المفاتيح عند الظهور.
            الكتابة اختيارية عبر الحقل أدناه عند الحاجة.
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
            aria-describedby={gotoError ? `${titleId}-err` : dialId}
            placeholder={`${MUSHAF_PAGE_MIN}–${MUSHAF_PAGE_MAX}`}
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
  onClearSelection: () => void;
};

/** قائمة آية: تفسير · استماع · نسخ · فاصل · إلغاء التحديد */
export const MushafVerseMenu = memo(function MushafVerseMenu({
  verseKey,
  status,
  onPlay,
  onTafsir,
  onCopy,
  onBookmark,
  onClose,
  onClearSelection,
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
          aria-label="إغلاق القائمة"
        >
          إغلاق
        </button>
        <span className="nm-verse-menu__label">{label}</span>
      </div>
      <div className="nm-verse-menu__grid">
        <button type="button" className="nm-verse-menu__action" onClick={onTafsir}>
          تفسير
        </button>
        <button type="button" className="nm-verse-menu__action" onClick={onPlay}>
          استماع
        </button>
        <button type="button" className="nm-verse-menu__action" onClick={onCopy}>
          نسخ
        </button>
        <button type="button" className="nm-verse-menu__action" onClick={onBookmark}>
          إضافة فاصل
        </button>
      </div>
      <button
        type="button"
        className="nm-verse-menu__clear"
        data-testid="nm-verse-clear-selection"
        onClick={onClearSelection}
        aria-label="إلغاء التحديد"
      >
        إلغاء التحديد
      </button>
      <div className="nm-verse-menu__status" aria-live="polite">
        {status ?? ""}
      </div>
    </div>
  );
});
