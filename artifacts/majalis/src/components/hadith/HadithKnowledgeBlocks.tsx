import type { ReactNode } from "react";
import { Link } from "wouter";
import { BookMarked, AlertTriangle, Info, Library } from "lucide-react";
import { InformationCard } from "@/components/ui/InformationCard";
import { HadithFaq } from "./HadithFaq";
import "@/styles/pages/hadith-design-language.css";

/** بطاقة تعريف — Knowledge Reader */
export function HadithDefinitionCard({
  title = "تعريف",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <InformationCard title={title} tone="info" icon={Info} className="hdl-kr hdl-kr--definition">
      <div className="hdl-kr__body">{children}</div>
    </InformationCard>
  );
}

/** تنبيه علمي */
export function HadithWarningCard({
  title = "تنبيه علمي",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <InformationCard title={title} tone="caution" icon={AlertTriangle} className="hdl-kr hdl-kr--warning">
      <div className="hdl-kr__body">{children}</div>
    </InformationCard>
  );
}

/** مصادر */
export function HadithSourcesCard({
  title = "مصادر",
  sources,
}: {
  title?: string;
  sources: string[];
}) {
  return (
    <InformationCard title={title} tone="neutral" icon={Library} className="hdl-kr hdl-kr--sources">
      <ul className="hdl-kr__list">
        {sources.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </InformationCard>
  );
}

/** أمثلة */
export function HadithExamplesCard({
  title = "أمثلة",
  examples,
}: {
  title?: string;
  examples: string[];
}) {
  return (
    <InformationCard title={title} tone="info" icon={BookMarked} className="hdl-kr hdl-kr--examples">
      <ul className="hdl-kr__list">
        {examples.map((ex) => (
          <li key={ex}>{ex}</li>
        ))}
      </ul>
    </InformationCard>
  );
}

/** روابط داخلية */
export function HadithInternalLinks({
  title = "روابط داخلية",
  links,
}: {
  title?: string;
  links: { href: string; label: string }[];
}) {
  return (
    <nav className="hdl-kr hdl-kr--links" aria-label={title}>
      <p className="hdl-kr__links-title">{title}</p>
      <div className="hdl-kr__links-row">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="hdl-chip hdl-chip--link">
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

/** أسئلة مختصرة */
export function HadithKnowledgeFaq({
  title = "أسئلة مختصرة",
  items,
}: {
  title?: string;
  items: { q: string; a: string }[];
}) {
  return <HadithFaq title={title} items={items} />;
}
