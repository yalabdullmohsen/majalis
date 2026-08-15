import { useEffect } from "react";
import { IslamicQuizGame } from "@/components/quiz-game/IslamicQuizGame";
import { ShareButtons } from "@/components/ContentActions";
import { PublishStatusBanner } from "@/components/PublishStatusBanner";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/components/islamic-quiz-game.css";
import "@/styles/pages/quiz.css";
import "@/styles/components/scholarly-trust.css";

export default function QuizPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/quiz",
      title: "أسئلة وأجوبة — قيد الإكمال | المجلس العلمي",
      description:
        "صفحة قيد الإكمال لجمع الأسئلة والأجوبة الشرعية، وسيُضاف المحتوى تدريجيًا بعد المراجعة.",
      keywords: ["أسئلة وأجوبة", "قيد الإكمال", "سين جيم", "أسئلة إسلامية"],
      robots: "index, follow",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "أسئلة وأجوبة — قيد الإكمال",
          url: "https://www.majlisilm.com/quiz",
          description:
            "صفحة قيد الإكمال لجمع الأسئلة والأجوبة الشرعية، وسيُضاف المحتوى تدريجيًا بعد المراجعة.",
          inLanguage: "ar",
          provider: { "@type": "Organization", name: "المجلس العلمي", url: "https://www.majlisilm.com" },
        },
      ],
    });
  }, []);

  return (
    <>
      <PublishStatusBanner status="incomplete" />
      <IslamicQuizGame />
      <div className="twh-share">
        <ShareButtons title="أسئلة وأجوبة — المجلس العلمي" url="https://www.majlisilm.com/quiz" />
      </div>
    </>
  );
}
