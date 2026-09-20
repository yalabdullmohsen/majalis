import { useEffect, useState } from "react";
import { DailyChallengeQuiz } from "@/components/quiz-game/DailyChallengeQuiz";
import { IslamicQuizGame } from "@/components/quiz-game/IslamicQuizGame";
import { ShareButtons } from "@/components/ContentActions";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/components/islamic-quiz-game.css";
import "@/styles/pages/quiz.css";

export default function QuizPage() {
  const [showDaily, setShowDaily] = useState(false);

  useEffect(() => {
    applyPageSeo({
      path: "/quiz",
      title: "تحدي الأسئلة | سُنّة",
      description: "اختبر معلوماتك في العلوم الشرعية واللغة العربية من خلال أسئلة متنوعة وموثقة.",
      keywords: ["تحدي الأسئلة", "تحدي سُنّة", "مسابقة إسلامية", "اختبار معلومات", "أسئلة شرعية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: "تحدي الأسئلة",
          url: "https://www.ssunnah.com/quiz",
          description: "اختبر معلوماتك في العلوم الشرعية واللغة العربية من خلال أسئلة متنوعة وموثقة",
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
      title="تحدي الأسئلة"
      subtitle="اختبر معلوماتك في العلوم الشرعية واللغة العربية من خلال أسئلة متنوعة وموثقة."
      eyebrow="تحدي سُنّة"
      groupTitle=""
    >
      {showDaily ? (
        <div className="qzg-root qzg-root--embedded">
          <div className="qzg-inner">
            <button type="button" className="qzg-back-setup" onClick={() => setShowDaily(false)}>
              ← العودة لتحدي الأسئلة
            </button>
            <DailyChallengeQuiz />
          </div>
        </div>
      ) : (
        <IslamicQuizGame onDaily={() => setShowDaily(true)} />
      )}
      <div className="twh-share">
        <ShareButtons title="تحدي الأسئلة — سُنّة" url="https://www.ssunnah.com/quiz" />
      </div>
    </SectionTemplatePage>
  );
}
