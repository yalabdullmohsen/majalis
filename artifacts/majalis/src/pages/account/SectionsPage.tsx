/**
 * صفحة /sections — لوبي موحّد بلا لافتة وبلا بحث محلي.
 * Visual Redesign V2 Expansion B — PageHeaderV2 + هوية الأقسام.
 */
import { useEffect } from "react";
import { applyPageSeo } from "@/lib/seo";
import { MoreHubFromRegistry } from "@/features/more/MoreHubFromRegistry";
import { GridScreen } from "@/components/design-system/screens";
import { PageHeaderV2 } from "@/components/design-system";
import "@/components/sections/section-cards.css";
import "@/styles/pages/lessons-sections-v2.css";

export default function SectionsPage() {
  useEffect(() => {
    applyPageSeo({
      title: "الأقسام — سُنّة",
      description:
        "أقسام سُنّة: العلوم الشرعية، القصص، الدعوة، العبادة، التعلّم، والحساب.",
      path: "/sections",
    });
  }, []);

  return (
    <GridScreen compose="mark" columns={2}>
      <PageHeaderV2
        title="الأقسام"
        description="علوم شرعية، عبادة، تعلّم، وقصص — وصول سريع بهوية سُنّة الموحّدة."
      />
      <MoreHubFromRegistry />
    </GridScreen>
  );
}
