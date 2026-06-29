import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading, Empty } from "@/components/ui-common";
import { ContentDetailLayout } from "@/components/platform/ContentDetailLayout";
import { supabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { displayText } from "@/lib/display-text";
import { applyPageSeo } from "@/lib/seo";
import { usePageView } from "@/hooks/usePageView";

export default function QaDetailPage({ params }: { params?: { id?: string } }) {
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
      const { data } = await supabase
        .from("qa_questions")
        .select("*, qa_categories(name)")
        .eq("id", itemId)
        .maybeSingle();
      setItem(data);
    })().finally(() => setLoading(false));
  }, [itemId]);

  usePageView("qa", itemId);

  useEffect(() => {
    if (!item?.question) return;
    applyPageSeo({
      path: `/qa/${itemId}`,
      title: `${displayText(item.question).slice(0, 60)} | الأسئلة الشرعية`,
      description: displayText(item.answer || item.question).slice(0, 160),
      canonicalPath: `/qa/${itemId}`,
    });
  }, [item, itemId]);

  if (loading) return <Loading />;
  if (!item) return <Empty text="لم يُعثر على السؤال." />;

  return (
    <ContentDetailLayout
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "الأسئلة الشرعية", href: "/qa" },
        { label: "سؤال" },
      ]}
      title={displayText(item.question)}
      subtitle={item.qa_categories?.name || item.ruling_type || ""}
    >
      {item.answer && (
        <div className="content-detail-body">
          <h2>الجواب</h2>
          <p>{displayText(item.answer)}</p>
        </div>
      )}
      {item.evidence && (
        <div className="content-detail-body">
          <h2>الدليل</h2>
          <p>{displayText(item.evidence)}</p>
        </div>
      )}
      <p><Link href="/qa">← العودة إلى الأسئلة</Link></p>
    </ContentDetailLayout>
  );
}
