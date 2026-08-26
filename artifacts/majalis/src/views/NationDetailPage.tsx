import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRoute } from "wouter";
import { ChevronLeft, ChevronRight, BookOpen, ListTree, Clock, MapPin, Heart } from "lucide-react";
import { PageHeader } from "@/components/ui-common";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import {
  getNation,
  getNationNeighbors,
  estimateReadingMinutes,
  type Evidence,
  type Nation,
} from "@/lib/nations-seed";
import { PunishmentIcon } from "@/components/nations/PunishmentIcon";
import "@/styles/nations.css";

const READ_POS_KEY = "nations:last-chapter";
const FAV_KEY = "nations:favorites";

const EVIDENCE_LABEL: Record<Evidence["kind"], string> = {
  quran: "قرآن",
  hadith: "حديث صحيح",
  tafsir: "قول مفسّر",
  disputed: "مسألة خلافية",
  unverified: "رواية غير ثابتة",
};

export default function NationDetailPage() {
  const [, params] = useRoute("/nations/:slug");
  const slug = params?.slug ?? "";
  const nation = getNation(slug);
  const { prev, next } = getNationNeighbors(slug);

  const [mode, setMode] = useState<"summary" | "full">("full");
  const [progress, setProgress] = useState(0);
  const [fav, setFav] = useState(false);
  const [resumeChapter, setResumeChapter] = useState<string | null>(null);
  const articleRef = useRef<HTMLDivElement>(null);

  const minutes = useMemo(() => (nation ? estimateReadingMinutes(nation) : 0), [nation]);

  useEffect(() => {
    if (!nation) return;
    applyPageSeo({
      path: `/nations/${nation.slug}`,
      title: `${nation.name} | الأمم السابقة — المجلس العلمي`,
      description: nation.summary.slice(0, 300),
      keywords: [nation.name, ...nation.aliases, nation.punishment.type],
      jsonLd: [
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "الأمم السابقة", path: "/nations" },
          { name: nation.name, path: `/nations/${nation.slug}` },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: nation.name,
          description: nation.summary.slice(0, 300),
          inLanguage: "ar",
          url: `https://majlisilm.com/nations/${nation.slug}`,
        },
      ],
    });
  }, [nation]);

  // شريط التقدم داخل القصة + حفظ آخر موضع قراءة
  useEffect(() => {
    if (!nation) return;
    const el = articleRef.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight - window.innerHeight;
      const passed = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      setProgress(total > 0 ? Math.round((passed / total) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [nation, mode]);

  useEffect(() => {
    if (!nation) return;
    try {
      const saved = JSON.parse(localStorage.getItem(READ_POS_KEY) || "{}");
      if (saved[nation.slug]) setResumeChapter(saved[nation.slug]);
      const favs: string[] = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      setFav(favs.includes(nation.slug));
    } catch {
      /* تخزين محلي غير متاح — لا يؤثر على عرض المحتوى */
    }
  }, [nation]);

  const saveChapter = (id: string) => {
    if (!nation) return;
    try {
      const saved = JSON.parse(localStorage.getItem(READ_POS_KEY) || "{}");
      saved[nation.slug] = id;
      localStorage.setItem(READ_POS_KEY, JSON.stringify(saved));
    } catch {
      /* تجاهل */
    }
  };

  const toggleFav = () => {
    if (!nation) return;
    try {
      const favs: string[] = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      const nextFavs = favs.includes(nation.slug)
        ? favs.filter((s) => s !== nation.slug)
        : [...favs, nation.slug];
      localStorage.setItem(FAV_KEY, JSON.stringify(nextFavs));
      setFav(nextFavs.includes(nation.slug));
    } catch {
      /* تجاهل */
    }
  };

  if (!nation) {
    return (
      <div className="page-shell nations-page" dir="rtl">
        <PageHeader eyebrow="الأمم السابقة" title="لم نجد هذه الأمة" />
        <p className="nations-empty">
          الرابط الذي فتحته لا يطابق أي أمة في القسم.{" "}
          <Link href="/nations" className="nations-link">عُد إلى فهرس الأمم السابقة</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="page-shell nations-page nation-detail" dir="rtl">
      <div className="nation-progress" aria-hidden="true">
        <div className="nation-progress__bar" style={{ width: `${progress}%` }} />
      </div>

      <PageHeader eyebrow="الأمم السابقة" title={nation.name} subtitle={nation.summary} />

      <div className="nation-actions">
        <button
          type="button"
          className={`nation-action${fav ? " is-active" : ""}`}
          onClick={toggleFav}
          aria-pressed={fav}
        >
          <Heart size={16} aria-hidden="true" /> {fav ? "في المفضلة" : "أضف للمفضلة"}
        </button>
        <span className="nation-action nation-action--static">
          <Clock size={16} aria-hidden="true" /> {minutes} دقيقة
        </span>
        <div className="nation-mode" role="tablist" aria-label="وضع القراءة">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "summary"}
            className={`nation-mode__btn${mode === "summary" ? " is-active" : ""}`}
            onClick={() => setMode("summary")}
          >
            مختصر
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "full"}
            className={`nation-mode__btn${mode === "full" ? " is-active" : ""}`}
            onClick={() => setMode("full")}
          >
            كامل
          </button>
        </div>
      </div>

      {/* الشريط البصري: النبي ← الدعوة ← الموقف ← العقوبة ← النجاة */}
      <ol className="nation-flow" aria-label="مسار القصة">
        <li className="nation-flow__step">
          <span className="nation-flow__label">النبي</span>
          <span className="nation-flow__value">
            {nation.prophetKnown && nation.prophet ? nation.prophet.name : "لم يُسمَّ"}
          </span>
        </li>
        <li className="nation-flow__step">
          <span className="nation-flow__label">الدعوة</span>
          <span className="nation-flow__value">{nation.dawahMethod ? "بلاغ وإنذار" : "لم يرد تفصيل"}</span>
        </li>
        <li className="nation-flow__step">
          <span className="nation-flow__label">موقفهم</span>
          <span className="nation-flow__value">{nation.believed ? "آمن منهم" : "كذّبوا"}</span>
        </li>
        <li className="nation-flow__step">
          <span className="nation-flow__label">العقوبة</span>
          <span className="nation-flow__value">
            <PunishmentIcon type={nation.punishment.type} size={16} /> {nation.punishment.type}
          </span>
        </li>
        <li className="nation-flow__step">
          <span className="nation-flow__label">النجاة</span>
          <span className="nation-flow__value">{nation.survivors.split("،")[0]}</span>
        </li>
      </ol>

      <section className="nation-facts" aria-label="بطاقة التعريف">
        <Fact label="المكان" value={nation.place} icon={<MapPin size={15} />} />
        <Fact label="الحقبة" value={nation.era} />
        <Fact label="سبب العقوبة" value={nation.sin} />
        <Fact label="وصف العقوبة" value={nation.punishment.description} />
        <Fact label="من نجا" value={nation.survivors} />
        {nation.dawahMethod && <Fact label="أسلوب الدعوة" value={nation.dawahMethod} />}
        <Fact label="موقفهم من الدعوة" value={nation.response} />
        <Fact label="أبرز صفاتهم" value={nation.traits.join(" · ")} />
      </section>

      {mode === "full" && (
        <>
          <nav className="nation-toc" aria-label="فهرس القصة">
            <h2 className="nation-toc__title">
              <ListTree size={16} aria-hidden="true" /> فهرس القصة
            </h2>
            <ol className="nation-toc__list">
              {nation.chapters.map((c) => (
                <li key={c.id}>
                  <a href={`#ch-${c.id}`} className="nation-toc__link" onClick={() => saveChapter(c.id)}>
                    {c.title}
                  </a>
                </li>
              ))}
            </ol>
            {resumeChapter && (
              <a href={`#ch-${resumeChapter}`} className="nation-toc__resume">
                تابع القراءة من آخر موضع
              </a>
            )}
          </nav>

          <div className="nation-story" ref={articleRef}>
            {nation.chapters.map((c) => (
              <article key={c.id} id={`ch-${c.id}`} className="nation-chapter">
                <h2 className="nation-chapter__title">{c.title}</h2>
                {c.body.map((p, i) => (
                  <p key={i} className="nation-chapter__p">{p}</p>
                ))}
                {c.notKnown && (
                  <p className="nation-notknown">
                    <strong>حدّ النص:</strong> {c.notKnown}
                  </p>
                )}
                {c.evidences && c.evidences.length > 0 && (
                  <div className="nation-evidences">
                    {c.evidences.map((e, i) => (
                      <EvidenceBlock key={i} evidence={e} />
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}

      <section className="nation-section">
        <h2 className="nation-section__title">
          <BookOpen size={16} aria-hidden="true" /> مواضع القصة في القرآن
        </h2>
        <ul className="nation-refs">
          {nation.quranRefs.map((r, i) => (
            <li key={i} className="nation-ref">
              <span className="nation-ref__surah">{r.surah}: {r.ayahs}</span>
              {r.note && <span className="nation-ref__note">{r.note}</span>}
            </li>
          ))}
        </ul>
        <Link href="/quran-hub" className="nations-link">افتح المصحف واقرأ المواضع كاملة</Link>
      </section>

      {nation.hadiths.length > 0 && (
        <section className="nation-section">
          <h2 className="nation-section__title">الأحاديث الصحيحة المتعلقة</h2>
          <div className="nation-evidences">
            {nation.hadiths.map((h, i) => (
              <EvidenceBlock key={i} evidence={h} />
            ))}
          </div>
        </section>
      )}

      <section className="nation-section">
        <h2 className="nation-section__title">ما ثبت وما لم يثبت وما اختُلف فيه</h2>
        <ul className="nation-status-list">
          {nation.establishedVsDisputed.map((row, i) => (
            <li key={i} className={`nation-status nation-status--${statusClass(row.status)}`}>
              <span className="nation-status__badge">{row.status}</span>
              <span className="nation-status__claim">{row.claim}</span>
              <span className="nation-status__note">{row.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="nation-section">
        <h2 className="nation-section__title">العبر والفوائد</h2>
        <ul className="nation-list">
          {nation.lessons.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      </section>

      <section className="nation-section">
        <h2 className="nation-section__title">أوجه التشابه والاختلاف مع بقية الأمم</h2>
        <ul className="nation-list">
          {nation.comparisons.map((c, i) => <li key={i}>{c}</li>)}
        </ul>
      </section>

      <section className="nation-section nation-section--today">
        <h2 className="nation-section__title">ماذا نتعلم من قصتهم اليوم؟</h2>
        <ul className="nation-list">
          {nation.todayLesson.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </section>

      {nation.approxLocation && (
        <section className="nation-section">
          <h2 className="nation-section__title">
            <MapPin size={16} aria-hidden="true" /> الموقع التقريبي
          </h2>
          <p className="nation-map-note">
            {nation.approxLocation.label}. الموقع <strong>تقريبي</strong> مبني على ما دلّت عليه
            النصوص وأقوال أهل العلم، ولا يُقصد به تحديد قاطع.
          </p>
          <a
            className="nations-link"
            href={`https://www.google.com/maps?q=${nation.approxLocation.lat},${nation.approxLocation.lng}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            عرض الموقع التقريبي على الخريطة
          </a>
        </section>
      )}

      <nav className="nation-nav" aria-label="التنقل بين الأمم">
        {prev ? (
          <Link href={`/nations/${prev.slug}`} className="nation-nav__btn">
            <ChevronRight size={16} aria-hidden="true" /> {prev.name}
          </Link>
        ) : <span />}
        <Link href="/nations" className="nation-nav__index">فهرس الأمم</Link>
        {next ? (
          <Link href={`/nations/${next.slug}`} className="nation-nav__btn">
            {next.name} <ChevronLeft size={16} aria-hidden="true" />
          </Link>
        ) : <span />}
      </nav>

      <div className="nations-share">
        <ShareButtons
          title={`${nation.name} — الأمم السابقة | المجلس العلمي`}
          url={`https://majlisilm.com/nations/${nation.slug}`}
        />
      </div>
    </div>
  );
}

function statusClass(status: Nation["establishedVsDisputed"][number]["status"]) {
  if (status === "ثابت") return "established";
  if (status === "مختلف فيه") return "disputed";
  return "unverified";
}

function Fact({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="nation-fact">
      <span className="nation-fact__label">{icon} {label}</span>
      <span className="nation-fact__value">{value}</span>
    </div>
  );
}

function EvidenceBlock({ evidence }: { evidence: Evidence }) {
  return (
    <blockquote className={`nation-evidence nation-evidence--${evidence.kind}`}>
      <span className="nation-evidence__kind">{EVIDENCE_LABEL[evidence.kind]}</span>
      <p className="nation-evidence__text">{evidence.text}</p>
      <cite className="nation-evidence__ref">
        {evidence.ref}
        {evidence.grade ? ` — ${evidence.grade}` : ""}
      </cite>
    </blockquote>
  );
}
