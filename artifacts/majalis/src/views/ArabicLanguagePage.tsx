import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { ARABIC_LANGUAGE } from "@/lib/arabic-language-data";

export default function ArabicLanguagePage() {
  return (
    <SectionAccordionLayout
      eyebrow="اللغة العربية"
      title="النحو والصرف والبلاغة لطالب العلم"
      sections={ARABIC_LANGUAGE}
    />
  );
}
