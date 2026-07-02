"use client";

type HadithRef = {
  text: string;
  source: string;
  number: string;
  grade: "صحيح" | "حسن" | "ضعيف" | "موضوع";
  narrator: string;
  extra?: string;
};

const GRADE_COLOR: Record<HadithRef["grade"], string> = {
  صحيح:  "#15803d",
  حسن:   "#b45309",
  ضعيف:  "#dc2626",
  موضوع: "#7f1d1d",
};

function HadithBadge({ h }: { h: HadithRef }) {
  const color = GRADE_COLOR[h.grade];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        marginTop: "0.45rem",
        fontSize: "0.7rem",
        lineHeight: 1.4,
        color: "var(--ds-ink-soft, #6b7280)",
        background: "var(--ds-surface-2, #f3f4f6)",
        borderRadius: "0.35rem",
        padding: "0.18rem 0.45rem",
        borderRight: `3px solid ${color}`,
        direction: "rtl",
      }}
      title={h.extra}
    >
      <span style={{ fontWeight: 700, color, fontSize: "0.68rem" }}>{h.grade}</span>
      <span>·</span>
      <span>{h.source} ({h.number})</span>
      <span>·</span>
      <span>رواه {h.narrator}</span>
    </span>
  );
}

const TAWHEED_TYPES = [
  {
    num: "١",
    title: "توحيد الربوبية",
    subtitle: "توحيد الخلق والتدبير",
    description:
      "الإقرار بأن الله وحده هو الخالق الرازق المحيي المميت المدبر لجميع الأمور، لا شريك له في ملكه. وهذا النوع فطريٌّ يُقرّ به أكثر الناس، ولكنه وحده لا يكفي للنجاة.",
    ayah: "قُلْ مَن يَرْزُقُكُم مِّنَ السَّمَاءِ وَالْأَرْضِ أَمَّن يَمْلِكُ السَّمْعَ وَالْأَبْصَارَ",
    ref: "يونس: ٣١",
  },
  {
    num: "٢",
    title: "توحيد الألوهية",
    subtitle: "توحيد العبادة والقصد",
    description:
      "إفراد الله بجميع أنواع العبادة: صلاةً وصوماً ودعاءً وخوفاً ورجاءً وذبحاً ونذراً ومحبةً وتوكلاً. وهو مضمون شهادة أن لا إله إلا الله، وهو أصل الدعوة النبوية من أولها إلى آخرها.",
    ayah: "وَمَا أَرْسَلْنَا مِن قَبْلِكَ مِن رَّسُولٍ إِلَّا نُوحِي إِلَيْهِ أَنَّهُ لَا إِلَٰهَ إِلَّا أَنَا فَاعْبُدُونِ",
    ref: "الأنبياء: ٢٥",
  },
  {
    num: "٣",
    title: "توحيد الأسماء والصفات",
    subtitle: "توحيد الإثبات والتنزيه",
    description:
      "الإيمان بما أثبته الله لنفسه وأثبته له رسوله ﷺ من الأسماء الحسنى والصفات العليا، على وجه يليق بجلاله سبحانه، بلا تحريف ولا تعطيل ولا تكييف ولا تمثيل.",
    ayah: "لَيْسَ كَمِثْلِهِ شَيْءٌ وَهُوَ السَّمِيعُ الْبَصِيرُ",
    ref: "الشورى: ١١",
  },
] as const;

type Principle = {
  title: string;
  body: string;
  quranRef?: string;
  hadith?: HadithRef;
};

const TAWHEED_PRINCIPLES: Principle[] = [
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
    body: "ما أطلق عليه الشرعُ اسم الشرك ولم يبلغ حدّ الأكبر، كالرياء والسمعة والحلف بغير الله. قال ﷺ: «إنَّ أخوف ما أخاف عليكم الشرك الأصغر: الرياء».",
    hadith: {
      text: "إنَّ أخوف ما أخاف عليكم الشرك الأصغر: الرياء",
      source: "مسند أحمد",
      number: "٢٣٦٣٠",
      grade: "صحيح",
      narrator: "محمود بن لبيد الأنصاري",
      extra: "صحّحه الألباني في السلسلة الصحيحة (٩٥١) وصحيح الجامع (١٥٥٥)",
    },
  },
  {
    title: "البدعة في الدين",
    body: "كل عبادة لم يشرعها الله ورسوله مردودة وإن حسنت نية صاحبها. قال ﷺ: «كل بدعة ضلالة، وكل ضلالة في النار». والإحداث في الدين من أعظم الذرائع إلى الشرك.",
    hadith: {
      text: "كل بدعة ضلالة، وكل ضلالة في النار",
      source: "صحيح مسلم (٨٦٧) والنسائي",
      number: "١٥٧٨",
      grade: "صحيح",
      narrator: "جابر بن عبدالله",
      extra: "اللفظ الكامل (وكل ضلالة في النار) في سنن النسائي (١٥٧٨). قصة الحديث: خطبة الجمعة.",
    },
  },
  {
    title: "التوسل المشروع",
    body: "يُشرع التوسل بأسماء الله وصفاته، وبالعمل الصالح، وبدعاء الرجل الصالح الحي. أما دعاء الأموات وطلب الحاجات منهم والاستغاثة بهم فهو الشرك الأكبر.",
  },
  {
    title: "التعلق بالأسباب",
    body: "الأخذ بالأسباب المشروعة واجب مع صرف القلب لله وحده. أما اعتقاد تأثير السبب بذاته دون الله، أو التعلق بأسباب لم يجعلها الله مؤثرة، فهو قدح في التوحيد.",
  },
  {
    title: "أصل دعوة الرسل",
    body: "بعث الله كل رسول بالدعوة إلى توحيد الألوهية أولاً. قال تعالى: ﴿وَلَقَدْ بَعَثْنَا فِي كُلِّ أُمَّةٍ رَّسُولًا أَنِ اعْبُدُوا اللَّهَ وَاجْتَنِبُوا الطَّاغُوتَ﴾ [النحل: ٣٦].",
  },
];

export function HomeTawheed() {
  return (
    <section className="home-section" aria-labelledby="tawheed-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">عقيدة أهل السنة والجماعة</p>
          <h2 id="tawheed-heading">التوحيد</h2>
          <p>التوحيد هو أساس الدين وأصله، وهو إفراد الله بالخلق والأمر والعبادة.</p>
        </div>
      </div>

      <div className="tawheed-types-grid">
        {TAWHEED_TYPES.map((t) => (
          <div key={t.num} className="tawheed-type-card ui-card">
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

      <h3 className="tawheed-principles-heading">مسائل مهمة في التوحيد</h3>
      <div className="tawheed-principles-grid">
        {TAWHEED_PRINCIPLES.map((p) => (
          <div key={p.title} className="tawheed-principle-card ui-card">
            <p className="tawheed-principle-card__title">{p.title}</p>
            <p className="tawheed-principle-card__body">{p.body}</p>
            {p.hadith && (
              <div style={{ marginTop: "0.35rem" }}>
                <HadithBadge h={p.hadith} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default HomeTawheed;
