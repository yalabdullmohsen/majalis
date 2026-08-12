import { useEffect, useRef, useState } from "react";
import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { accordionExploreLinks, type AccordionExploreKey } from "@/lib/explore-links";
import type { DarsSection } from "@/lib/dars-types";

type Loader = () => Promise<Record<string, unknown>>;

/** يحمّل بيانات الأكورديون كسولًا حتى لا تُدمَج الحزم الضخمة في المسار الأولي. */
export function LazySectionAccordionPage({
  eyebrow,
  title,
  load,
  exportName,
  relatedKey,
  stat3Label,
  stat3Value,
}: {
  eyebrow: string;
  title: string;
  load: Loader;
  exportName: string;
  relatedKey: AccordionExploreKey;
  stat3Label?: string;
  stat3Value?: number;
}) {
  const [sections, setSections] = useState<DarsSection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    let cancelled = false;
    void loadRef
      .current()
      .then((mod) => {
        if (cancelled) return;
        const data = mod[exportName];
        if (!Array.isArray(data)) throw new Error(`مفتاح البيانات مفقود: ${exportName}`);
        setSections(data as DarsSection[]);
      })
      .catch((err) => {
        if (!cancelled) setError(String((err as Error)?.message || err));
      });
    return () => {
      cancelled = true;
    };
  }, [exportName]);

  if (error) {
    return (
      <div className="page-shell" dir="rtl">
        <p role="alert">تعذّر تحميل الفهرس. أعد المحاولة لاحقًا.</p>
      </div>
    );
  }

  if (!sections) {
    return (
      <div className="page-shell" dir="rtl" aria-busy="true">
        <p>جارٍ تحميل الفهرس…</p>
      </div>
    );
  }

  return (
    <SectionAccordionLayout
      eyebrow={eyebrow}
      title={title}
      sections={sections}
      stat3Label={stat3Label}
      stat3Value={stat3Value}
      relatedLinks={accordionExploreLinks(relatedKey)}
    />
  );
}
