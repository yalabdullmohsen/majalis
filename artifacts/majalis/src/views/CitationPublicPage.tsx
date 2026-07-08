import { useEffect, useRef, useState } from "react";
import { Download, Link2, QrCode, Star } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Link, useRoute } from "wouter";
import {
  type Citation,
  CONTENT_TYPE_COLOR,
  CONTENT_TYPE_LABEL,
  getCitationImageUrl,
  getQrCodeUrl,
  getShareUrl,
  saveCitationToLibrary,
  fetchCitationBySlug,
} from "@/lib/citation-service";
import { useAuth } from "@/components/AuthProvider";
import { applyPageSeo } from "@/lib/seo";

export default function CitationPublicPage() {
  const [, params] = useRoute("/c/:slug");

  useEffect(() => {
    applyPageSeo({
      path: "/c",
      title: "مقتطف علمي مشترك | المجلس العلمي",
      description: "مقتطف علمي من المجلس العلمي — استشهادات أكاديمية بأسلوب مفهرس وجاهز للمشاركة والنشر.",
      keywords: ["مقتطف علمي", "استشهاد أكاديمي", "نص إسلامي", "مشاركة علمية"],
    });
  }, []);
  const slug = params?.slug || "";
  const { user } = useAuth();

  const [citation, setCitation] = useState<Citation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchCitationBySlug(slug)
      .then((r) => {
        if (r.ok && r.citation) setCitation(r.citation);
        else setError(r.error || "الاقتباس غير موجود");
      })
      .catch(() => setError("خطأ في الاتصال"))
      .finally(() => setLoading(false));
  }, [slug]);

  // التمييز التلقائي للنص عند التحميل (للـ deep-link)
  const contentRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!citation || !contentRef.current) return;
    try {
      const el = contentRef.current;
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    } catch { /* صامت */ }
  }, [citation]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(getShareUrl(slug)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = async () => {
    if (!citation) return;
    const r = await saveCitationToLibrary(citation.id);
    if (r.ok) setSaved(true);
  };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-[var(--majalis-parchment)]">
        <Spinner className="size-10 text-[var(--majalis-emerald)]" aria-label="جارٍ التحميل" />
      </div>
    );
  }

  if (error || !citation) {
    return (
      <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[var(--majalis-parchment)] p-6">
        <p className="text-[var(--majalis-ink-soft)] text-lg">{error || "الاقتباس غير موجود"}</p>
        <Link href="/" className="text-[var(--majalis-emerald)] hover:underline">
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  const src = citation.source;
  const typeColor = src ? CONTENT_TYPE_COLOR[src.content_type] || "#065f46" : "#065f46";
  const typeLabel = src ? CONTENT_TYPE_LABEL[src.content_type] || "" : "";

  // رابط العودة للمصدر
  const sourceHref = src?.source_url || (src?.reference_id ? `/${src.content_type.replace("_", "-")}/${src.reference_id}` : "/");

  // Meta الـ SEO ديناميكي
  useEffect(() => {
    if (!citation || !src) return;
    document.title = `"${citation.quoted_text.slice(0, 60)}..." — مجالس`;
    const meta = (n: string) => document.querySelector(`meta[name="${n}"],meta[property="${n}"]`) as HTMLMetaElement | null;
    if (meta("description")) meta("description")!.content = citation.quoted_text;
    if (meta("og:title")) meta("og:title")!.content = `اقتباس: ${src.title_ar}`;
    if (meta("og:description")) meta("og:description")!.content = citation.quoted_text;
    if (meta("og:image")) meta("og:image")!.content = getCitationImageUrl(slug);
  }, [citation, src, slug]);

  return (
    <div dir="rtl" className="min-h-screen bg-[var(--majalis-parchment)] flex flex-col">
      {/* شريط التنقل */}
      <nav className="bg-[var(--majalis-panel)] border-b border-[var(--majalis-line)] px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-[var(--majalis-emerald)] font-bold text-lg">
          مجالس
        </Link>
        <span className="text-xs text-[var(--majalis-ink-soft)] opacity-60">تطبيق العلم الشرعي</span>
      </nav>

      {/* بطاقة الاقتباس الرئيسية */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl space-y-6">

          {/* بطاقة الاقتباس */}
          <div className="bg-[var(--majalis-panel)] rounded-2xl shadow-xl overflow-hidden border border-[var(--majalis-line)] "
            style={{ "--cit-type-color": typeColor } as React.CSSProperties}>
            {/* شريط ملوَّن */}
            <div className="h-1.5 cit-type-bar" />

            <div className="p-6 space-y-4">
              {/* نوع المحتوى والعنوان */}
              {src && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="px-2 py-0.5 rounded text-xs text-white font-medium cit-type-badge"
                  >
                    {typeLabel}
                  </span>
                  <span className="text-sm font-semibold text-[var(--majalis-ink-soft)]">
                    {src.title_ar}
                  </span>
                </div>
              )}

              {/* النص المقتبس */}
              <blockquote className="border-r-4 border-[var(--majalis-emerald)] pr-4">
                <p
                  ref={contentRef}
                  className="text-[var(--majalis-ink)] text-lg leading-relaxed font-arabic"
                >
                  {citation.quoted_text}
                </p>
              </blockquote>

              {/* بيانات المصدر */}
              {src && (
                <div className="text-sm text-[var(--majalis-ink-soft)] space-y-0.5">
                  {src.author_name && <p>الكاتب/الشيخ: <span className="font-medium">{src.author_name}</span></p>}
                  {src.book_name && (
                    <p>
                      المصدر: <span className="font-medium">{src.book_name}</span>
                      {src.volume && ` — ج${src.volume}`}
                      {src.page_number && ` — ص${src.page_number}`}
                    </p>
                  )}
                  {src.publish_year && <p>السنة: {src.publish_year}</p>}
                </div>
              )}
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={copyLink}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[var(--majalis-panel)] border border-[var(--majalis-line)] rounded-xl hover:border-[var(--majalis-emerald)] text-[var(--majalis-ink-soft)] transition-colors shadow-sm"
            >
              <Link2 size={14} strokeWidth={2} aria-hidden="true" /> {copied ? "تم النسخ ✓" : "نسخ الرابط"}
            </button>

            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[var(--majalis-panel)] border border-[var(--majalis-line)] rounded-xl hover:border-[var(--majalis-emerald)] text-[var(--majalis-ink-soft)] transition-colors shadow-sm"
            >
              <QrCode size={14} strokeWidth={2} aria-hidden="true" /> QR Code
            </button>

            <a
              href={getCitationImageUrl(slug)}
              download={`citation-${slug}.svg`}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[var(--majalis-panel)] border border-[var(--majalis-line)] rounded-xl hover:border-[var(--majalis-emerald)] text-[var(--majalis-ink-soft)] transition-colors shadow-sm"
            >
              <Download size={14} strokeWidth={2} aria-hidden="true" /> تحميل بطاقة
            </a>

            {user && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saved}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl border transition-colors shadow-sm ${
                  saved
                    ? "bg-[var(--majalis-emerald-muted)] border-[var(--majalis-emerald)] text-[var(--majalis-emerald)]"
                    : "bg-[var(--majalis-panel)] border-[var(--majalis-line)] text-[var(--majalis-ink-soft)] hover:border-[var(--majalis-emerald)]"
                }`}
              >
                <Star size={14} strokeWidth={2} aria-hidden="true" /> {saved ? "محفوظ" : "احفظ في مكتبتي"}
              </button>
            )}
          </div>

          {/* QR Code */}
          {showQr && (
            <div className="flex justify-center">
              <div className="bg-[var(--majalis-panel)] p-4 rounded-2xl shadow border border-[var(--majalis-line)] text-center space-y-2">
                <img
                  src={getQrCodeUrl(slug)}
                  alt="QR Code للاقتباس"
                  className="w-48 h-48 mx-auto"
                />
                <p className="text-xs text-[var(--majalis-ink-soft)] opacity-60">{getShareUrl(slug)}</p>
              </div>
            </div>
          )}

          {/* رابط السياق الكامل */}
          {src && (
            <div className="text-center">
              <Link
                href={sourceHref}
                className="text-sm text-[var(--majalis-emerald)] hover:underline"
              >
                شاهد السياق الكامل ←
              </Link>
            </div>
          )}

          {/* تذييل */}
          <p className="text-center text-xs text-[var(--majalis-ink-soft)] opacity-60 pb-4">
            تم إنشاء هذا الاقتباس عبر{" "}
            <Link href="/" className="text-[var(--majalis-emerald)] hover:underline">
              منصة مجالس
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
