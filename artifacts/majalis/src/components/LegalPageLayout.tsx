import type { ReactNode } from "react";
import { C } from "@/lib/theme";

type Props = {
  eyebrow: string;
  title: string;
  children: ReactNode;
};

function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = "/";
  }
}

export function LegalPageLayout({ eyebrow, title, children }: Props) {
  return (
    <div className="legal-page">
      <div className="legal-page-hero" style={{ background: C.emeraldDeep, color: C.parchment }}>
        <div className="legal-page-inner">
          <button type="button" className="legal-back-btn" onClick={goBack} aria-label="رجوع">
            ← رجوع
          </button>
          <p className="legal-page-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="legal-page-body legal-page-inner">{children}</div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="legal-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function LegalBackLink() {
  return (
    <p className="legal-back">
      <button type="button" className="legal-back-btn" onClick={goBack}>
        ← رجوع
      </button>
    </p>
  );
}
