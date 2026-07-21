import { useEffect } from "react";
import { FiqhCouncilListPage } from "./FiqhCouncilPage";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

export default function FiqhCouncilFatwasPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/fiqh-council/fatwas",
      title: "فتاوى المجمع الفقهي الجماعية | المجلس العلمي",
      description: "فتاوى جماعية صادرة عن المجمع الفقهي الإسلامي، موثقة بأدلتها ومراجعها الشرعية الصحيحة.",
      keywords: ["فتاوى جماعية", "فتاوى مجمع فقهي", "فتاوى هيئة", "إفتاء جماعي"],
      jsonLd: [{ "@context": "https://schema.org", "@type": "WebPage", name: "فتاوى المجمع الفقهي الجماعية", url: "https://www.majlisilm.com/fiqh-council/fatwas", about: { "@type": "Thing", name: "الفتاوى الجماعية الإسلامية" } }],
    });
  }, []);

  return (
    <>
      <FiqhCouncilListPage
        typeFilter="fatwa"
        title="الفتاوى الجماعية"
        subtitle="فتاوى جماعية صادرة عن المجمع الفقهي الإسلامي، مع أدلة ومراجع."
        showTypeFilter={false}
      />
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="fiqh" title="اختبر معلوماتك في الفقه الإسلامي" count={4} />
      </div>
    </>
  );
}
