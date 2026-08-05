import { LazySectionAccordionPage } from "@/components/LazySectionAccordionPage";

export default function ArabicLanguagePage() {
  return (
    <LazySectionAccordionPage
      eyebrow="اللغة العربية"
      title="النحو والصرف والبلاغة لطالب العلم"
      exportName="ARABIC_LANGUAGE"
      relatedKey="arabic"
      load={() => import("@/lib/arabic-language-data")}
    />
  );
}
