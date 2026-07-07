import { useCallback, useEffect, useRef, useState } from "react";
import { CitationModal } from "./CitationModal";
import { type CitationSource, type CitationContentType, CONTENT_TYPE_COLOR } from "@/lib/citation-service";

interface Props {
  /** بيانات المصدر — يمكن تمريرها مباشرة إن كانت معلومة */
  source?: CitationSource;
  /** أو تمرير معرّف المصدر لجلبه تلقائيًا */
  sourceId?: string;
  /** نوع المحتوى للاستخدام في الألوان والتصنيف */
  contentType?: CitationContentType;
  /** مرجع عنصر النص (لتمكين التحديد) */
  contentRef?: React.RefObject<HTMLElement>;
  /** عرض مضغوط (أيقونات فقط) */
  compact?: boolean;
  /** كلاس إضافي */
  className?: string;
}

/** Tooltip عائم عند تحديد النص (نمط Medium) */
function SelectionTooltip({
  onCite,
  onCopy,
}: {
  onCite: (text: string, start: number, end: number) => void;
  onCopy: (text: string) => void;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [selText, setSelText] = useState("");
  const [selStart, setSelStart] = useState(0);
  const [selEnd, setSelEnd] = useState(0);

  useEffect(() => {
    const handleSelect = () => {
      const sel = window.getSelection();
      const txt = sel?.toString().trim() || "";
      if (txt.length < 5) { setPos(null); return; }

      const range = sel!.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelText(txt);
      setSelStart(range.startOffset);
      setSelEnd(range.endOffset);
      setPos({
        top: rect.top + window.scrollY - 48,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    };

    const handleClickOut = () => {
      if (!window.getSelection()?.toString().trim()) setPos(null);
    };

    document.addEventListener("mouseup", handleSelect);
    document.addEventListener("touchend", handleSelect);
    document.addEventListener("mousedown", handleClickOut);
    return () => {
      document.removeEventListener("mouseup", handleSelect);
      document.removeEventListener("touchend", handleSelect);
      document.removeEventListener("mousedown", handleClickOut);
    };
  }, []);

  if (!pos) return null;

  return (
    <div
      dir="rtl"
      className="cab-tooltip"
      style={{ "--cab-top": `${pos.top}px`, "--cab-left": `${pos.left}px` } as React.CSSProperties}
    >
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onCite(selText, selStart, selEnd); setPos(null); }}
        className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-[var(--majalis-emerald-deep)]"
        title="اقتبس"
      >
        📑 اقتباس
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onCopy(selText); setPos(null); }}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-600 transition-colors"
        title="نسخ"
      >
        📋 نسخ
      </button>
    </div>
  );
}

export function CitationActionBar({
  source,
  sourceId,
  contentType,
  contentRef: _contentRef,
  compact = false,
  className = "",
}: Props) {
  const src = source ?? null;
  const [showModal, setShowModal] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [startOffset, setStartOffset] = useState<number | undefined>();
  const [endOffset, setEndOffset] = useState<number | undefined>();
  const [copied, setCopied] = useState(false);
  const printRef = useRef(false);


  const typeColor = src
    ? CONTENT_TYPE_COLOR[src.content_type] || "#065f46"
    : (contentType ? CONTENT_TYPE_COLOR[contentType] || "#065f46" : "#065f46");

  const openCite = useCallback((text = "", start?: number, end?: number) => {
    setSelectedText(text);
    setStartOffset(start);
    setEndOffset(end);
    setShowModal(true);
  }, []);

  const handleCiteBtn = () => {
    const sel = window.getSelection()?.toString().trim() || "";
    openCite(sel);
  };

  const handleCopy = useCallback(async (text?: string) => {
    const t = text || window.getSelection()?.toString().trim() || "";
    if (!t) return;
    await navigator.clipboard.writeText(t).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handlePrint = () => {
    if (printRef.current) return;
    printRef.current = true;
    window.print();
    setTimeout(() => { printRef.current = false; }, 3000);
  };

  const handleShare = async () => {
    if (!src) return;
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: src.title_ar, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!src && !sourceId) return null;

  const btnClass = compact
    ? "p-2 rounded-lg text-sm transition-colors hover:bg-[var(--mn-surface-hover)]"
    : "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--mn-surface-hover)]";

  return (
    <>
      {/* Tooltip عائم للتحديد */}
      {src && (
        <SelectionTooltip
          onCite={(text, start, end) => openCite(text, start, end)}
          onCopy={handleCopy}
        />
      )}

      {/* شريط الأزرار */}
      <div
        dir="rtl"
        className={`flex flex-wrap items-center gap-1 print:hidden ${className}`}
      >
        {/* فاصل ملوَّن حسب نوع المحتوى */}
        {!compact && (
          <span
            className="w-1 h-6 rounded-full ml-1 self-center cab-type-bar"
            style={{ "--cab-type-color": typeColor } as React.CSSProperties}
          />
        )}

        <button
          type="button"
          onClick={handleCiteBtn}
          className={btnClass}
          title="اقتباس"
        >
          📑 {!compact && "اقتباس"}
        </button>

        <button
          type="button"
          onClick={() => { /* الحفظ يتم عبر Modal */ setShowModal(true); }}
          className={btnClass}
          title="حفظ"
        >
          ⭐ {!compact && "حفظ"}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className={btnClass}
          title="مشاركة"
        >
          🔗 {!compact && "مشاركة"}
        </button>

        <button
          type="button"
          onClick={() => handleCopy()}
          className={btnClass}
          title="نسخ"
        >
          {copied ? "✓" : "📋"} {!compact && (copied ? "تم النسخ" : "نسخ")}
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className={btnClass}
          title="طباعة"
        >
          🖨️ {!compact && "طباعة"}
        </button>
      </div>

      {/* نافذة الاقتباس */}
      {showModal && src && (
        <CitationModal
          source={src}
          initialText={selectedText}
          startOffset={startOffset}
          endOffset={endOffset}
          onClose={() => { setShowModal(false); setSelectedText(""); }}
        />
      )}
    </>
  );
}

/**
 * Wrapper مبسَّط — يُلفّ أي محتوى ويضيف CitationActionBar تلقائيًا أسفله.
 */
export function WithCitation({
  source,
  children,
  compact,
}: {
  source?: CitationSource;
  children: React.ReactNode;
  compact?: boolean;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  return (
    <div className="space-y-2">
      <div ref={contentRef}>{children}</div>
      {source && (
        <CitationActionBar
          source={source}
          contentRef={contentRef as React.RefObject<HTMLElement>}
          compact={compact}
          className="border-t border-gray-100 dark:border-gray-700 pt-2 mt-2"
        />
      )}
    </div>
  );
}
