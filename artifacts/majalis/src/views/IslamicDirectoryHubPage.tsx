import { Landmark, MapPin, GraduationCap } from "lucide-react";
import MergedSectionHubPage from "@/views/MergedSectionHubPage";

export default function IslamicDirectoryHubPage() {
  return (
    <MergedSectionHubPage
      path="/islamic-directory"
      title="الدليل الإسلامي"
      description="دليل المؤسسات الإسلامية والمساجد والمشاهد في قسم واحد."
      cards={[
        {
          href: "/universities",
          title: "دليل الجامعات والكليات الشرعية",
          desc: "جامعات ومعاهد الدراسات الشرعية حول العالم مع المقارنة",
          Icon: GraduationCap,
        },
        {
          href: "/institutions",
          title: "المؤسسات الإسلامية",
          desc: "مساجد · مكتبات · مراكز",
          Icon: Landmark,
        },
        {
          href: "/islamic-landmarks",
          title: "المساجد والمشاهد",
          desc: "خريطة المشاهد الإسلامية التاريخية",
          Icon: MapPin,
        },
      ]}
    />
  );
}
