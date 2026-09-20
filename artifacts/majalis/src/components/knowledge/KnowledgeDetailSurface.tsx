import type { ReactNode } from "react";
import {
  ReadingBulletList,
  ReadingProse,
  ReadingSectionCard,
} from "@/components/content/ReadingSectionCard";
import {
  hasKnowledgeDetailContent,
  type KnowledgeDetailSection,
} from "@/lib/knowledge-detail";
import "@/styles/components/knowledge-summary-card.css";

export type KnowledgeDetailSurfaceSection = KnowledgeDetailSection & {
  children?: ReactNode;
};

type KnowledgeDetailSurfaceProps = {
  sections: KnowledgeDetailSurfaceSection[];
  className?: string;
};

/**
 * سطح تفاصيل واحد — أقسام قراءة بلا Card داخل Card وبلا توسعة قائمة.
 */
export function KnowledgeDetailSurface({
  sections,
  className = "",
}: KnowledgeDetailSurfaceProps) {
  const visible = sections.filter(hasKnowledgeDetailContent);
  if (visible.length === 0) return null;

  return (
    <div
      className={`kx-detail-surface${className ? ` ${className}` : ""}`}
      data-content-type="directory-detail"
    >
      {visible.map((section) => {
        const variant =
          section.variant === "quote"
            ? "quote"
            : section.variant === "related"
              ? "related"
              : section.variant === "overview"
                ? "summary"
                : "default";
        return (
          <ReadingSectionCard
            key={section.id}
            title={section.title}
            variant={variant}
            className="kx-detail-surface__section"
          >
            {section.prose ? <ReadingProse text={section.prose} /> : null}
            {section.fields && section.fields.length > 0 ? (
              <dl className="kx-detail-meta">
                {section.fields.map((field) => {
                  if (field.value == null || String(field.value).trim() === "") {
                    return null;
                  }
                  return (
                    <div key={field.label} className="kx-detail-meta__row">
                      <dt>{field.label}</dt>
                      <dd>{field.value as ReactNode}</dd>
                    </div>
                  );
                })}
              </dl>
            ) : null}
            {section.items && section.items.length > 0 ? (
              <ReadingBulletList items={section.items} />
            ) : null}
            {section.quote ? (
              <blockquote className="kx-detail-quote">{section.quote}</blockquote>
            ) : null}
            {section.children}
          </ReadingSectionCard>
        );
      })}
    </div>
  );
}
