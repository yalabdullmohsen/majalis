import { useEffect } from "react";
import { FiqhCouncilListPage } from "./FiqhCouncilPage";
import { applyPageSeo } from "@/lib/seo";

export default function FiqhCouncilFatwasPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/fiqh-council/fatwas",
      title: "فتاوى المجمع الفقهي الجماعية | المجلس العلمي",
      description: "فتاوى جماعية صادرة عن المجمع الفقهي الإسلامي — موثقة بأدلتها ومراجعها الشرعية الصحيحة.",
      keywords: ["فتاوى جماعية", "فتاوى مجمع فقهي", "فتاوى هيئة", "إفتاء جماعي"],
    });
  }, []);

  return (
    <FiqhCouncilListPage
      typeFilter="fatwa"
      title="الفتاوى الجماعية"
      subtitle="فتاوى جماعية صادرة عن المجمع الفقهي الإسلامي، مع أدلة ومراجع."
      showTypeFilter={false}
    />
  );
}
