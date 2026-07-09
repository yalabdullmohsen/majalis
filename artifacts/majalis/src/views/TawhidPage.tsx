import { useEffect } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";

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
    color: "var(--majalis-emerald, #1F4D3A)",
  },
  {
    num: "٢",
    title: "توحيد الألوهية",
    subtitle: "توحيد العبادة والقصد",
    description:
      "إفراد الله بجميع أنواع العبادة: صلاةً وصوماً ودعاءً وخوفاً ورجاءً وذبحاً ونذراً ومحبةً وتوكلاً. وهو مضمون شهادة أن لا إله إلا الله، وهو أصل الدعوة النبوية.",
    ayah: "وَمَا أَرْسَلْنَا مِن قَبْلِكَ مِن رَّسُولٍ إِلَّا نُوحِي إِلَيْهِ أَنَّهُ لَا إِلَٰهَ إِلَّا أَنَا فَاعْبُدُونِ",
    ref: "الأنبياء: ٢٥",
    color: "var(--majalis-emerald, #1F4D3A)",
  },
  {
    num: "٣",
    title: "توحيد الأسماء والصفات",
    subtitle: "توحيد الإثبات والتنزيه",
    description:
      "الإيمان بما أثبته الله لنفسه وأثبته له رسوله ﷺ من الأسماء الحسنى والصفات العليا، على وجه يليق بجلاله سبحانه، بلا تحريف ولا تعطيل ولا تكييف ولا تمثيل.",
    ayah: "لَيْسَ كَمِثْلِهِ شَيْءٌ وَهُوَ السَّمِيعُ الْبَصِيرُ",
    ref: "الشورى: ١١",
    color: "#7C3AED",
  },
] as const;

// ─── أركان الإيمان ────────────────────────────────────────────────────────

const IMAN_PILLARS = [
  {
    num: "١",
    title: "الإيمان بالله",
    body: "الإيمان بوجود الله وربوبيته وألوهيته وأسمائه وصفاته الكاملة. وهو أصل الأصول وأساس الأركان.",
  },
  {
    num: "٢",
    title: "الإيمان بالملائكة",
    body: "الإيمان بوجودهم وأنهم عباد الله المكرمون، يُنفّذون أوامره ولا يعصونه، ومن أشهرهم جبريل وميكائيل وإسرافيل ومالك.",
  },
  {
    num: "٣",
    title: "الإيمان بالكتب",
    body: "الإيمان بجميع الكتب التي أنزلها الله على رسله: التوراة والإنجيل والزبور وصحف إبراهيم والقرآن الكريم الذي نسخها.",
  },
  {
    num: "٤",
    title: "الإيمان بالرسل",
    body: "الإيمان بجميع الأنبياء والمرسلين من آدم حتى محمد ﷺ خاتمهم، وأنهم بلّغوا الرسالة وأدّوا الأمانة.",
  },
  {
    num: "٥",
    title: "الإيمان باليوم الآخر",
    body: "الإيمان بكل ما أخبر الله ورسوله عن ما بعد الموت: من فتنة القبر وعذابه ونعيمه، والبعث والحشر والميزان والصراط والجنة والنار.",
  },
  {
    num: "٦",
    title: "الإيمان بالقدر",
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
  },
  {
    title: "ثلاثة الأصول وأدلتها",
    author: "الإمام محمد بن عبد الوهاب",
    desc: "متن مختصر يجمع أصول الدين الثلاثة: معرفة الله، ودينه، ونبيه ﷺ.",
  },
  {
    title: "العقيدة الواسطية",
    author: "شيخ الإسلام ابن تيمية",
    desc: "أجمع متن في عقيدة أهل السنة في الأسماء والصفات والإيمان باليوم الآخر.",
  },
  {
    title: "لمعة الاعتقاد",
    author: "ابن قدامة المقدسي",
    desc: "متن حنبلي موجز في عقيدة السلف، مشروح شروحاً متعددة.",
  },
  {
    title: "شرح أصول اعتقاد أهل السنة",
    author: "الإمام اللالكائي",
    desc: "من أوسع كتب توثيق أقوال السلف في العقيدة بالأسانيد.",
  },
  {
    title: "الحموية والتدمرية",
    author: "شيخ الإسلام ابن تيمية",
    desc: "رسالتان في إثبات الصفات والرد على من عطّلها — للمتوسطين.",
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

const GRADE_COLOR: Record<HadithRef["grade"], string> = {
  صحيح: "var(--majalis-emerald, #1F4D3A)",
  حسن:  "var(--majalis-emerald-deep, #0A5040)",
  ضعيف: "var(--majalis-danger, #9B1C1C)",
  موضوع: "var(--majalis-danger, #9B1C1C)",
};

type Principle = {
  title: string;
  body: string;
  hadith?: HadithRef;
};

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
    <span
      className="tawheed-hadith-badge"
      style={{ "--grade-color": GRADE_COLOR[h.grade] } as React.CSSProperties}
      title={h.extra}
    >
      <span className="tawheed-hadith-badge__grade">{h.grade}</span>
      <span>·</span>
      <span>{h.source} ({h.number})</span>
      <span>·</span>
      <span>رواه {h.narrator}</span>
    </span>
  );
}

// ─── الصفحة ────────────────────────────────────────────────────────────────

export default function TawhidPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/tawhid",
      title: "التوحيد — عقيدة أهل السنة والجماعة | المجلس العلمي",
      description:
        "قسم التوحيد: أنواع التوحيد الثلاثة، أركان الإيمان الستة، الأسماء الحسنى، والمسائل المهمة — معتمد على منهج أهل السنة والجماعة.",
      ogType: "article",
    });
  }, []);

  return (
    <div className="page-shell" dir="rtl">
      {/* مسار التنقل */}
      <nav className="tawheed-breadcrumb" aria-label="مسار التنقل">
        <Link href="/">الرئيسية</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">التوحيد</span>
      </nav>

      {/* رأس الصفحة */}
      <header id="tawhid-header" className="tawheed-page-header">
        <p className="home-eyebrow">عقيدة أهل السنة والجماعة</p>
        <h1 className="tawheed-page-header__title">التوحيد</h1>
        <p className="tawheed-page-header__subtitle">
          التوحيد هو أساس الدين وأصله، وهو إفراد الله بالخلق والأمر والعبادة.
          وهو أول واجب على المكلّف وأعظم ما دعا إليه الأنبياء والمرسلون.
        </p>
        <blockquote className="tawheed-page-header__ayah">
          ﴿وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ﴾
          <cite> — الذاريات: ٥٦</cite>
        </blockquote>
      </header>

      {/* أنواع التوحيد */}
      <section aria-labelledby="types-heading" className="twh-section">
        <h2 id="types-heading" className="tawheed-principles-heading">
          أنواع التوحيد الثلاثة
        </h2>
        <div className="tawheed-types-grid">
          {TAWHEED_TYPES.map((t) => (
            <div
              key={t.num}
              className="tawheed-type-card"
              style={{ "--card-color": t.color } as React.CSSProperties}
            >
              <div className="tawheed-type-card__num">{t.num}</div>
              <p className="tawheed-type-card__title">{t.title}</p>
              <p className="tawheed-type-card__subtitle">{t.subtitle}</p>
              <p className="tawheed-type-card__desc">{t.description}</p>
              <blockquote className="tawheed-type-card__ayah">
                ﴿{t.ayah}﴾
                <cite>{t.ref}</cite>
              </blockquote>
            </div>
          ))}
        </div>
      </section>

      {/* أركان الإيمان الستة */}
      <section aria-labelledby="iman-heading" className="twh-section">
        <h2 id="iman-heading" className="tawheed-principles-heading">
          أركان الإيمان الستة
        </h2>
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
      </section>

      {/* مسائل مهمة */}
      <section aria-labelledby="principles-heading" className="twh-section">
        <h2 id="principles-heading" className="tawheed-principles-heading">
          مسائل مهمة في التوحيد
        </h2>
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
      </section>

      {/* من الأسماء الحسنى */}
      <section aria-labelledby="asma-heading" className="twh-section">
        <h2 id="asma-heading" className="tawheed-principles-heading">
          من الأسماء الحسنى
        </h2>
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
      </section>

      {/* كتب مقترحة */}
      <section aria-labelledby="books-heading" className="twh-section">
        <h2 id="books-heading" className="tawheed-principles-heading">
          كتب مقترحة في العقيدة
        </h2>
        <div className="twh-books-grid">
          {RECOMMENDED_BOOKS.map((b) => (
            <div key={b.title} className="twh-book-card">
              <p className="twh-book-title">{b.title}</p>
              <p className="twh-book-author">{b.author}</p>
              <p className="twh-book-desc">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* أقسام ذات صلة */}
      <section aria-labelledby="related-heading" className="twh-section twh-section--mb3">
        <h2 id="related-heading" className="tawheed-principles-heading">
          استكشف أيضاً
        </h2>
        <div className="tawheed-related-grid">
          {[
            { href: "/asma-husna",label: "الأسماء الحسنى",    desc: "99 اسماً لله بمعانيها وآياتها" },
            { href: "/hadith",   label: "الأحاديث النبوية",  desc: "صحيحة وضعيفة وموضوعة" },
            { href: "/rulings",  label: "الأحكام الشرعية",   desc: "موسوعة بالأحكام الفقهية" },
            { href: "/fatwa",    label: "الفتاوى",            desc: "فتاوى مُحقَّقة ومُصنَّفة" },
            { href: "/fiqh",     label: "الفقه الإسلامي",    desc: "مدخل منهجي لعلم الفقه" },
            { href: "/miracles", label: "الإعجاز العلمي",    desc: "إعجاز القرآن والسنة" },
            { href: "/adhkar",   label: "الأذكار",            desc: "أذكار الصباح والمساء" },
            { href: "/seerah",   label: "السيرة النبوية",    desc: "سيرة النبي ﷺ مفصّلة" },
            { href: "/library",  label: "المكتبة",            desc: "كتب العقيدة والفقه" },
          ].map(({ href, label, desc }) => (
            <Link key={href} href={href} className="tawheed-related-card">
              <strong className="tawheed-related-card__label">{label}</strong>
              <span className="tawheed-related-card__desc">{desc}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
