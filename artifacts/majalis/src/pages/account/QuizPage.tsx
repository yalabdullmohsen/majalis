import { useEffect } from "react";
import { IslamicQuizGame } from "@/components/quiz-game/IslamicQuizGame";
import { DailyChallengeQuiz } from "@/components/quiz-game/DailyChallengeQuiz";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/components/islamic-quiz-game.css";
import "@/styles/pages/quiz.css";

export default function QuizPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/quiz",
      title: "لعبة سين جيم – أسئلة وأجوبة | المجلس العلمي",
      description: "اختبر معلوماتك من خلال تحدّ يومي ولعبة أسئلة وأجوبة متدرجة.",
      keywords: ["سين جيم", "مسابقة إسلامية", "اختبار معلومات", "أسئلة إسلامية", "تحدي قرآني", "مسابقة فقهية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: "لعبة سين جيم – أسئلة وأجوبة",
          url: "https://majlisilm.com/quiz",
          description: "اختبر معلوماتك من خلال تحدّ يومي ولعبة أسئلة وأجوبة متدرجة",
          educationalLevel: "متعدد المستويات",
          inLanguage: "ar",
          provider: { "@type": "Organization", name: "المجلس العلمي", url: "https://majlisilm.com" },
        },
      ],
    });
  }, []);

  return (
    <>
      <DailyChallengeQuiz />
      <IslamicQuizGame />
      <div className="twh-share">
        <ShareButtons title="لعبة سين جيم – أسئلة وأجوبة — المجلس العلمي" url="https://majlisilm.com/quiz" />
      </div>
    </>
  );
}
