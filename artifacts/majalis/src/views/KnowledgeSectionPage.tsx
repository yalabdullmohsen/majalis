import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import {
  getKnowledgeItem,
  loadSectionItems,
  markDiscoverStation,
  readKnowledgeProgress,
  type KnowledgeItem,
} from "@/lib/knowledge-loader";
import { PageHeader } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/pages/knowledge.css";

const SECTION_TITLE: Record<string, string> = {
  prophets: "قصص الأنبياء",
  nations: "الأمم السابقة",
  quiz: "سين جيم",
  "quran-people": "الذين ذُكروا في القرآن",
  tafsir: "التفسير",
  history: "التاريخ الإسلامي",
  "intro-islam": "التعريف بالإسلام",
  "discover-islam": "اكتشف الإسلام",
};

export default function KnowledgeSectionPage() {
  const params = useParams<{ section?: string; id?: string }>();
  const section = params.section || "intro-islam";
  const id = params.id;
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [item, setItem] = useState<KnowledgeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [fontScale, setFontScale] = useState(1);
  const [focusMode, setFocusMode] = useState(false);
  const progress = useMemo(() => readKnowledgeProgress(), [item?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (id) {
        const one = await getKnowledgeItem(section, id);
        if (!cancelled) {
          setItem(one);
          setItems([]);
          if (one && section === "discover-islam") markDiscoverStation(one.id);
          if (one) {
            applyPageSeo({
              path: `/knowledge/${section}/${id}`,
              title: `${one.title} | ${SECTION_TITLE[section] || "معرفة"}`,
              description: one.body.slice(0, 140),
            });
          }
        }
      } else {
        const list = await loadSectionItems(section);
        if (!cancelled) {
          setItems(list);
          setItem(null);
          applyPageSeo({
            path: `/knowledge/${section}`,
            title: `${SECTION_TITLE[section] || section} | معرفة`,
            description: `فهرس قسم ${SECTION_TITLE[section] || section}`,
          });
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [section, id]);

  const visible = useMemo(() => {
    const q = filter.trim();
    if (!q) return items;
    return items.filter((it) => it.title.includes(q) || it.tags?.some((t) => t.includes(q)));
  }, [items, filter]);

  async function copyBody() {
    if (!item) return;
    await navigator.clipboard.writeText(`${item.title}\n\n${item.body}`);
  }

  if (loading) {
    return (
      <div className="page-shell narrow" dir="rtl">
        <PageHeader eyebrow="معرفة" title="جاري التحميل…" />
      </div>
    );
  }

  if (item) {
    const isReview = item.review_status === "needs_review";
    return (
      <div className={`page-shell narrow ${focusMode ? "knowledge-focus" : ""}`} dir="rtl">
        <PageHeader eyebrow={SECTION_TITLE[section] || "معرفة"} title={item.title} />
        {isReview && (
          <p role="status" className="knowledge-review-banner">
            هذا المدخل قيد المراجعة العلمية — لا يُعرض كحقيقة قطعية.
          </p>
        )}
        <div className="knowledge-toolbar">
          <button type="button" className="asp-add-btn" onClick={() => setFontScale((s) => Math.min(1.6, s + 0.1))}>
            تكبير الخط
          </button>
          <button type="button" className="asp-add-btn" onClick={() => setFontScale((s) => Math.max(0.9, s - 0.1))}>
            تصغير
          </button>
          <button type="button" className="asp-add-btn" onClick={() => setFocusMode((v) => !v)}>
            {focusMode ? "إظهار الأدوات" : "وضع قراءة"}
          </button>
          <button type="button" className="asp-run-btn" onClick={() => void copyBody()}>
            نسخ النص
          </button>
          <button
            type="button"
            className="asp-run-btn"
            onClick={() => {
              const url = `https://www.majlisilm.com/knowledge/${section}/${item.id}`;
              void navigator.share?.({ title: item.title, url }).catch(() => navigator.clipboard.writeText(url));
            }}
          >
            مشاركة
          </button>
        </div>
        <article className="knowledge-article surface-brand" style={{ fontSize: `${fontScale}rem` }}>
          <div className="knowledge-article-body">
            {item.body.split("\n").map((line, i) =>
              line.startsWith("## ") ? <h2 key={i}>{line.slice(3)}</h2> : line.startsWith("### ") ? <h3 key={i}>{line.slice(4)}</h3> : <p key={i}>{line}</p>,
            )}
          </div>
          {item.evidences?.length > 0 && (
            <section>
              <h2>الأدلة</h2>
              <ul>
                {item.evidences.map((e, i) => (
                  <li key={i}>
                    <strong>{e.type}</strong> [{e.ref}] {e.type === "ayah" ? `﴿${e.text}﴾` : e.text}
                    {e.grade ? ` — ${e.grade}${e.graded_by ? ` (${e.graded_by})` : ""}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {item.related?.length > 0 && (
            <section>
              <h2>مرتبط بـ</h2>
              <ul>
                {item.related.map((r) => (
                  <li key={r}>
                    <Link href={`/knowledge/${section}/${r}`}>{r}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
        <p className="page-meta">آخر تحديث: {item.updated_at}</p>
        <Link href={`/knowledge/${section}`} className="page-link-inline">
          ← فهرس القسم
        </Link>
      </div>
    );
  }

  return (
    <div className="page-shell narrow" dir="rtl">
      <PageHeader eyebrow="معرفة" title={SECTION_TITLE[section] || section} />
      <label className="knowledge-filter">
        تصفية
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="ابحث في العناوين…" />
      </label>
      {section === "discover-islam" && (
        <p className="page-meta">محطات منجزة محلياً: {progress.discoverStations.length}</p>
      )}
      <ul className="knowledge-index-list">
        {visible.slice(0, 200).map((it) => (
          <li key={it.id}>
            <Link href={`/knowledge/${section}/${it.id}`} className="knowledge-index-link surface-brand">
              <span>{it.title}</span>
              {it.review_status === "needs_review" && <span className="knowledge-badge">مراجعة</span>}
            </Link>
          </li>
        ))}
      </ul>
      {visible.length > 200 && <p className="page-meta">يُعرض أول 200 نتيجة — ضيّق التصفية.</p>}
    </div>
  );
}
