import type { ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export type KnowledgeBlockKind =
  | "definition"
  | "outcomes"
  | "evidence"
  | "sources"
  | "notes"
  | "warning"
  | "faq"
  | "timeline"
  | "concepts"
  | "related"
  | "summary"
  | "ruling";

type BlockShellProps = {
  kind: KnowledgeBlockKind;
  label?: string;
  title?: string;
  className?: string;
  children: ReactNode;
  id?: string;
};

function BlockShell({ kind, label, title, className, children, id }: BlockShellProps) {
  return (
    <section
      id={id}
      className={cn("kx-block", `kx-block--${kind}`, className)}
      data-kx-block={kind}
    >
      {label ? <p className="kx-block__label">{label}</p> : null}
      {title ? <h2 className="kx-block__title">{title}</h2> : null}
      <div className="kx-block__body">{children}</div>
    </section>
  );
}

export function DefinitionBlock({
  title = "التعريف",
  children,
  className,
  id,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <BlockShell kind="definition" label="تعريف" title={title} className={className} id={id}>
      {children}
    </BlockShell>
  );
}

export function LearningOutcomesBlock({
  title = "ماذا ستتعلم",
  items,
  className,
  id,
}: {
  title?: string;
  items: string[];
  className?: string;
  id?: string;
}) {
  if (!items.length) return null;
  return (
    <BlockShell kind="outcomes" label="مخرجات" title={title} className={className} id={id}>
      <ol className="kx-outcomes">
        {items.map((item) => (
          <li key={item} className="kx-outcomes__item">
            {item}
          </li>
        ))}
      </ol>
    </BlockShell>
  );
}

export function EvidenceBlock({
  title = "الأدلة",
  children,
  className,
  id,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <BlockShell kind="evidence" label="دليل" title={title} className={className} id={id}>
      {children}
    </BlockShell>
  );
}

export function SourceReferencesBlock({
  title = "المصادر",
  items,
  className,
  id,
}: {
  title?: string;
  items: string[];
  className?: string;
  id?: string;
}) {
  if (!items.length) return null;
  return (
    <BlockShell kind="sources" label="مراجع" title={title} className={className} id={id}>
      <ul className="kx-sources">
        {items.map((item) => (
          <li key={item} className="kx-sources__item">
            {item}
          </li>
        ))}
      </ul>
    </BlockShell>
  );
}

export function KnowledgeNotesBlock({
  title = "ملاحظات",
  children,
  className,
  id,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <BlockShell kind="notes" label="ملاحظة" title={title} className={className} id={id}>
      {children}
    </BlockShell>
  );
}

export function WarningNoticeBlock({
  title = "تنبيه",
  children,
  className,
  id,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <BlockShell kind="warning" label="تنبيه مهم" title={title} className={className} id={id}>
      {children}
    </BlockShell>
  );
}

export function FaqSectionBlock({
  title = "أسئلة شائعة",
  items,
  className,
  id,
}: {
  title?: string;
  items: Array<{ q: string; a: string }>;
  className?: string;
  id?: string;
}) {
  if (!items.length) return null;
  return (
    <BlockShell kind="faq" label="أسئلة" title={title} className={className} id={id}>
      <div className="kx-faq">
        {items.map((item) => (
          <details key={item.q} className="kx-faq__item">
            <summary className="kx-faq__q">{item.q}</summary>
            <p className="kx-faq__a">{item.a}</p>
          </details>
        ))}
      </div>
    </BlockShell>
  );
}

export function TimelineBlock({
  title = "الخط الزمني",
  items,
  className,
  id,
}: {
  title?: string;
  items: Array<{ when: string; what: string }>;
  className?: string;
  id?: string;
}) {
  if (!items.length) return null;
  return (
    <BlockShell kind="timeline" label="تسلسل" title={title} className={className} id={id}>
      <ol className="kx-timeline">
        {items.map((item) => (
          <li key={`${item.when}-${item.what.slice(0, 24)}`} className="kx-timeline__item">
            <span className="kx-timeline__when">{item.when}</span>
            <p className="kx-timeline__what">{item.what}</p>
          </li>
        ))}
      </ol>
    </BlockShell>
  );
}

export function KeyConceptsBlock({
  title = "مفاهيم أساسية",
  items,
  className,
  id,
}: {
  title?: string;
  items: string[];
  className?: string;
  id?: string;
}) {
  if (!items.length) return null;
  return (
    <BlockShell kind="concepts" label="مفاهيم" title={title} className={className} id={id}>
      <ul className="kx-concepts">
        {items.map((item) => (
          <li key={item} className="kx-concepts__item">
            {item}
          </li>
        ))}
      </ul>
    </BlockShell>
  );
}

export function RelatedTopicsBlock({
  title = "مواضيع ذات صلة",
  items,
  className,
  id,
}: {
  title?: string;
  items: Array<{ href: string; label: string; meta?: string }>;
  className?: string;
  id?: string;
}) {
  if (!items.length) return null;
  return (
    <BlockShell kind="related" label="واصل" title={title} className={className} id={id}>
      <ul className="kx-related">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="kx-related__link">
              <span>{item.label}</span>
              {item.meta ? <span className="kx-related__meta">{item.meta}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </BlockShell>
  );
}

export function SummaryBlock({
  title = "ملخص",
  children,
  className,
  id,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <BlockShell kind="summary" label="ملخص" title={title} className={className} id={id}>
      {children}
    </BlockShell>
  );
}

export function RulingBlock({
  title = "الحكم",
  children,
  className,
  id,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <BlockShell kind="ruling" label="حكم" title={title} className={className} id={id}>
      {children}
    </BlockShell>
  );
}
