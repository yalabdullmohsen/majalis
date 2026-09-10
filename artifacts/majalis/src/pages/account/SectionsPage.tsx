/**
 * صفحة /sections — لوبي موحّد بلا لافتة وبلا بحث محلي.
 */
import { useEffect } from "react";
import { applyPageSeo } from "@/lib/seo";
import { MoreHubFromRegistry } from "@/features/more/MoreHubFromRegistry";
import { GridScreen } from "@/components/design-system/screens";
import "@/components/sections/section-cards.css";

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
      <MoreHubFromRegistry />
    </GridScreen>
  );
}
