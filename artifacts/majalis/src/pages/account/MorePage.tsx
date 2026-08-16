/**
 * صفحة /more — مركز الأقسام الثانوية (صفحة كاملة بدون زر يغطي البطاقات).
 */
import { useEffect } from "react";
import { Link } from "wouter";
import {
  MORE_ACCOUNT_SECTIONS,
  MORE_FEATURED_SECTIONS,
  MORE_STANDARD_SECTIONS,
  type MoreSection,
} from "@/features/more/moreSections";
import { applyPageSeo } from "@/lib/seo";
import { ContentHubLayout } from "@/components/layout/ContentHubLayout";
import "@/styles/components/more-bottom-sheet.css";
import "@/styles/pages/more-page.css";

function MoreTile({ section, size }: { section: MoreSection; size: "lg" | "sm" }) {
  const Icon = section.icon;
  return (
    <Link
      href={section.route}
      className={`more-page-tile more-page-tile--${size}`}
      aria-label={`${section.title}${section.subtitle ? ` — ${section.subtitle}` : ""}`}
    >
      <span className="more-page-tile__icon" aria-hidden="true">
        <Icon size={size === "lg" ? 26 : 20} />
      </span>
      <span className="more-page-tile__title">{section.title}</span>
      {section.subtitle ? (
        <span className="more-page-tile__sub">{section.subtitle}</span>
      ) : null}
    </Link>
  );
}

export default function MorePage() {
  useEffect(() => {
    applyPageSeo({
      title: "المزيد — المجلس العلمي",
      description:
        "المزيد: مكتبة، أعلام، حديث، قصص الأنبياء، أمم، سيرة، سين جيم، فوائد وبطاقات، بحث وإعدادات.",
      path: "/more",
    });
  }, []);

  return (
    <ContentHubLayout title="المزيد" subtitle="مركز الأقسام الثانوية" className="more-page">
      <section className="more-page-section" aria-labelledby="more-primary-heading">
        <h2 id="more-primary-heading" className="more-page-section__title">
          الأقسام الأساسية
        </h2>
        <ul className="more-page-grid more-page-grid--featured">
          {MORE_FEATURED_SECTIONS.map((s) => (
            <li key={s.id}>
              <MoreTile section={s} size="lg" />
            </li>
          ))}
        </ul>
      </section>

      <section className="more-page-section" aria-labelledby="more-secondary-heading">
        <h2 id="more-secondary-heading" className="more-page-section__title">
          أدوات مساعدة
        </h2>
        <ul className="more-page-grid more-page-grid--standard">
          {MORE_STANDARD_SECTIONS.map((s) => (
            <li key={s.id}>
              <MoreTile section={s} size="sm" />
            </li>
          ))}
        </ul>
      </section>

      <section className="more-page-section" aria-labelledby="more-account-heading">
        <h2 id="more-account-heading" className="more-page-section__title">
          الحساب
        </h2>
        <ul className="more-page-grid more-page-grid--account">
          {MORE_ACCOUNT_SECTIONS.map((s) => (
            <li key={s.id}>
              <MoreTile section={s} size="sm" />
            </li>
          ))}
        </ul>
      </section>
    </ContentHubLayout>
  );
}
