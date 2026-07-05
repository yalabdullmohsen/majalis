import { useState } from "react";
import { usePageView } from "@/hooks/usePageView";
import { AdminQuickEdit } from "@/components/AdminQuickEdit";

const PHASES = [
  {
    id: "lineage-birth",
    num: 1,
    title: "النسب والمولد",
    year: "عام الفيل — 571م",
    icon: "🌙",
    color: "#0d9488",
    desc: "وُلد النبي ﷺ في مكة المكرمة عام الفيل، من نسب قريشي شريف يمتد إلى إبراهيم الخليل عليه السلام. وفي ذلك العام حمى الله الكعبة المشرفة من أبرهة وجنده.",
    topics: ["نسبه الشريف ﷺ", "مولده في مكة", "حادثة الفيل"],
  },
  {
    id: "childhood",
    num: 2,
    title: "الطفولة والرضاعة",
    year: "571–576م",
    icon: "👶",
    color: "#0369a1",
    desc: "أُرضع ﷺ عند حليمة السعدية في بني سعد، وفُقد والده قبل ولادته. توفيت أمه آمنة وهو في السادسة، فكفله جده عبد المطلب ثم عمه أبو طالب.",
    topics: ["رضاعته عند حليمة", "يتمه ﷺ", "كفالة جده وعمه"],
  },
  {
    id: "youth",
    num: 3,
    title: "الشباب قبل البعثة",
    year: "576–610م",
    icon: "📜",
    color: "#7c3aed",
    desc: "عُرف ﷺ في قومه بالصادق الأمين، شارك في حلف الفضول لنصرة المظلومين، عمل بالتجارة، وتزوج خديجة رضي الله عنها، وكان يتحنث في غار حراء.",
    topics: ["الصادق الأمين", "حلف الفضول", "زواجه من خديجة ﷢", "تحنّثه في حراء"],
  },
  {
    id: "prophethood",
    num: 4,
    title: "البعثة",
    year: "610م",
    icon: "✨",
    color: "#0E6E52",
    desc: "نزل جبريل عليه السلام على النبي ﷺ في غار حراء بأوائل سورة العلق، فكانت بداية الوحي والرسالة المحمدية الخاتمة.",
    topics: ["نزول الوحي الأول", "غار حراء", "أوائل المؤمنين"],
  },
  {
    id: "secret-dawah",
    num: 5,
    title: "الدعوة السرية",
    year: "610–613م",
    icon: "🕊️",
    color: "#059669",
    desc: "انطلقت الدعوة سراً بين الأهل والمقربين؛ أسلمت خديجة وعلي وأبو بكر وزيد رضي الله عنهم، واتسعت الدائرة تدريجياً قبل الجهر.",
    topics: ["الدعوة في السر", "أوائل المسلمين", "الهجرة إلى الحبشة"],
  },
  {
    id: "open-dawah",
    num: 6,
    title: "الدعوة الجهرية",
    year: "613–619م",
    icon: "📢",
    color: "#dc2626",
    desc: "أُعلنت الدعوة على رؤوس الأشهاد وصعد النبي ﷺ الصفا ينادي قريشاً. فاشتد الإيذاء وهاجر المستضعفون إلى الحبشة، وحُوصر المسلمون في شعب أبي طالب.",
    topics: ["الجهر بالدعوة", "إيذاء قريش", "الحصار في الشعب"],
  },
  {
    id: "year-of-sorrow",
    num: 7,
    title: "عام الحزن والإسراء",
    year: "619–620م",
    icon: "🌃",
    color: "#4338ca",
    desc: "توفيت أم المؤمنين خديجة وعمه أبو طالب في عام واحد سُمّي بعام الحزن. ثم كانت رحلة الإسراء إلى المسجد الأقصى والمعراج إلى السماوات تثبيتاً للنبي ﷺ.",
    topics: ["وفاة خديجة ﷢", "وفاة أبي طالب", "الإسراء والمعراج"],
  },
  {
    id: "hijra",
    num: 8,
    title: "الهجرة إلى المدينة",
    year: "622م",
    icon: "🐪",
    color: "#0E6E52",
    desc: "أذن الله بالهجرة إلى يثرب، فخرج النبي ﷺ مع أبي بكر رضي الله عنه وآثرا غار ثور مأوىً، ثم وصل المدينة فاستُقبل بالفرح والترحيب. كانت هذه الهجرة بداية التقويم الهجري.",
    topics: ["مغادرة مكة", "الوصول للمدينة", "بناء المسجد النبوي", "الأخوّة بين المهاجرين والأنصار"],
  },
  {
    id: "ghazawat",
    num: 9,
    title: "الغزوات الكبرى",
    year: "624–627م",
    icon: "⚔️",
    color: "#9f1239",
    desc: "شهدت هذه المرحلة غزوات بدر الكبرى وأُحد والخندق؛ أبلى فيها المسلمون بلاءً حسناً وثبّتت إيمانهم، وكان النصر والابتلاء كلاهما درساً وتكويناً للأمة.",
    topics: ["غزوة بدر الكبرى", "غزوة أُحد", "غزوة الأحزاب — الخندق"],
  },
  {
    id: "hudaybiyya-mecca",
    num: 10,
    title: "الحديبية وفتح مكة",
    year: "628–630م",
    icon: "🕌",
    color: "#0d9488",
    desc: "كان صلح الحديبية فتحاً مبيناً مهّد لانتشار الإسلام أفواجاً. تُوّج ذلك بدخول مكة المكرمة عام ثمانية للهجرة بلا قتال، وعفا النبي ﷺ عمن آذاه.",
    topics: ["صلح الحديبية", "فتح مكة", "العفو العام"],
  },
  {
    id: "farewell",
    num: 11,
    title: "حجة الوداع",
    year: "السنة العاشرة — 632م",
    icon: "📿",
    color: "#0369a1",
    desc: "أدّى النبي ﷺ فريضة الحج وألقى خطبته الجامعة في عرفات بين مئة ألف من الصحابة. وأُنزل في ذلك اليوم العظيم: ﴿الْيَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ﴾.",
    topics: ["حجة الوداع", "خطبة عرفة", "اكتمال الدين"],
  },
  {
    id: "death",
    num: 12,
    title: "الوفاة",
    year: "السنة الحادية عشرة — 632م",
    icon: "🌹",
    color: "#059669",
    desc: "مرض النبي ﷺ في أواخر صفر سنة إحدى عشرة، وانتقل إلى الرفيق الأعلى في الثاني عشر من ربيع الأول. دُفن في حجرة عائشة رضي الله عنها بالمدينة المنورة.",
    topics: ["مرضه ﷺ الأخير", "وفاته ودفنه", "الحزن العظيم"],
  },
];

const SOURCES = [
  "السيرة النبوية — ابن هشام",
  "البداية والنهاية — ابن كثير",
  "زاد المعاد في هدي خير العباد — ابن القيم",
  "الرحيق المختوم — صفي الرحمن المباركفوري",
  "السيرة النبوية الصحيحة — أكرم ضياء العمري",
];

export default function SeerahPage() {
  usePageView("seerah", null);
  const [activeId, setActiveId] = useState(PHASES[0].id);

  const activeIdx = PHASES.findIndex(p => p.id === activeId);
  const active = PHASES[activeIdx];

  const goTo = (id: string) => {
    setActiveId(id);
    if (window.innerWidth <= 720) {
      const panel = document.getElementById("seerah-panel");
      if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <style>{SEERAH_CSS}</style>
      <div className="seerah-page" dir="rtl">

        {/* Hero */}
        <div className="seerah-hero">
          <div className="seerah-hero__badge">📖 سيرة النبي ﷺ</div>
          <h1 className="seerah-hero__title">السيرة النبوية الشريفة</h1>
          <p className="seerah-hero__sub">
            حياة النبي محمد ﷺ من مولده الكريم إلى وفاته — 12 مرحلة تاريخية
          </p>
        </div>

        {/* Notice */}
        <div className="seerah-notice">
          <strong>💡 منهج القسم:</strong> يُقدَّم المحتوى التاريخي استناداً إلى المصادر الموثقة كسيرة ابن هشام والبداية والنهاية وزاد المعاد. التفاصيل الشرعية التفصيلية تُضاف تدريجياً من مصادر علمية معتمدة.
        </div>

        {/* Timeline Layout */}
        <div className="seerah-layout">

          {/* Sidebar — قائمة المراحل */}
          <nav className="seerah-timeline" aria-label="مراحل السيرة النبوية">
            <div className="seerah-timeline__line" aria-hidden="true" />
            {PHASES.map(phase => (
              <button
                key={phase.id}
                className={`seerah-timeline__item${activeId === phase.id ? " seerah-timeline__item--active" : ""}`}
                onClick={() => goTo(phase.id)}
                style={{ "--phase-color": phase.color } as React.CSSProperties}
                aria-current={activeId === phase.id ? "true" : undefined}
                aria-label={`المرحلة ${phase.num}: ${phase.title}`}
              >
                <span
                  className="seerah-timeline__dot"
                  style={activeId === phase.id ? { background: phase.color, borderColor: phase.color, color: "#fff" } : undefined}
                >
                  {phase.num}
                </span>
                <span className="seerah-timeline__label">
                  <span className="seerah-timeline__title">{phase.title}</span>
                  <span className="seerah-timeline__year">{phase.year.split("—")[0].trim()}</span>
                </span>
              </button>
            ))}
          </nav>

          {/* Detail Panel */}
          <div className="seerah-panel" id="seerah-panel">
            <div className="seerah-panel__header" style={{ borderBottomColor: active.color + "50" }}>
              <span className="seerah-panel__icon">{active.icon}</span>
              <div style={{ flex: 1 }}>
                <div className="seerah-panel__num" style={{ color: active.color }}>
                  المرحلة {active.num} من {PHASES.length}
                </div>
                <h2 className="seerah-panel__title">{active.title}</h2>
                <div className="seerah-panel__year" style={{ color: active.color }}>
                  {active.year}
                </div>
              </div>
            </div>

            <p className="seerah-panel__desc">{active.desc}</p>

            <div className="seerah-panel__topics">
              {active.topics.map(t => (
                <span
                  key={t}
                  className="seerah-panel__topic"
                  style={{ borderColor: active.color + "50", color: active.color, background: active.color + "0d" }}
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="seerah-panel__coming">
              <span className="seerah-panel__coming-dot" />
              التفاصيل التاريخية التفصيلية من مصادر موثقة قادمة قريباً
            </div>

            {/* Navigation */}
            <div className="seerah-panel__nav">
              {activeIdx > 0 && (
                <button
                  className="seerah-panel__nav-btn"
                  onClick={() => goTo(PHASES[activeIdx - 1].id)}
                >
                  ← {PHASES[activeIdx - 1].title}
                </button>
              )}
              {activeIdx < PHASES.length - 1 && (
                <button
                  className="seerah-panel__nav-btn seerah-panel__nav-btn--next"
                  onClick={() => goTo(PHASES[activeIdx + 1].id)}
                >
                  {PHASES[activeIdx + 1].title} →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* المصادر */}
        <div className="seerah-sources">
          <h2 className="seerah-sources__title">📚 مصادر السيرة المعتمدة</h2>
          <ul className="seerah-sources__list">
            {SOURCES.map(src => (
              <li key={src} className="seerah-sources__item">
                <span className="seerah-sources__bullet">•</span>
                {src}
              </li>
            ))}
          </ul>
        </div>

      </div>
      <AdminQuickEdit section="prophet-stories" />
    </>
  );
}

const SEERAH_CSS = `
.seerah-page {
  min-height: 100vh;
  background: #f8f7f4;
  direction: rtl;
  font-family: 'Cairo', 'Tajawal', sans-serif;
  padding-bottom: 3rem;
}

/* ── Hero ── */
.seerah-hero {
  background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0d9488 100%);
  color: #fff;
  padding: 3.5rem 1.5rem 3rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.seerah-hero::before {
  content: '☪';
  position: absolute;
  font-size: 14rem;
  opacity: 0.04;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  select: none;
}
.seerah-hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255,255,255,0.12);
  color: #a7f3d0;
  font-size: 0.85rem;
  padding: 0.35rem 1rem;
  border-radius: 2rem;
  margin-bottom: 1rem;
}
.seerah-hero__title {
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 800;
  margin: 0 0 0.75rem;
  line-height: 1.25;
}
.seerah-hero__sub {
  color: #d1fae5;
  font-size: clamp(0.875rem, 2vw, 1rem);
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.7;
}

/* ── Notice ── */
.seerah-notice {
  max-width: 920px;
  margin: 1.5rem auto;
  padding: 0.9rem 1.25rem;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 12px;
  font-size: 0.85rem;
  color: #065f46;
  line-height: 1.7;
}
@media (max-width: 640px) {
  .seerah-notice { margin: 1rem 0.75rem; }
}

/* ── Layout ── */
.seerah-layout {
  max-width: 980px;
  margin: 0 auto 2rem;
  padding: 0 1rem;
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
}
@media (max-width: 720px) {
  .seerah-layout { flex-direction: column; padding: 0 0.75rem; gap: 1rem; }
}

/* ── Timeline Sidebar ── */
.seerah-timeline {
  position: sticky;
  top: 1rem;
  flex-shrink: 0;
  width: 230px;
  display: flex;
  flex-direction: column;
  gap: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
}
.seerah-timeline::-webkit-scrollbar { width: 4px; }
.seerah-timeline::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
@media (max-width: 720px) {
  .seerah-timeline {
    position: static;
    width: 100%;
    flex-direction: row;
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    max-height: none;
    padding: 0.5rem;
    gap: 0.4rem;
    scrollbar-width: none;
  }
  .seerah-timeline::-webkit-scrollbar { display: none; }
}
.seerah-timeline__line {
  display: none;
}

.seerah-timeline__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.65rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: right;
  border-radius: 9px;
  transition: background 0.15s;
  width: 100%;
}
.seerah-timeline__item:hover { background: #f3f4f6; }
.seerah-timeline__item--active { background: #f0fdf4; }
@media (max-width: 720px) {
  .seerah-timeline__item {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0.5rem 0.4rem;
    min-width: 64px;
    flex-shrink: 0;
    border: 1px solid #e5e7eb;
    background: #fff;
    border-radius: 10px;
    gap: 0.25rem;
  }
  .seerah-timeline__item--active {
    border-color: var(--phase-color, #0d9488);
    background: #f0fdf4;
  }
  .seerah-timeline__label { display: none; }
}

.seerah-timeline__dot {
  flex-shrink: 0;
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  background: #f9fafb;
  border: 2px solid #d1d5db;
  color: #6b7280;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}

.seerah-timeline__label {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  text-align: right;
}
.seerah-timeline__title {
  font-size: 0.79rem;
  font-weight: 600;
  color: #374151;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}
.seerah-timeline__item--active .seerah-timeline__title { color: #111827; font-weight: 700; }
.seerah-timeline__year {
  font-size: 0.67rem;
  color: #9ca3af;
  white-space: nowrap;
}

/* ── Detail Panel ── */
.seerah-panel {
  flex: 1;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 1.75rem;
  min-height: 340px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
@media (max-width: 720px) {
  .seerah-panel { padding: 1.25rem; scroll-margin-top: 1rem; }
}

.seerah-panel__header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding-bottom: 1.25rem;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 1.25rem;
}
.seerah-panel__icon {
  font-size: 2.5rem;
  flex-shrink: 0;
  line-height: 1;
  margin-top: 0.1rem;
}
.seerah-panel__num {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-bottom: 0.2rem;
  text-transform: uppercase;
}
.seerah-panel__title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.3rem;
  line-height: 1.25;
}
.seerah-panel__year {
  font-size: 0.82rem;
  font-weight: 600;
}

.seerah-panel__desc {
  font-size: 0.97rem;
  color: #374151;
  line-height: 1.95;
  margin: 0 0 1.25rem;
}

.seerah-panel__topics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}
.seerah-panel__topic {
  font-size: 0.79rem;
  padding: 0.3rem 0.85rem;
  border-radius: 2rem;
  border: 1px solid;
  font-weight: 500;
}

.seerah-panel__coming {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.8rem;
  color: #0E6E52;
  background: rgba(14,110,82,0.06);
  border: 1px solid #fde68a;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}
.seerah-panel__coming-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  flex-shrink: 0;
}

.seerah-panel__nav {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.seerah-panel__nav-btn {
  padding: 0.55rem 1.1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.83rem;
  color: #374151;
  font-family: 'Cairo', 'Tajawal', sans-serif;
  transition: border-color 0.15s, background 0.15s;
}
.seerah-panel__nav-btn:hover { border-color: #9ca3af; background: #f3f4f6; }
.seerah-panel__nav-btn--next { margin-right: auto; }

/* ── Sources ── */
.seerah-sources {
  max-width: 920px;
  margin: 0 auto 2rem;
  padding: 1.5rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
}
@media (max-width: 640px) {
  .seerah-sources { margin: 0 0.75rem 2rem; }
}
.seerah-sources__title {
  font-size: 0.97rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1rem;
}
.seerah-sources__list {
  list-style: none;
  margin: 0; padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.seerah-sources__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;
}
.seerah-sources__bullet { color: #059669; font-size: 1.1rem; line-height: 1; }
`;
