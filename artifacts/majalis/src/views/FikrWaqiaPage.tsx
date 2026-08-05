import { LazySectionAccordionPage } from "@/components/LazySectionAccordionPage";

export default function FikrWaqiaPage() {
  return (
    <LazySectionAccordionPage
      eyebrow="الفكر والواقع"
      title="الشباب والعمل والتقنية والقرارات"
      exportName="FIKR_WAQIA"
      relatedKey="fikr"
      load={() => import("@/lib/fikr-waqia-data")}
    />
  );
}
