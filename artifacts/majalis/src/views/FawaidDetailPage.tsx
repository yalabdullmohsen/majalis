import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading, Empty } from "@/components/ui-common";
import { ContentDetailLayout } from "@/components/platform/ContentDetailLayout";
import { supabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { displayText } from "@/lib/display-text";
import { applyPageSeo } from "@/lib/seo";
import { usePageView } from "@/hooks/usePageView";

export default function FawaidDetailPage({ params }: { params?: { id?: string } }) {
  const itemId = params?.id || "";
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!itemId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      if (!isSupabaseConfigured()) {
        setItem(null);
        return;
      }
      const { data } = await supabase.from("fawaid").select("*").eq("id", itemId).maybeSingle();
      setItem(data);
    })().finally(() => setLoading(false));
  }, [itemId]);

  usePageView("fawaid", itemId);

  useEffect(() => {
    if (!item) return;
    applyPageSeo({
      path: `/fawaid/${itemId}`,
      title: `${item.category || "فائدة"} | الفوائد — المجلس العلمي`,
      description: displayText(item.text || "").slice(0, 160),
      canonicalPath: `/fawaid/${itemId}`,
    });
  }, [item, itemId]);

  if (loading) return <Loading />;
  if (!item) return <Empty text="لم تُعثر على الفائدة." />;

  return (
    <ContentDetailLayout
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "الفوائد", href: "/fawaid" },
        { label: item.category || "فائدة" },
      ]}
      title={item.category || "فائدة"}
      subtitle={[item.source, item.author_name].filter(Boolean).join(" · ")}
    >
      <p className="content-detail-body">{displayText(item.text || "")}</p>
      <p><Link href="/fawaid">← العودة إلى الفوائد</Link></p>
    </ContentDetailLayout>
  );
}
