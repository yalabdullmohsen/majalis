import { useEffect, useState } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";

// ─── أقسام العقيدة والتوحيد ──────────────────────────────────────────────────

type AqeedaSection = {
  emoji: string;
  title: string;
  desc: string;
  href: string;
  badge: string;
  color: string;
  isCurrent?: boolean;
};

const AQEEDA_SECTIONS: AqeedaSection[] = [
  {
    emoji: "🕌",
    title: "التوحيد ومسائله",
    desc: "أنواع التوحيد الثلاثة، الشرك، البدعة، والمسائل العقدية المهمة",
    href: "/tawhid",
    badge: "٨ مسائل",
    isCurrent: true,
    color: "#1F4D3A",
  },
  {
    emoji: "🌟",
    title: "أركان الإسلام",
    desc: "الشهادتان — الصلاة — الزكاة — الصيام — الحج، مع الدليل والشرح",
    href: "/arkan",
    badge: "٥ أركان",
    color: "#0F5132",
  },
  {
    emoji: "✨",
    title: "أركان الإيمان",
    desc: "الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر والقدر",
    href: "/arkan-iman",
    badge: "٦ أركان",
    color: "#7C3AED",
  },
  {
    emoji: "💎",
    title: "الأسماء الحسنى",
    desc: "التسعة والتسعون اسماً بمعانيها وأدلتها وآثارها في السلوك",
    href: "/asma-husna",
    badge: "٩٩ اسماً",
    color: "#0F766E",
  },
  {
    emoji: "🌿",
    title: "الجنة والنار",
    desc: "صفة الجنة ونعيمها، وصفة النار وعذابها من نصوص الكتاب والسنة",
    href: "/janna-naar",
    badge: "عقيدة",
    color: "#1F4D3A",
  },
  {
    emoji: "⏳",
    title: "علامات الساعة",
    desc: "العلامات الصغرى والكبرى مرتبةً بالأدلة — من اقتراب الساعة",
    href: "/alamat-saah",
    badge: "صغرى وكبرى",
    color: "#92400E",
  },
  {
    emoji: "👼",
    title: "الملائكة في الإسلام",
    desc: "أسماؤهم ومهامهم وصفاتهم وما جاء في القرآن والسنة عنهم",
    href: "/malaika",
    badge: "غيبيات",
    color: "#5B21B6",
  },
  {
    emoji: "🔬",
    title: "الإعجاز العلمي",
    desc: "إعجاز القرآن الكريم والسنة النبوية في مجالات العلوم الحديثة",
    href: "/miracles",
    badge: "إعجاز",
    color: "#065F46",
  },
];

// ─── أنواع التوحيد ────────────────────────────────────────────────────────

const TAWHEED_TYPES = [
  {
    num: "١",
    title: "توحيد الربوبية",
    subtitle: "توحيد الخلق والتدبير",
    description:
      "الإقرار بأن الله وحده هو الخالق الرازق المحيي المميت المدبّر لجميع الأمور، لا شريك له في ملكه. وهذا النوع فطريٌّ يُقرّ به أكثر الناس، لكنه وحده لا يكفي للنجاة.",
    ayah: "قُلْ مَن يَرْزُقُكُم مِّنَ السَّمَاءِ وَالْأَرْضِ أَمَّن يَمْلِكُ السَّمْعَ وَالْأَبْصَارَ",
    ref: "يونس: ٣١",
    variant: "emerald",
  },
  {
    num: "٢",
    title: "توحيد الألوهية",
    subtitle: "توحيد العبادة والقصد",
    description:
      "إفراد الله بجميع أنواع العبادة: صلاةً وصوماً ودعاءً وخوفاً ورجاءً وذبحاً ونذراً ومحبةً وتوكلاً. وهو مضمون شهادة أن لا إله إلا الله، وهو أصل الدعوة النبوية.",
    ayah: "وَمَا أَرْسَلْنَا مِن قَبْلِكَ مِن رَّسُولٍ إِلَّا نُوحِي إِلَيْهِ أَنَّهُ لَا إِلَٰهَ إِلَّا أَنَا فَاعْبُدُونِ",
    ref: "الأنبياء: ٢٥",
    variant: "emerald",
  },
  {
    num: "٣",
    title: "توحيد الأسماء والصفات",
    subtitle: "توحيد الإثبات والتنزيه",
    description:
      "الإيمان بما أثبته الله لنفسه وأثبته له رسوله ﷺ من الأسماء الحسنى والصفات العليا، على وجه يليق بجلاله سبحانه، بلا تحريف ولا تعطيل ولا تكييف ولا تمثيل.",
    ayah: "لَيْسَ كَمِثْلِهِ شَيْءٌ وَهُوَ السَّمِيعُ الْبَصِيرُ",
    ref: "الشورى: ١١",
    variant: "purple",
  },
] as const;

// ─── أركان الإيمان ────────────────────────────────────────────────────────

const IMAN_PILLARS = [
  {
    num: "١", title: "الإيمان بالله",
    body: "الإيمان بوجود الله وربوبيته وألوهيته وأسمائه وصفاته الكاملة. وهو أصل الأصول وأساس الأركان.",
  },
  {
    num: "٢", title: "الإيمان بالملائكة",
    body: "الإيمان بوجودهم وأنهم عباد الله المكرمون، يُنفّذون أوامره ولا يعصونه، ومن أشهرهم جبريل وميكائيل وإسرافيل ومالك.",
  },
  {
    num: "٣", title: "الإيمان بالكتب",
    body: "الإيمان بجميع الكتب التي أنزلها الله على رسله: التوراة والإنجيل والزبور وصحف إبراهيم والقرآن الكريم الذي نسخها.",
  },
  {
    num: "٤", title: "الإيمان بالرسل",
    body: "الإيمان بجميع الأنبياء والمرسلين من آدم حتى محمد ﷺ خاتمهم، وأنهم بلّغوا الرسالة وأدّوا الأمانة.",
  },
  {
    num: "٥", title: "الإيمان باليوم الآخر",
    body: "الإيمان بكل ما أخبر الله ورسوله عن ما بعد الموت: من فتنة القبر وعذابه ونعيمه، والبعث والحشر والميزان والصراط والجنة والنار.",
  },
  {
    num: "٦", title: "الإيمان بالقدر",
    body: "الإيمان بأن الله علم كل شيء وكتبه وشاءه وخلقه. وله أربع مراتب: العلم، والكتابة، والمشيئة، والخلق. والإيمان بهذا لا ينفي مسؤولية الإنسان.",
  },
] as const;

// ─── من الأسماء الحسنى ───────────────────────────────────────────────────

const ASMA_HUSNA = [
  { name: "الله",     meaning: "اسمه الجامع لجميع صفات الكمال والجلال" },
  { name: "الرحمن",  meaning: "ذو الرحمة الواسعة التي وسعت كل شيء" },
  { name: "الرحيم",  meaning: "دائم الرحمة بعباده المؤمنين في الدنيا والآخرة" },
  { name: "الملك",   meaning: "المالك لجميع الكون، الحاكم الذي لا حاكم سواه" },
  { name: "القدوس",  meaning: "المنزّه عن كل نقص وعيب، البالغ في الطهارة والكمال" },
  { name: "السلام",  meaning: "ذو السلامة من كل نقص، مصدر السلام لعباده" },
  { name: "الغفّار", meaning: "الذي يغفر الذنوب مرةً بعد مرة لمن تاب واستغفر" },
  { name: "الرزّاق", meaning: "الذي يتولى رزق جميع الخلق ويوسّع ويضيّق بحكمته" },
  { name: "العليم",  meaning: "المحيط علمه بكل شيء في الأزل وإلى الأبد" },
  { name: "القدير",  meaning: "الكامل القدرة على كل شيء، لا يعجزه شيء" },
  { name: "الحكيم",  meaning: "الذي يضع كل شيء في موضعه اللائق به بالغاً في الحكمة" },
  { name: "السميع",  meaning: "الذي يسمع كل صوت سرّاً وعلناً، لا يخفى عليه خافية" },
  { name: "البصير",  meaning: "المحيط بصره بكل مرئي دقيق أو جليل" },
  { name: "الحيّ",   meaning: "الحياة الكاملة الأزلية الأبدية التي لا تشبه حياة المخلوقين" },
  { name: "القيّوم", meaning: "القائم بنفسه الذي يقوم غيره به، لا يحتاج إلى أحد" },
  { name: "الكريم",  meaning: "ذو الكرم والعطاء الواسع والجود الذي لا ينقطع" },
] as const;

// ─── كتب مقترحة ──────────────────────────────────────────────────────────

const RECOMMENDED_BOOKS = [
  {
    title: "كتاب التوحيد",
    author: "الإمام محمد بن عبد الوهاب",
    desc: "أصل متين في توحيد الألوهية مع الأدلة القرآنية والحديثية — أول كتاب في العقيدة للمبتدئ.",
    level: "مبتدئ",
  },
  {
    title: "ثلاثة الأصول وأدلتها",
    author: "الإمام محمد بن عبد الوهاب",
    desc: "متن مختصر يجمع أصول الدين الثلاثة: معرفة الله، ودينه، ونبيه ﷺ.",
    level: "مبتدئ",
  },
  {
    title: "العقيدة الواسطية",
    author: "شيخ الإسلام ابن تيمية",
    desc: "أجمع متن في عقيدة أهل السنة في الأسماء والصفات والإيمان باليوم الآخر.",
    level: "متوسط",
  },
  {
    title: "لمعة الاعتقاد",
    author: "ابن قدامة المقدسي",
    desc: "متن حنبلي موجز في عقيدة السلف، مشروح شروحاً متعددة.",
    level: "مبتدئ",
  },
  {
    title: "شرح أصول اعتقاد أهل السنة",
    author: "الإمام اللالكائي",
    desc: "من أوسع كتب توثيق أقوال السلف في العقيدة بالأسانيد.",
    level: "متقدم",
  },
  {
    title: "الحموية والتدمرية",
    author: "شيخ الإسلام ابن تيمية",
    desc: "رسالتان في إثبات الصفات والرد على من عطّلها — للمتوسطين.",
    level: "متوسط",
  },
] as const;

// ─── مسائل التوحيد ───────────────────────────────────────────────────────

type HadithRef = {
  text: string;
  source: string;
  number: string;
  grade: "صحيح" | "حسن" | "ضعيف" | "موضوع";
  narrator: string;
  extra?: string;
};

const GRADE_MOD: Record<HadithRef["grade"], string> = {
  صحيح:  "tawheed-hadith-badge--sahih",
  حسن:   "tawheed-hadith-badge--hasan",
  ضعيف:  "tawheed-hadith-badge--daif",
  موضوع: "tawheed-hadith-badge--mawdu",
};

type Principle = { title: string; body: string; hadith?: HadithRef };

const PRINCIPLES: Principle[] = [
  {
    title: "شهادة لا إله إلا الله",
    body: "لها ركنان لا تصح إلا بهما: نفي الإلهية عن كل ما سوى الله (لا إله)، وإثباتها لله وحده (إلا الله). ومن أقرّ بالربوبية دون الألوهية لم يكن موحداً.",
  },
  {
    title: "أعظم الأوامر والنواهي",
    body: "أعظم ما أمر الله به التوحيد، وأعظم ما نهى عنه الشرك. قال تعالى: ﴿وَاعْبُدُوا اللَّهَ وَلَا تُشْرِكُوا بِهِ شَيْئًا﴾ [النساء: ٣٦].",
  },
  {
    title: "الشرك الأكبر",
    body: "صرف شيء من العبادة لغير الله، كدعاء الأموات والاستغاثة بهم والذبح والنذر لغير الله. وهو أعظم الذنوب ولا يغفره الله لمن مات عليه، قال تعالى: ﴿إِنَّ اللَّهَ لَا يَغْفِرُ أَن يُشْرَكَ بِهِ﴾ [النساء: ٤٨].",
  },
  {
    title: "الشرك الأصغر",
    body: "ما أطلق عليه الشرعُ اسم الشرك ولم يبلغ حدّ الأكبر، كالرياء والسمعة والحلف بغير الله.",
    hadith: {
      text: "إنَّ أخوف ما أخاف عليكم الشرك الأصغر: الرياء",
      source: "مسند أحمد",
      number: "٢٣٦٣٠",
      grade: "صحيح",
      narrator: "محمود بن لبيد الأنصاري",
      extra: "صحّحه الألباني في السلسلة الصحيحة (٩٥١)",
    },
  },
  {
    title: "البدعة في الدين",
    body: "كل عبادة لم يشرعها الله ورسوله مردودة وإن حسنت نية صاحبها.",
    hadith: {
      text: "كل بدعة ضلالة، وكل ضلالة في النار",
      source: "صحيح مسلم",
      number: "٨٦٧",
      grade: "صحيح",
      narrator: "جابر بن عبدالله",
    },
  },
  {
    title: "التوسل المشروع",
    body: "يُشرع التوسل بأسماء الله وصفاته، وبالعمل الصالح، وبدعاء الرجل الصالح الحي. أما دعاء الأموات فهو الشرك الأكبر.",
  },
  {
    title: "التعلق بالأسباب",
    body: "الأخذ بالأسباب المشروعة واجب مع صرف القلب لله وحده. أما اعتقاد تأثير السبب بذاته دون الله فهو قدح في التوحيد.",
  },
  {
    title: "أصل دعوة الرسل",
    body: "بعث الله كل رسول بالدعوة إلى توحيد الألوهية أولاً. قال تعالى: ﴿وَلَقَدْ بَعَثْنَا فِي كُلِّ أُمَّةٍ رَّسُولًا أَنِ اعْبُدُوا اللَّهَ وَاجْتَنِبُوا الطَّاغُوتَ﴾ [النحل: ٣٦].",
  },
];

// ─── مكوّن شارة الحديث ─────────────────────────────────────────────────────

function HadithBadge({ h }: { h: HadithRef }) {
  return (
    <span className={`tawheed-hadith-badge ${GRADE_MOD[h.grade]}`} title={h.extra}>
      <span className="tawheed-hadith-badge__grade">{h.grade}</span>
      <span>·</span>
      <span>{h.source} ({h.number})</span>
      <span>·</span>
      <span>رواه {h.narrator}</span>
    </span>
  );
}

// ─── التبويبات ─────────────────────────────────────────────────────────────

type Tab = "tawhid-types" | "iman-pillars" | "principles" | "asma" | "books";
const TABS: { id: Tab; label: string }[] = [
  { id: "tawhid-types",  label: "أنواع التوحيد" },
  { id: "iman-pillars",  label: "أركان الإيمان" },
  { id: "principles",    label: "مسائل التوحيد" },
  { id: "asma",          label: "الأسماء الحسنى" },
  { id: "books",         label: "كتب مقترحة" },
];

// ─── الصفحة ────────────────────────────────────────────────────────────────

export default function TawhidPage() {
  const [tab, setTab] = useState<Tab>("tawhid-types");

  useEffect(() => {
    applyPageSeo({
      path: "/tawhid",
      title: "العقيدة والتوحيد — أقسام وموضوعات كاملة | المجلس العلمي",
      description:
        "بوابة العقيدة والتوحيد: أنواع التوحيد، أركان الإيمان، الأسماء الحسنى، الجنة والنار، علامات الساعة، الملائكة، والإعجاز العلمي — منهج أهل السنة والجماعة.",
      ogType: "article",
    });
  }, []);

  return (
    <div className="page-shell" dir="rtl">
      {/* مسار التنقل */}
      <nav className="tawheed-breadcrumb" aria-label="مسار التنقل">
        <Link href="/">الرئيسية</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">العقيدة والتوحيد</span>
      </nav>

      {/* رأس القسم */}
      <header className="twh-hub-hero">
        <div className="twh-hub-hero__inner">
          <p className="home-eyebrow">عقيدة أهل السنة والجماعة</p>
          <h1 className="twh-hub-hero__title">العقيدة والتوحيد</h1>
          <p className="twh-hub-hero__sub">
            أقسام العقيدة كاملةً — من التوحيد وأركان الإيمان حتى الغيبيات وعلامات الساعة
          </p>
          <blockquote className="twh-hub-hero__ayah">
            ﴿وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ﴾
            <cite> — الذاريات: ٥٦</cite>
          </blockquote>
        </div>
      </header>

      {/* شبكة أقسام العقيدة */}
      <section aria-labelledby="hub-sections-heading" className="twh-section">
        <h2 id="hub-sections-heading" className="tawheed-principles-heading twh-hub-sections-title">
          أقسام العقيدة والتوحيد
        </h2>
        <div className="twh-hub-grid">
          {AQEEDA_SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={`twh-hub-card${s.isCurrent ? " twh-hub-card--current" : ""}`}
              style={{ "--twh-hub-clr": s.color } as React.CSSProperties}
              aria-current={s.isCurrent ? "page" : undefined}
            >
              <span className="twh-hub-card__emoji" aria-hidden="true">{s.emoji}</span>
              <div className="twh-hub-card__body">
                <p className="twh-hub-card__title">{s.title}</p>
                <p className="twh-hub-card__desc">{s.desc}</p>
              </div>
              <span className="twh-hub-card__badge">{s.badge}</span>
              {s.isCurrent && <span className="twh-hub-card__current-tag">الصفحة الحالية</span>}
            </Link>
          ))}
        </div>
      </section>

      {/* تبويبات المحتوى التعليمي */}
      <section aria-label="محتوى التوحيد" className="twh-section">
        <div className="twh-tabs-bar" role="tablist" aria-label="محتوى التوحيد">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              className={`twh-tab${tab === t.id ? " twh-tab--active" : ""}`}
              onClick={() => setTab(t.id)}
              aria-selected={tab === t.id}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* أنواع التوحيد */}
        {tab === "tawhid-types" && (
          <div role="tabpanel" className="twh-tabpanel">
            <div className="tawheed-types-grid">
              {TAWHEED_TYPES.map((t, idx) => (
                <div
                  key={t.num}
                  className={`tawheed-type-card tawheed-type-card--${idx === 2 ? "purple" : "emerald"}`}
                >
                  <div className="tawheed-type-card__num">{t.num}</div>
                  <p className="tawheed-type-card__title">{t.title}</p>
                  <p className="tawheed-type-card__subtitle">{t.subtitle}</p>
                  <p className="tawheed-type-card__desc">{t.description}</p>
                  <blockquote className="tawheed-type-card__ayah">
                    ﴿{t.ayah}﴾<cite>{t.ref}</cite>
                  </blockquote>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* أركان الإيمان */}
        {tab === "iman-pillars" && (
          <div role="tabpanel" className="twh-tabpanel">
            <p className="twh-section-intro">
              قال ﷺ: «الإيمان أن تؤمن بالله وملائكته وكتبه ورسله واليوم الآخر وتؤمن بالقدر خيره وشرّه»
              <span className="twh-source-ref"> — صحيح مسلم (٨)</span>
            </p>
            <div className="twh-pillars-grid">
              {IMAN_PILLARS.map((p) => (
                <div key={p.num} className="twh-pillar-card">
                  <div className="twh-pillar-num">{p.num}</div>
                  <div className="twh-pillar-body">
                    <p className="twh-pillar-title">{p.title}</p>
                    <p className="twh-pillar-desc">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="twh-subsection-link">
              <Link href="/arkan-iman" className="twh-goto-btn">
                صفحة أركان الإيمان كاملةً ←
              </Link>
            </div>
          </div>
        )}

        {/* مسائل التوحيد */}
        {tab === "principles" && (
          <div role="tabpanel" className="twh-tabpanel">
            <div className="tawheed-principles-grid">
              {PRINCIPLES.map((p) => (
                <div key={p.title} className="tawheed-principle-card">
                  <p className="tawheed-principle-card__title">{p.title}</p>
                  <p className="tawheed-principle-card__body">{p.body}</p>
                  {p.hadith && (
                    <div className="twh-hadith-wrap">
                      <p className="twh-hadith-text">«{p.hadith.text}»</p>
                      <HadithBadge h={p.hadith} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* من الأسماء الحسنى */}
        {tab === "asma" && (
          <div role="tabpanel" className="twh-tabpanel">
            <p className="twh-section-intro">
              ﴿وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَى فَادْعُوهُ بِهَا﴾
              <span className="twh-source-ref"> — الأعراف: ١٨٠</span>
            </p>
            <div className="twh-asma-grid">
              {ASMA_HUSNA.map((a) => (
                <div key={a.name} className="twh-asma-card">
                  <p className="twh-asma-name">{a.name}</p>
                  <p className="twh-asma-meaning">{a.meaning}</p>
                </div>
              ))}
            </div>
            <div className="twh-subsection-link">
              <Link href="/asma-husna" className="twh-goto-btn">
                الصفحة الكاملة للأسماء الحسنى (٩٩ اسماً) ←
              </Link>
            </div>
          </div>
        )}

        {/* كتب مقترحة */}
        {tab === "books" && (
          <div role="tabpanel" className="twh-tabpanel">
            <div className="twh-books-grid">
              {RECOMMENDED_BOOKS.map((b) => (
                <div key={b.title} className="twh-book-card">
                  <span className={`twh-book-level twh-book-level--${b.level === "مبتدئ" ? "beginner" : b.level === "متوسط" ? "mid" : "adv"}`}>{b.level}</span>
                  <p className="twh-book-title">{b.title}</p>
                  <p className="twh-book-author">{b.author}</p>
                  <p className="twh-book-desc">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
