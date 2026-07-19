import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { PageHeader, Empty } from "@/components/ui-common";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { getArticleBySlug, type DawahArticle } from "@/lib/dawah-service";
import "@/styles/discover-islam.css";

export default function DiscoverIslamArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<DawahArticle | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) return;
    setItem(undefined);
    getArticleBySlug(slug).then((a) => {
      setItem(a);
      if (a) {
        applyPageSeo({
          path: `/discover-islam/articles/${slug}`,
          title: `${a.title_ar} | التعريف بالإسلام`,
          description: a.summary_ar || a.title_ar,
        });
      }
    });
  }, [slug]);

  if (item === undefined) return <div className="page-shell narrow"><PageHeader eyebrow="التعريف بالإسلام" title="جارٍ التحميل..." /></div>;
  if (item === null) return <div className="page-shell narrow"><Empty text="لم يُعثر على هذا المقال، أو أنه لا يزال قيد المراجعة." /></div>;

  return (
    <div className="page-shell narrow dii-question-page">
      <PageHeader eyebrow="مقال" title={item.title_ar} showBack />
      {item.cover_image_url && <img src={item.cover_image_url} alt="" className="dii-article-cover" loading="lazy" />}
      <div className="ui-card">
        <p className="page-desc dii-detailed-answer">{item.body_ar}</p>
      </div>
      <div className="twh-share" style={{ marginTop: "1.5rem" }}>
        <ShareButtons title={item.title_ar} url={`https://www.majlisilm.com/discover-islam/articles/${item.slug}`} />
      </div>
    </div>
  );
}
