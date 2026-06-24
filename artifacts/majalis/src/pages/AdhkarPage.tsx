import { PageHeader } from "@/components/ui-common";
import { getAdhkarSections } from "@/lib/platform-api";

export default function AdhkarPage() {
  const sections = getAdhkarSections();

  return (
    <div className="page-shell">
      <PageHeader eyebrow="الأذكار" title="الأذكار" subtitle="أذكار يومية من السنة النبوية." />
      <div className="adhkar-sections">
        {sections.map((section) => (
          <section key={section.id} className="ui-card adhkar-section">
            <h2>{section.title}</h2>
            <ul>
              {section.items.map((item, i) => (
                <li key={i}>
                  <p>{item.text}</p>
                  {item.count > 1 && <span className="adhkar-count">{item.count} مرة</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
