/**
 * قوالب قراءة موحّدة للتفاصيل الداخلية — أغلفة رفيعة فوق ReadingSectionCard
 * دون تغيير النص الشرعي؛ تنظيم وهوية فقط.
 */
import { type ReactNode } from "react";
import {
  ReadingSectionCard,
  ReadingProse,
  ReadingBulletList,
  type ReadingSectionVariant,
} from "@/components/content/ReadingSectionCard";
import {
  CompactSources,
  summarizeSourceLine,
  type CompactSourceItem,
} from "@/components/content/CompactSources";
import { SectionEntryCard } from "@/components/ui/HubCard";
import "@/styles/components/reading-section-card.css";
import "@/styles/components/content-reading-shell.css";

export type { ReadingSectionVariant };

export type ContentSectionProps = {
  title: string;
  children?: ReactNode;
  paragraphs?: string[];
  variant?: ReadingSectionVariant;
  className?: string;
  id?: string;
};

/** قسم قراءة عام داخل بطاقة ناعمة */
export function ContentSection({
  title,
  children,
  paragraphs,
  variant = "default",
  className = "",
  id,
}: ContentSectionProps) {
  return (
    <ReadingSectionCard
      title={title}
      variant={variant}
      className={`content-section${id ? ` content-section--${id}` : ""}${className ? ` ${className}` : ""}`}
    >
      {paragraphs?.map((p) => (
        <ReadingProse key={p.slice(0, 48)} text={p} />
      ))}
      {children}
    </ReadingSectionCard>
  );
}

export function DefinitionBox(props: Omit<ContentSectionProps, "variant">) {
  return <ContentSection {...props} variant="definition" />;
}

export function EvidenceBox(props: Omit<ContentSectionProps, "variant">) {
  return <ContentSection {...props} variant="evidence" />;
}

export function QuotePanel(props: Omit<ContentSectionProps, "variant">) {
  return <ContentSection {...props} variant="quote" />;
}

export function FAQBox({
  title = "أسئلة مختصرة",
  items,
  className = "",
}: {
  title?: string;
  items: { q: string; a: ReactNode }[];
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <ReadingSectionCard title={title} variant="faq" className={className}>
      <ul className="cr-faq">
        {items.map((item) => (
          <li key={item.q} className="cr-faq__item">
            <h3 className="cr-faq__q">{item.q}</h3>
            <div className="cr-faq__a">{item.a}</div>
          </li>
        ))}
      </ul>
    </ReadingSectionCard>
  );
}

export function SourceBox({
  title = "المصادر",
  sources,
  className = "",
}: {
  title?: string;
  sources: string[] | CompactSourceItem[];
  className?: string;
}) {
  const items: CompactSourceItem[] = (sources || [])
    .map((s) => (typeof s === "string" ? summarizeSourceLine(s) : s))
    .filter((s) => s.summary.trim());
  if (!items.length) return null;
  return (
    <ReadingSectionCard title={title} variant="sources" className={`source-box ${className}`.trim()}>
      <CompactSources title="" items={items} className="compact-sources--in-rsc" />
    </ReadingSectionCard>
  );
}

export function RelatedLinksBox({
  title = "روابط ذات صلة",
  links,
  className = "",
}: {
  title?: string;
  links: { href: string; title: string; description?: string }[];
  className?: string;
}) {
  if (!links.length) return null;
  return (
    <ReadingSectionCard title={title} variant="related" className={className}>
      <div className="cr-related-grid hub-card-grid">
        {links.map((l) => (
          <SectionEntryCard
            key={l.href}
            href={l.href}
            title={l.title}
            description={l.description}
            variant="compact"
            className="cr-related-link internal-link-card ss-internal-link-card"
          />
        ))}
      </div>
    </ReadingSectionCard>
  );
}

/** غلاف صفحة تفاصيل: ملاحظة تمهيد + أقسام + مصادر مجمّعة اختيارية */
export function ContentDetailReadingShell({
  note,
  children,
  className = "",
}: {
  note?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`cr-shell rsc-stack${className ? ` ${className}` : ""}`} dir="rtl" data-content-reading="1">
      {note ? (
        <aside className="cr-note soft-card soft-card--on-light" role="note">
          {note}
        </aside>
      ) : null}
      {children}
    </div>
  );
}

export {
  ReadingSectionCard,
  ReadingProse,
  ReadingBulletList,
  CompactSources,
  summarizeSourceLine,
};
