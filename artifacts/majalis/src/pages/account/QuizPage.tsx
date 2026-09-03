import { useEffect } from "react";
import { IslamicQuizGame } from "@/components/quiz-game/IslamicQuizGame";
import { DailyChallengeQuiz } from "@/components/quiz-game/DailyChallengeQuiz";
import { ShareButtons } from "@/components/ContentActions";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/components/islamic-quiz-game.css";
import "@/styles/pages/quiz.css";

export default function QuizPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/quiz",
      title: "لعبة سين جيم – أسئلة وأجوبة | سُنّة",
      description: "اختبر معلوماتك من خلال تحدّ يومي ولعبة أسئلة وأجوبة متدرجة.",
      keywords: ["سين جيم", "مسابقة إسلامية", "اختبار معلومات", "أسئلة إسلامية", "تحدي قرآني", "مسابقة فقهية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: "لعبة سين جيم – أسئلة وأجوبة",
          url: "https://www.ssunnah.com/quiz",
          description: "اختبر معلوماتك من خلال تحدّ يومي ولعبة أسئلة وأجوبة متدرجة",
          educationalLevel: "متعدد المستويات",
          inLanguage: "ar",
          provider: { "@type": "Organization", name: "سُنّة", url: "https://www.ssunnah.com" },
        },
      ],
    });
  }, []);

  return (
    <SectionTemplatePage
      route="/quiz"
      title="سين جيم"
      subtitle="اختبر معلوماتك من خلال تحدّ يومي ولعبة أسئلة وأجوبة متدرجة."
      eyebrow="التعلّم الشخصي"
      groupTitle="أسئلة وأجوبة"
    >
      <IslamicQuizGame />
      <DailyChallengeQuiz />
      <div className="twh-share">
        <ShareButtons title="لعبة سين جيم – أسئلة وأجوبة — سُنّة" url="https://www.ssunnah.com/quiz" />
      </div>
    </SectionTemplatePage>
  );
}
