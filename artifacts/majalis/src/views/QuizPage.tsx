import { useEffect } from "react";
import { IslamicQuizGame } from "@/components/quiz-game/IslamicQuizGame";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";

export default function QuizPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/quiz",
      title: "لعبة سين جيم – أسئلة وأجوبة | المجلس العلمي",
      description: "اختبر معلوماتك من خلال لعبة أسئلة وأجوبة ممتعة ومتدرجة.",
      keywords: ["سين جيم", "مسابقة إسلامية", "اختبار معلومات", "أسئلة إسلامية", "تحدي قرآني", "مسابقة فقهية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: "لعبة سين جيم – أسئلة وأجوبة",
          url: "https://www.majlisilm.com/quiz",
          description: "اختبر معلوماتك من خلال لعبة أسئلة وأجوبة ممتعة ومتدرجة",
          educationalLevel: "متعدد المستويات",
          inLanguage: "ar",
          provider: { "@type": "Organization", name: "المجلس العلمي", url: "https://www.majlisilm.com" },
        },
      ],
    });
  }, []);

  return (
    <>
      <IslamicQuizGame />
      <div className="twh-share">
        <ShareButtons title="لعبة سين جيم – أسئلة وأجوبة — المجلس العلمي" url="https://www.majlisilm.com/quiz" />
      </div>
    </>
  );
}
