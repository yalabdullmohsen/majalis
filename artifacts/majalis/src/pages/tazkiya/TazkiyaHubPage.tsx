import { BookOpen, HeartHandshake, RotateCcw, Sprout } from "lucide-react";
import MergedSectionHubPage from "@/views/MergedSectionHubPage";

/**
 * بوابة موحّدة: الذنوب والحقوق + التوبة والاستغفار.
 * الاسم الظاهر في الأقسام: «التزكية والتوبة».
 */
export default function TazkiyaHubPage() {
  return (
    <MergedSectionHubPage
      path="/tazkiya"
      title="التزكية والتوبة"
      description="الذنوب والحقوق، والتوبة والاستغفار — باب واحد لتطهير النفس والرجوع إلى الله."
      eyebrow="التزكية والسلوك"
      quote={{
        text: "تُوبُوا إِلَى اللَّهِ تَوْبَةً نَّصُوحًا",
        ref: "التحريم: ٨",
      }}
      cards={[
        {
          href: "/sins-and-rights",
          title: "الذنوب والحقوق",
          desc: "كبائر الذنوب وحقوق الله والعباد",
          Icon: HeartHandshake,
        },
        {
          href: "/tawba",
          title: "التوبة والاستغفار",
          desc: "شروط التوبة النصوح وفضل الاستغفار",
          Icon: RotateCcw,
        },
        {
          href: "/tazkiya-topics",
          title: "موضوعات التزكية",
          desc: "دروس في تزكية النفس وأمراض القلوب",
          Icon: BookOpen,
        },
        {
          href: "/akhlaq",
          title: "مكارم الأخلاق",
          desc: "أخلاق المسلم من القرآن والسنة",
          Icon: Sprout,
        },
      ]}
    />
  );
}
