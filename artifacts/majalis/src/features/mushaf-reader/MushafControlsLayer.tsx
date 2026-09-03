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
};

/** طبقة أدوات القراءة — تظهر عند الحاجة فقط */
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
}: ControlsProps) {
  const [draft, setDraft] = useState(String(pageNumber));
  const [gotoError, setGotoError] = useState<string | null>(null);
  const titleId = useId();
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
    <div className="nm-controls" data-open={chromeOpen ? "1" : "0"} aria-hidden={!chromeOpen && !gotoOpen}>
      <div className="nm-controls__bar" data-testid="nm-controls-bar">
        <button type="button" className="nm-controls__btn nm-controls__exit" onClick={onExit}>
          خروج
        </button>
        <button
          type="button"
          className="nm-controls__page"
          onClick={() => onGotoOpenChange(true)}
          aria-label={`الصفحة ${pageNumber} من ${MUSHAF_PAGE_MAX} — انتقال`}
          dir="ltr"
        >
          {toArabicDigits(pageNumber)}
        </button>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {onPlayPage ? (
            <button type="button" className="nm-controls__btn" onClick={onPlayPage}>
              تشغيل الصفحة
            </button>
          ) : null}
          <button type="button" className="nm-controls__btn" onClick={onIndex}>
            فهرس
          </button>
          <button type="button" className="nm-controls__btn" onClick={onSearch}>
            بحث
          </button>
        </div>
      </div>

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
      <button
        type="button"
        className="nm-controls__btn"
        onClick={onClose}
        style={{ position: "absolute", insetInlineStart: "0.75rem", top: "0.55rem" }}
        aria-label="إغلاق"
      >
        إغلاق
      </button>
      <span className="nm-verse-menu__label">{label}</span>
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
