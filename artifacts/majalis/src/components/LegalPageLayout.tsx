import type { ReactNode } from "react";
import { Link } from "wouter";
import { C } from "@/lib/theme";

type Props = {
  eyebrow: string;
  title: string;
  children: ReactNode;
};

export function LegalPageLayout({ eyebrow, title, children }: Props) {
  return (
    <div className="legal-page">
      <div className="legal-page-hero" style={{ background: C.emeraldDeep, color: C.parchment }}>
        <div className="legal-page-inner">
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
      <Link href="/">← العودة للرئيسية</Link>
    </p>
  );
}
