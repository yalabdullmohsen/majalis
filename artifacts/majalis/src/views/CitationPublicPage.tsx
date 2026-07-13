import { useEffect, useRef, useState } from "react";
import { Download, Link2, QrCode, Star } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Link, useRoute } from "wouter";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import {
  type Citation,
  CONTENT_TYPE_LABEL,
  citTypeClass,
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

  const slug = params?.slug || "";

  useEffect(() => {
    applyPageSeo({
      path: `/c/${slug}`,
      title: "مقتطف علمي مشترك | المجلس العلمي",
      description: "مقتطف علمي من المجلس العلمي، استشهادات أكاديمية بأسلوب مفهرس وجاهز للمشاركة والنشر.",
      keywords: ["مقتطف علمي", "استشهاد أكاديمي", "نص إسلامي", "مشاركة علمية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          name: "مقتطف علمي",
          url: `https://majlisilm.com/c/${slug}`,
          description: "مقتطف علمي إسلامي جاهز للمشاركة والاستشهاد الأكاديمي",
          publisher: { "@type": "Organization", name: "المجلس العلمي", url: "https://majlisilm.com" },
          inLanguage: "ar",
        },
      ],
    });
  }, [slug]);
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
      <div className="cpp-loading">
        <Spinner className="cpp-loading__spinner" aria-label="جارٍ التحميل" />
      </div>
    );
  }

  if (error || !citation) {
    return (
      <div className="cpp-error">
        <p className="cpp-error__text">{error || "الاقتباس غير موجود"}</p>
        <Link href="/" className="cpp-error__link">العودة للرئيسية</Link>
      </div>
    );
  }

  const src = citation.source;
  const typeMod = src ? citTypeClass(src.content_type) : "cit-type--fatwa";
  const typeLabel = src ? CONTENT_TYPE_LABEL[src.content_type] || "" : "";
  const sourceHref = src?.source_url || (src?.reference_id ? `/${src.content_type.replace("_", "-")}/${src.reference_id}` : "/");

  useEffect(() => {
    if (!citation || !src) return;
    document.title = `"${citation.quoted_text.slice(0, 60)}..."، المجلس العلمي`;
    const meta = (n: string) => document.querySelector(`meta[name="${n}"],meta[property="${n}"]`) as HTMLMetaElement | null;
    if (meta("description")) meta("description")!.content = citation.quoted_text;
    if (meta("og:title")) meta("og:title")!.content = `اقتباس: ${src.title_ar}`;
    if (meta("og:description")) meta("og:description")!.content = citation.quoted_text;
    if (meta("og:image")) meta("og:image")!.content = getCitationImageUrl(slug);
  }, [citation, src, slug]);

  return (
    <div className="cpp-root">
      {/* شريط التنقل */}
      <nav aria-label="تنقل الصفحة" className="cpp-nav">
        <Link href="/" className="cpp-nav__brand">المجلس العلمي</Link>
        <span className="cpp-nav__tagline">تطبيق العلم الشرعي</span>
      </nav>

      {/* المحتوى الرئيسي */}
      <main className="cpp-main">
        <div className="cpp-content">

          {/* بطاقة الاقتباس */}
          <div className={`cpp-card ${typeMod}`}>
            <div className="h-1.5 cit-type-bar" />
            <div className="cpp-card__body">

              {src && (
                <div className="cpp-type-header">
                  <span className="px-2 py-0.5 rounded text-xs text-white font-medium cit-type-badge">
                    {typeLabel}
                  </span>
                  <span className="cpp-source-title">{src.title_ar}</span>
                </div>
              )}

              <blockquote className="cpp-blockquote">
                <p ref={contentRef} className="cpp-quote-text">
                  {citation.quoted_text}
                </p>
              </blockquote>

              {src && (
                <div className="cpp-source-meta">
                  {src.author_name && <p>الكاتب/الشيخ: <span className="font-medium">{src.author_name}</span></p>}
                  {src.book_name && (
                    <p>
                      المصدر: <span className="font-medium">{src.book_name}</span>
                      {src.volume && `، ج${src.volume}`}
                      {src.page_number && `، ص${src.page_number}`}
                    </p>
                  )}
                  {src.publish_year && <p>السنة: {src.publish_year}</p>}
                </div>
              )}
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="cpp-actions">
            <button type="button" onClick={copyLink} className="cpp-action-btn">
              <Link2 size={14} strokeWidth={2} aria-hidden="true" />
              {copied ? "تم النسخ ✓" : "نسخ الرابط"}
            </button>

            <button type="button" onClick={() => setShowQr(!showQr)} className="cpp-action-btn">
              <QrCode size={14} strokeWidth={2} aria-hidden="true" /> QR Code
            </button>

            <a
              href={getCitationImageUrl(slug)}
              download={`citation-${slug}.svg`}
              className="cpp-action-btn"
            >
              <Download size={14} strokeWidth={2} aria-hidden="true" /> تحميل بطاقة
            </a>

            {user && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saved}
                className={`cpp-action-btn${saved ? " cpp-action-btn--saved" : ""}`}
              >
                <Star size={14} strokeWidth={2} aria-hidden="true" />
                {saved ? "محفوظ" : "احفظ في مكتبتي"}
              </button>
            )}
          </div>

          {/* QR Code */}
          {showQr && (
            <div className="cpp-qr-wrap">
              <div className="cpp-qr-box">
                <img src={getQrCodeUrl(slug)} alt="QR Code للاقتباس" className="cpp-qr-img" loading="lazy" decoding="async" />
                <p className="cpp-qr-url">{getShareUrl(slug)}</p>
              </div>
            </div>
          )}

          {/* رابط السياق الكامل */}
          {src && (
            <div className="cpp-context">
              <Link href={sourceHref} className="cpp-link">
                شاهد السياق الكامل ←
              </Link>
            </div>
          )}

          {/* تذييل */}
          <p className="cpp-footer">
            تم إنشاء هذا الاقتباس عبر{" "}
            <Link href="/" className="cpp-link">المجلس العلمي</Link>
          </p>
          <div className="twh-share">
            <ShareButtons title="اقتباس من المجلس العلمي" url={typeof window !== "undefined" ? window.location.href : "https://majlisilm.com"} />
          </div>
          <div className="px-4 pb-6 mt-4">
            <SectionQuiz categoryId={["hadith", "quran"]} title="اختبر معلوماتك في القرآن والحديث" count={4} />
          </div>
        </div>
      </main>
    </div>
  );
}
