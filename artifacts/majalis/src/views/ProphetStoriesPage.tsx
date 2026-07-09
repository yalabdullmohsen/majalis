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
        <style>{PROPHETS_CSS}</style>
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
        <style>{PROPHETS_CSS}</style>
        <QuizView onClose={() => setView("grid")} />
      </>
    );
  }

  return (
    <>
      <style>{PROPHETS_CSS}</style>
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

// ── CSS (Embedded) ────────────────────────────────────────────────────────────

const PROPHETS_CSS = `
/* ── Page Shell ── */
.prophets-lux-page {
  min-height: 100vh;
  background: var(--msk-canvas, #FAF8F5);
  color: var(--msk-text, #1C1A18);
  font-family: 'Cairo', 'Tajawal', sans-serif;
  direction: rtl;
}

/* ── Light Content Section ── */
.prophets-light-section {
  background: var(--msk-canvas, #FAF8F5);
}

/* ── Hero ── */
.prophets-lux-hero {
  position: relative;
  padding: 4rem 1.5rem 3rem;
  text-align: center;
  overflow: hidden;
  background-color: #18362A;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cpath d='M50,4 L57.27,32.45 L82.53,17.47 L67.55,42.73 L96,50 L67.55,57.27 L82.53,82.53 L57.27,67.55 L50,96 L42.73,67.55 L17.47,82.53 L32.45,57.27 L4,50 L32.45,42.73 L17.47,17.47 L42.73,32.45 Z' fill='none' stroke='%23FFFFFF' stroke-opacity='0.055' stroke-width='1.1'/%3E%3Ccircle cx='50' cy='50' r='1.4' fill='%23FFFFFF' fill-opacity='0.08'/%3E%3C/svg%3E");
  background-size: 100px 100px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.prophets-lux-hero__stars {
  position: absolute; inset: 0;
  pointer-events: none;
}
.prophets-lux-hero__star-wrap {
  position: absolute;
  top: var(--star-top);
  left: var(--star-left);
  animation: lux-pulse 4s ease-in-out infinite;
  animation-delay: var(--star-delay, 0s);
}
@keyframes lux-pulse {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.2); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .prophets-lux-hero__star-wrap { animation: none; }
}
.prophets-lux-hero__content {
  position: relative;
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
.prophets-lux-hero__title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-family: 'Amiri', serif;
  color: ${GOLD};
  margin: 0;
  text-shadow: 0 2px 20px ${GOLD}40;
  line-height: 1.3;
}
.prophets-lux-hero__subtitle {
  color: #c8c8b8;
  font-size: clamp(0.9rem, 2.5vw, 1.1rem);
  max-width: 500px;
  line-height: 1.7;
  margin: 0;
}
.prophets-lux-hero__count {
  font-size: 0.9rem;
  color: ${GOLD_LIGHT};
  opacity: 0.8;
  margin: 0;
}

/* ── Tabs ── */
.prophets-lux-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 0.85rem 1.25rem;
  overflow-x: auto;
  scrollbar-width: none;
  border-bottom: 1px solid var(--msk-border, #e5e0d5);
  background: var(--msk-canvas-1, #fff);
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.prophets-lux-tabs::-webkit-scrollbar { display: none; }
.prophets-lux-tab {
  padding: 0.45rem 1.1rem;
  border-radius: 8px;
  border: 1px solid #d4c9b5;
  background: transparent;
  color: #4b5563;
  font-family: 'Cairo', sans-serif;
  font-size: 0.875rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}
.prophets-lux-tab:hover { border-color: ${GOLD}; color: #1F4D3A; background: rgba(14,110,82,0.06); }
.prophets-lux-tab--active {
  background: ${GOLD}18;
  border-color: ${GOLD};
  color: #1F4D3A;
  font-weight: 700;
}

/* ── Container ── */
.prophets-lux-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}

/* ── Disclaimer ── */
.prophets-lux-disclaimer {
  background: rgba(14,110,82,0.06);
  border: 1px solid rgba(24,54,42,0.3);
  border-radius: 10px;
  padding: 0.85rem 1.2rem;
  font-size: 0.84rem;
  color: #18362A;
  margin-bottom: 1.25rem;
  line-height: 1.65;
}

/* ── Search ── */
.prophets-lux-search-wrap {
  position: relative;
  margin-bottom: 1.25rem;
}
.prophets-lux-search {
  width: 100%;
  padding: 0.8rem 1.25rem;
  border-radius: 12px;
  border: 1px solid #d4c9b5;
  background: #fff;
  color: #1a1a1a;
  font-size: 1rem;
  font-family: 'Cairo', sans-serif;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}
.prophets-lux-search:focus { border-color: ${GOLD}; box-shadow: 0 0 0 3px ${GOLD}18; }
.prophets-lux-search::placeholder { color: #9ca3af; }
.prophets-lux-search-clear {
  position: absolute;
  top: 50%; right: 1rem;
  transform: translateY(-50%);
  background: none; border: none;
  color: #9ca3af; font-size: 1rem;
  cursor: pointer; padding: 0.25rem;
}
.prophets-lux-count { color: #6b7280; font-size: 0.875rem; margin: 0 0 1rem; }

/* ── Grid ── */
.prophets-lux-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}
@media (min-width: 640px) { .prophets-lux-grid { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1024px) { .prophets-lux-grid { grid-template-columns: repeat(4, 1fr); } }

/* ── Prophet Card ── */
.prophet-lux-card {
  position: relative;
  background: var(--msk-canvas-1, #fff);
  border: 1px solid var(--msk-border, #e5e0d5);
  border-radius: 16px;
  padding: 1.25rem 1rem 1rem;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
  overflow: hidden;
  text-align: right;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.prophet-lux-card:hover,
.prophet-lux-card:focus-visible {
  transform: translateY(-3px);
  border-color: var(--prophet-color, ${GOLD})80;
  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
  outline: none;
}
.prophet-lux-card__num {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  width: 24px; height: 24px;
  background: var(--prophet-color, ${GOLD})18;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem;
  color: var(--prophet-color, ${GOLD});
  font-weight: 700;
}
.prophet-lux-card__star {
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
}
.prophet-lux-card__body { flex: 1; }
.prophet-lux-card__name {
  font-family: 'Amiri', serif;
  font-size: 1.2rem;
  color: #111827;
  margin: 0 0 0.25rem;
  line-height: 1.3;
}
.prophet-lux-card__pbuh { font-size: 0.75rem; color: #6b7280; }
.prophet-lux-card__quran {
  font-family: 'Amiri Quran', 'Amiri', serif;
  font-size: 0.8rem;
  color: var(--msk-gold, #1F4D3A);
  margin-bottom: 0.25rem;
  opacity: 0.85;
}
.prophet-lux-card__title { color: var(--prophet-color, ${GOLD}); font-size: 0.85rem; margin: 0 0 0.2rem; font-weight: 600; }
.prophet-lux-card__place { color: #6b7280; font-size: 0.78rem; margin: 0 0 0.4rem; }
.prophet-lux-card__bio { color: #4b5563; font-size: 0.8rem; line-height: 1.6; margin: 0 0 0.75rem; }
.prophet-lux-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}
.prophet-lux-card__surahs { color: #9ca3af; }
.prophet-lux-card__read { color: var(--prophet-color, ${GOLD}); font-weight: 600; }
.prophet-lux-card__bookmark {
  position: absolute;
  top: 0.6rem; right: 0.6rem;
  background: none; border: none;
  font-size: 1rem; cursor: pointer;
  padding: 0.2rem;
  z-index: 2;
}
.prophet-lux-card__border {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--prophet-color, ${GOLD})60, transparent);
}

/* ── Empty ── */
.prophets-lux-empty {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

/* ── Back Button ── */
.prophet-lux-back {
  background: none;
  border: 1px solid ${GOLD}40;
  color: ${GOLD_LIGHT};
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Cairo', sans-serif;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.prophet-lux-back:hover { border-color: ${GOLD}; background: ${GOLD}15; }

/* ── Detail View ── */
.prophet-detail-lux {
  min-height: 100vh;
  background: linear-gradient(180deg, var(--msk-canvas-deep, #0A1628) 0%, color-mix(in srgb, var(--msk-canvas-deep, #0A1628) 60%, #0D1F3C) 50%, var(--msk-canvas-deep, #0A1628) 100%);
  color: #F5F5F0;
  direction: rtl;
}
.prophet-detail-lux__topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${GOLD}15;
  gap: 1rem;
  flex-wrap: wrap;
}
.prophet-detail-lux__actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}
.prophet-action-btn {
  background: none;
  border: 1px solid ${GOLD}30;
  color: #ccc;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-family: 'Cairo', sans-serif;
  transition: all 0.2s;
  white-space: nowrap;
}
.prophet-action-btn:hover { border-color: ${GOLD}; color: ${GOLD_LIGHT}; }
.prophet-font-controls {
  display: flex;
  gap: 0.25rem;
}
.prophet-font-controls button {
  background: rgba(255,255,255,0.07);
  border: 1px solid ${GOLD}25;
  color: #ccc;
  width: 32px; height: 32px;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Cairo', sans-serif;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.prophet-font-controls button:hover { background: ${GOLD}20; color: ${GOLD}; }

/* ── Detail Hero ── */
.prophet-detail-lux__hero {
  position: relative;
  padding: 3rem 1.5rem;
  text-align: center;
  overflow: hidden;
  border-bottom: 1px solid color-mix(in srgb, var(--prophet-color, ${GOLD}) 20%, transparent);
  background: linear-gradient(135deg, color-mix(in srgb, var(--prophet-color, ${GOLD}) 13%, transparent) 0%, var(--msk-canvas-deep, #0D1F3C) 60%);
}
.prophet-detail-lux__hero-pattern {
  position: absolute; inset: 0;
  display: flex; flex-wrap: wrap;
  align-items: center; justify-content: center;
  gap: 12px;
  pointer-events: none;
  overflow: hidden;
}
.prophet-detail-lux__hero-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}
.prophet-detail-lux__hero-star { margin-bottom: 0.5rem; }
.prophet-detail-lux__num-badge {
  font-size: 0.8rem;
  color: #aaa;
  background: rgba(255,255,255,0.07);
  padding: 0.2rem 0.75rem;
  border-radius: 20px;
  border: 1px solid ${GOLD}25;
}
.prophet-detail-lux__name {
  font-family: 'Amiri', serif;
  font-size: clamp(2rem, 6vw, 3.5rem);
  color: ${GOLD};
  margin: 0;
  text-shadow: 0 2px 20px ${GOLD}40;
}
.prophet-detail-lux__pbuh { color: #aaa; font-size: 0.95rem; margin: 0; }
.prophet-detail-lux__quran-title {
  font-family: 'Amiri Quran', 'Amiri', serif;
  font-size: 1.1rem;
  color: ${GOLD_LIGHT};
  opacity: 0.9;
}
.prophet-detail-lux__hero-title {
  color: var(--prophet-color, ${GOLD});
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

/* ── Quick Facts ── */
.prophet-facts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  max-width: 900px;
  margin: 0 auto;
}
@media (min-width: 640px) { .prophet-facts-grid { grid-template-columns: repeat(4, 1fr); } }
.prophet-fact-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid ${GOLD}20;
  border-radius: 12px;
  padding: 0.9rem 1rem;
  text-align: center;
}
.prophet-fact-card__label {
  display: block;
  font-size: 0.72rem;
  color: #888;
  margin-bottom: 0.4rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.prophet-fact-card__value {
  display: block;
  font-size: 0.95rem;
  color: ${GOLD_LIGHT};
  font-weight: 600;
  line-height: 1.4;
}

/* ── Story ── */
.prophet-story-lux {
  max-width: 820px;
  margin: 0 auto;
  padding: 1.5rem;
  line-height: 1.8;
  font-size: var(--pstory-fs, 16px);
  transition: font-size 0.2s;
}
.prophet-disclaimer-lux {
  background: rgba(255,200,0,0.07);
  border: 1px solid ${GOLD}25;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.82rem;
  color: #bbb;
  margin-bottom: 2rem;
}
.prophet-section-lux {
  margin-bottom: 2.25rem;
}
.prophet-section-lux__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${GOLD}20;
}
.prophet-section-lux__title {
  font-family: 'Amiri', serif;
  font-size: 1.25rem;
  color: ${GOLD_LIGHT};
  margin: 0;
}
.prophet-section-lux__text { color: #d0d0c8; line-height: 1.85; margin: 0; }

/* Chips */
.prophet-chips-lux {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.prophet-chip-lux {
  background: rgba(255,255,255,0.06);
  border: 1px solid ${GOLD}30;
  color: ${GOLD_LIGHT};
  padding: 0.35rem 0.85rem;
  border-radius: 20px;
  font-size: 0.85rem;
}

/* Attributes */
.prophet-attrs-list {
  list-style: none;
  padding: 0; margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.prophet-attrs-list__item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: #d0d0c8;
  line-height: 1.7;
}
.prophet-attrs-list__bullet {
  flex-shrink: 0;
  width: 24px; height: 24px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.65rem;
  color: #fff;
  margin-top: 0.15rem;
  background: var(--prophet-color, ${GOLD});
}

/* Lessons */
.prophet-lessons-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}
@media (min-width: 640px) { .prophet-lessons-grid { grid-template-columns: repeat(2, 1fr); } }
.prophet-lesson-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid ${GOLD}20;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}
.prophet-lesson-card__num {
  font-size: 1.25rem;
  font-weight: 700;
  font-family: 'Amiri', serif;
  flex-shrink: 0;
  line-height: 1;
  color: var(--prophet-color, ${GOLD});
}
.prophet-lesson-card__text { color: #d0d0c8; font-size: 0.9rem; line-height: 1.7; margin: 0; }

/* Footer */
.prophet-story-lux__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${GOLD}20;
  color: #888;
  font-size: 0.82rem;
}

/* ── DB Story & Citations ── */
.prophet-db-story { margin-top: 0.25rem; }
.prophet-citations {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.prophet-citation-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid ${GOLD}25;
  border-radius: 10px;
  padding: 0.85rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.prophet-citation-card__surah {
  font-family: 'Amiri', serif;
  font-size: 1rem;
  color: ${GOLD_LIGHT};
  font-weight: 600;
}
.prophet-citation-card__ayahs {
  font-size: 0.8rem;
  color: #aaa;
}
.prophet-citation-card__note {
  font-size: 0.88rem;
  color: #d0d0c8;
  line-height: 1.7;
  margin: 0.25rem 0 0;
}

/* ── Nav ── */
.prophet-nav-lux {
  display: flex;
  justify-content: space-between;
  padding: 1.5rem;
  max-width: 820px;
  margin: 0 auto;
  gap: 1rem;
}
.prophet-nav-lux__btn {
  background: rgba(255,255,255,0.04);
  border: 1px solid ${GOLD}30;
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  transition: all 0.2s;
}
.prophet-nav-lux__btn:hover { border-color: ${GOLD}; background: ${GOLD}10; }
.prophet-nav-lux__btn--next { align-items: flex-end; }
.prophet-nav-lux__dir { font-size: 0.75rem; color: #888; }
.prophet-nav-lux__pname { font-size: 1rem; color: ${GOLD_LIGHT}; font-weight: 600; font-family: 'Amiri', serif; }

/* ── Timeline ── */
.prophet-timeline {
  position: relative;
  padding: 2rem 1rem;
  max-width: 900px;
  margin: 0 auto;
}
.prophet-timeline__line {
  position: absolute;
  top: 0; bottom: 0;
  left: 50%;
  width: 2px;
  background: linear-gradient(180deg, transparent, ${GOLD}60, transparent);
  transform: translateX(-50%);
}
.prophet-timeline__item {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
  position: relative;
}
.prophet-timeline__item--right { flex-direction: row; justify-content: flex-end; padding-left: 55%; }
.prophet-timeline__item--left { flex-direction: row-reverse; justify-content: flex-end; padding-right: 55%; }
.prophet-timeline__dot {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  border: none;
  transition: transform 0.2s;
  flex-shrink: 0;
  z-index: 2;
  background: var(--item-color, ${GOLD});
  box-shadow: 0 0 12px color-mix(in srgb, var(--item-color, ${GOLD}) 38%, transparent);
}
.prophet-timeline__dot:hover { transform: translateX(-50%) scale(1.2); }
.prophet-timeline__card {
  background: #fff;
  border: 1px solid #e5e0d5;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
  max-width: 180px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.prophet-timeline__card:hover { border-color: ${GOLD}; box-shadow: 0 3px 10px rgba(0,0,0,0.1); }
.prophet-timeline__name {
  font-family: 'Amiri', serif;
  font-size: 1rem;
  margin: 0 0 0.2rem;
  color: var(--item-color, #111827);
}
.prophet-timeline__title { font-size: 0.75rem; color: #6b7280; margin: 0 0 0.15rem; }
.prophet-timeline__era { font-size: 0.7rem; color: #9ca3af; margin: 0; }

@media (max-width: 640px) {
  .prophet-timeline__line { left: 20px; }
  .prophet-timeline__item--right,
  .prophet-timeline__item--left {
    flex-direction: row;
    justify-content: flex-start;
    padding-left: 0; padding-right: 0;
    padding-inline-start: 60px;
  }
  .prophet-timeline__dot { left: 20px; transform: translateX(-50%); }
  .prophet-timeline__dot:hover { transform: translateX(-50%) scale(1.15); }
  .prophet-timeline__card { max-width: 100%; }
}

/* ── Quiz ── */
.prophet-quiz {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1.5rem;
  min-height: 60vh;
  display: flex;
  flex-direction: column;
}
.prophet-quiz__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}
.prophet-quiz__progress {
  flex: 1;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}
.prophet-quiz__progress-bar {
  height: 100%;
  background: ${GOLD};
  border-radius: 2px;
  transition: width 0.3s;
  width: var(--quiz-pct, 0%);
}
.prophet-quiz__close {
  background: none; border: none;
  color: #9ca3af; font-size: 1.1rem;
  cursor: pointer; padding: 0.25rem;
}
.prophet-quiz__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  text-align: center;
}
.prophet-quiz__question {
  font-family: 'Amiri', serif;
  font-size: 1.3rem;
  color: #111827;
  line-height: 1.7;
  margin: 0;
}
.prophet-quiz__opts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  width: 100%;
}
.prophet-quiz__opt {
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid #d4c9b5;
  background: #fff;
  color: #374151;
  cursor: pointer;
  font-family: 'Cairo', sans-serif;
  font-size: 0.95rem;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.prophet-quiz__opt:hover:not([disabled]) { border-color: ${GOLD}; background: rgba(14,110,82,0.06); color: #1F4D3A; }
.prophet-quiz__opt--correct { background: #dcfce7 !important; border-color: #16a34a !important; color: #14532d !important; }
.prophet-quiz__opt--wrong { background: #fee2e2 !important; border-color: #dc2626 !important; color: #7f1d1d !important; }
.prophet-quiz__done {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}
.prophet-quiz__done h2 { font-family: 'Amiri', serif; font-size: 2rem; color: #1F4D3A; margin: 0; }
.prophet-quiz__score { font-size: 1.5rem; color: #1F4D3A; font-weight: 700; margin: 0; }
.prophet-quiz__remark { color: #6b7280; font-size: 1rem; margin: 0; }
.prophet-quiz__btn {
  margin-top: 0.5rem;
  padding: 0.75rem 2rem;
  background: ${GOLD}20;
  border: 1px solid ${GOLD};
  color: #1F4D3A;
  border-radius: 10px;
  cursor: pointer;
  font-family: 'Cairo', sans-serif;
  font-size: 1rem;
  transition: all 0.2s;
}
.prophet-quiz__btn:hover { background: ${GOLD}35; }

/* ── بطاقة الانتقال إلى السيرة النبوية ── */
.prophets-seerah-bridge {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #18362A 0%, #0E4530 100%);
  border-radius: 16px;
  border: 1px solid rgba(190,199,195,0.25);
  box-shadow: 0 4px 20px rgba(24,54,42,0.18);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  color: #FAF8F2;
}
.prophets-seerah-bridge:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(24,54,42,0.28);
}
.prophets-seerah-bridge__ornament {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  background: rgba(190,199,195,0.12);
  border: 1px solid rgba(190,199,195,0.25);
  border-radius: 50%;
}
.prophets-seerah-bridge__body {
  flex: 1;
  min-width: 0;
}
.prophets-seerah-bridge__eyebrow {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  color: #a7f3d0;
  text-transform: uppercase;
  margin-bottom: 0.3rem;
}
.prophets-seerah-bridge__title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #FAF8F2;
  margin: 0 0 0.35rem;
  line-height: 1.3;
  font-family: 'Cairo', sans-serif;
}
.prophets-seerah-bridge__desc {
  font-size: 0.83rem;
  color: rgba(225,229,227,0.82);
  line-height: 1.65;
  margin: 0;
}
.prophets-seerah-bridge__arrow {
  flex-shrink: 0;
  font-size: 1.4rem;
  color: ${GOLD};
  opacity: 0.85;
  transition: transform 0.2s;
}
.prophets-seerah-bridge:hover .prophets-seerah-bridge__arrow {
  transform: translateX(-4px);
}
@media (max-width: 560px) {
  .prophets-seerah-bridge {
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 1rem;
  }
  .prophets-seerah-bridge__arrow { display: none; }
}
.prophet-geo-border { display: flex; gap: 4px; align-items: center; opacity: 0.6; }
.prophet-not-found { padding: 2rem; text-align: center; }
.prophet-not-found__msg { color: var(--txt-muted, #52525B); margin-top: 1rem; }
.prophet-db-para { margin-bottom: 1rem; }
.prophets-seerah-link { text-decoration: none; display: block; margin-top: 1.5rem; }
`;
