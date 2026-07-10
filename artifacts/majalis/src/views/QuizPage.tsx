import { useEffect } from "react";
import { IslamicQuizGame } from "@/components/quiz-game/IslamicQuizGame";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";

export default function QuizPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/quiz",
      title: "مسابقة المعلومات الإسلامية | المجلس العلمي",
      description: "اختبر معلوماتك الإسلامية في التاريخ والفقه والقرآن والسيرة النبوية، مسابقة تفاعلية بمستويات متدرجة.",
      keywords: ["مسابقة إسلامية", "اختبار معلومات", "أسئلة إسلامية", "تحدي قرآني", "مسابقة فقهية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: "مسابقة المعلومات الإسلامية",
          url: "https://majlisilm.com/quiz",
          description: "اختبر معلوماتك الإسلامية في الفقه والقرآن والسيرة والتاريخ",
          educationalLevel: "متعدد المستويات",
          inLanguage: "ar",
          provider: { "@type": "Organization", name: "المجلس العلمي", url: "https://majlisilm.com" },
        },
      ],
    });
  }, []);

  return (
    <>
      <IslamicQuizGame />
      <div className="twh-share">
        <ShareButtons title="مسابقة المعلومات الإسلامية — المجلس العلمي" url="https://majlisilm.com/quiz" />
      </div>
    </>
  );
}
