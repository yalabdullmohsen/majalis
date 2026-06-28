import { useMemo, useState } from "react";
import { Link } from "wouter";
import { PageHeader, Empty } from "@/components/ui-common";
import {
  getAllMutoon,
  MUTOON_CATEGORIES,
  DEFAULT_MUTOON_FILTERS,
  filterMutoon,
  type MutoonFilters,
} from "@/lib/mutoon";

export default function MutoonPage() {
  const [filters, setFilters] = useState<MutoonFilters>(DEFAULT_MUTOON_FILTERS);
  const allTexts = useMemo(() => getAllMutoon(), []);
  const texts = useMemo(() => filterMutoon(allTexts, filters), [allTexts, filters]);

  const set = <K extends keyof MutoonFilters>(key: K, value: MutoonFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="ds-page page-shell">
      <PageHeader
        eyebrow="المتون العلمية"
        title="موسوعة المتون"
        subtitle="متون علمية معتمدة في العقيدة والفقه والحديث والنحو — مع شرح واختبارات وتقدم."
      />

      <div className="hub-filters ui-card">
        <input
          className="hub-filters__search"
          placeholder="ابحث عن متن، مؤلف، تصنيف..."
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          aria-label="بحث في المتون"
        />
        <select value={filters.category} onChange={(e) => set("category", e.target.value)} aria-label="التصنيف">
          <option value="">كل التصنيفات</option>
          {MUTOON_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={filters.level} onChange={(e) => set("level", e.target.value)} aria-label="المستوى">
          <option value="">كل المستويات</option>
          {["مبتدئ", "متوسط", "متقدم", "تخصص"].map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {texts.length === 0 ? (
        <Empty text="لا توجد متون مطابقة." />
      ) : (
        <div className="mutoon-grid">
          {texts.map((m) => (
            <Link key={m.id} href={`/mutoon/${m.id}`} className="mutoon-tile ui-card">
              <span className="page-tag">{m.category}</span>
              <h2>{m.name}</h2>
              <p className="mutoon-tile__author">{m.author}</p>
              <p className="mutoon-tile__level">المستوى: {m.level}</p>
              <p className="mutoon-tile__summary">{m.summary.slice(0, 100)}…</p>
              <div className="mutoon-tile__badges">
                {m.audio_url && <span>🔊 صوتي</span>}
                {m.video_url && <span>🎬 مرئي</span>}
                {m.pdf_url && <span>📄 PDF</span>}
                {m.has_quiz && <span>✓ اختبار</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
