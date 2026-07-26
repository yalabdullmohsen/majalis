import { Link } from "wouter";
import type { ConnectionSection, LinkedItem } from "@/lib/entity-graph";
import { prefetchHref } from "@/lib/entity-graph";

const KIND_AR: Record<string, string> = {
  scholar: "عالم",
  book: "كتاب",
  prophet: "نبي",
  nation: "قوم",
  hub: "قسم",
  topic: "موضوع",
  category: "تصنيف",
  hadith_collection: "حديث",
  surah: "سورة",
  lesson: "درس",
  university: "جامعة",
  madhhab: "مذهب",
  sahabah: "صحابي",
};

function Card({ item }: { item: LinkedItem }) {
  return (
    <Link
      href={item.href}
      className="ek-card"
      onMouseEnter={() => prefetchHref(item.href)}
      onFocus={() => prefetchHref(item.href)}
    >
      <span className="ek-card__kind">{KIND_AR[item.kind] || "محتوى"}</span>
      <span className="ek-card__title">{item.title}</span>
      {item.subtitle ? <span className="ek-card__sub">{item.subtitle}</span> : null}
    </Link>
  );
}

export function EntityConnections({ sections }: { sections: ConnectionSection[] }) {
  if (!sections.length) return null;
  return (
    <div className="ek-sections">
      {sections.map((section) => (
        <section key={section.id} className="ek-section" aria-label={section.title}>
          <h2 className="ek-section__title">{section.title}</h2>
          <div className="ek-grid">
            {section.items.map((item) => (
              <Card key={`${section.id}-${item.id}`} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
