import { useEffect, useState, useMemo } from "react";
import { AlertTriangle, Building2 } from "lucide-react";
import { QuranCircleCard } from "@/components/circles/QuranCircleCard";
import { getQuranCircles, type QuranCircle, type CircleFilters } from "@/lib/quran-circles-service";
import { applyPageSeo } from "@/lib/seo";
import { arabicMatchAny } from "@/lib/arabic-search";
import { ShareButtons } from "@/components/ContentActions";
import { IslamicDivider } from "@/components/design/IslamicDivider";

const LEVEL_OPTIONS = ["الكل", "مبتدئ", "متوسط", "متقدم"];
const TRACK_OPTIONS = ["الكل", "رجال", "نساء", "أطفال", "عام"];
const MODE_OPTIONS  = ["الكل", "حضوري", "عن بُعد", "هجين"];

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`qcp-filter-pill${active ? " is-active" : ""}`}
    >
      {label}
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="qc-card qcp-skeleton">
      <div className="qc-card__head qcp-skeleton__head" />
      <div className="qc-card__body">
        <div className="qcp-skeleton__bar qcp-skeleton__bar--1" />
        <div className="qcp-skeleton__bar qcp-skeleton__bar--2" />
      </div>
    </div>
  );
}

export default function QuranCirclesPage() {
  const [circles, setCircles] = useState<QuranCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/quran-circles",
      title: "حلقات القرآن الكريم | المجلس العلمي",
      description: "اعثر على حلقات تحفيظ القرآن الكريم المناسبة، حلقات مختلطة وللرجال وللنساء بمستويات متدرجة.",
      keywords: ["حلقات قرآن", "تحفيظ قرآن", "حلقة قرآنية", "حفظ القرآن", "تجويد"],
      jsonLd: [{ "@context": "https://schema.org", "@type": "WebPage", name: "حلقات القرآن الكريم", url: "https://majlisilm.com/quran-circles", about: { "@type": "Thing", name: "حلقات تحفيظ وتجويد القرآن الكريم" } }],
    });
  }, []);
  const [level, setLevel]     = useState("الكل");
  const [track, setTrack]     = useState("الكل");
  const [mode, setMode]       = useState("الكل");
  const [search, setSearch]   = useState("");

  const filteredCircles = useMemo(() =>
    search.trim()
      ? circles.filter(c => arabicMatchAny([c.name, c.sheikh_name ?? "", c.location ?? "", c.description ?? ""], search))
      : circles,
  [circles, search]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const filters: CircleFilters = {};
    if (level !== "الكل") filters.level = level;
    if (track !== "الكل") filters.track = track;
    if (mode  !== "الكل") filters.mode  = mode;

    getQuranCircles(filters)
      .then(setCircles)
      .catch(() => setError("تعذّر تحميل الحلقات، تحقق من الاتصال وحاول مجدداً."))
      .finally(() => setLoading(false));
  }, [level, track, mode]);

  return (
    <div className="ds-page" dir="rtl">
      <header className="qcp-header">
        <p className="qcp-eyebrow">حفظ القرآن الكريم</p>
        <h1 className="qcp-title">حلقات التحفيظ</h1>
        <p className="qcp-subtitle">ابحث عن حلقة تناسبك وانضم إليها، مستويات ومسارات متعددة.</p>
      </header>

      <div className="qcp-filters">
        <div className="qcp-filter-row">
          <span className="qcp-filter-label">المستوى:</span>
          {LEVEL_OPTIONS.map((o) => (
            <FilterPill key={o} label={o} active={level === o} onClick={() => setLevel(o)} />
          ))}
        </div>
        <div className="qcp-filter-row">
          <span className="qcp-filter-label">المسار:</span>
          {TRACK_OPTIONS.map((o) => (
            <FilterPill key={o} label={o} active={track === o} onClick={() => setTrack(o)} />
          ))}
        </div>
        <div className="qcp-filter-row">
          <span className="qcp-filter-label">النمط:</span>
          {MODE_OPTIONS.map((o) => (
            <FilterPill key={o} label={o} active={mode === o} onClick={() => setMode(o)} />
          ))}
        </div>
      </div>

      <div className="qcp-search-wrap">
        <input
          type="search"
          className="ds-input qcp-search-input"
          placeholder="ابحث باسم الحلقة أو الشيخ أو الموقع..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="بحث في حلقات القرآن"
        />
      </div>

      <IslamicDivider />

      {error ? (
        <div role="alert" className="qcp-error">
          <p className="qcp-error__msg"><AlertTriangle size={13} className="inline ml-1" />{error}</p>
          <button type="button" onClick={() => setLevel(level)} className="qcp-retry-btn">
            إعادة المحاولة
          </button>
        </div>
      ) : loading ? (
        <div className="qcp-grid">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredCircles.length === 0 ? (
        <div className="qcp-empty">
          <p className="qcp-empty__icon" aria-hidden="true"><Building2 size={40} strokeWidth={1.3} /></p>
          <p className="qcp-empty__title">{search.trim() ? `لا توجد حلقات لـ «${search}»` : "لا توجد حلقات بهذه المعايير حالياً"}</p>
          <p className="qcp-empty__desc">جرّب تغيير الفلاتر أو البحث أو تواصل مع الإدارة لإضافة حلقتك.</p>
          <button
            type="button"
            onClick={() => { setLevel("الكل"); setTrack("الكل"); setMode("الكل"); setSearch(""); }}
            className="qcp-clear-btn"
          >
            إزالة الفلاتر والبحث
          </button>
        </div>
      ) : (
        <div className="qcp-grid">
          {filteredCircles.map((c) => <QuranCircleCard key={c.id} circle={c} />)}
        </div>
      )}

      <div className="twh-share">
        <ShareButtons title="حلقات القرآن الكريم — المجلس العلمي" url="https://majlisilm.com/quran-circles" />
      </div>
    </div>
  );
}
