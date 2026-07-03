import { useEffect, useRef, useState } from "react";
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

export default function CitationPublicPage() {
  const [, params] = useRoute("/c/:slug");
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
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-amber-50 dark:bg-gray-900">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !citation) {
    return (
      <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center gap-6 bg-amber-50 dark:bg-gray-900 p-6">
        <p className="text-gray-600 dark:text-gray-400 text-lg">{error || "الاقتباس غير موجود"}</p>
        <Link href="/" className="text-emerald-700 dark:text-emerald-400 hover:underline">
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
    <div dir="rtl" className="min-h-screen bg-amber-50 dark:bg-gray-900 flex flex-col">
      {/* شريط التنقل */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-lg">
          مجالس
        </Link>
        <span className="text-xs text-gray-400">تطبيق العلم الشرعي</span>
      </nav>

      {/* بطاقة الاقتباس الرئيسية */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl space-y-6">

          {/* بطاقة الاقتباس */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-amber-100 dark:border-gray-700">
            {/* شريط ملوَّن */}
            <div className="h-1.5" style={{ background: typeColor }} />

            <div className="p-6 space-y-4">
              {/* نوع المحتوى والعنوان */}
              {src && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="px-2 py-0.5 rounded text-xs text-white font-medium"
                    style={{ background: typeColor }}
                  >
                    {typeLabel}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {src.title_ar}
                  </span>
                </div>
              )}

              {/* النص المقتبس */}
              <blockquote className="border-r-4 border-emerald-600 pr-4">
                <p
                  ref={contentRef}
                  className="text-gray-900 dark:text-gray-100 text-lg leading-relaxed font-arabic"
                >
                  {citation.quoted_text}
                </p>
              </blockquote>

              {/* بيانات المصدر */}
              {src && (
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-0.5">
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
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:border-emerald-500 text-gray-700 dark:text-gray-200 transition-colors shadow-sm"
            >
              🔗 {copied ? "تم النسخ ✓" : "نسخ الرابط"}
            </button>

            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:border-emerald-500 text-gray-700 dark:text-gray-200 transition-colors shadow-sm"
            >
              📱 QR Code
            </button>

            <a
              href={getCitationImageUrl(slug)}
              download={`citation-${slug}.svg`}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:border-emerald-500 text-gray-700 dark:text-gray-200 transition-colors shadow-sm"
            >
              🖼️ تحميل بطاقة
            </a>

            {user && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saved}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl border transition-colors shadow-sm ${
                  saved
                    ? "bg-amber-50 dark:bg-amber-900/30 border-amber-400 text-amber-700 dark:text-amber-400"
                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-amber-400"
                }`}
              >
                {saved ? "⭐ محفوظ" : "⭐ احفظ في مكتبتي"}
              </button>
            )}
          </div>

          {/* QR Code */}
          {showQr && (
            <div className="flex justify-center">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow border border-gray-200 dark:border-gray-700 text-center space-y-2">
                <img
                  src={getQrCodeUrl(slug)}
                  alt="QR Code للاقتباس"
                  className="w-48 h-48 mx-auto"
                />
                <p className="text-xs text-gray-400">{getShareUrl(slug)}</p>
              </div>
            </div>
          )}

          {/* رابط السياق الكامل */}
          {src && (
            <div className="text-center">
              <Link
                href={sourceHref}
                className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                شاهد السياق الكامل ←
              </Link>
            </div>
          )}

          {/* تذييل */}
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 pb-4">
            تم إنشاء هذا الاقتباس عبر{" "}
            <Link href="/" className="text-emerald-700 dark:text-emerald-400 hover:underline">
              منصة مجالس
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
