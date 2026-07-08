import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { FiqhCouncilSubnav } from "./FiqhCouncilPage";
import { compareFiqhItems, getFiqhCouncilItems, getFiqhCouncilItemsBySlugs } from "@/lib/fiqh-council-service";
import { applyPageSeo } from "@/lib/seo";
import {
  fiqhCompareHref,
  fiqhItemHref,
  formatFiqhItemMeta,
  type FiqhCouncilItem,
} from "@/lib/fiqh-council-types";

function CompareColumn({ item }: { item: FiqhCouncilItem }) {
  return (
    <article className="fiqh-compare-column">
      <h3>{item.title}</h3>
      <p className="fiqh-compare-meta">{formatFiqhItemMeta(item)}</p>
      {item.summary && <p className="fiqh-compare-summary">{item.summary}</p>}
      {item.ruling_text && (
        <div className="fiqh-compare-ruling">
          <strong>الحكم / التوصية</strong>
          <p>{item.ruling_text}</p>
        </div>
      )}
      {item.evidence && item.evidence.length > 0 && (
        <div className="fiqh-compare-evidence">
          <strong>الأدلة</strong>
          <ul>
            {item.evidence.map((e, i) => (
              <li key={i}>{e.type && `${e.type}: `}{e.text}{e.source && ` — ${e.source}`}</li>
            ))}
          </ul>
        </div>
      )}
      {item.tags && item.tags.length > 0 && (
        <div className="content-hub-chips">
          {item.tags.map((t) => <span key={t} className="content-hub-chip">{t}</span>)}
        </div>
      )}
      <div className="fiqh-compare-actions">
        <Link href={fiqhItemHref(item.slug)} className="fiqh-council-section-link">التفاصيل</Link>
        {item.source_url && (
          <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="fiqh-council-section-link">
            المصدر الأصلي
          </a>
        )}
      </div>
    </article>
  );
}

export default function FiqhCouncilComparePage() {
  const search = useSearch();
  const selectedSlugs = useMemo(() => {
    const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
    const raw = params.get("items") || "";
    return raw.split(",").map((s) => decodeURIComponent(s.trim())).filter(Boolean).slice(0, 4);
  }, [search]);

  const [items, setItems] = useState<FiqhCouncilItem[]>([]);
  const [catalog, setCatalog] = useState<FiqhCouncilItem[]>([]);
  const [picker, setPicker] = useState<string[]>(selectedSlugs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyPageSeo({
      path: "/fiqh-council/compare",
      title: "مقارنة قرارات المجمع الفقهي | المجلس العلمي",
      description: "قارن بين قرارات وفتاوى مجلس الفقه الإسلامي جنباً إلى جنب — أداة تحليلية للباحثين والدارسين.",
      keywords: ["مقارنة فقهية", "قرارات فقهية", "مجمع فقهي", "تحليل فقهي", "مقارنة الفتاوى"],
    });
  }, []);

  useEffect(() => {
    getFiqhCouncilItems({ limit: 40 }).then(({ data }) => setCatalog(data));
  }, []);

  useEffect(() => {
    if (!selectedSlugs.length) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getFiqhCouncilItemsBySlugs(selectedSlugs)
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, [selectedSlugs.join(",")]);

  const comparison = items.length >= 2 ? compareFiqhItems(items) : null;

  const togglePicker = (slug: string) => {
    setPicker((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 4) return prev;
      return [...prev, slug];
    });
  };

  return (
    <div className="page-shell wide content-hub-page fiqh-council-page fiqh-compare-page">
      <PageHeader
        eyebrow="أداة الباحث"
        title="مقارنة القرارات الفقهية"
        subtitle="قارِن بين قرارين أو أكثر: المصدر، التاريخ، الأدلة، ونقاط الاتفاق والاختلاف."
      />

      <FiqhCouncilSubnav />

      <section className="fiqh-compare-picker ui-card">
        <h2 className="fiqh-council-section-title">اختر للمقارنة (حتى 4)</h2>
        <div className="fiqh-compare-picker-list">
          {catalog.map((item) => (
            <label key={item.slug} className="fiqh-compare-picker-item">
              <input
                type="checkbox"
                checked={picker.includes(item.slug)}
                onChange={() => togglePicker(item.slug)}
              />
              <span>{item.title}</span>
            </label>
          ))}
        </div>
        {picker.length >= 2 && (
          <Link href={fiqhCompareHref(picker)} className="fiqh-compare-run-btn">
            مقارنة ({picker.length})
          </Link>
        )}
      </section>

      {loading ? <Loading /> : selectedSlugs.length < 2 ? (
        <Empty text="اختر قرارين على الأقل للمقارنة." />
      ) : items.length < 2 ? (
        <Empty text="تعذّر تحميل العناصر المحددة." />
      ) : (
        <>
          {comparison && (comparison.agreementPoints.length > 0 || comparison.differencePoints.length > 0) && (
            <section className="fiqh-compare-insights ui-card">
              {comparison.agreementPoints.length > 0 && (
                <div>
                  <h3>نقاط الاتفاق</h3>
                  <ul>{comparison.agreementPoints.map((p) => <li key={p}>{p}</li>)}</ul>
                </div>
              )}
              {comparison.differencePoints.length > 0 && (
                <div>
                  <h3>نقاط الاختلاف</h3>
                  <ul>{comparison.differencePoints.map((p) => <li key={p}>{p}</li>)}</ul>
                </div>
              )}
            </section>
          )}

          <div className={`fiqh-compare-grid fiqh-compare-grid--${items.length}`}>
            {items.map((item) => (
              <CompareColumn key={item.slug} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
