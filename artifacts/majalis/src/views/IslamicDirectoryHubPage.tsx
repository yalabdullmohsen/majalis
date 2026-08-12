import { Landmark, MapPin } from "lucide-react";
import MergedSectionHubPage from "@/views/MergedSectionHubPage";

export default function IslamicDirectoryHubPage() {
  return (
    <MergedSectionHubPage
      path="/islamic-directory"
      title="الدليل الإسلامي"
      description="دليل المؤسسات الإسلامية والمساجد والمشاهد في قسم واحد."
      cards={[
        {
          href: "/institutions",
          title: "المؤسسات الإسلامية",
          desc: "مساجد · مكتبات · مراكز · جامعات",
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
