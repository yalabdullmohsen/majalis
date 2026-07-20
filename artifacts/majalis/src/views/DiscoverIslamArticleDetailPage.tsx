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
  const [viewLang, setViewLang] = useState<"ar" | "en">("ar");

  useEffect(() => {
    if (!slug) return;
    setItem(undefined);
    setViewLang("ar");
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

  const hasEnglish = Boolean(item.title_en);
  const displayTitle = viewLang === "en" && item.title_en ? item.title_en : item.title_ar;

  return (
    <div className="page-shell narrow dii-question-page">
      <div dir={viewLang === "ar" ? "rtl" : "ltr"}>
        <PageHeader eyebrow="مقال" title={displayTitle} showBack />
      </div>

      {hasEnglish && (
        <div className="dii-lang-row" role="tablist" aria-label="الترجمات المتاحة">
          <span className="dii-lang-label">الترجمات المتاحة:</span>
          <button type="button" onClick={() => setViewLang("ar")} className={viewLang === "ar" ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}>العربية</button>
          <button type="button" onClick={() => setViewLang("en")} className={viewLang === "en" ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}>English</button>
        </div>
      )}

      {item.cover_image_url && <img src={item.cover_image_url} alt="" className="dii-article-cover" loading="lazy" />}

      {viewLang === "ar" ? (
        <div className="ui-card">
          <p className="page-desc dii-detailed-answer">{item.body_ar}</p>
        </div>
      ) : (
        <div className="ui-card" dir="ltr">
          <p className="dii-short-answer">{item.summary_en}</p>
          <p className="page-desc" style={{ marginTop: "1rem" }}>The full article text is currently available in Arabic only. A complete English translation is in progress.</p>
        </div>
      )}

      <div className="twh-share" style={{ marginTop: "1.5rem" }}>
        <ShareButtons title={displayTitle} url={`https://www.majlisilm.com/discover-islam/articles/${item.slug}`} />
      </div>
    </div>
  );
}
