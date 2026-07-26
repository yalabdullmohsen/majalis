import { useEffect } from "react";
import { IslamicQuizGame } from "@/components/quiz-game/IslamicQuizGame";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/components/islamic-quiz-game.css";
import "@/styles/pages/quiz.css";

export default function QuizPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/quiz",
      title: "اختبر معلوماتك — لعبة سؤال وجواب | المجلس العلمي",
      description: "لعبة تعليمية متدرجة لاختبار المعلومات في السيرة والفقه والعقيدة والقرآن — منفصلة عن الأسئلة العلمية.",
      keywords: ["اختبر معلوماتك", "لعبة سؤال وجواب", "مسابقة إسلامية", "اختبار معلومات", "أسئلة إسلامية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: "اختبر معلوماتك — لعبة سؤال وجواب",
          url: "https://majlisilm.com/quiz",
          description: "لعبة تعليمية متدرجة لاختبار المعلومات الشرعية",
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
        <ShareButtons title="اختبر معلوماتك — لعبة سؤال وجواب — المجلس العلمي" url="https://majlisilm.com/quiz" />
      </div>
    </>
  );
}
