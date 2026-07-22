import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { PageHeader, Empty } from "@/components/ui-common";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { getArticleBySlug, getArticleTranslations, type DawahArticle, type DawahTranslation } from "@/lib/dawah-service";
import "@/styles/discover-islam.css";

const LANG_LABELS: Record<string, string> = { en: "English", fr: "Français", tr: "Türkçe", ur: "اردو", id: "Bahasa Indonesia" };
const FULL_TEXT_NOTE: Record<string, string> = {
  en: "The full article text is currently available in Arabic only. A complete translation is in progress.",
  fr: "Le texte intégral de l'article n'est actuellement disponible qu'en arabe. Une traduction complète est en cours.",
};

export default function DiscoverIslamArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<DawahArticle | null | undefined>(undefined);
  const [translations, setTranslations] = useState<DawahTranslation[]>([]);
  const [viewLang, setViewLang] = useState<string>("ar");

  useEffect(() => {
    if (!slug) return;
    setItem(undefined);
    setTranslations([]);
    setViewLang("ar");
    getArticleBySlug(slug).then((a) => {
      setItem(a);
      if (a) {
        getArticleTranslations(a.id).then((rows) => {
          const merged = a.title_en ? [{ lang: "en", title: a.title_en, summary: a.summary_en, body: null, status: "approved" as const }, ...rows.filter((r) => r.lang !== "en")] : rows;
          setTranslations(merged);
        });
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

  const activeTranslation = viewLang === "ar" ? null : translations.find((t) => t.lang === viewLang);
  const displayTitle = activeTranslation?.title || item.title_ar;
  const isRtlLang = viewLang === "ar" || viewLang === "ur";

  return (
    <div className="page-shell narrow dii-question-page">
      <div dir={isRtlLang ? "rtl" : "ltr"}>
        <PageHeader eyebrow="مقال" title={displayTitle} showBack />
      </div>

      {translations.length > 0 && (
        <div className="dii-lang-row" role="tablist" aria-label="الترجمات المتاحة">
          <span className="dii-lang-label">الترجمات المتاحة:</span>
          <button type="button" onClick={() => setViewLang("ar")} className={viewLang === "ar" ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}>العربية</button>
          {translations.map((t) => (
            <button key={t.lang} type="button" onClick={() => setViewLang(t.lang)} className={viewLang === t.lang ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}>
              {LANG_LABELS[t.lang] || t.lang}
            </button>
          ))}
        </div>
      )}

      {item.cover_image_url && <img src={item.cover_image_url} alt="" className="dii-article-cover" loading="lazy" />}

      {viewLang === "ar" ? (
        <div className="ui-card">
          <p className="page-desc dii-detailed-answer">{item.body_ar}</p>
        </div>
      ) : (
        <div className="ui-card" dir={isRtlLang ? "rtl" : "ltr"}>
          <p className="dii-short-answer">{activeTranslation?.summary}</p>
          <p className="page-desc" style={{ marginTop: "1rem" }}>{FULL_TEXT_NOTE[viewLang] || FULL_TEXT_NOTE.en}</p>
        </div>
      )}

      <div className="twh-share" style={{ marginTop: "1.5rem" }}>
        <ShareButtons title={displayTitle} url={`https://www.majlisilm.com/discover-islam/articles/${item.slug}`} />
      </div>
    </div>
  );
}
