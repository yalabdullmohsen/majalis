import { useEffect, useState, useMemo } from "react";
import { AlertTriangle, Building2, Globe, MapPin } from "lucide-react";
import { QuranCircleCard } from "@/components/circles/QuranCircleCard";
import { getQuranCircles, type QuranCircle, type CircleFilters } from "@/lib/quran-circles-service";
import { applyPageSeo } from "@/lib/seo";
import { arabicMatchAny } from "@/lib/arabic-search";
import { ShareButtons } from "@/components/ContentActions";
import { IslamicDivider } from "@/components/design/IslamicDivider";

const LEVEL_OPTIONS = ["الكل", "مبتدئ", "متوسط", "متقدم"];
const TRACK_OPTIONS = ["الكل", "رجال", "نساء", "أطفال", "عام"];
const MODE_OPTIONS  = ["الكل", "حضوري", "عن بُعد", "هجين"];
const GOV_OPTIONS   = ["الكل", "العاصمة", "حولي", "الفروانية", "الجهراء", "مبارك الكبير", "الأحمدي", "جميع المحافظات"];

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

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <div className="qcp-section-header" dir="rtl">
      <span className="qcp-section-header__icon">{icon}</span>
      <h2 className="qcp-section-header__title">{title}</h2>
      <span className="qcp-section-header__count">{count} حلقة</span>
    </div>
  );
}

export default function QuranCirclesPage() {
  const [circles, setCircles]   = useState<QuranCircle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [level, setLevel]       = useState("الكل");
  const [track, setTrack]       = useState("الكل");
  const [mode, setMode]         = useState("الكل");
  const [gov, setGov]           = useState("الكل");
  const [search, setSearch]     = useState("");

  useEffect(() => {
    applyPageSeo({
      path: "/quran-circles",
      title: "حلقات القرآن الكريم في الكويت وعالمياً | المجلس العلمي",
      description: "دليل شامل لحلقات تحفيظ القرآن الكريم في الكويت (حضوري) ومنصات التحفيظ الإلكترونية الموثوقة من جميع أنحاء العالم، مع روابط التسجيل والتواصل المباشر.",
      keywords: ["حلقات قرآن الكويت", "تحفيظ قرآن", "حلقة قرآنية", "حفظ القرآن", "تجويد", "مراكز وزارة الأوقاف الكويت", "حلقات قرآن اونلاين"],
      jsonLd: [{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "حلقات القرآن الكريم في الكويت وعالمياً",
        url: "https://majlisilm.com/quran-circles",
        about: { "@type": "Thing", name: "حلقات تحفيظ وتجويد القرآن الكريم" },
      }],
    });
  }, []);

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

  const filteredCircles = useMemo(() => {
    let list = circles;
    if (gov !== "الكل") {
      list = list.filter((c) => (c as any).governorate === gov);
    }
    if (search.trim()) {
      list = list.filter((c) =>
        arabicMatchAny([c.name, c.sheikh_name ?? "", c.location ?? "", c.description ?? ""], search),
      );
    }
    return list;
  }, [circles, search, gov]);

  const kuwaitCircles  = filteredCircles.filter((c) => c.mode !== "عن بُعد" || (c as any).governorate === "الكويت");
  const onlineCircles  = filteredCircles.filter((c) => c.mode === "عن بُعد" && !(c as any).governorate);
  const hybridKuwait   = filteredCircles.filter((c) => c.mode === "هجين");

  const visibleKuwait = [...kuwaitCircles.filter((c) => c.mode !== "عن بُعد"), ...hybridKuwait]
    .filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i);

  const resetAll = () => {
    setLevel("الكل"); setTrack("الكل"); setMode("الكل");
    setGov("الكل"); setSearch("");
  };

  return (
    <div className="ds-page" dir="rtl">
      {/* ── الرأس ── */}
      <header className="qcp-header">
        <p className="qcp-eyebrow">حفظ القرآن الكريم</p>
        <h1 className="qcp-title">حلقات التحفيظ</h1>
        <p className="qcp-subtitle">
          دليل شامل لحلقات تحفيظ القرآن في الكويت — حضوري وعبر الإنترنت.
          جميع الحلقات موثّقة مع روابط التسجيل والتواصل المباشر.
        </p>

        {/* إحصائيات سريعة */}
        <div className="qcp-stats-row">
          <div className="qcp-stat">
            <MapPin size={15} className="inline ml-1" />
            <strong>60+</strong> مركز تحفيظ في الكويت
          </div>
          <div className="qcp-stat">
            <Globe size={15} className="inline ml-1" />
            <strong>8</strong> منصات إلكترونية موثوقة
          </div>
        </div>
      </header>

      {/* ── الفلاتر ── */}
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
        <div className="qcp-filter-row">
          <span className="qcp-filter-label">المحافظة:</span>
          {GOV_OPTIONS.map((o) => (
            <FilterPill key={o} label={o} active={gov === o} onClick={() => setGov(o)} />
          ))}
        </div>
      </div>

      {/* البحث */}
      <div className="qcp-search-wrap">
        <input
          type="search"
          className="ds-input qcp-search-input"
          placeholder="ابحث باسم الحلقة أو المنصة أو المحافظة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="بحث في حلقات القرآن"
        />
      </div>

      {/* رابط التسجيل الرسمي */}
      <div className="qcp-reg-banner" dir="rtl">
        <div className="qcp-reg-banner__content">
          <Building2 size={18} className="inline ml-2" />
          <strong>تسجيل رسمي — وزارة الأوقاف الكويتية:</strong>
          <span className="qcp-reg-banner__desc"> سجّل إلكترونياً في مراكز التحفيظ الحكومية بالرقم المدني</span>
        </div>
        <a
          href="https://halakat.awqaf.gov.kw/Home/RegisterStudent"
          target="_blank"
          rel="noopener noreferrer"
          className="qcp-reg-banner__btn"
        >
          سجّل الآن ←
        </a>
      </div>

      <IslamicDivider />

      {/* المحتوى */}
      {error ? (
        <div role="alert" className="qcp-error">
          <p className="qcp-error__msg">
            <AlertTriangle size={13} className="inline ml-1" />
            {error}
          </p>
          <button type="button" onClick={() => setLevel(level)} className="qcp-retry-btn">
            إعادة المحاولة
          </button>
        </div>
      ) : loading ? (
        <div className="qcp-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredCircles.length === 0 ? (
        <div className="qcp-empty">
          <p className="qcp-empty__icon" aria-hidden="true">
            <Building2 size={40} strokeWidth={1.3} />
          </p>
          <p className="qcp-empty__title">
            {search.trim() ? `لا توجد حلقات لـ «${search}»` : "لا توجد حلقات بهذه المعايير حالياً"}
          </p>
          <p className="qcp-empty__desc">
            جرّب تغيير الفلاتر أو البحث أو تواصل مع الإدارة لإضافة حلقتك.
          </p>
          <button type="button" onClick={resetAll} className="qcp-clear-btn">
            إزالة الفلاتر
          </button>
        </div>
      ) : (
        <>
          {/* حلقات الكويت الحضورية والهجينة */}
          {visibleKuwait.length > 0 && (
            <section aria-label="حلقات الكويت">
              <SectionHeader
                icon={<MapPin size={18} />}
                title="حلقات الكويت — حضوري وهجين"
                count={visibleKuwait.length}
              />
              <div className="qcp-grid">
                {visibleKuwait.map((c) => <QuranCircleCard key={c.id} circle={c} />)}
              </div>
            </section>
          )}

          {/* الحلقات الإلكترونية العالمية */}
          {onlineCircles.length > 0 && (
            <section aria-label="حلقات إلكترونية عالمية" style={{ marginTop: "2rem" }}>
              <SectionHeader
                icon={<Globe size={18} />}
                title="حلقات إلكترونية — عالمية موثوقة"
                count={onlineCircles.length}
              />
              <div className="qcp-grid">
                {onlineCircles.map((c) => <QuranCircleCard key={c.id} circle={c} />)}
              </div>
            </section>
          )}
        </>
      )}

      <div className="twh-share">
        <ShareButtons title="حلقات القرآن الكريم — المجلس العلمي" url="https://majlisilm.com/quran-circles" />
      </div>
    </div>
  );
}
