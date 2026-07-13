import { useEffect } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import {
  getTopicBySlug,
  getRelatedTopics,
  RIGHTS_CATEGORY_LABELS,
  SIN_SEVERITY_LABELS,
  SIN_TYPE_LABELS,
} from "@/lib/sins-rights-data";
import type { SinType } from "@/lib/sins-rights-types";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { Empty } from "@/components/ui-common";

export default function SinsAndRightsDetailPage({ params }: { params: { slug: string } }) {
  const topic = getTopicBySlug(params.slug);
  const related = topic ? getRelatedTopics(params.slug) : [];

  useEffect(() => {
    if (!topic) return;
    const path = `/sins-and-rights/${topic.slug}`;
    applyPageSeo({
      path,
      title: `${topic.title} | الذنوب والحقوق — المجلس العلمي`,
      description: topic.shortDescription,
      keywords: [topic.title, "التوبة", "الذنوب والحقوق", "المجلس العلمي", RIGHTS_CATEGORY_LABELS[topic.rightsCategory]],
      ogType: "article",
      canonicalPath: path,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: topic.title,
          description: topic.shortDescription,
          inLanguage: "ar",
          publisher: { "@type": "Organization", name: "المجلس العلمي", url: "https://majlisilm.com" },
        },
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "الذنوب والحقوق", path: "/sins-and-rights" },
          { name: topic.title, path },
        ]),
      ],
    });
  }, [topic]);

  if (!topic) {
    return (
      <div className="snr-detail-page">
        <Empty text="الموضوع غير موجود." />
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link href="/sins-and-rights" style={{ color: "var(--elite-green, #18362A)", fontWeight: 600 }}>
            ← العودة إلى الذنوب والحقوق
          </Link>
        </div>
      </div>
    );
  }

  const sinTypes = Array.isArray(topic.sinType) ? topic.sinType : [topic.sinType];

  return (
    <div className="snr-detail-page">
      {/* Breadcrumb */}
      <nav className="snr-detail-breadcrumb" aria-label="مسار التنقل">
        <Link href="/">الرئيسية</Link>
        <span className="snr-detail-breadcrumb-sep">›</span>
        <Link href="/sins-and-rights">الذنوب والحقوق</Link>
        <span className="snr-detail-breadcrumb-sep">›</span>
        <span>{topic.title}</span>
      </nav>

      {/* Header */}
      <header className="snr-detail-header">
        <h1 className="snr-detail-title">{topic.title}</h1>
        <p className="snr-detail-short-desc">{topic.shortDescription}</p>

        <div className="snr-detail-badges">
          <span className={`snr-badge snr-badge--${topic.rightsCategory}`}>
            {RIGHTS_CATEGORY_LABELS[topic.rightsCategory]}
          </span>
          {(() => {
            const sev = topic.sinSeverity;
            const cls = sev === "kabira" ? "kabira" : sev === "saghira" ? "saghira" : "depends";
            return <span className={`snr-badge snr-badge--${cls}`}>{SIN_SEVERITY_LABELS[sev]}</span>;
          })()}
          {sinTypes.map((t) => (
            <span key={t} className="snr-badge snr-badge--shared" style={{ fontSize: "0.72rem" }}>
              {SIN_TYPE_LABELS[t as SinType]}
            </span>
          ))}
          {topic.repentanceConditions.requiresRestitution && (
            <span className="snr-badge snr-badge--restitution">يستلزم رد حق</span>
          )}
          {topic.repentanceConditions.hasExpiation && (
            <span className="snr-badge snr-badge--expiation">توجد كفارة</span>
          )}
        </div>

        <div className="snr-detail-review-status">
          {topic.reviewStatus === "reviewed" ? (
            <>
              <span className="snr-badge snr-badge--reviewed">✓ مراجع</span>
              {topic.reviewedAt && <span style={{ marginRight: "0.25rem" }}>— آخر مراجعة: {topic.reviewedAt}</span>}
            </>
          ) : (
            <span className="snr-badge snr-badge--pending">⏳ قيد المراجعة الشرعية</span>
          )}
        </div>
      </header>

      {/* الشرح */}
      <section className="snr-detail-section">
        <div className="snr-detail-section-title">
          <span>📘</span> الشرح
        </div>
        <p style={{ fontSize: "0.95rem", color: "var(--elite-ink, #122019)", lineHeight: 1.75 }}>
          {topic.explanation}
        </p>
      </section>

      {/* الدليل من القرآن */}
      {topic.quranEvidence.length > 0 && (
        <section className="snr-detail-section">
          <div className="snr-detail-section-title">
            <span>📖</span> الدليل من القرآن الكريم
          </div>
          {topic.quranEvidence.map((ev, i) => (
            <div key={i} className="snr-evidence-item">
              <div className="snr-evidence-text">﴿{ev.text}﴾</div>
              <div className="snr-evidence-source">
                <span>{ev.source}</span>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* الدليل من السنة */}
      {topic.hadithEvidence.length > 0 && (
        <section className="snr-detail-section">
          <div className="snr-detail-section-title">
            <span>📜</span> الدليل من السنة النبوية
          </div>
          {topic.hadithEvidence.map((ev, i) => (
            <div key={i} className="snr-evidence-item">
              <div className="snr-evidence-text">«{ev.text}»</div>
              <div className="snr-evidence-source">
                <span>{ev.source}</span>
                {ev.grade && <span className="snr-evidence-grade">{ev.grade}</span>}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* آثار الذنب */}
      {topic.effects.length > 0 && (
        <section className="snr-detail-section">
          <div className="snr-detail-section-title">
            <span>⚠️</span> آثار الذنب
          </div>
          <ul className="snr-list">
            {topic.effects.map((e, i) => (
              <li key={i}>
                <span className="snr-list-bullet">•</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* شروط التوبة */}
      <section className="snr-detail-section">
        <div className="snr-detail-section-title">
          <span>🔄</span> شروط التوبة
        </div>
        <div className="snr-repentance-box">
          {topic.repentanceConditions.general.map((cond, i) => (
            <div key={i} className="snr-repentance-condition">
              <div className="snr-repentance-num">{i + 1}</div>
              <div className="snr-repentance-text">{cond}</div>
            </div>
          ))}
        </div>

        {topic.repentanceConditions.requiresRestitution && (
          <div className="snr-restitution-alert">
            <span className="snr-restitution-alert-icon">⚠️</span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>يستلزم رد حق</div>
              <div className="snr-restitution-alert-text">
                {topic.repentanceConditions.restitutionDetails}
              </div>
              {topic.repentanceConditions.ifOwnerUnreachable && (
                <div style={{ marginTop: "0.5rem", fontStyle: "italic", fontSize: "0.85rem" }}>
                  💡 عند تعذر الوصول: {topic.repentanceConditions.ifOwnerUnreachable}
                </div>
              )}
            </div>
          </div>
        )}

        {topic.repentanceConditions.requiresForgiveness && topic.repentanceConditions.forgivenessDetails && (
          <div className="snr-guide-note" style={{ marginTop: "0.75rem" }}>
            🤝 <strong>بشأن طلب المسامحة:</strong> {topic.repentanceConditions.forgivenessDetails}
          </div>
        )}

        {topic.repentanceConditions.hasExpiation && topic.repentanceConditions.expiationDetails && (
          <div style={{ background: "rgba(26,74,122,0.06)", borderRadius: "var(--elite-r-sm, 8px)", padding: "0.75rem 1rem", marginTop: "0.75rem", fontSize: "0.875rem", color: "#1a4a7a" }}>
            📋 <strong>الكفارة:</strong> {topic.repentanceConditions.expiationDetails}
          </div>
        )}
      </section>

      {/* الأخطاء الشائعة */}
      {topic.commonMistakes.length > 0 && (
        <section className="snr-detail-section">
          <div className="snr-detail-section-title">
            <span>❌</span> أخطاء شائعة في فهم التوبة
          </div>
          <ul className="snr-list">
            {topic.commonMistakes.map((m, i) => (
              <li key={i}>
                <span className="snr-list-bullet">•</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* المصادر */}
      {topic.references.length > 0 && (
        <section className="snr-detail-section">
          <div className="snr-detail-section-title">
            <span>📚</span> المصادر والمراجع
          </div>
          <ul className="snr-list">
            {topic.references.map((ref, i) => (
              <li key={i}>
                <span className="snr-list-bullet">•</span>
                <span>{ref}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* الموضوعات ذات الصلة */}
      {related.length > 0 && (
        <section className="snr-detail-section">
          <div className="snr-detail-section-title">
            <span>🔗</span> موضوعات ذات صلة
          </div>
          <div className="snr-related-grid">
            {related.map((r) => (
              <Link key={r.slug} href={`/sins-and-rights/${r.slug}`} className="snr-related-link">
                <span className="snr-related-link-label">{r.title}</span>
                <span className="snr-mindmap-child-arrow">←</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* العودة */}
      <div style={{ textAlign: "center", paddingTop: "1rem" }}>
        <Link
          href="/sins-and-rights"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            color: "var(--elite-green, #18362A)",
            fontWeight: 600,
            fontSize: "0.9375rem",
            textDecoration: "none",
          }}
        >
          ← العودة إلى الذنوب والحقوق
        </Link>
      </div>
    </div>
  );
}
