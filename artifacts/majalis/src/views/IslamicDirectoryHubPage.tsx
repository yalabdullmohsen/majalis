import { Landmark, MapPin, GraduationCap } from "lucide-react";
import MergedSectionHubPage from "@/views/MergedSectionHubPage";
import contentCounts from "@/data/content-counts.json";
import { toArabicDigits } from "@/lib/utils";
import { UtilityScreen } from "@/components/design-system/screens";

export default function IslamicDirectoryHubPage() {
  const universities = toArabicDigits(contentCounts.universities ?? 0);
  const institutions = toArabicDigits(contentCounts.institutions ?? 0);
  const landmarks = toArabicDigits(contentCounts.landmarks ?? 0);

  return (
    <UtilityScreen compose="mark">
    <MergedSectionHubPage
      path="/islamic-directory"
      title="الدليل الإسلامي"
      description="دليل موحّد للجامعات الشرعية والمؤسسات الإسلامية والمساجد والمشاهد التاريخية — بهوية واحدة وبيانات مُدقَّقة."
      cards={[
        {
          href: "/universities",
          title: "دليل الجامعات والكليات الشرعية",
          desc: `${universities} جامعة ومعهدًا — برامج وأسئلة شائعة ومقارنة`,
          Icon: GraduationCap,
        },
        {
          href: "/institutions",
          title: "المؤسسات الإسلامية",
          desc: `${institutions} مؤسسة — مساجد ومكتبات ومراكز وهيئات`,
          Icon: Landmark,
        },
        {
          href: "/islamic-landmarks",
          title: "المساجد والمشاهد",
          desc: `${landmarks} معلمًا على الخريطة عبر العصور الإسلامية`,
          Icon: MapPin,
        },
      ]}
    />
    </UtilityScreen>
  );
}
