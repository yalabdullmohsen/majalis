/**
 * صفحة /more — أبواب مميزة ثم أقسام أصغر ثم الحساب/الإعدادات.
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
      aria-label={section.title}
    >
      <Icon size={size === "lg" ? 28 : 22} aria-hidden="true" />
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
      description: "أبواب العلم والخدمة: سين جيم، القصص، التفسير، السيرة، المكتبة والمزيد.",
      path: "/more",
    });
  }, []);

  return (
    <ContentHubLayout title="المزيد" subtitle="أبواب العلم والخدمة">
      <section className="more-page-section" aria-labelledby="more-featured-heading">
        <h2 id="more-featured-heading" className="more-page-section__title sr-only">
          الأبواب الرئيسية
        </h2>
        <ul className="more-page-grid more-page-grid--featured">
          {MORE_FEATURED_SECTIONS.map((s) => (
            <li key={s.id}>
              <MoreTile section={s} size="lg" />
            </li>
          ))}
        </ul>
      </section>

      <section className="more-page-section" aria-labelledby="more-standard-heading">
        <h2 id="more-standard-heading" className="more-page-section__title">
          أقسام أخرى
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
          الحساب والإعدادات
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
