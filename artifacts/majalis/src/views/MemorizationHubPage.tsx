import { CalendarDays, Clock, Repeat, Zap } from "lucide-react";
import MergedSectionHubPage from "@/views/MergedSectionHubPage";

export default function MemorizationHubPage() {
  return (
    <MergedSectionHubPage
      path="/memorization"
      title="الحفظ والمراجعة"
      description="اختبارات الحفظ وخطط الحفظ والمراجعة في قسم موحّد."
      cards={[
        {
          href: "/quran/worship-hub?surah=1",
          title: "مركز العبادة القرآنية",
          desc: "مواقيت الصلاة، تحفيظ A-B، وتنزيل التلاوات أوفلاين",
          Icon: Clock,
        },
        {
          href: "/quran-memorization",
          title: "اختبارات الحفظ",
          desc: "أنواع متعددة من اختبارات الحفظ القرآني",
          Icon: Zap,
        },
        {
          href: "/quran/hifz-loop?surah=1",
          title: "مشغّل التحفيظ",
          desc: "تكرار A-B مع تظليل الآية وتعديل السرعة",
          Icon: Repeat,
        },
        {
          href: "/quran/memorization-plans",
          title: "خطط الحفظ والمراجعة",
          desc: "خطط مرنة للحفظ والمراجعة والتثبيت",
          Icon: CalendarDays,
        },
      ]}
    />
  );
}
