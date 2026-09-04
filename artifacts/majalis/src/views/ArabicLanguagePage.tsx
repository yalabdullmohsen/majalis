import { LazySectionAccordionPage } from "@/components/LazySectionAccordionPage";

export default function ArabicLanguagePage() {
  return (
    <LazySectionAccordionPage
      eyebrow="علوم العربية"
      title="النحو والصرف والبلاغة لطالب العلم"
      subtitle="مسار ميسر لفهم العربية التي تعين على فهم القرآن والسنة وكلام أهل العلم."
      description="ثمانية أبواب مرتّبة: من أساسيات النحو إلى البلاغة، مع بحث وفلاتر موحّدة وبطاقات ناعمة بلا عناصر تجريبية."
      route="/arabic-language"
      exportName="ARABIC_LANGUAGE"
      relatedKey="arabic"
      load={() => import("@/lib/arabic-language-data")}
    />
  );
}
