import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  BookOpen,
  ChevronDown,
  ExternalLink,
  MapPin,
  Phone,
} from "lucide-react";
import { ActiveFilters, type ActiveFilterItem } from "@/components/filters/ActiveFilters";
import { FilterBar } from "@/components/filters/FilterBar";
import { FilterSheet } from "@/components/filters/FilterSheet";
import { applyPageSeo } from "@/lib/seo";
import {
  getQuranCircles,
  type CircleFilters,
  type QuranCircle,
} from "@/lib/quran-circles-service";
import "@/styles/components/filters.css";
import "@/styles/pages/quran-circles.css";

const LEVELS = ["الكل", "مبتدئ", "متوسط", "متقدم"] as const;
const TRACKS = ["الكل", "رجال", "نساء", "أطفال", "عام"] as const;
const MODES = ["الكل", "حضوري", "عن بُعد", "هجين"] as const;

function cleanDescription(text: string): string {
  return text.replace(/\.{4,}/g, ".").trim();
}

function CircleCard({ circle }: { circle: QuranCircle }) {
  const [expanded, setExpanded] = useState(false);
  const description = circle.description ? cleanDescription(circle.description) : null;
  const longDescription = Boolean(description && description.length > 140);

  return (
    <li className="qc-card">
      <h3 className="qc-card__title">{circle.name}</h3>

      <div className="qc-card__badges">
        <span>{circle.level}</span>
        <span>{circle.track}</span>
        <span>{circle.mode}</span>
        {circle.registration_url ? <span className="qc-card__badge--open">تسجيل مفتوح</span> : null}
      </div>

      <ul className="qc-card__facts" aria-label="تفاصيل الحلقة">
        {circle.location ? (
          <li>
            <MapPin size={14} aria-hidden="true" />
            <span>{circle.location}</span>
          </li>
        ) : null}
        {circle.schedule_time || (circle.schedule_days?.length ?? 0) > 0 ? (
          <li>
            <BookOpen size={14} aria-hidden="true" />
            <span>
              {(circle.schedule_days ?? []).join("، ")}
              {circle.schedule_days?.length && circle.schedule_time ? " — " : ""}
              {circle.schedule_time ?? ""}
            </span>
          </li>
        ) : null}
        {circle.contact_info ? (
          <li>
            <Phone size={14} aria-hidden="true" />
            <span>{circle.contact_info}</span>
          </li>
        ) : null}
      </ul>

      {description ? (
        <div className="qc-card__desc-wrap">
          <p className={expanded ? "qc-card__desc is-expanded" : "qc-card__desc"}>{description}</p>
          {longDescription ? (
            <button
              type="button"
              className="qc-card__more"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              {expanded ? "عرض أقل" : "عرض المزيد"}
              <ChevronDown size={14} aria-hidden="true" className={expanded ? "is-flip" : ""} />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="qc-card__actions">
        {circle.registration_url ? (
          <a
            className="qc-card__btn qc-card__btn--primary"
            href={circle.registration_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            تسجيل <ExternalLink size={14} aria-hidden="true" />
          </a>
        ) : null}
        {circle.website_url ? (
          <a
            className="qc-card__btn qc-card__btn--ghost"
            href={circle.website_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            الموقع <ExternalLink size={14} aria-hidden="true" />
          </a>
        ) : null}
        {circle.meeting_link ? (
          <a
            className="qc-card__btn qc-card__btn--ghost"
            href={circle.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
          >
            رابط الحلقة <ExternalLink size={14} aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </li>
  );
}

export default function QuranCirclesPage() {
  const [circles, setCircles] = useState<QuranCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [level, setLevel] = useState<string>("الكل");
  const [track, setTrack] = useState<string>("الكل");
  const [mode, setMode] = useState<string>("الكل");
  const [governorate, setGovernorate] = useState<string>("الكل");
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    applyPageSeo({
      path: "/quran-circles",
      title: "حلقات تحفيظ القرآن | المجلس العلمي",
      description:
        "دليل حلقات تحفيظ القرآن في الكويت والمنصات الموثوقة — بروابط تسجيل وتواصل من وزارة الأوقاف والمصادر المعلنة.",
      keywords: ["حلقات قرآن", "تحفيظ", "أوقاف الكويت", "حلقات عن بعد"],
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const filters: CircleFilters = {};
    if (level !== "الكل") filters.level = level;
    if (track !== "الكل") filters.track = track;
    if (mode !== "الكل") filters.mode = mode;
    try {
      const rows = await getQuranCircles(filters);
      setCircles(rows);
    } catch {
      setCircles([]);
    } finally {
      setLoading(false);
    }
  }, [level, track, mode]);

  useEffect(() => {
    void load();
  }, [load]);

  const governorateOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of circles) {
      if (c.governorate) set.add(c.governorate);
    }
    return ["الكل", ...[...set].sort((a, b) => a.localeCompare(b, "ar"))];
  }, [circles]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (level !== "الكل") n += 1;
    if (track !== "الكل") n += 1;
    if (mode !== "الكل") n += 1;
    if (governorate !== "الكل") n += 1;
    if (registrationOpen) n += 1;
    return n;
  }, [level, track, mode, governorate, registrationOpen]);

  const activeFilterItems = useMemo((): ActiveFilterItem[] => {
    const items: ActiveFilterItem[] = [];
    if (track !== "الكل") {
      items.push({ id: "track", label: track, onRemove: () => setTrack("الكل") });
    }
    if (level !== "الكل") {
      items.push({ id: "level", label: level, onRemove: () => setLevel("الكل") });
    }
    if (mode !== "الكل") {
      items.push({ id: "mode", label: mode, onRemove: () => setMode("الكل") });
    }
    if (governorate !== "الكل") {
      items.push({ id: "gov", label: governorate, onRemove: () => setGovernorate("الكل") });
    }
    if (registrationOpen) {
      items.push({
        id: "reg",
        label: "تسجيل مفتوح",
        onRemove: () => setRegistrationOpen(false),
      });
    }
    return items;
  }, [track, level, mode, governorate, registrationOpen]);

  const clearAllFilters = useCallback(() => {
    setLevel("الكل");
    setTrack("الكل");
    setMode("الكل");
    setGovernorate("الكل");
    setRegistrationOpen(false);
  }, []);

  const visible = useMemo(() => {
    const needle = q.trim();
    return circles.filter((c) => {
      if (governorate !== "الكل" && (c.governorate || "أخرى") !== governorate) return false;
      if (registrationOpen && !c.registration_url) return false;
      if (!needle) return true;
      const hay = [
        c.name,
        c.location ?? "",
        c.governorate ?? "",
        c.description ?? "",
        c.sheikh_name ?? "",
      ].join(" ");
      return hay.includes(needle);
    });
  }, [circles, q, governorate, registrationOpen]);

  const byGov = useMemo(() => {
    const map = new Map<string, QuranCircle[]>();
    for (const c of visible) {
      const key = c.governorate || (c.mode === "عن بُعد" ? "عن بُعد" : "أخرى");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return [...map.entries()];
  }, [visible]);

  return (
    <div className="qc-page" dir="rtl">
      <header className="qc-hero">
        <p className="qc-hero__eyebrow">دليل التحفيظ</p>
        <h1 className="qc-hero__title">حلقات تحفيظ القرآن</h1>
        <p className="qc-hero__lead">
          بيانات أولية من إدارة شؤون القرآن الكريم بوزارة الأوقاف الكويتية ومنصات موثوقة
          معلنة. تحقق من روابط التسجيل قبل الالتحاق؛ الجداول قد تتغيّر.
        </p>
        <div className="qc-hero__links">
          <Link href="/quran-hub">مركز القرآن</Link>
          <Link href="/quran-memorization">اختبارات الحفظ</Link>
          <Link href="/quran/memorization-plans">خطط الحفظ</Link>
        </div>
      </header>

      <section className="qc-toolbar" aria-label="بحث وتصفية الحلقات">
        <FilterBar
          searchValue={q}
          onSearchChange={setQ}
          searchPlaceholder="بحث بالاسم أو الموقع…"
          searchAriaLabel="بحث في الحلقات"
          activeCount={activeFilterCount}
          onOpenFilters={() => setFiltersOpen(true)}
          filtersOpen={filtersOpen}
          filterToggleLabel="فلترة"
          onClearAll={activeFilterCount > 0 ? clearAllFilters : undefined}
        />
        <ActiveFilters
          items={activeFilterItems}
          onClearAll={activeFilterItems.length > 1 ? clearAllFilters : undefined}
          resultCount={loading ? null : visible.length}
        />
      </section>

      <FilterSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="تصفية الحلقات">
        <div className="mj-filter-fields">
          <label>
            المستوى
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              {LEVELS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <label>
            المسار
            <select value={track} onChange={(e) => setTrack(e.target.value)}>
              {TRACKS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <label>
            النمط
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              {MODES.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <label>
            المحافظة / المنطقة
            <select value={governorate} onChange={(e) => setGovernorate(e.target.value)}>
              {governorateOptions.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <label>
            الجنس
            <select
              value={track === "رجال" || track === "نساء" ? track : "الكل"}
              onChange={(e) => {
                const v = e.target.value;
                setTrack(v === "الكل" ? "الكل" : v);
              }}
            >
              <option value="الكل">الكل</option>
              <option value="رجال">رجال</option>
              <option value="نساء">نساء</option>
            </select>
          </label>
          <label className="qc-sheet-check">
            <input
              type="checkbox"
              checked={registrationOpen}
              onChange={(e) => setRegistrationOpen(e.target.checked)}
            />
            <span>تسجيل مفتوح</span>
          </label>
        </div>
      </FilterSheet>

      {loading ? (
        <p className="qc-empty">جارٍ تحميل الدليل…</p>
      ) : visible.length === 0 ? (
        <p className="qc-empty">لا حلقات مطابقة للمرشّحات الحالية.</p>
      ) : (
        byGov.map(([gov, list]) => (
          <section key={gov} className="qc-group">
            <h2 className="qc-group__title">{gov}</h2>
            <ul className="qc-list">
              {list.map((c) => (
                <CircleCard key={c.id} circle={c} />
              ))}
            </ul>
          </section>
        ))
      )}

      <footer className="qc-footnote">
        المصدر الأساسي لبيانات الكويت:{" "}
        <a href="https://quran.awqaf.gov.kw" target="_blank" rel="noopener noreferrer">
          شؤون القرآن — الأوقاف الكويتية
        </a>
        . أي تعارض مع الموقع الرسمي يُقدَّم فيه قول الأوقاف.
      </footer>
    </div>
  );
}
