import { useEffect, useState } from "react";
import { Bird, BookOpen, Gem, Heart, Landmark, Lightbulb, Library, MapPin, Megaphone, Moon, ScrollText, Sparkles, Sprout, Swords } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { Link } from "wouter";
import { usePageView } from "@/hooks/usePageView";
import { AdminQuickEdit } from "@/components/AdminQuickEdit";
import { ShareButton } from "@/components/ShareButton";

const PHASES: { id: string; num: number; title: string; year: string; Icon: LucideIcon; color: string; desc: string; topics: string[] }[] = [
  {
    id: "lineage-birth",
    num: 1,
    title: "النسب والمولد",
    year: "عام الفيل — 571م",
    Icon: Moon,
    color: "#18362A",
    desc: "وُلد النبي ﷺ في مكة المكرمة عام الفيل، من نسب قريشي شريف يمتد إلى إبراهيم الخليل عليه السلام. وفي ذلك العام حمى الله الكعبة المشرفة من أبرهة وجنده.",
    topics: ["نسبه الشريف ﷺ", "مولده في مكة", "حادثة الفيل"],
  },
  {
    id: "childhood",
    num: 2,
    title: "الطفولة والرضاعة",
    year: "571–576م",
    Icon: Sprout,
    color: "#153025",
    desc: "أُرضع ﷺ عند حليمة السعدية في بني سعد، وفُقد والده قبل ولادته. توفيت أمه آمنة وهو في السادسة، فكفله جده عبد المطلب ثم عمه أبو طالب.",
    topics: ["رضاعته عند حليمة", "يتمه ﷺ", "كفالة جده وعمه"],
  },
  {
    id: "youth",
    num: 3,
    title: "الشباب قبل البعثة",
    year: "576–610م",
    Icon: ScrollText,
    color: "#18362A",
    desc: "عُرف ﷺ في قومه بالصادق الأمين، شارك في حلف الفضول لنصرة المظلومين، عمل بالتجارة، وتزوج خديجة رضي الله عنها، وكان يتحنث في غار حراء.",
    topics: ["الصادق الأمين", "حلف الفضول", "زواجه من خديجة ﷢", "تحنّثه في حراء"],
  },
  {
    id: "prophethood",
    num: 4,
    title: "البعثة",
    year: "610م",
    Icon: Sparkles,
    color: "#18362A",
    desc: "نزل جبريل عليه السلام على النبي ﷺ في غار حراء بأوائل سورة العلق، فكانت بداية الوحي والرسالة المحمدية الخاتمة.",
    topics: ["نزول الوحي الأول", "غار حراء", "أوائل المؤمنين"],
  },
  {
    id: "secret-dawah",
    num: 5,
    title: "الدعوة السرية",
    year: "610–613م",
    Icon: Bird,
    color: "#1E4A37",
    desc: "انطلقت الدعوة سراً بين الأهل والمقربين؛ أسلمت خديجة وعلي وأبو بكر وزيد رضي الله عنهم، واتسعت الدائرة تدريجياً قبل الجهر.",
    topics: ["الدعوة في السر", "أوائل المسلمين", "الهجرة إلى الحبشة"],
  },
  {
    id: "open-dawah",
    num: 6,
    title: "الدعوة الجهرية",
    year: "613–619م",
    Icon: Megaphone,
    color: "#9B1C1C",
    desc: "أُعلنت الدعوة على رؤوس الأشهاد وصعد النبي ﷺ الصفا ينادي قريشاً. فاشتد الإيذاء وهاجر المستضعفون إلى الحبشة، وحُوصر المسلمون في شعب أبي طالب.",
    topics: ["الجهر بالدعوة", "إيذاء قريش", "الحصار في الشعب"],
  },
  {
    id: "year-of-sorrow",
    num: 7,
    title: "عام الحزن والإسراء",
    year: "619–620م",
    Icon: Moon,
    color: "#2A3E50",
    desc: "توفيت أم المؤمنين خديجة وعمه أبو طالب في عام واحد سُمّي بعام الحزن. ثم كانت رحلة الإسراء إلى المسجد الأقصى والمعراج إلى السماوات تثبيتاً للنبي ﷺ.",
    topics: ["وفاة خديجة ﷢", "وفاة أبي طالب", "الإسراء والمعراج"],
  },
  {
    id: "hijra",
    num: 8,
    title: "الهجرة إلى المدينة",
    year: "622م",
    Icon: MapPin,
    color: "#18362A",
    desc: "أذن الله بالهجرة إلى يثرب، فخرج النبي ﷺ مع أبي بكر رضي الله عنه وآثرا غار ثور مأوىً، ثم وصل المدينة فاستُقبل بالفرح والترحيب. كانت هذه الهجرة بداية التقويم الهجري.",
    topics: ["مغادرة مكة", "الوصول للمدينة", "بناء المسجد النبوي", "الأخوّة بين المهاجرين والأنصار"],
  },
  {
    id: "ghazawat",
    num: 9,
    title: "الغزوات الكبرى",
    year: "624–627م",
    Icon: Swords,
    color: "#5C1C2A",
    desc: "شهدت هذه المرحلة غزوات بدر الكبرى وأُحد والخندق؛ أبلى فيها المسلمون بلاءً حسناً وثبّتت إيمانهم، وكان النصر والابتلاء كلاهما درساً وتكويناً للأمة.",
    topics: ["غزوة بدر الكبرى", "غزوة أُحد", "غزوة الأحزاب — الخندق"],
  },
  {
    id: "hudaybiyya-mecca",
    num: 10,
    title: "الحديبية وفتح مكة",
    year: "628–630م",
    Icon: Landmark,
    color: "#18362A",
    desc: "كان صلح الحديبية فتحاً مبيناً مهّد لانتشار الإسلام أفواجاً. تُوّج ذلك بدخول مكة المكرمة عام ثمانية للهجرة بلا قتال، وعفا النبي ﷺ عمن آذاه.",
    topics: ["صلح الحديبية", "فتح مكة", "العفو العام"],
  },
  {
    id: "farewell",
    num: 11,
    title: "حجة الوداع",
    year: "السنة العاشرة — 632م",
    Icon: Gem,
    color: "#153025",
    desc: "أدّى النبي ﷺ فريضة الحج وألقى خطبته الجامعة في عرفات بين مئة ألف من الصحابة. وأُنزل في ذلك اليوم العظيم: ﴿الْيَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ﴾.",
    topics: ["حجة الوداع", "خطبة عرفة", "اكتمال الدين"],
  },
  {
    id: "death",
    num: 12,
    title: "الوفاة",
    year: "السنة الحادية عشرة — 632م",
    Icon: Heart,
    color: "#1E4A37",
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

  useEffect(() => {
    applyPageSeo({
      path: "/seerah",
      title: "السيرة النبوية | المجلس العلمي",
      description: "السيرة النبوية الشريفة — تاريخ حياة النبي محمد ﷺ منذ الميلاد حتى الوفاة بمراحل مرتّبة.",
      keywords: ["السيرة النبوية", "سيرة النبي", "محمد ﷺ", "تاريخ الإسلام", "الهجرة النبوية"],
    });
  }, []);

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
      <div className="seerah-page" dir="rtl">

        {/* رابط عكسي لقصص الأنبياء */}
        <div className="seerah-back-wrap">
          <Link href="/prophets" className="seerah-back-link">
            ← قصص الأنبياء الكرام
          </Link>
        </div>

        {/* لافتة الربط: السيرة امتداد لقصص الأنبياء */}
        <div className="seerah-prophets-banner" dir="rtl">
          <span className="seerah-prophets-banner__icon" aria-hidden="true"><BookOpen size={20} strokeWidth={1.5} /></span>
          <p className="seerah-prophets-banner__text">
            <strong>السيرة النبوية</strong> خاتمة قصص الأنبياء الكرام وامتدادها الطبيعي — فهي بعثة خاتم الأنبياء والمرسلين محمد ﷺ التي أتمّ الله بها الدين وأكمل النعمة.
          </p>
          <Link href="/prophets" className="seerah-prophets-banner__link">قصص الأنبياء ←</Link>
        </div>

        {/* Hero */}
        <div className="seerah-hero">
          <div className="seerah-hero__badge"><BookOpen size={14} className="inline ml-1" /> سيرة النبي ﷺ</div>
          <h1 className="seerah-hero__title">السيرة النبوية الشريفة</h1>
          <p className="seerah-hero__sub">
            امتداداً لرسالة الأنبياء — حياة خاتمهم محمد ﷺ من المولد إلى الوفاة في 12 مرحلة
          </p>
        </div>

        {/* Notice */}
        <div className="seerah-notice">
          <strong><Lightbulb size={14} className="inline ml-1" /> منهج القسم:</strong> يُقدَّم المحتوى التاريخي استناداً إلى المصادر الموثقة كسيرة ابن هشام والبداية والنهاية وزاد المعاد. التفاصيل الشرعية التفصيلية تُضاف تدريجياً من مصادر علمية معتمدة.
        </div>

        {/* Timeline Layout */}
        <div className="seerah-layout">

          {/* Sidebar — قائمة المراحل */}
          <nav className="seerah-timeline" aria-label="مراحل السيرة النبوية">
            <div className="seerah-timeline__line" aria-hidden="true" />
            {PHASES.map(phase => (
              <button
                key={phase.id}
                type="button"
                className={`seerah-timeline__item seerah-phase--${phase.id}${activeId === phase.id ? " seerah-timeline__item--active" : ""}`}
                onClick={() => goTo(phase.id)}
                aria-current={activeId === phase.id ? "true" : undefined}
                aria-label={`المرحلة ${phase.num}: ${phase.title}`}
              >
                <span className="seerah-timeline__dot">
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
          <div className={`seerah-panel seerah-phase--${active.id}`} id="seerah-panel">
            <div className="seerah-panel__header">
              <span className="seerah-panel__icon">{(() => { const I = active.Icon; return <I size={28} strokeWidth={1.3} />; })()}</span>
              <div className="seerah-panel__header-body">
                <div className="seerah-panel__num">
                  المرحلة {active.num} من {PHASES.length}
                </div>
                <h2 className="seerah-panel__title">{active.title}</h2>
                <div className="seerah-panel__year">
                  {active.year}
                </div>
              </div>
            </div>

            <p className="seerah-panel__desc">{active.desc}</p>

            <div className="seerah-panel__topics">
              {active.topics.map(t => (
                <span key={t} className="seerah-panel__topic">{t}</span>
              ))}
            </div>

            <div className="seerah-panel__coming">
              <span className="seerah-panel__coming-dot" />
              التفاصيل التاريخية التفصيلية من مصادر موثقة قادمة قريباً
            </div>

            <ShareButton
              title={`السيرة النبوية — ${active.title}`}
              text={`${active.title} (${active.year})\n${active.desc}`}
              size="sm"
              className="seerah-panel__share"
            />

            {/* Navigation */}
            <div className="seerah-panel__nav">
              {activeIdx > 0 && (
                <button
                  type="button"
                  className="seerah-panel__nav-btn"
                  onClick={() => goTo(PHASES[activeIdx - 1].id)}
                >
                  ← {PHASES[activeIdx - 1].title}
                </button>
              )}
              {activeIdx < PHASES.length - 1 && (
                <button
                  type="button"
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
          <h2 className="seerah-sources__title"><Library size={18} className="inline ml-2" /> مصادر السيرة المعتمدة</h2>
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
