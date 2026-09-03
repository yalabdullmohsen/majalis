/**
 * صفحة /more — تُبنى بالكامل من سجل الأقسام.
 */
import { useEffect } from "react";
import { applyPageSeo } from "@/lib/seo";
import { ContentHubLayout } from "@/components/layout/ContentHubLayout";
import { MoreHubFromRegistry } from "@/features/more/MoreHubFromRegistry";
import "@/styles/pages/more-page.css";

export default function MorePage() {
  useEffect(() => {
    applyPageSeo({
      title: "المزيد — سُنّة",
      description:
        "المزيد: العلوم الشرعية، القصص، الدعوة، العبادة، التعلّم، والحساب.",
      path: "/more",
    });
  }, []);

  return (
    <ContentHubLayout title="المزيد" subtitle="كل الأقسام من مصدر واحد" className="more-page">
      <MoreHubFromRegistry />
    </ContentHubLayout>
  );
}
