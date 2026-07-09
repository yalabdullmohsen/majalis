import { useEffect, useState } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
/* ══ بيانات قواعد التجويد ══ */
type TajweedRule = {
  id: string;
  category: string;
  title: string;
  definition: string;
  types?: { name: string; definition: string; example: string }[];
  example?: string;
  color: string;
};

const CATEGORIES = ["الكل", "النون الساكنة والتنوين", "الميم الساكنة", "المدود", "الأحكام العامة", "صفات الحروف", "مخارج الحروف"];

const RULES: TajweedRule[] = [
  /* ══ النون الساكنة والتنوين ══ */
  {
    id: "izhar-halqi", category: "النون الساكنة والتنوين", color: "#0A5040",
    title: "الإظهار الحلقي",
    definition: "النطق بالنون الساكنة أو التنوين بدون غنة إذا جاء بعدهما أحد حروف الحلق الستة: الهمزة، الهاء، العين، الحاء، الغين، الخاء.",
    example: "مَنْ آمَنَ · عَلِيمٌ حَكِيمٌ · مِنْ هَادٍ",
  },
  {
    id: "idgham-bighunnah", category: "النون الساكنة والتنوين", color: "#0A5040",
    title: "الإدغام بغنة",
    definition: "إدخال النون الساكنة أو التنوين في الحرف التالي مع الغنة إذا كان من حروف (ينمو): الياء، النون، الميم، الواو.",
    example: "مَنْ يَقُولُ · خَيْرٌ وَأَبْقَى · مِن نِّعْمَةٍ",
  },
  {
    id: "idgham-bila-ghunnah", category: "النون الساكنة والتنوين", color: "#0A5040",
    title: "الإدغام بلا غنة",
    definition: "إدغام النون الساكنة أو التنوين في اللام أو الراء بدون غنة.",
    example: "مِن لَّدُنْهُ · مِن رَّبِّهِمْ · هُدًى لِّلْمُتَّقِينَ",
  },
  {
    id: "iqlab", category: "النون الساكنة والتنوين", color: "#0A5040",
    title: "الإقلاب",
    definition: "قلب النون الساكنة أو التنوين ميماً مخفاةً بغنة عند حرف الباء.",
    example: "أَنبِئُونِي · سَمِيعٌ بَصِيرٌ · مِن بَعْدِ",
  },
  {
    id: "ikhfa-haqiqi", category: "النون الساكنة والتنوين", color: "#0A5040",
    title: "الإخفاء الحقيقي",
    definition: "النطق بالنون الساكنة أو التنوين بصفة بين الإظهار والإدغام مع بقاء الغنة عند بقية الحروف الخمسة عشر.",
    example: "أَنتُمْ · جَنَّاتٍ تَجْرِي · مِن قَبْلِ",
  },

  /* ══ الميم الساكنة ══ */
  {
    id: "izhar-shafawi", category: "الميم الساكنة", color: "#155241",
    title: "الإظهار الشفوي",
    definition: "إظهار الميم الساكنة عند جميع الحروف ما عدا الباء والميم.",
    example: "وَهُمْ فِيهَا · كُنتُمْ خَيْرَ أُمَّةٍ",
  },
  {
    id: "idgham-shafawi", category: "الميم الساكنة", color: "#155241",
    title: "الإدغام الشفوي",
    definition: "إدغام الميم الساكنة في الميم المتحركة بعدها مع الغنة.",
    example: "كُنتُمْ مُسْلِمِينَ · هُمْ مُؤْمِنُونَ",
  },
  {
    id: "ikhfa-shafawi", category: "الميم الساكنة", color: "#155241",
    title: "الإخفاء الشفوي",
    definition: "إخفاء الميم الساكنة عند الباء مع الغنة.",
    example: "وَهُم بِالْآخِرَةِ · تَرْمِيهِم بِحِجَارَةٍ",
  },

  /* ══ المدود ══ */
  {
    id: "madd-tabii", category: "المدود", color: "#1A3A2E",
    title: "المد الطبيعي (الأصلي)",
    definition: "المد بمقدار حركتين وهو الأصل في المدود. يكون بحرف المد (ألف، واو، ياء) بدون سبب من همز أو سكون.",
    example: "قَالَ · يَقُولُ · فِي",
  },
  {
    id: "madd-muttasil", category: "المدود", color: "#1A3A2E",
    title: "المد المتصل (الواجب)",
    definition: "اجتماع حرف المد والهمزة في كلمة واحدة. يُمد ٤ أو ٥ حركات.",
    example: "جَاءَ · سَاءَ · شَيْءٍ · السَّمَاءِ",
  },
  {
    id: "madd-munfasil", category: "المدود", color: "#1A3A2E",
    title: "المد المنفصل (الجائز)",
    definition: "أن ينتهي حرف المد في كلمة وتبدأ كلمة تالية بهمزة. يُمد من ٢ إلى ٥ حركات.",
    example: "يَا أَيُّهَا · بِمَا أُنزِلَ · قُوا أَنفُسَكُمْ",
  },
  {
    id: "madd-lazim", category: "المدود", color: "#1A3A2E",
    title: "المد اللازم",
    definition: "حرف مد يعقبه سكون أصلي في كلمة أو حرف، يُمد ٦ حركات لزوماً.",
    types: [
      { name: "الكلمي المثقل", definition: "حرف المد ثم حرف مشدد", example: "الصَّاخَّةُ · الضَّالِّينَ · الدَّابَّةُ" },
      { name: "الكلمي المخفف", definition: "حرف المد ثم حرف ساكن غير مشدد", example: "آلْآنَ · آلذَّكَرَيْنِ" },
      { name: "الحرفي المثقل", definition: "في فواتح السور ذات ثلاثة أحرف مع التشديد", example: "الم · الر · حم" },
      { name: "الحرفي المخفف", definition: "في فواتح السور بدون تشديد", example: "ص · ق · ن" },
    ],
  },
  {
    id: "madd-arid", category: "المدود", color: "#1A3A2E",
    title: "المد العارض للسكون",
    definition: "حرف مد يعقبه سكون عارض بسبب الوقف. يجوز فيه القصر والتوسط والإشباع.",
    example: "نَسْتَعِينُ (وقفاً) · الرَّحِيمُ (وقفاً)",
  },
  {
    id: "madd-leen", category: "المدود", color: "#1A3A2E",
    title: "مد اللين",
    definition: "واو أو ياء ساكنة مفتوح ما قبلها يعقبها حرف ساكن بالوقف. يُمد ٢-٦ حركات وقفاً.",
    example: "خَوْفٌ (وقفاً) · بَيْتٌ (وقفاً)",
  },
  {
    id: "madd-badal", category: "المدود", color: "#1A3A2E",
    title: "مد البدل",
    definition: "همزة تسبق حرف المد في كلمة واحدة. يُمد حركتين.",
    example: "آمَنَ (أصلها أَأْمَنَ) · آدَمَ · إِيمَانٌ · أُوتُوا",
  },

  /* ══ الأحكام العامة ══ */
  {
    id: "qalqalah", category: "الأحكام العامة", color: "#0D2B22",
    title: "القلقلة",
    definition: "اضطراب الصوت عند النطق بحروف (قطب جد) ساكنة حتى يُسمع لها نبرة قوية. تكون كبرى عند الوقف وصغرى وسط الكلام.",
    example: "يَطْمَعُ · قَدْ أَفْلَحَ · اقْرَأ · نَحْنُ نَبْلُو · مِن بَعْدِ",
  },
  {
    id: "tafkhim-tarqiq", category: "الأحكام العامة", color: "#0D2B22",
    title: "التفخيم والترقيق",
    definition: "التفخيم: تفعيم المخرج وامتلاؤه. الترقيق: نحول المخرج وخلوه. أحرف الاستعلاء السبعة دائماً مفخمة (خص ضغط قظ). اللام في لفظ الجلالة تُفخم بعد فتح أو ضم.",
    example: "اللَّهُ (تفخيم) · بِسْمِ اللَّهِ (ترقيق بعد كسر)",
  },
  {
    id: "waqf", category: "الأحكام العامة", color: "#0D2B22",
    title: "أحكام الوقف والابتداء",
    definition: "الوقف: قطع القراءة لحظةً. أنواعه: التام، الكافي، الحسن، القبيح. الابتداء: الشروع في القراءة بعد وقف.",
    types: [
      { name: "الوقف التام", definition: "لا تعلق له بما بعده لفظاً ومعنى", example: "﴿وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ﴾" },
      { name: "الوقف الكافي", definition: "لا تعلق له بما بعده معنى وله تعلق لفظاً", example: "عند انتهاء الجملة المعنوية" },
      { name: "الوقف الحسن", definition: "يصح الوقف عليه لاستقامة المعنى لكن ما بعده أتم", example: "﴿الْحَمْدُ لِلَّهِ﴾ (يصح لكن الأتم: ربِّ العالمين)" },
      { name: "الوقف القبيح", definition: "يخلّ بالمعنى ولا يُستحسن", example: "الوقف على ﴿إِنَّ اللَّهَ﴾ دون تمام الجملة" },
    ],
  },
  {
    id: "ghunnah", category: "الأحكام العامة", color: "#0D2B22",
    title: "الغنة",
    definition: "صوت موسيقي يخرج من الخيشوم (الأنف). تكون في النون والميم المشددتين أو عند الإخفاء والإدغام. مقدارها حركتان.",
    example: "إِنَّ · أَمَّا · مَن يَقُولُ",
  },
  {
    id: "hamz-wasl", category: "الأحكام العامة", color: "#0D2B22",
    title: "همزة الوصل والقطع",
    definition: "همزة الوصل: تُنطق ابتداءً وتُسقط درجاً (في وسط الكلام). همزة القطع: تُنطق دائماً في كل حال.",
    example: "اقرأ (وصل) · أَفَلَمْ (قطع)",
  },

  /* ══ صفات الحروف ══ */
  {
    id: "sifat", category: "صفات الحروف", color: "#183020",
    title: "الصفات اللازمة للحروف",
    definition: "الصفات الملازمة للحرف لا تفارقه. منها: الجهر والهمس، الشدة والرخاوة، الاستعلاء والاستفال، الإطباق والانفتاح، الإذلاق والإصمات.",
    types: [
      { name: "الجهر", definition: "الاعتماد على المخرج حتى يمتنع جري النفس", example: "ب ج د ذ ر ز ض ع ظ ف غ ل م ن و ي هـ" },
      { name: "الهمس", definition: "جريان النفس عند النطق بالحرف لضعف الاعتماد", example: "ت ث ح خ س ش ص ف ك هـ" },
      { name: "الشدة", definition: "انحباس الصوت عند النطق", example: "أ ب ت د ج ق ك ط" },
      { name: "التوسط", definition: "اعتدال الصوت بين الشدة والرخاوة", example: "ر ل ع م ن" },
      { name: "الاستعلاء", definition: "ارتفاع اللسان إلى الحنك عند النطق", example: "خ ص ض ط ظ غ ق (خص ضغط قظ)" },
    ],
  },

  /* ══ مخارج الحروف ══ */
  {
    id: "makharij", category: "مخارج الحروف", color: "#0F261E",
    title: "مخارج الحروف (أماكن خروجها)",
    definition: "المخارج خمسة رئيسية: الجوف (ا و ي المدية)، الحلق (ء هـ ع ح غ خ)، اللسان (18 حرفاً)، الشفتان (ب م و ف)، الخيشوم (الغنة في ن م).",
    types: [
      { name: "الجوف", definition: "تخرج منه حروف المد الثلاثة", example: "الألف المدية · الواو المدية · الياء المدية" },
      { name: "الحلق", definition: "أقصاه: الهمزة والهاء. وسطه: العين والحاء. أدناه: الغين والخاء", example: "ء هـ ع ح غ خ" },
      { name: "اللسان", definition: "يشمل: القاف، الكاف، الجيم والشين والياء، الضاد، اللام، النون، الراء، الطاء والدال والتاء، الثاء والذال والظاء، الصاد والزاي والسين", example: "ق ك ج ش ي ض ل ن ر ط د ت ث ذ ظ ص ز س" },
      { name: "الشفتان", definition: "الباء والميم من اجتماع الشفتين. الواو الحرفية من الشفتين. الفاء من الشفة السفلى وأطراف الثنايا العليا", example: "ب م و ف" },
      { name: "الخيشوم", definition: "يخرج منه صوت الغنة للنون والميم عند الإدغام والإخفاء", example: "غنة: إِنَّ · أَمَّا" },
    ],
  },
];

function RuleCard({ rule }: { rule: TajweedRule }) {
  const [open, setOpen] = useState(false);

  return (
    <article className={`tj-card tj-card--${rule.id}`}>
      <button
        type="button"
        className="tj-card__header"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="tj-card__title-wrap">
          <span className="tj-cat-badge">{rule.category}</span>
          <h3 className="tj-card__title">{rule.title}</h3>
        </div>
        <span className="tj-toggle" aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="tj-card__body">
          <p className="tj-definition">{rule.definition}</p>
          {rule.example && (
            <div className="tj-example">
              <span className="tj-example-label">مثال: </span>
              <span className="tj-example-text" lang="ar">{rule.example}</span>
            </div>
          )}
          {rule.types && rule.types.length > 0 && (
            <div className="tj-types">
              {rule.types.map(t => (
                <div key={t.name} className="tj-type">
                  <strong className="tj-type-name">{t.name}</strong>
                  <p className="tj-type-def">{t.definition}</p>
                  <span className="tj-type-ex" lang="ar">{t.example}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function QuranTajweedPage() {
  const [category, setCategory] = useState("الكل");

  useEffect(() => {
    applyPageSeo({
      path: "/quran/tajweed",
      title: "علم التجويد | المجلس العلمي",
      description: "قواعد علم التجويد الكاملة — أحكام النون الساكنة والتنوين، الميم الساكنة، المدود، صفات الحروف ومخارجها.",
      keywords: ["تجويد", "قواعد التجويد", "أحكام التجويد", "النون الساكنة", "المدود", "مخارج الحروف"],
    });
  }, []);

  const filtered = category === "الكل" ? RULES : RULES.filter(r => r.category === category);

  return (
    <div className="page-shell ds-page tj-page">
      <div className="ds-hero tj-hero">
        <p className="ds-hero__eyebrow">القرآن الكريم</p>
        <h1 className="ds-hero__title">علم التجويد</h1>
        <p className="ds-hero__subtitle">
          قواعد تجويد القرآن الكريم — أحكام كاملة للنون والميم والمدود وصفات الحروف ومخارجها
        </p>
      </div>

      {/* تنقل أقسام القرآن */}
      <nav className="quran-subnav" aria-label="أقسام القرآن">
        <Link href="/quran"               className="quran-subnav__link">المصحف</Link>
        <Link href="/quran/tajweed"        className="quran-subnav__link is-active">التجويد</Link>
        <Link href="/quran/surah-stories"  className="quran-subnav__link">قصص القرآن</Link>
        <Link href="/quran-live"           className="quran-subnav__link">البث المباشر</Link>
        <Link href="/quran-radio"          className="quran-subnav__link">الإذاعات</Link>
      </nav>

      {/* مقدمة */}
      <div className="tj-intro-box">
        <p>
          التجويد لغةً: التحسين. واصطلاحاً: إعطاء كل حرف حقه ومستحقه من الصفات، والنطق به من
          مخرجه الصحيح. تعلّمه فرض كفاية وتطبيقه فرض عين على كل قارئ للقرآن الكريم.
        </p>
        <p className="tj-hadith" lang="ar">
          قال النبي ﷺ: «زَيِّنُوا الْقُرْآنَ بِأَصْوَاتِكُمْ» — رواه أبو داود وابن ماجه
        </p>
      </div>

      {/* فلتر الأحكام */}
      <div className="ds-filters-bar">
        {CATEGORIES.map(c => (
          <button
            key={c}
            type="button"
            className={`ds-chip${category === c ? " ds-chip--active" : ""}`}
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
          >
            {c}
          </button>
        ))}
      </div>

      {/* البطاقات */}
      <div className="tj-grid">
        {filtered.map(rule => (
          <RuleCard key={rule.id} rule={rule} />
        ))}
      </div>

      {/* روابط ذات صلة */}
      <div className="tj-related">
        <p className="tj-related-title">مراجع وكتب مقترحة</p>
        <div className="tj-related-list">
          <a href="#" className="tj-related-link">متن الجزرية — ابن الجزري</a>
          <a href="#" className="tj-related-link">التمهيد في علم التجويد — ابن الجزري</a>
          <a href="#" className="tj-related-link">هداية القاري — عبد الفتاح المرصفي</a>
          <Link href="/quran" className="tj-related-link">ابدأ القراءة من المصحف ←</Link>
        </div>
      </div>
    </div>
  );
}
