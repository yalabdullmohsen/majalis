"use client";

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
    color: "#1F6E54",
  },
  {
    num: "٢",
    title: "توحيد الألوهية",
    subtitle: "توحيد العبادة والقصد",
    description:
      "إفراد الله بجميع أنواع العبادة: صلاةً وصوماً ودعاءً وخوفاً ورجاءً وذبحاً ونذراً ومحبةً وتوكلاً. وهو مضمون شهادة أن لا إله إلا الله، وهو أصل الدعوة النبوية.",
    ayah: "وَمَا أَرْسَلْنَا مِن قَبْلِكَ مِن رَّسُولٍ إِلَّا نُوحِي إِلَيْهِ أَنَّهُ لَا إِلَٰهَ إِلَّا أَنَا فَاعْبُدُونِ",
    ref: "الأنبياء: ٢٥",
    color: "#0E6E52",
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
  صحيح: "#15803d",
  حسن: "#0E6E52",
  ضعيف: "#dc2626",
  موضوع: "#7f1d1d",
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
      style={{ borderRightColor: GRADE_COLOR[h.grade] }}
      title={h.extra}
    >
      <span style={{ fontWeight: 700, color: GRADE_COLOR[h.grade], fontSize: "0.68rem" }}>
        {h.grade}
      </span>
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
        "قسم التوحيد: أنواع التوحيد الثلاثة (الربوبية، الألوهية، الأسماء والصفات) مع أدلتها القرآنية والمسائل المهمة — معتمد على منهج أهل السنة والجماعة.",
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
      <header className="tawheed-page-header">
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
      <section aria-labelledby="types-heading" style={{ marginBottom: "2rem" }}>
        <h2 id="types-heading" className="tawheed-principles-heading">
          أنواع التوحيد الثلاثة
        </h2>
        <div className="tawheed-types-grid">
          {TAWHEED_TYPES.map((t) => (
            <div
              key={t.num}
              className="tawheed-type-card"
              style={{ borderTop: `3px solid ${t.color}` }}
            >
              <div
                className="tawheed-type-card__num"
                style={{ background: t.color }}
              >
                {t.num}
              </div>
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

      {/* مسائل مهمة */}
      <section aria-labelledby="principles-heading" style={{ marginBottom: "2rem" }}>
        <h2 id="principles-heading" className="tawheed-principles-heading">
          مسائل مهمة في التوحيد
        </h2>
        <div className="tawheed-principles-grid">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="tawheed-principle-card">
              <p className="tawheed-principle-card__title">{p.title}</p>
              <p className="tawheed-principle-card__body">{p.body}</p>
              {p.hadith && (
                <div style={{ marginTop: "0.5rem" }}>
                  <p
                    style={{
                      fontFamily: "Amiri Quran, Scheherazade New, serif",
                      fontSize: "0.9rem",
                      lineHeight: 1.9,
                      color: "var(--text-base, #1a1a1a)",
                      margin: "0 0 0.25rem",
                      direction: "rtl",
                    }}
                  >
                    «{p.hadith.text}»
                  </p>
                  <HadithBadge h={p.hadith} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* أقسام ذات صلة */}
      <section aria-labelledby="related-heading" style={{ marginBottom: "3rem" }}>
        <h2 id="related-heading" className="tawheed-principles-heading">
          استكشف أيضاً
        </h2>
        <div className="tawheed-related-grid">
          {[
            { href: "/hadith",   label: "الأحاديث النبوية",  desc: "صحيحة وضعيفة وموضوعة" },
            { href: "/rulings",  label: "الأحكام الشرعية",   desc: "موسوعة بالأحكام الفقهية" },
            { href: "/fatwa",    label: "الفتاوى",            desc: "فتاوى مُحقَّقة ومُصنَّفة" },
            { href: "/fiqh",     label: "الفقه الإسلامي",   desc: "مدخل منهجي لعلم الفقه" },
            { href: "/miracles", label: "الإعجاز العلمي",   desc: "إعجاز القرآن والسنة" },
            { href: "/adhkar",   label: "الأذكار",            desc: "أذكار الصباح والمساء" },
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
