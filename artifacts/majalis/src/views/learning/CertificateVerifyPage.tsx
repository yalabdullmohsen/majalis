import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { verifyLearningCertificate } from "@/lib/digital-learning-service";

type CertResult = {
  valid: boolean;
  message?: string;
  certificate?: {
    title?: string;
    holder?: string;
    issued_at?: string;
    path?: string;
    level?: string;
  };
};

export default function CertificateVerifyPage() {
  const params = useParams();
  const [code, setCode] = useState(params.code || "");
  const [inputCode, setInputCode] = useState(params.code || "");
  const [result, setResult] = useState<CertResult | null>(null);
  const [loading, setLoading] = useState(Boolean(params.code));

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setResult(null);
    verifyLearningCertificate(code)
      .then((r) => setResult(r as CertResult))
      .finally(() => setLoading(false));
  }, [code]);

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputCode.trim();
    if (trimmed) setCode(trimmed);
  }

  return (
    <div className="page-shell narrow cvp-shell">
      <div className="cvp-hero">
        <div className="cvp-hero-icon">🎓</div>
        <h1 className="cvp-title">التحقق من الشهادة</h1>
        <p className="cvp-subtitle">
          أدخل رمز الشهادة للتحقق من صحتها وصلاحيتها
        </p>
      </div>

      {/* Input form */}
      <form className="cvp-form" onSubmit={handleVerify}>
        <div className="cvp-input-wrap">
          <input
            className="cvp-input"
            type="text"
            placeholder="أدخل رمز الشهادة…"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            dir="ltr"
            aria-label="رمز الشهادة"
          />
          <button type="submit" className="cvp-submit-btn">
            تحقق
          </button>
        </div>
        <p className="cvp-input-hint">الرمز مكوّن من حروف وأرقام، مثال: ABC-12345</p>
      </form>

      {/* Result area */}
      {loading && (
        <div className="cvp-loading">
          <span className="cvp-loading-dot" />
          <span className="cvp-loading-dot" />
          <span className="cvp-loading-dot" />
          <p>جاري التحقق…</p>
        </div>
      )}

      {!loading && result?.valid && (
        <div className="cvp-result cvp-result--valid">
          <div className="cvp-result-badge">✓</div>
          <h2 className="cvp-result-title">شهادة صالحة</h2>
          {result.certificate?.title && (
            <p className="cvp-cert-name">{result.certificate.title}</p>
          )}
          <div className="cvp-cert-details">
            {result.certificate?.holder && (
              <div className="cvp-cert-row">
                <span className="cvp-cert-label">المستفيد</span>
                <span className="cvp-cert-value">{result.certificate.holder}</span>
              </div>
            )}
            {result.certificate?.path && (
              <div className="cvp-cert-row">
                <span className="cvp-cert-label">المسار العلمي</span>
                <span className="cvp-cert-value">{result.certificate.path}</span>
              </div>
            )}
            {result.certificate?.level && (
              <div className="cvp-cert-row">
                <span className="cvp-cert-label">المستوى</span>
                <span className="cvp-cert-value">{result.certificate.level}</span>
              </div>
            )}
            {result.certificate?.issued_at && (
              <div className="cvp-cert-row">
                <span className="cvp-cert-label">تاريخ الإصدار</span>
                <span className="cvp-cert-value">
                  {new Date(result.certificate.issued_at).toLocaleDateString("ar-KW", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </span>
              </div>
            )}
            <div className="cvp-cert-row">
              <span className="cvp-cert-label">رمز الشهادة</span>
              <span className="cvp-cert-value cvp-cert-code">{code}</span>
            </div>
          </div>
          <p className="cvp-cert-note">
            هذه الشهادة صادرة عن المجلس العلمي وهي موثّقة رقمياً.
          </p>
        </div>
      )}

      {!loading && result && !result.valid && (
        <div className="cvp-result cvp-result--invalid">
          <div className="cvp-result-badge cvp-result-badge--invalid">✗</div>
          <h2 className="cvp-result-title cvp-result-title--invalid">شهادة غير صالحة</h2>
          <p className="cvp-result-msg">
            {result.message || "لم يتم العثور على شهادة بهذا الرمز. تأكد من صحة الرمز وأعد المحاولة."}
          </p>
        </div>
      )}

      {/* How to get a certificate */}
      <section className="cvp-info-section">
        <h2 className="cvp-info-title">كيف تحصل على شهادة؟</h2>
        <div className="cvp-steps">
          <div className="cvp-step">
            <span className="cvp-step-num">١</span>
            <div>
              <strong>اختر مساراً علمياً</strong>
              <p>ابدأ بأحد المسارات التعليمية المتاحة على المنصة</p>
            </div>
          </div>
          <div className="cvp-step">
            <span className="cvp-step-num">٢</span>
            <div>
              <strong>أكمل الدروس والاختبارات</strong>
              <p>تابع الدروس وأجب عن الاختبارات بنجاح</p>
            </div>
          </div>
          <div className="cvp-step">
            <span className="cvp-step-num">٣</span>
            <div>
              <strong>احصل على شهادتك</strong>
              <p>تصدر شهادتك الرقمية عند إتمام المسار بنجاح</p>
            </div>
          </div>
        </div>
      </section>

      <div className="cvp-links">
        <Link href="/learning-path" className="cvp-back-link">المسارات العلمية</Link>
        <Link href="/quiz" className="cvp-back-link">المسابقات التعليمية</Link>
        <Link href="/contact" className="cvp-back-link">تواصل معنا</Link>
      </div>
    </div>
  );
}
