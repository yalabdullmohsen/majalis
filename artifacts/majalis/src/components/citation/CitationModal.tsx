import { useCallback, useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  type Citation,
  type CitationSource,
  type CitationStyle,
  CONTENT_TYPE_COLOR,
  CONTENT_TYPE_LABEL,
  MAX_QUOTE_LENGTH,
  STYLE_LABEL,
  createCitation,
  fetchFormattedCitation,
  getCitationImageUrl,
  getQrCodeUrl,
  getShareUrl,
  saveCitationToLibrary,
} from "@/lib/citation-service";

interface Props {
  source: CitationSource;
  initialText?: string;
  startOffset?: number;
  endOffset?: number;
  onClose: () => void;
}

export function CitationModal({ source, initialText = "", startOffset, endOffset, onClose }: Props) {
  const [text, setText] = useState(initialText.slice(0, MAX_QUOTE_LENGTH));
  const [style, setStyle] = useState<CitationStyle>("default");
  const [formatted, setFormatted] = useState("");
  const [citation, setCitation] = useState<Citation | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [tab, setTab] = useState<"preview" | "share" | "save">("preview");
  const [savedFolder] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isDark = document.documentElement.classList.contains("dark");

  // جلب التوثيق المنسَّق
  useEffect(() => {
    if (!source.id) return;
    fetchFormattedCitation(source.id, style).then((r) => {
      if (r.formatted) setFormatted(r.formatted);
    });
  }, [source.id, style]);

  // إنشاء الاقتباس عند فتح التبويب الثاني أو الثالث
  const ensureCitation = useCallback(async () => {
    if (citation) return citation;
    if (!text.trim()) { setStatus("أدخل نصًا للاقتباس"); return null; }
    setLoading(true);
    const r = await createCitation({
      source_id: source.id,
      quoted_text: text.trim(),
      text_start_offset: startOffset,
      text_end_offset: endOffset,
      citation_style: style,
    });
    setLoading(false);
    if (!r.ok) { setStatus(r.error || "فشل إنشاء الاقتباس"); return null; }
    setCitation(r.citation!);
    setShareUrl(r.share_url!);
    return r.citation!;
  }, [citation, text, source.id, startOffset, endOffset, style]);

  const handleTabChange = async (t: "preview" | "share" | "save") => {
    if (t !== "preview") await ensureCitation();
    setTab(t);
  };

  // نسخ النص + التوثيق
  const copyTextAndRef = async () => {
    const cit = await ensureCitation();
    const full = `"${text}"\n\n— ${formatted || source.title_ar}\n${cit ? getShareUrl(cit.deep_link_slug) : ""}`;
    await navigator.clipboard.writeText(full).catch(() => {});
    setStatus("تم النسخ ✓");
    setTimeout(() => setStatus(null), 2500);
  };

  // نسخ الرابط المباشر
  const copyLink = async () => {
    if (!shareUrl) { await ensureCitation(); return; }
    await navigator.clipboard.writeText(shareUrl).catch(() => {});
    setStatus("تم نسخ الرابط ✓");
    setTimeout(() => setStatus(null), 2500);
  };

  // تحميل بطاقة الاقتباس كصورة
  const downloadImage = useCallback(async () => {
    const cit = await ensureCitation();
    if (!cit) return;
    // تحميل SVG من الـ API
    const url = getCitationImageUrl(cit.deep_link_slug, isDark);
    const a = document.createElement("a");
    a.href = url;
    a.download = `citation-${cit.deep_link_slug}.svg`;
    a.click();
  }, [citation, isDark, ensureCitation]);

  // تحميل الصورة PNG من بطاقة المعاينة
  const downloadCardPng = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `citation-${citation?.deep_link_slug || "majalis"}.png`;
      a.click();
    } catch { /* صامت */ }
  }, [citation]);

  // حفظ في المكتبة
  const handleSave = async () => {
    const cit = await ensureCitation();
    if (!cit) return;
    setLoading(true);
    const r = await saveCitationToLibrary(cit.id, {
      folder_id: savedFolder || undefined,
      personal_note: note || undefined,
    });
    setLoading(false);
    setStatus(r.ok ? "تم الحفظ في مكتبتك ✓" : (r.error || "فشل الحفظ"));
    setTimeout(() => setStatus(null), 3000);
  };

  const typeColor = CONTENT_TYPE_COLOR[source.content_type] || "#065f46";
  const typeLabel = CONTENT_TYPE_LABEL[source.content_type] || source.content_type;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ background: "var(--majalis-panel)", color: "var(--majalis-ink)" }}>
        {/* رأس النافذة */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--majalis-line)" }}>
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded text-xs text-white font-medium"
              style={{ background: typeColor }}
            >
              {typeLabel}
            </span>
            <span className="text-sm font-semibold line-clamp-1">
              {source.title_ar}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none transition-colors"
            style={{ color: "var(--majalis-ink-soft)" }}
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>

        {/* التبويبات */}
        <div className="flex" style={{ borderBottom: "1px solid var(--majalis-line)" }}>
          {(["preview", "share", "save"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTabChange(t)}
              className="flex-1 py-2.5 text-sm font-medium transition-colors"
              style={tab === t ? {
                borderBottom: "2px solid var(--mn-border-active)",
                color: "var(--mn-text-active)"
              } : { color: "var(--majalis-ink-soft)" }}
            >
              {t === "preview" ? "معاينة" : t === "share" ? "مشاركة" : "حفظ"}
            </button>
          ))}
        </div>

        {/* المحتوى */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* تبويب المعاينة */}
          {tab === "preview" && (
            <>
              {/* تعديل النص */}
              <div>
                <label className="block text-xs font-medium mb-1"
                  style={{ color: "var(--majalis-ink-soft)" }}>
                  النص المقتبس ({text.length}/{MAX_QUOTE_LENGTH} حرف)
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_QUOTE_LENGTH))}
                  rows={4}
                  className="w-full rounded-lg px-3 py-2 text-sm text-right leading-relaxed outline-none resize-none"
                  style={{
                    border: "1px solid var(--majalis-line)",
                    background: "var(--majalis-parchment)",
                    color: "var(--majalis-ink)",
                    boxShadow: "0 0 0 0",
                  }}
                  onFocus={(e) => { e.currentTarget.style.outline = `2px solid var(--majalis-emerald)`; }}
                  onBlur={(e) => { e.currentTarget.style.outline = "none"; }}
                  dir="rtl"
                />
              </div>

              {/* أسلوب التوثيق (للأبحاث والمقالات فقط) */}
              {["article", "research"].includes(source.content_type) && (
                <div>
                  <label className="block text-xs font-medium mb-1"
                    style={{ color: "var(--majalis-ink-soft)" }}>
                    أسلوب التوثيق
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as CitationStyle)}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      border: "1px solid var(--majalis-line)",
                      background: "var(--majalis-parchment)",
                      color: "var(--majalis-ink)",
                    }}
                  >
                    {(Object.keys(STYLE_LABEL) as CitationStyle[]).map((s) => (
                      <option key={s} value={s}>{STYLE_LABEL[s]}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* بطاقة المعاينة */}
              <div
                ref={cardRef}
                dir="rtl"
                className="border rounded-xl p-5 space-y-3"
                style={{
                  background: "var(--majalis-parchment-deep)",
                  borderColor: "var(--majalis-line)",
                }}
              >
                <p className="text-sm font-bold" style={{ color: "var(--majalis-emerald-deep)" }}>
                  مجالس — منصة العلم الشرعي
                </p>
                <p className="leading-relaxed text-base font-arabic pr-3"
                  style={{
                    color: "var(--majalis-ink)",
                    borderRight: "4px solid var(--majalis-emerald)",
                  }}>
                  {text || "أدخل النص المراد اقتباسه..."}
                </p>
                {formatted && (
                  <p className="text-xs mt-2" style={{ color: "var(--majalis-ink-soft)" }}>— {formatted}</p>
                )}
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyTextAndRef}
                  className="citation-btn citation-btn--primary"
                >
                  📋 نسخ النص والمصدر
                </button>
                <button
                  type="button"
                  onClick={downloadCardPng}
                  className="citation-btn citation-btn--secondary"
                >
                  🖼️ تحميل صورة
                </button>
              </div>
            </>
          )}

          {/* تبويب المشاركة */}
          {tab === "share" && (
            <div className="space-y-4">
              {shareUrl ? (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1"
                      style={{ color: "var(--majalis-ink-soft)" }}>
                      الرابط المباشر
                    </label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={shareUrl}
                        className="flex-1 rounded-lg px-3 py-2 text-sm text-left font-mono outline-none"
                        style={{
                          border: "1px solid var(--majalis-line)",
                          background: "var(--majalis-parchment-deep)",
                          color: "var(--majalis-ink-soft)",
                        }}
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={copyLink}
                        className="citation-btn citation-btn--primary"
                      >
                        نسخ
                      </button>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowQr(!showQr)}
                      className="text-sm hover:underline transition-colors"
                      style={{ color: "var(--mn-text-active)" }}
                    >
                      {showQr ? "إخفاء QR Code" : "عرض QR Code"}
                    </button>
                    {showQr && citation && (
                      <div className="mt-3 flex flex-col items-center gap-2">
                        <img
                          src={getQrCodeUrl(citation.deep_link_slug)}
                          alt="QR Code"
                          className="w-40 h-40 rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                        <a
                          href={getQrCodeUrl(citation.deep_link_slug)}
                          download={`qr-${citation.deep_link_slug}.png`}
                          className="text-xs hover:underline"
                          style={{ color: "var(--majalis-ink-soft)" }}
                        >
                          تحميل QR Code
                        </a>
                      </div>
                    )}
                  </div>

                  {/* بطاقة SVG */}
                  {citation && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={downloadImage}
                        className="citation-btn citation-btn--brass"
                      >
                        🖼️ تحميل بطاقة الاقتباس (SVG)
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  {loading ? "جاري الإنشاء..." : "انقر على تبويب «معاينة» أولًا للتحقق من النص"}
                </p>
              )}
            </div>
          )}

          {/* تبويب الحفظ */}
          {tab === "save" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                احفظ هذا الاقتباس في مكتبتك الشخصية مع ملاحظة اختيارية.
              </p>
              <div>
                <label className="block text-xs font-medium mb-1"
                  style={{ color: "var(--majalis-ink-soft)" }}>
                  ملاحظة شخصية (اختياري)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="ملاحظتك الخاصة على هذا الاقتباس..."
                  className="w-full rounded-lg px-3 py-2 text-sm text-right outline-none resize-none"
                  style={{
                    border: "1px solid var(--majalis-line)",
                    background: "var(--majalis-parchment)",
                    color: "var(--majalis-ink)",
                  }}
                  onFocus={(e) => { e.currentTarget.style.outline = `2px solid var(--majalis-emerald)`; }}
                  onBlur={(e) => { e.currentTarget.style.outline = "none"; }}
                  dir="rtl"
                />
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="citation-btn citation-btn--primary w-full disabled:opacity-50"
              >
                {loading ? "جاري الحفظ..." : "حفظ في مكتبتي"}
              </button>
            </div>
          )}

          {status && (
            <p className="text-sm text-center font-medium py-1"
              style={{ color: "var(--mn-text-active)" }}>
              {status}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
