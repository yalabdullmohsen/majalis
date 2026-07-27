import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { ARABIC_LANGUAGE } from "@/lib/arabic-language-data";
import { accordionExploreLinks } from "@/lib/explore-links";

export default function ArabicLanguagePage() {
  return (
    <SectionAccordionLayout
      eyebrow="اللغة العربية"
      title="النحو والصرف والبلاغة لطالب العلم"
      sections={ARABIC_LANGUAGE}
      relatedLinks={accordionExploreLinks("arabic")}
    />
  );
}
