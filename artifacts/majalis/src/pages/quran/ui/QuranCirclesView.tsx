import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  BookOpen,
  ExternalLink,
  Filter,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import {
  getQuranCircles,
  type CircleFilters,
  type QuranCircle,
} from "@/lib/quran-circles-service";
import "@/styles/pages/quran-circles.css";

const LEVELS = ["الكل", "مبتدئ", "متوسط", "متقدم"] as const;
const TRACKS = ["الكل", "رجال", "نساء", "أطفال", "عام"] as const;
const MODES = ["الكل", "حضوري", "عن بُعد", "هجين"] as const;

export default function QuranCirclesPage() {
  const [circles, setCircles] = useState<QuranCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<string>("الكل");
  const [track, setTrack] = useState<string>("الكل");
  const [mode, setMode] = useState<string>("الكل");
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

  const visible = useMemo(() => {
    const needle = q.trim();
    if (!needle) return circles;
    return circles.filter((c) => {
      const hay = [
        c.name,
        c.location ?? "",
        c.governorate ?? "",
        c.description ?? "",
        c.sheikh_name ?? "",
      ].join(" ");
      return hay.includes(needle);
    });
  }, [circles, q]);

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
          بيانات أولية من إدارة شؤون القرآن الكريم بوزارة الأوقاف الكويتية
          ومنصات موثوقة معلنة. تحقق من روابط التسجيل قبل الالتحاق؛ الجداول
          قد تتغيّر.
        </p>
        <div className="qc-hero__links">
          <Link href="/quran-hub">مركز القرآن</Link>
          <Link href="/quran-memorization">اختبارات الحفظ</Link>
          <Link href="/quran/memorization-plans">خطط الحفظ</Link>
        </div>
      </header>

      <section className="qc-filters" aria-label="تصفية الحلقات">
        <div className="qc-filters__search">
          <Filter size={16} aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث بالاسم أو الموقع أو المحافظة…"
            aria-label="بحث في الحلقات"
          />
        </div>
        <div className="qc-filters__row">
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
        </div>
        <p className="qc-filters__count">
          {loading ? "" : `${visible.length} حلقة`}
        </p>
      </section>

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
                <li key={c.id} className="qc-card">
                  <div className="qc-card__head">
                    <Users size={18} aria-hidden="true" />
                    <h3>{c.name}</h3>
                  </div>
                  <div className="qc-card__badges">
                    <span>{c.level}</span>
                    <span>{c.track}</span>
                    <span>{c.mode}</span>
                  </div>
                  {c.location ? (
                    <p className="qc-card__meta">
                      <MapPin size={14} aria-hidden="true" /> {c.location}
                    </p>
                  ) : null}
                  {c.schedule_time ? (
                    <p className="qc-card__meta">
                      <BookOpen size={14} aria-hidden="true" />{" "}
                      {(c.schedule_days ?? []).join("، ")}
                      {c.schedule_days?.length ? " — " : ""}
                      {c.schedule_time}
                    </p>
                  ) : null}
                  {c.contact_info ? (
                    <p className="qc-card__meta">
                      <Phone size={14} aria-hidden="true" /> {c.contact_info}
                    </p>
                  ) : null}
                  {c.description ? (
                    <p className="qc-card__desc">
                      {c.description.replace(/\.{4,}/g, ".").slice(0, 220)}
                      {c.description.length > 220 ? "…" : ""}
                    </p>
                  ) : null}
                  <div className="qc-card__actions">
                    {c.registration_url ? (
                      <a
                        href={c.registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        تسجيل <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    ) : null}
                    {c.website_url ? (
                      <a
                        href={c.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        الموقع <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    ) : null}
                    {c.meeting_link ? (
                      <a
                        href={c.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        رابط الحلقة <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <footer className="qc-footnote">
        المصدر الأساسي لبيانات الكويت:{" "}
        <a
          href="https://quran.awqaf.gov.kw"
          target="_blank"
          rel="noopener noreferrer"
        >
          شؤون القرآن — الأوقاف الكويتية
        </a>
        . أي تعارض مع الموقع الرسمي يُقدَّم فيه قول الأوقاف.
      </footer>
    </div>
  );
}
