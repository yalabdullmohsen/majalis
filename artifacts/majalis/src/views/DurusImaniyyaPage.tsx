import { LazySectionAccordionPage } from "@/components/LazySectionAccordionPage";

export default function DurusImaniyyaPage() {
  return (
    <LazySectionAccordionPage
      eyebrow="التربية والتزكية"
      title="الدروس الإيمانية والتربوية"
      exportName="DURUS_IMANIYYA"
      relatedKey="durusImaniyya"
      stat3Label="سلاسل"
      stat3Value={5}
      load={() => import("@/lib/durus-imaniyya-data")}
    />
  );
}
