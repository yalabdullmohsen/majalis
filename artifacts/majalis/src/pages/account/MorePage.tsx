/**
 * صفحة /more — مركز الأقسام الثانوية حسب مجموعات IA.
 */
import { useEffect } from "react";
import { Link } from "wouter";
import {
  MORE_ACCOUNT_SECTIONS,
  MORE_SECTION_GROUPS,
  MORE_STANDARD_SECTIONS,
  moreSectionsInGroup,
  type MoreSection,
  type MoreSectionGroupId,
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

function GroupSection({
  groupId,
  title,
  size,
}: {
  groupId: MoreSectionGroupId;
  title: string;
  size: "lg" | "sm";
}) {
  const items = moreSectionsInGroup(groupId);
  if (items.length === 0) return null;
  return (
    <section className="more-page-section" aria-labelledby={`more-${groupId}-heading`}>
      <h2 id={`more-${groupId}-heading`} className="more-page-section__title">
        {title}
      </h2>
      <ul className={`more-page-grid more-page-grid--${size === "lg" ? "featured" : "standard"}`}>
        {items.map((s) => (
          <li key={s.id}>
            <MoreTile section={s} size={size} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function MorePage() {
  useEffect(() => {
    applyPageSeo({
      title: "المزيد — المجلس العلمي",
      description:
        "المزيد: مكتبة، أعلام، حديث، قصص الأنبياء، سين جيم، فوائد وبطاقات، أذكار، بحث وإعدادات.",
      path: "/more",
    });
  }, []);

  return (
    <ContentHubLayout title="المزيد" subtitle="مركز الأقسام الثانوية">
      {MORE_SECTION_GROUPS.map((g) => (
        <GroupSection
          key={g.id}
          groupId={g.id}
          title={g.title}
          size={g.id === "science" || g.id === "learn" ? "lg" : "sm"}
        />
      ))}

      <section className="more-page-section" aria-labelledby="more-tools-heading">
        <h2 id="more-tools-heading" className="more-page-section__title">
          أدوات مساعدة للبحث
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
