import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader, Loading } from "@/components/ui-common";
import { loadHadithIndex, loadHadithCollection } from "@/lib/content-library/loader";

type HadithRow = {
  id: string;
  number: number;
  text: string;
  matn: string;
  source: string;
  grade: string;
  narrator: string;
};

export default function HadithPage() {
  const [index, setIndex] = useState<Awaited<ReturnType<typeof loadHadithIndex>>>(null);
  const [collection, setCollection] = useState("bukhari");
  const [rows, setRows] = useState<HadithRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadHadithIndex().then(setIndex);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadHadithCollection(collection)
      .then((data) => setRows((data?.hadiths as HadithRow[]) || []))
      .finally(() => setLoading(false));
  }, [collection]);

  const filtered = search.trim()
    ? rows.filter((h) => h.text.includes(search.trim()) || h.matn?.includes(search.trim()))
    : rows.slice(0, 100);

  const active = index?.collections.find((c) => c.key === collection);

  return (
    <div className="page-shell narrow content-hub-page">
      <PageHeader
        eyebrow="السنة"
        title="مكتبة الأحاديث"
        subtitle="أحاديث موثقة مع بحث وتصنيف حسب الكتاب."
      />

      <div className="hadith-toolbar">
        <label className="sr-only" htmlFor="hadith-collection">المجموعة</label>
        <select
          id="hadith-collection"
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          className="hadith-select"
        >
          {(index?.collections || []).map((c) => (
            <option key={c.key} value={c.key}>
              {c.label} ({c.count.toLocaleString("ar")})
            </option>
          ))}
        </select>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث في المتن..."
          className="hadith-search"
        />
      </div>

      {active?.curated && (
        <p className="home-daily-meta">
          هذا الكتاب مفهرس — النص الكامل متاح في المصدر الأصلي على sunnah.com
        </p>
      )}

      {loading ? (
        <Loading />
      ) : (
        <div className="hadith-list">
          {filtered.map((h) => (
            <article key={h.id} className="ui-card hadith-card">
              <header className="hadith-card__head">
                <span className="page-tag">{h.source}</span>
                <span className="hadith-num">#{h.number}</span>
                {h.grade && <span className="hadith-grade">{h.grade}</span>}
              </header>
              <p className="hadith-card__text">{h.matn || h.text}</p>
              {h.narrator && h.narrator !== "—" && (
                <p className="home-daily-meta">الراوي: {h.narrator}</p>
              )}
            </article>
          ))}
          {!search.trim() && rows.length > 100 && (
            <p className="home-daily-meta">يُعرض أول 100 حديث — استخدم البحث للوصول إلى بقية الأحاديث.</p>
          )}
        </div>
      )}

      <p className="home-daily-meta">
        <Link href="/arbaeen-nawawi">الأربعون النووية</Link>
        {" · "}
        <Link href="/">الرئيسية</Link>
      </p>
    </div>
  );
}
