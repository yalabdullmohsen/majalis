import { Calendar, Star } from "lucide-react";
import MergedSectionHubPage from "@/views/MergedSectionHubPage";

export default function OccasionsLessonsHubPage() {
  return (
    <MergedSectionHubPage
      path="/occasions-lessons"
      title="المناسبات والدروس"
      description="المناسبات الإسلامية وتقويم الدروس في صفحة واحدةحدة."
      cards={[
        {
          href: "/occasions",
          title: "المناسبات الإسلامية",
          desc: "أذكار المناسبات والأعياد والأحداث الدينية",
          Icon: Star,
        },
        {
          href: "/calendar",
          title: "تقويم الدروس",
          desc: "التقويم والمواعيد العلمية",
          Icon: Calendar,
        },
      ]}
    />
  );
}
