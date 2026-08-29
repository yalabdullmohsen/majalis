/**
 * صفحة /sections — لوبي موحّد بلا لافتة وبلا بحث محلي.
 */
import { useEffect } from "react";
import { applyPageSeo } from "@/lib/seo";
import { MoreHubFromRegistry } from "@/features/more/MoreHubFromRegistry";
import "@/components/sections/section-cards.css";

export default function SectionsPage() {
  useEffect(() => {
    applyPageSeo({
      title: "الأقسام — سُنّة",
      description:
        "أقسام سُنّة: العلوم الشرعية، القصص، الدعوة، المكتبة، العبادة، التعلّم، والحساب.",
      path: "/sections",
    });
  }, []);

  return <MoreHubFromRegistry />;
}
