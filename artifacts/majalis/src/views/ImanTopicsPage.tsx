import { LazySectionAccordionPage } from "@/components/LazySectionAccordionPage";

export default function ImanTopicsPage() {
  return (
    <LazySectionAccordionPage
      eyebrow="الإيمان والعقيدة"
      title="الإيمان بالله وعالم الغيب"
      route="/iman-topics"
      exportName="IMAN_TOPICS"
      relatedKey="iman"
      load={() => import("@/lib/iman-topics-data")}
    />
  );
}
