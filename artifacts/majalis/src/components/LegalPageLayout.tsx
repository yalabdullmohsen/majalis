import type { ReactNode } from "react";
import { goBackOrFallback } from "@/lib/navigation-back";
import { PageShell } from "@/components/layout/PageShell";

type Props = {
  eyebrow: string;
  title: string;
  children: ReactNode;
  /** تاريخ آخر تحديث ظاهر للمستخدم (مثل سياسة الخصوصية) */
  updatedAt?: string;
};

function goBack() {
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  goBackOrFallback(currentPath);
}

export function LegalPageLayout({ eyebrow, title, children, updatedAt }: Props) {
  return (
    <PageShell
      as="article"
      variant="narrow"
      density="airy"
      className="legal-page"
      aria-labelledby="legal-page-title"
      intro={
        <header className="legal-page-hero">
          <div className="legal-page-inner">
            <button type="button" className="legal-back-btn" onClick={goBack} aria-label="رجوع إلى الصفحة السابقة">
              → رجوع
            </button>
            <p className="legal-page-eyebrow">{eyebrow}</p>
            <h1 id="legal-page-title">{title}</h1>
            {updatedAt ? (
              <p className="legal-page-updated">
                آخر تحديث: <time dateTime={updatedAt}>{updatedAt}</time>
              </p>
            ) : null}
          </div>
        </header>
      }
      content={<div className="legal-page-body legal-page-inner">{children}</div>}
    />
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
      <button type="button" className="legal-back-btn" onClick={goBack} aria-label="رجوع إلى الصفحة السابقة">
        → رجوع
      </button>
    </p>
  );
}
