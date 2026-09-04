import { LazySectionAccordionPage } from "@/components/LazySectionAccordionPage";

export default function TazkiyaTopicsPage() {
  return (
    <LazySectionAccordionPage
      eyebrow="تزكية النفس والأخلاق"
      title="الأخلاق والأمراض والأسئلة الكبرى"
      route="/tazkiya-topics"
      exportName="TAZKIYA_TOPICS"
      relatedKey="tazkiya"
      load={() => import("@/lib/tazkiya-topics-data")}
    />
  );
}
