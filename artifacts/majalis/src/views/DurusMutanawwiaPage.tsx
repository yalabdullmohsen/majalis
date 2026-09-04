import { LazySectionAccordionPage } from "@/components/LazySectionAccordionPage";

export default function DurusMutanawwiaPage() {
  return (
    <LazySectionAccordionPage
      eyebrow="المحتوى التعليمي"
      title="دروس متنوعة"
      route="/durus-mutanawwia"
      exportName="DURUS_MUTANAWWIA"
      relatedKey="durusMutanawwia"
      load={() => import("@/lib/durus-mutanawwia-data")}
    />
  );
}
