import { useState, useCallback, useEffect, useRef } from "react";
import { CalendarDays, Heart, HelpCircle, LayoutList, Link2 } from "lucide-react";
import { Link } from "wouter";
import { PROPHETS, getProphet, searchProphets, type ProphetRecord } from "@/lib/prophets-data";
import { applyPageSeo } from "@/lib/seo";
import { supabase } from "@/lib/supabase";

type Citation = { surah: string; ayahs: string; note: string };

// ── Palette & Helpers ────────────────────────────────────────────────────────

const PROPHET_HUE: Record<string, string> = {
  adam: "#5D726A", idris: "#4A6B6B", nuh: "#3D6560", hud: "#5A7066",
  salih: "#5B6B60", ibrahim: "#18362A", lut: "#3A6A4A", ismail: "#2A5E42",
  "is-haq": "#3D6050", yaqub: "#356055", yusuf: "#2D5545", ayyub: "#4A6055",
  shuayb: "#25504A", musa: "#18362A", harun: "#1E4A38", "dhul-kifl": "#354A42",
  dawud: "#2A3E35", sulayman: "#153025", ilyas: "#3A5548", "al-yasa": "#266050",
  yunus: "#1A5555", zakariyya: "#2A503C", yahya: "#205540", isa: "#1E3F50",
  muhammad: "#18362A",
};

const GOLD = "#BEC7C3";
const GOLD_LIGHT = "#E1E5E3";

function prophetColor(slug: string) { return PROPHET_HUE[slug] || GOLD; }

function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("prophet-bookmarks") || "[]"); }
    catch { return []; }
  });
  const toggle = useCallback((slug: string) => {
    setBookmarks(prev => {
      const next = prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug];
      try { localStorage.setItem("prophet-bookmarks", JSON.stringify(next)); } catch { /* localStorage unavailable */ }
      return next;
    });
  }, []);
  const has = useCallback((slug: string) => bookmarks.includes(slug), [bookmarks]);
  return { toggle, has, count: bookmarks.length };
}

// ── Geometric SVG Components ────────────────────────────────────────────────

function IslamicStar({ size = 32, color = GOLD, opacity = 1 }: { size?: number; color?: string; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" opacity={opacity} aria-hidden="true">
      <polygon
        points="50,2 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"
        fill={color}
      />
    </svg>
  );
}

function GeometricBorder({ color = GOLD, size = 18 }: { color?: string; size?: number }) {
  return (
    <div className="prophet-geo-border">
      {[...Array(3)].map((_, i) => (
        <IslamicStar key={i} size={size} color={color} opacity={0.8 - i * 0.2} />
      ))}
    </div>
  );
}

// ── Quiz Data ────────────────────────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  { q: "من هو أكثر الأنبياء ذكراً في القرآن الكريم؟", a: "موسى", opts: ["إبراهيم", "موسى", "محمد", "عيسى"] },
  { q: "ما لقب نبي الله إبراهيم عليه السلام؟", a: "خليل الله", opts: ["صفيّ الله", "كليم الله", "خليل الله", "روح الله"] },
  { q: "من بنى الكعبة المشرفة مع أبيه؟", a: "إسماعيل", opts: ["إسحاق", "إسماعيل", "يعقوب", "يوسف"] },
  { q: "ما لقب نبي الله يونس عليه السلام؟", a: "ذو النون", opts: ["ذو الكفل", "ذو النون", "كليم الله", "صدّيق"] },
  { q: "من هو خاتم الأنبياء والمرسلين؟", a: "محمد ﷺ", opts: ["عيسى", "إبراهيم", "محمد ﷺ", "موسى"] },
];

// ── ProphetCard ──────────────────────────────────────────────────────────────

function ProphetCard({
  prophet,
  onSelect,
  isBookmarked,
  onBookmark,
}: {
  prophet: ProphetRecord;
  onSelect: () => void;
  isBookmarked: boolean;
  onBookmark: (e: React.MouseEvent) => void;
}) {
  const color = prophetColor(prophet.slug);
  const [hovered, setHovered] = useState(false);

  return (
    <article
      className="prophet-lux-card"
      style={{
        "--prophet-color": color,
        "--prophet-color-light": color + "30",
      } as React.CSSProperties}
      onClick={onSelect}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && onSelect()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      tabIndex={0}
      role="button"
      aria-label={`عرض قصة ${prophet.arabicName} عليه السلام`}
    >
      {/* رقم ترتيبي */}
      <div className="prophet-lux-card__num">{prophet.id}</div>

      {/* أيقونة نجمة */}
      <div className="prophet-lux-card__star">
        <IslamicStar size={36} color={color} opacity={hovered ? 1 : 0.7} />
      </div>

      {/* المحتوى */}
      <div className="prophet-lux-card__body">
        <h3 className="prophet-lux-card__name">
          {prophet.arabicName}
          <span className="prophet-lux-card__pbuh"> عليه السلام</span>
        </h3>
        {prophet.quranTitle && (
          <div className="prophet-lux-card__quran">﴾ {prophet.quranTitle} ﴿</div>
        )}
        <p className="prophet-lux-card__title">{prophet.title}</p>
        <p className="prophet-lux-card__place">{prophet.peopleOrPlace}</p>
        <p className="prophet-lux-card__bio">{prophet.briefBio.slice(0, 100)}…</p>

        <div className="prophet-lux-card__footer">
          <span className="prophet-lux-card__surahs">{prophet.surahCount} سورة</span>
          <span className="prophet-lux-card__read">اقرأ القصة ←</span>
        </div>
      </div>

      {/* زر المفضلة */}
      <button
        type="button"
        className="prophet-lux-card__bookmark"
        onClick={onBookmark}
        aria-label={isBookmarked ? "إزالة من المفضلة" : "إضافة للمفضلة"}
        title={isBookmarked ? "إزالة من المفضلة" : "إضافة للمفضلة"}
      >
        {isBookmarked ? <Heart size={16} className="icon-danger--filled" /> : <Heart size={16} />}
      </button>

      {/* حد خارجي ذهبي */}
      <div className="prophet-lux-card__border" />
    </article>
  );
}

// ── ProphetDetailView ────────────────────────────────────────────────────────

function ProphetDetailView({
  slug,
  onBack,
  onNavigate,
  isBookmarked,
  onBookmark,
}: {
  slug: string;
  onBack: () => void;
  onNavigate: (slug: string) => void;
  isBookmarked: boolean;
  onBookmark: () => void;
}) {
  const p = getProphet(slug);
  const [fontSize, setFontSize] = useState(16);
  const [dbStory, setDbStory] = useState<{ content: string; citations: Citation[] } | null>(null);
  const [dbLoading, setDbLoading] = useState(true);
  const prevProphet = p && p.id > 1 ? PROPHETS[p.id - 2] : null;
  const nextProphet = p && p.id < PROPHETS.length ? PROPHETS[p.id] : null;

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [slug]);

  useEffect(() => {
    setDbStory(null);
    setDbLoading(true);
    supabase
      .from("prophet_stories")
      .select("content, citations")
      .eq("slug", slug)
      .eq("is_approved", true)
      .maybeSingle()
      .then(({ data }) => {
        setDbStory(data ?? null);
        setDbLoading(false);
      });
  }, [slug]);

  if (!p) {
    return (
      <div className="prophet-not-found">
        <button type="button" className="prophet-lux-back" onClick={onBack}>← العودة</button>
        <p className="prophet-not-found__msg">النبي غير موجود</p>
      </div>
    );
  }

  const color = prophetColor(p.slug);

  const share = async () => {
    const text = `${p.arabicName} عليه السلام — ${p.title}\n${p.briefBio.slice(0, 200)}…\n\nمن قصص الأنبياء في المجلس العلمي`;
    const url = `https://majlisilm.com/prophets/${p.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `قصة ${p.arabicName}`, text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        alert("تم نسخ الرابط إلى الحافظة ✓");
      }
    } catch { /* share cancelled */ }
  };

  return (
    <div className="prophet-detail-lux" style={{ "--prophet-color": color } as React.CSSProperties}>
      {/* زر العودة */}
      <div className="prophet-detail-lux__topbar">
        <button type="button" className="prophet-lux-back" onClick={onBack}>← قائمة الأنبياء</button>
        <div className="prophet-detail-lux__actions">
          <button
            type="button"
            className="prophet-action-btn"
            onClick={onBookmark}
            title={isBookmarked ? "إزالة من المفضلة" : "حفظ في المفضلة"}
          >
            {isBookmarked ? <><Heart size={13} className="inline icon-danger--filled ml-1" />محفوظ</> : <><Heart size={13} className="inline ml-1" />احفظ</>}
          </button>
          <button type="button" className="prophet-action-btn" onClick={share} title="مشاركة">
            <Link2 size={13} className="inline ml-1" /> شارك
          </button>
          <div className="prophet-font-controls">
            <button type="button" onClick={() => setFontSize(s => Math.max(13, s - 1))} title="تصغير الخط" aria-label="تصغير الخط">أ−</button>
            <button type="button" onClick={() => setFontSize(s => Math.min(22, s + 1))} title="تكبير الخط" aria-label="تكبير الخط">أ+</button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="prophet-detail-lux__hero">
        <div className="prophet-detail-lux__hero-pattern" aria-hidden="true">
          {[...Array(12)].map((_, i) => (
            <IslamicStar key={i} size={28} color={GOLD} opacity={0.06 + (i % 4) * 0.02} />
          ))}
        </div>
        <div className="prophet-detail-lux__hero-content">
          <div className="prophet-detail-lux__hero-star">
            <IslamicStar size={60} color={color} />
          </div>
          <span className="prophet-detail-lux__num-badge">النبي {p.id} من {PROPHETS.length}</span>
          <h1 className="prophet-detail-lux__name">{p.arabicName}</h1>
          <p className="prophet-detail-lux__pbuh">صلوات الله وسلامه عليه</p>
          {p.quranTitle && (
            <div className="prophet-detail-lux__quran-title">﴾ {p.quranTitle} ﴿</div>
          )}
          <p className="prophet-detail-lux__hero-title">{p.title}</p>
          <GeometricBorder color={color} size={20} />
        </div>
      </div>

      {/* Quick Facts */}
      <div className="prophet-facts-grid">
        <div className="prophet-fact-card">
          <span className="prophet-fact-card__label">القوم / البلد</span>
          <span className="prophet-fact-card__value">{p.peopleOrPlace}</span>
        </div>
        <div className="prophet-fact-card">
          <span className="prophet-fact-card__label">الحقبة</span>
          <span className="prophet-fact-card__value">{p.era}</span>
        </div>
        <div className="prophet-fact-card">
          <span className="prophet-fact-card__label">ذُكر في</span>
          <span className="prophet-fact-card__value">{p.surahCount} سورة</span>
        </div>
        <div className="prophet-fact-card">
          <span className="prophet-fact-card__label">أبرز سورة</span>
          <span className="prophet-fact-card__value">{p.mainSurahs[0] || "—"}</span>
        </div>
      </div>

      {/* قصة كاملة */}
      <article className="prophet-story-lux" style={{ "--pstory-fs": `${fontSize}px` } as React.CSSProperties}>

        {/* النبذة */}
        <section className="prophet-section-lux">
          <div className="prophet-section-lux__header">
            <IslamicStar size={22} color={color} />
            <h2 className="prophet-section-lux__title">نبذة تعريفية</h2>
          </div>
          <p className="prophet-section-lux__text">{p.briefBio}</p>
        </section>

        {/* أبرز السور */}
        <section className="prophet-section-lux">
          <div className="prophet-section-lux__header">
            <IslamicStar size={22} color={color} />
            <h2 className="prophet-section-lux__title">أبرز السور القرآنية</h2>
          </div>
          <div className="prophet-chips-lux">
            {p.mainSurahs.map(s => (
              <span key={s} className="prophet-chip-lux">سورة {s}</span>
            ))}
          </div>
        </section>

        {/* الصفات والمعجزات */}
        <section className="prophet-section-lux">
          <div className="prophet-section-lux__header">
            <IslamicStar size={22} color={color} />
            <h2 className="prophet-section-lux__title">أبرز الصفات والمعجزات</h2>
          </div>
          <ul className="prophet-attrs-list">
            {p.keyAttributes.map((a, i) => (
              <li key={i} className="prophet-attrs-list__item">
                <span className="prophet-attrs-list__bullet">✦</span>
                {a}
              </li>
            ))}
          </ul>
        </section>

        {/* الدروس والعبر */}
        <section className="prophet-section-lux">
          <div className="prophet-section-lux__header">
            <IslamicStar size={22} color={color} />
            <h2 className="prophet-section-lux__title">الدروس والعبر</h2>
          </div>
          <div className="prophet-lessons-grid">
            {p.lessons.map((l, i) => (
              <div key={i} className="prophet-lesson-card">
                <span className="prophet-lesson-card__num">{i + 1}</span>
                <p className="prophet-lesson-card__text">{l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* القصة الكاملة — تُعرض فقط إذا كانت معتمدة في قاعدة البيانات */}
        {!dbLoading && dbStory?.content && (
          <section className="prophet-section-lux">
            <div className="prophet-section-lux__header">
              <IslamicStar size={22} color={color} />
              <h2 className="prophet-section-lux__title">القصة الكاملة</h2>
            </div>
            <div className="prophet-db-story">
              {dbStory.content.split("\n").filter(Boolean).map((para, i) => (
                <p key={i} className="prophet-section-lux__text prophet-db-para">{para}</p>
              ))}
            </div>
          </section>
        )}

        {/* الاستشهادات القرآنية */}
        {!dbLoading && dbStory?.citations && dbStory.citations.length > 0 && (
          <section className="prophet-section-lux">
            <div className="prophet-section-lux__header">
              <IslamicStar size={22} color={color} />
              <h2 className="prophet-section-lux__title">الاستشهادات القرآنية</h2>
            </div>
            <div className="prophet-citations">
              {dbStory.citations.map((c, i) => (
                <div key={i} className="prophet-citation-card">
                  <span className="prophet-citation-card__surah">سورة {c.surah}</span>
                  {c.ayahs && <span className="prophet-citation-card__ayahs">الآيات: {c.ayahs}</span>}
                  {c.note && <p className="prophet-citation-card__note">{c.note}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* مصدر المعلومات */}
        <footer className="prophet-story-lux__footer">
          <IslamicStar size={18} color={GOLD} opacity={0.6} />
          <span>المصدر: القرآن الكريم وكتب التفسير والسيرة الموثوقة</span>
          <IslamicStar size={18} color={GOLD} opacity={0.6} />
        </footer>
      </article>

      {/* التنقل بين الأنبياء */}
      <div className="prophet-nav-lux">
        {prevProphet ? (
          <button type="button" className="prophet-nav-lux__btn" onClick={() => onNavigate(prevProphet.slug)}>
            <span className="prophet-nav-lux__dir">← السابق</span>
            <span className="prophet-nav-lux__pname">{prevProphet.arabicName}</span>
          </button>
        ) : <span />}
        {nextProphet ? (
          <button type="button" className="prophet-nav-lux__btn prophet-nav-lux__btn--next" onClick={() => onNavigate(nextProphet.slug)}>
            <span className="prophet-nav-lux__dir">التالي →</span>
            <span className="prophet-nav-lux__pname">{nextProphet.arabicName}</span>
          </button>
        ) : <span />}
      </div>
    </div>
  );
}

// ── Timeline View ────────────────────────────────────────────────────────────

function TimelineView({ onSelect }: { onSelect: (slug: string) => void }) {
  return (
    <div className="prophet-timeline">
      <div className="prophet-timeline__line" aria-hidden="true" />
      {PROPHETS.map((p, idx) => {
        const color = prophetColor(p.slug);
        const side = idx % 2 === 0 ? "right" : "left";
        return (
          <div key={p.slug} className={`prophet-timeline__item prophet-timeline__item--${side}`} style={{ "--item-color": color } as React.CSSProperties}>
            <button
              type="button"
              className="prophet-timeline__dot"
              onClick={() => onSelect(p.slug)}
              aria-label={`قصة ${p.arabicName}`}
            >
              <IslamicStar size={16} color="#fff" />
            </button>
            <div
              className="prophet-timeline__card"
              onClick={() => onSelect(p.slug)}
              role="button"
              tabIndex={0}
              aria-label={`عرض قصة ${p.arabicName}`}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(p.slug)}
            >
              <h3 className="prophet-timeline__name">{p.arabicName}</h3>
              <p className="prophet-timeline__title">{p.title}</p>
              <p className="prophet-timeline__era">{p.era}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Quiz View ────────────────────────────────────────────────────────────────

function QuizView({ onClose }: { onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const q = QUIZ_QUESTIONS[idx];

  const answer = (opt: string) => {
    if (answered) return;
    setAnswered(opt);
    if (opt === q.a) setScore(s => s + 1);
    setTimeout(() => {
      if (idx + 1 >= QUIZ_QUESTIONS.length) { setDone(true); }
      else { setIdx(i => i + 1); setAnswered(null); }
    }, 1000);
  };

  if (done) {
    const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);
    return (
      <div className="prophet-quiz">
        <div className="prophet-quiz__done">
          <IslamicStar size={64} color={GOLD} />
          <h2>انتهى الاختبار!</h2>
          <p className="prophet-quiz__score">
            {score} / {QUIZ_QUESTIONS.length} ({pct}%)
          </p>
          <p className="prophet-quiz__remark">
            {pct >= 80 ? "ممتاز! أنت عارف بقصص الأنبياء ✦" : pct >= 60 ? "جيد! استمر في التعلم" : "واصل القراءة لتتعلم أكثر"}
          </p>
          <button type="button" className="prophet-quiz__btn" onClick={onClose}>العودة للقائمة</button>
        </div>
      </div>
    );
  }

  return (
    <div className="prophet-quiz">
      <div className="prophet-quiz__header">
        <span>سؤال {idx + 1} من {QUIZ_QUESTIONS.length}</span>
        <div className="prophet-quiz__progress">
          <div className="prophet-quiz__progress-bar" style={{ "--quiz-pct": `${(idx / QUIZ_QUESTIONS.length) * 100}%` } as React.CSSProperties} />
        </div>
        <button type="button" aria-label="إغلاق الاختبار" className="prophet-quiz__close" onClick={onClose}>✕</button>
      </div>
      <div className="prophet-quiz__body">
        <IslamicStar size={36} color={GOLD} />
        <p className="prophet-quiz__question">{q.q}</p>
        <div className="prophet-quiz__opts">
          {q.opts.map(opt => {
            let cls = "prophet-quiz__opt";
            if (answered) {
              if (opt === q.a) cls += " prophet-quiz__opt--correct";
              else if (opt === answered) cls += " prophet-quiz__opt--wrong";
            }
            return (
              <button type="button" key={opt} className={cls} onClick={() => answer(opt)}>{opt}</button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

type View = "grid" | "timeline" | "quiz" | "bookmarks";

export default function ProphetStoriesPage() {
  const [search, setSearch] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [view, setView] = useState<View>("grid");
  const { toggle: toggleBookmark, has: isBookmarked, count: bookmarkCount } = useBookmarks();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/prophets",
      title: "قصص الأنبياء والمرسلين | المجلس العلمي",
      description: "قصص الأنبياء والمرسلين عليهم السلام من آدم إلى محمد ﷺ — سيرهم وقصصهم ومعجزاتهم وعبرهم من القرآن الكريم والسنة النبوية.",
      keywords: ["قصص الأنبياء", "أنبياء الإسلام", "المرسلون", "قصص قرآنية", "آدم موسى عيسى محمد"],
    });
  }, []);

  // اختر النبي من URL إذا وُجد
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/prophets\/([^/]+)$/);
    if (match) setSelectedSlug(match[1]);
  }, []);

  const results = view === "bookmarks"
    ? searchProphets(search).filter(p => isBookmarked(p.slug))
    : searchProphets(search);

  if (selectedSlug) {
    return (
      <>
        <ProphetDetailView
          slug={selectedSlug}
          onBack={() => setSelectedSlug(null)}
          onNavigate={setSelectedSlug}
          isBookmarked={isBookmarked(selectedSlug)}
          onBookmark={() => toggleBookmark(selectedSlug)}
        />
      </>
    );
  }

  if (view === "quiz") {
    return (
      <>
        <QuizView onClose={() => setView("grid")} />
      </>
    );
  }

  return (
    <>
      <div className="prophets-lux-page">

        {/* ─── Hero Banner ─── */}
        <div className="prophets-lux-hero">
          <div className="prophets-lux-hero__stars" aria-hidden="true">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="prophets-lux-hero__star-wrap"
                style={{
                  "--star-top": `${Math.sin(i * 1.37) * 40 + 50}%`,
                  "--star-left": `${(i / 10) * 100}%`,
                  "--star-delay": `${i * 0.5}s`,
                } as React.CSSProperties}
              >
                <IslamicStar size={16 + (i % 3) * 10} color={GOLD} opacity={0.07 + (i % 4) * 0.03} />
              </div>
            ))}
          </div>
          <div className="prophets-lux-hero__content">
            <GeometricBorder color={GOLD} size={24} />
            <h1 className="prophets-lux-hero__title">قصص الأنبياء</h1>
            <p className="prophets-lux-hero__subtitle">
              الأنبياء الكرام المذكورون في القرآن الكريم — نبذات تعريفية ودروس وعبر
            </p>
            <p className="prophets-lux-hero__count">{PROPHETS.length} نبياً كريماً</p>
            <GeometricBorder color={GOLD} size={24} />
          </div>
        </div>

        {/* ─── قسم فاتح: تبويبات + محتوى ─── */}
        <div className="prophets-light-section">

          {/* تبويبات العرض */}
          <div className="prophets-lux-tabs">
            {(["grid", "timeline", "bookmarks", "quiz"] as const).map(v => (
              <button
                key={v}
                type="button"
                className={`prophets-lux-tab ${view === v ? "prophets-lux-tab--active" : ""}`}
                onClick={() => setView(v)}
                aria-pressed={view === v}
              >
                {v === "grid" && <><LayoutList size={15} strokeWidth={1.8} aria-hidden="true" /> القائمة</>}
                {v === "timeline" && <><CalendarDays size={15} strokeWidth={1.8} aria-hidden="true" /> الخط الزمني</>}
                {v === "bookmarks" && <><Heart size={15} strokeWidth={1.8} aria-hidden="true" /> المفضلة{bookmarkCount > 0 ? ` (${bookmarkCount})` : ""}</>}
                {v === "quiz" && <><HelpCircle size={15} strokeWidth={1.8} aria-hidden="true" /> اختبر نفسك</>}
              </button>
            ))}
          </div>

          {/* Timeline View */}
          {view === "timeline" && (
            <div className="prophets-lux-container">
              <TimelineView onSelect={setSelectedSlug} />
            </div>
          )}

          {/* Grid + Bookmarks View */}
          {(view === "grid" || view === "bookmarks") && (
            <div className="prophets-lux-container">
              {/* بحث */}
              <div className="prophets-lux-search-wrap">
                <input
                  ref={searchRef}
                  className="prophets-lux-search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="ابحث في الأنبياء بالاسم أو القوم أو الخاصية..."
                  aria-label="بحث في قصص الأنبياء"
                />
                {search && (
                  <button type="button" aria-label="مسح البحث" className="prophets-lux-search-clear" onClick={() => setSearch("")}>✕</button>
                )}
              </div>

              {/* إحصاء */}
              {search && (
                <p className="prophets-lux-count" aria-live="polite" aria-atomic="true">{results.length} نتيجة</p>
              )}

              {/* شبكة البطاقات */}
              {results.length === 0 ? (
                <div className="prophets-lux-empty">
                  <IslamicStar size={48} color={GOLD} opacity={0.3} />
                  <p>لا توجد نتائج لـ «{search}»</p>
                </div>
              ) : (
                <>
                  <div className="prophets-lux-grid">
                    {results.map(p => (
                      <ProphetCard
                        key={p.slug}
                        prophet={p}
                        onSelect={() => setSelectedSlug(p.slug)}
                        isBookmarked={isBookmarked(p.slug)}
                        onBookmark={e => { e.stopPropagation(); toggleBookmark(p.slug); }}
                      />
                    ))}
                  </div>
                  {/* ── بطاقة الانتقال إلى السيرة النبوية ── */}
                  {!search && (
                    <Link href="/seerah" className="prophets-seerah-link">
                      <div className="prophets-seerah-bridge">
                        <div className="prophets-seerah-bridge__ornament" aria-hidden="true">
                          <IslamicStar size={28} color={GOLD} opacity={0.7} />
                        </div>
                        <div className="prophets-seerah-bridge__body">
                          <div className="prophets-seerah-bridge__eyebrow">التسلسل التاريخي · الفصل الأخير</div>
                          <h3 className="prophets-seerah-bridge__title">بداية السيرة النبوية الشريفة</h3>
                          <p className="prophets-seerah-bridge__desc">
                            امتداداً لرسالة الأنبياء، وُلد خاتم النبيين محمد ﷺ — اقرأ سيرته من النسب إلى الرسالة والهجرة والفتح.
                          </p>
                        </div>
                        <div className="prophets-seerah-bridge__arrow" aria-hidden="true">←</div>
                      </div>
                    </Link>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

