import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { MASARAT, type Masar } from "@/lib/masarat-data";

export default function MasaratPage() {
  return (
    <div className="page-shell" dir="rtl">
      <PageHeader
        eyebrow="مسارات التعلم"
        title="ابدأ من هنا"
        subtitle="اختر مسارًا يناسب هدفك، وسيرشدك خطوة بخطوة"
      />

      <div style={{ maxWidth: "52rem", margin: "0 auto", padding: "0 1rem 5rem" }}>
        <div className="masarat-grid">
          {MASARAT.map((masar) => (
            <MasarCard key={masar.id} masar={masar} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MasarCard({ masar }: { masar: Masar }) {
  return (
    <article
      className="masar-card"
      style={{ borderTop: `3px solid ${masar.color}` }}
    >
      {/* Header */}
      <div
        className="masar-card__header"
        style={{ background: `${masar.color}0c` }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.6rem" }}>
          <span style={{ fontSize: "2rem", lineHeight: 1 }} aria-hidden="true">{masar.icon}</span>
          <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
            <span style={{
              fontSize: "0.8rem",
              padding: "0.2rem 0.55rem",
              borderRadius: "1rem",
              fontWeight: 700,
              background: `${masar.color}22`,
              color: masar.color,
              border: `1px solid ${masar.color}40`,
            }}>
              {masar.level}
            </span>
            <span style={{
              fontSize: "0.8rem",
              padding: "0.2rem 0.55rem",
              borderRadius: "1rem",
              fontWeight: 600,
              background: "var(--mindmap-surface-alt, #f3ede0)",
              color: "var(--mindmap-ink-soft, #5a5040)",
              border: "1px solid var(--mindmap-line, #d6cdb8)",
            }}>
              {masar.duration}
            </span>
          </div>
        </div>
        <h2 style={{ margin: "0 0 0.3rem", fontSize: "1.05rem", fontWeight: 900, lineHeight: 1.35, color: masar.color }}>
          {masar.title}
        </h2>
        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--mindmap-ink-soft, #5a5040)", lineHeight: 1.55 }}>
          {masar.subtitle}
        </p>
      </div>

      {/* Steps */}
      <div className="masar-card__steps">
        <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {masar.steps.map((step, idx) => (
            <li key={step.id} className="masar-card__step">
              <span
                className="masar-card__step-num"
                style={{ background: masar.color }}
                aria-hidden="true"
              >
                {idx + 1}
              </span>
              {step.href ? (
                <Link
                  href={step.href}
                  style={{ fontSize: "0.82rem", color: "var(--mindmap-ink, #1c1810)", lineHeight: 1.55, textDecoration: "none" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = masar.color; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--mindmap-ink, #1c1810)"; }}
                >
                  {step.title}
                </Link>
              ) : (
                <span style={{ fontSize: "0.82rem", color: "var(--mindmap-ink-soft, #5a5040)", lineHeight: 1.55 }}>
                  {step.title}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* CTA */}
      <div className="masar-card__footer">
        <Link
          href={masar.steps[0]?.href ?? "#"}
          style={{
            display: "block",
            textAlign: "center",
            fontSize: "0.85rem",
            fontWeight: 800,
            padding: "0.65rem 1rem",
            borderRadius: "0.625rem",
            color: "#fff",
            background: masar.color,
            textDecoration: "none",
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.9"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
        >
          ابدأ المسار ←
        </Link>
      </div>
    </article>
  );
}
