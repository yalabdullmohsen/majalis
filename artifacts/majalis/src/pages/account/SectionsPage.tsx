/**
 * صفحة /sections — الأقسام صفحة كاملة (لا شيت سفلي).
 */
import { useEffect } from "react";
import { applyPageSeo } from "@/lib/seo";
import { ContentHubLayout } from "@/components/layout/ContentHubLayout";
import { MoreHubFromRegistry } from "@/features/more/MoreHubFromRegistry";
import "@/styles/pages/more-page.css";
import "@/components/sections/section-cards.css";

export default function SectionsPage() {
  useEffect(() => {
    applyPageSeo({
      title: "الأقسام — المجلس العلمي",
      description:
        "أقسام المجلس العلمي: العلوم الشرعية، القصص، الدعوة، المكتبة، العبادة، التعلّم، والحساب.",
      path: "/sections",
    });
  }, []);

  return (
    <ContentHubLayout title="الأقسام" className="more-page sections-page">
      <MoreHubFromRegistry showSearch />
    </ContentHubLayout>
  );
}
