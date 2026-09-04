import { LazySectionAccordionPage } from "@/components/LazySectionAccordionPage";

export default function DurusImaniyyaPage() {
  return (
    <LazySectionAccordionPage
      eyebrow="التربية والتزكية"
      title="الدروس الإيمانية والتربوية"
      route="/durus-imaniyya"
      exportName="DURUS_IMANIYYA"
      relatedKey="durusImaniyya"
      load={() => import("@/lib/durus-imaniyya-data")}
    />
  );
}
