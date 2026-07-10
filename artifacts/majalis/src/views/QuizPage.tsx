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
