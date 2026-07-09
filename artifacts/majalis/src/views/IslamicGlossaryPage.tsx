import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/elite-2026.css";

/* ══════════════════════════════════════════════════════════════════
   §242 — المصطلحات الإسلامية  (.gl-*)
   ══════════════════════════════════════════════════════════════════ */

type Category = "all" | "aqeedah" | "fiqh" | "hadith" | "quran" | "seerah" | "tazkiya";

interface GlossaryTerm {
  id: number;
  term: string;
  plural?: string;
  category: Exclude<Category, "all">;
  definition: string;
  detail?: string;
  related?: string[];
  source?: string;
}

const CATEGORIES: { id: Category; label: string; color: string }[] = [
  { id: "all",     label: "الكل",            color: "#1F4D3A" },
  { id: "aqeedah", label: "العقيدة",         color: "#1a5a7a" },
  { id: "fiqh",    label: "الفقه",           color: "#7B3E0C" },
  { id: "hadith",  label: "علم الحديث",      color: "#312E81" },
  { id: "quran",   label: "علوم القرآن",     color: "#065F46" },
  { id: "seerah",  label: "السيرة والتاريخ", color: "#9B1C1C" },
  { id: "tazkiya", label: "التزكية والأخلاق",color: "#4A2008" },
];

const TERMS: GlossaryTerm[] = [
  /* ══ العقيدة ══ */
  {
    id: 1, term: "التوحيد", category: "aqeedah",
    definition: "إفراد الله تعالى بالعبادة والربوبية والأسماء والصفات.",
    detail: "ينقسم التوحيد إلى ثلاثة أقسام: توحيد الربوبية (الإقرار بأن الله هو الخالق الرازق المدبّر)، وتوحيد الألوهية (إفراده بالعبادة)، وتوحيد الأسماء والصفات (إثبات ما أثبته الله لنفسه بلا تحريف ولا تعطيل ولا تكييف ولا تمثيل).",
    related: ["الشرك", "الأسماء الحسنى", "العبادة"],
    source: "كتاب التوحيد لابن خزيمة، ولوامع الأنوار البهية للسفاريني",
  },
  {
    id: 2, term: "الشرك", category: "aqeedah",
    definition: "جعل شريك لله في ما هو من خصائصه سبحانه.",
    detail: "ينقسم إلى شركٍ أكبر (يُخرج من الملة كالدعاء لغير الله) وشركٍ أصغر (كالرياء). قال تعالى: ﴿إِنَّ اللَّهَ لَا يَغْفِرُ أَن يُشْرَكَ بِهِ وَيَغْفِرُ مَا دُونَ ذَٰلِكَ لِمَن يَشَاءُ﴾.",
    related: ["التوحيد", "الردة", "الكفر"],
  },
  {
    id: 3, term: "الإيمان", category: "aqeedah",
    definition: "التصديق بالقلب والإقرار باللسان والعمل بالجوارح، يزيد بالطاعة وينقص بالمعصية.",
    detail: "أركانه ستة: الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر والقدر خيره وشره.",
    related: ["الإسلام", "الإحسان", "الكفر"],
    source: "حديث جبريل في صحيح مسلم",
  },
  {
    id: 4, term: "القدر", category: "aqeedah",
    definition: "إيمان المسلم بأن الله علم كل شيء قبل وقوعه، وكتبه وشاءه وخلقه.",
    detail: "مراتب الإيمان بالقدر أربع: العلم، الكتابة، المشيئة، الخلق. والإيمان بالقدر لا ينفي مسؤولية العبد لأن الله منح الإنسان الإرادة والاختيار.",
    related: ["التوكل", "الإيمان", "السبب والمسبب"],
  },
  {
    id: 5, term: "البدعة", category: "aqeedah",
    definition: "ما أُحدث في الدين مما لا أصل له في الشرع يُراد به التعبد.",
    detail: "قال ﷺ: «كل بدعة ضلالة» (مسلم). وتختلف البدعة عن المصالح المرسلة في أن الأولى في العبادات والثانية في العادات والمعاملات.",
    related: ["السنة", "المصالح المرسلة", "الاجتهاد"],
    source: "الاعتصام للشاطبي",
  },

  /* ══ الفقه ══ */
  {
    id: 6, term: "الفرض", category: "fiqh",
    definition: "ما أمر به الشارع على وجه الحتم والإلزام، يُثاب فاعله ويُعاقب تاركه.",
    detail: "وهو مرادف للواجب عند الشافعية والمالكية والحنابلة، بينما يُفرّق بينهما الحنفية: فالفرض ثبت بدليل قطعي، والواجب بدليل ظني.",
    related: ["الواجب", "السنة", "المندوب", "المحرم"],
  },
  {
    id: 7, term: "الإجماع", category: "fiqh",
    definition: "اتفاق مجتهدي الأمة الإسلامية في عصر من العصور على حكم شرعي.",
    detail: "الإجماع حجة شرعية ملزمة، ومصدره القرآن والسنة وليس الرأي المجرد. أنواعه: إجماع صريح وإجماع سكوتي.",
    related: ["الاجتهاد", "القياس", "الأدلة الشرعية"],
    source: "الرسالة للإمام الشافعي",
  },
  {
    id: 8, term: "القياس", category: "fiqh",
    definition: "إلحاق فرع بأصل لعلة جامعة بينهما في الحكم الشرعي.",
    detail: "أركانه أربعة: الأصل (المقيس عليه)، الفرع (المقيس)، الحكم، العلة. مثاله: قياس الشراب الجديد على الخمر في التحريم لعلة الإسكار.",
    related: ["الإجماع", "الاجتهاد", "العلة"],
    source: "إرشاد الفحول للشوكاني",
  },
  {
    id: 9, term: "الاجتهاد", category: "fiqh",
    definition: "بذل الفقيه وسعه في استنباط الحكم الشرعي من الأدلة التفصيلية.",
    detail: "شروطه: معرفة القرآن والسنة والإجماع والقياس والعربية ومقاصد الشريعة. للمجتهد أجران إن أصاب وأجر إن أخطأ.",
    related: ["الفقيه", "الاجتهاد والتقليد", "المجتهد"],
  },
  {
    id: 10, term: "الرخصة", category: "fiqh",
    definition: "الحكم الشرعي المشروع لعذر مع قيام السبب الموجب للتحريم أو التضييق.",
    detail: "مثل: التيمم عند فقدان الماء، والإفطار في رمضان للمسافر والمريض، وقصر الصلاة في السفر.",
    related: ["العزيمة", "الضرورة", "المشقة تجلب التيسير"],
  },
  {
    id: 11, term: "النجاسة", category: "fiqh", plural: "النجاسات",
    definition: "كل شيء حكم الشرع بنجاسته ووجوب التنزه عنه كالبول والدم والخمر.",
    detail: "تنقسم إلى نجاسة حقيقية (بدن، ثوب، مكان) ونجاسة حكمية (الحدث الأكبر والأصغر).",
    related: ["الطهارة", "الوضوء", "الغسل"],
  },

  /* ══ علم الحديث ══ */
  {
    id: 12, term: "الإسناد", category: "hadith",
    definition: "سلسلة الرواة الموصلة للمتن من المُحدِّث حتى النبي ﷺ.",
    detail: "قال ابن المبارك: «الإسناد من الدين، لولا الإسناد لقال من شاء ما شاء». علم نقد الإسناد من أبرز ما تميزت به الحضارة الإسلامية.",
    related: ["المتن", "الراوي", "الجرح والتعديل"],
    source: "نزهة النظر لابن حجر",
  },
  {
    id: 13, term: "الحديث الصحيح", category: "hadith",
    definition: "ما اتصل إسناده بنقل العدل الضابط عن مثله من أوله إلى منتهاه مع انتفاء الشذوذ والعلة.",
    detail: "شروطه خمسة: اتصال السند، عدالة الرواة، ضبط الرواة، السلامة من الشذوذ، السلامة من العلة القادحة.",
    related: ["الحديث الحسن", "الحديث الضعيف", "الإسناد"],
    source: "علوم الحديث لابن الصلاح",
  },
  {
    id: 14, term: "الجرح والتعديل", category: "hadith",
    definition: "علم يُبحث فيه عن أحوال الرواة من حيث القبول والرد بألفاظ خاصة.",
    detail: "الجرح: إظهار ما في الراوي من صفات يوجب ردّ روايته. التعديل: توثيق الراوي وقبول حديثه. وهو من أدق العلوم وأصعبها.",
    related: ["الإسناد", "الرواة", "الثقة والضعيف"],
    source: "الكفاية في علم الرواية للخطيب البغدادي",
  },
  {
    id: 15, term: "المرسل", category: "hadith",
    definition: "ما سقط من إسناده الصحابي، فرواه التابعي عن النبي ﷺ مباشرة.",
    detail: "حكمه: ضعيف عند الجمهور لجهالة الصحابي، لكن المالكية والحنفية يحتجون به في الجملة إذا اعتضد بعمل أهل المدينة أو غيره.",
    related: ["المنقطع", "المعضل", "الإسناد"],
  },
  {
    id: 16, term: "الموضوع", category: "hadith",
    definition: "الحديث المختلق المنسوب للنبي ﷺ كذباً وافتراءً.",
    detail: "قال ﷺ: «من كذب عليَّ متعمداً فليتبوأ مقعده من النار» (متفق عليه). الحديث الموضوع لا يجوز روايته إلا ببيان وضعه.",
    related: ["الحديث الضعيف", "الجرح والتعديل", "الوضّاعون"],
  },

  /* ══ علوم القرآن ══ */
  {
    id: 17, term: "التفسير", category: "quran",
    definition: "علم يُبحث فيه عن معاني القرآن الكريم وما يستنبط منه من أحكام وحكم.",
    detail: "أنواعه: تفسير بالمأثور (بالقرآن والسنة وأقوال الصحابة)، وتفسير بالرأي المقبول (بالاجتهاد المضبوط)، وتفسير إشاري (الصوفي). أبرز كتبه: ابن جرير، ابن كثير، القرطبي.",
    related: ["التأويل", "أسباب النزول", "الناسخ والمنسوخ"],
    source: "الإتقان في علوم القرآن للسيوطي",
  },
  {
    id: 18, term: "الناسخ والمنسوخ", category: "quran",
    definition: "الناسخ: ما رفع به حكم شرعي متأخر سابقاً عليه. والمنسوخ: الحكم المرفوع.",
    detail: "أنواع النسخ: نسخ الحكم وبقاء التلاوة، نسخ التلاوة وبقاء الحكم، نسخهما معاً. ومثاله: نسخ توجه الصلاة نحو بيت المقدس إلى الكعبة.",
    related: ["التفسير", "أسباب النزول", "المكي والمدني"],
  },
  {
    id: 19, term: "المكي والمدني", category: "quran",
    definition: "المكي: ما نزل قبل الهجرة النبوية. المدني: ما نزل بعدها.",
    detail: "خصائص المكي: قِصَر السور، التركيز على العقيدة، خطاب يا أيها الناس. خصائص المدني: طول السور، التشريع التفصيلي، خطاب يا أيها الذين آمنوا.",
    related: ["التفسير", "السور", "الناسخ والمنسوخ"],
  },
  {
    id: 20, term: "أسباب النزول", category: "quran",
    definition: "الوقائع والأحداث التي نزلت الآيات بسببها أو في سياقها.",
    detail: "فائدتها: فهم معنى الآية وحكمتها، دفع توهم الحصر، معرفة من نزلت فيهم. وضابطه: «العبرة بعموم اللفظ لا بخصوص السبب» عند الجمهور.",
    related: ["التفسير", "المكي والمدني", "الوقائع"],
    source: "أسباب النزول للواحدي",
  },
  {
    id: 21, term: "الإعجاز القرآني", category: "quran",
    definition: "إعجاز القرآن الكريم من حيث أسلوبه وبيانه وتشريعاته ومعلوماته الغيبية والكونية.",
    detail: "أوجه الإعجاز: الإعجاز البياني اللغوي، الإعجاز التشريعي، الإعجاز العلمي، الإعجاز الغيبي، تحدي العرب أن يأتوا بمثله.",
    related: ["التفسير", "البلاغة", "الإعجاز العلمي"],
  },

  /* ══ السيرة ══ */
  {
    id: 22, term: "الهجرة", category: "seerah",
    definition: "انتقال النبي ﷺ وصحابته من مكة المكرمة إلى المدينة المنورة عام ٦٢٢م.",
    detail: "تعدّ الهجرة نقطة تحول كبرى في تاريخ الإسلام، وبها بدأ التقويم الهجري. وكانت فراراً بالدين لا هرباً من العدو، وقد قال ﷺ: «لو أن الناس يعلمون ما فارقت مكة إلا لحبها».",
    related: ["السيرة النبوية", "أصحاب النبي", "غزوة بدر"],
  },
  {
    id: 23, term: "الصحابي", category: "seerah", plural: "الصحابة",
    definition: "من لقي النبي ﷺ مؤمناً به ومات على الإسلام.",
    detail: "عددهم: يزيد على مئة ألف صحابي. أفضلهم: أبو بكر الصديق ثم عمر ثم عثمان ثم علي. وكلهم عدول بشهادة القرآن والسنة.",
    related: ["التابعون", "أتباع التابعين", "الإسناد"],
    source: "الإصابة في تمييز الصحابة لابن حجر",
  },
  {
    id: 24, term: "التابعي", category: "seerah", plural: "التابعون",
    definition: "من لقي صحابياً مؤمناً ومات على الإسلام.",
    detail: "أفضل التابعين: سعيد بن المسيب، وعروة بن الزبير، والقاسم بن محمد. وطبقتهم تلي الصحابة في الفضل والاحتجاج.",
    related: ["الصحابة", "أتباع التابعين", "القرون الثلاثة الأولى"],
  },
  {
    id: 25, term: "الغزوة", category: "seerah", plural: "الغزوات",
    definition: "المعركة التي يشارك فيها النبي ﷺ بنفسه.",
    detail: "عددها: ٢٧ غزوة حسب أشهر الروايات. أبرزها: بدر الكبرى، أُحد، الخندق، فتح مكة. ما لم يشارك فيه ﷺ يسمى «سرية».",
    related: ["السيرة النبوية", "السرايا", "الجهاد"],
  },

  /* ══ التزكية ══ */
  {
    id: 26, term: "التوبة", category: "tazkiya",
    definition: "الرجوع إلى الله بترك الذنب والندم عليه والعزم على عدم العودة إليه.",
    detail: "شروطها: الندم على الذنب، الإقلاع عنه، العزم على عدم العودة، وإن كانت تتعلق بحق آدمي فلا بد من ردّه أو الاستحلال منه.",
    related: ["الاستغفار", "الذنوب", "المحاسبة"],
    source: "كتاب التوبة لابن القيم",
  },
  {
    id: 27, term: "الزهد", category: "tazkiya",
    definition: "الانصراف عن الدنيا والتعلق بالآخرة، مع أداء الواجبات وتجنب المحرمات.",
    detail: "قال سفيان الثوري: «الزهد في الدنيا قِصَر الأمل لا أكل الغليظ ولبس الخشن». والزهد لا يعني ترك العمل والكسب، بل عدم التعلق القلبي بالدنيا.",
    related: ["القناعة", "الورع", "التوكل"],
    source: "كتاب الزهد لابن المبارك، ومدارج السالكين لابن القيم",
  },
  {
    id: 28, term: "الإخلاص", category: "tazkiya",
    definition: "إفراد الله بالقصد في الطاعة، بأن يعمل العبد العمل لله وحده لا لرياء ولا سمعة.",
    detail: "هو أحد شرطي قبول العمل (الإخلاص والمتابعة). قال ابن القيم: «الإخلاص أن تكون حركاتك وسكناتك لله وحده».",
    related: ["الرياء", "الصدق", "التوحيد"],
    source: "كتاب الإخلاص والنية للبيهقي",
  },
  {
    id: 29, term: "الرياء", category: "tazkiya",
    definition: "إظهار العمل الصالح للناس ابتغاء ثنائهم ومدحهم دون ابتغاء وجه الله.",
    detail: "سمّاه النبي ﷺ «الشرك الأصغر». وهو مُحبط للعمل. والفرق بينه وبين السمعة: الرياء أن يعمل لأجل رؤية الناس، والسمعة أن يعمل لأجل سماعهم.",
    related: ["الإخلاص", "الشرك الأصغر", "الأعمال الظاهرة"],
  },
  {
    id: 30, term: "التوكل", category: "tazkiya",
    definition: "الاعتماد على الله تعالى في جلب المصالح ودفع المضارّ مع الأخذ بالأسباب.",
    detail: "التوكل لا يعني ترك الأسباب — بل الأسباب من شرطه. قال ﷺ: «اعقلها وتوكّل» (الترمذي). والتوكل منزلة عالية من منازل القلوب.",
    related: ["اليقين", "الزهد", "الأسباب"],
    source: "كتاب التوكل على الله لابن أبي الدنيا",
  },
];

export default function IslamicGlossaryPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");
  const [openTerm, setOpenTerm] = useState<number | null>(null);
  const [alpha, setAlpha] = useState<string>("");

  useEffect(() => {
    applyPageSeo({
      path: "/islamic-glossary",
      title: "المصطلحات الإسلامية | المجلس العلمي",
      description: "قاموس المصطلحات الإسلامية الشامل — تعريفات دقيقة في العقيدة والفقه وعلم الحديث وعلوم القرآن والسيرة والتزكية.",
      keywords: ["مصطلحات إسلامية", "قاموس إسلامي", "مصطلحات فقهية", "مصطلحات الحديث", "علوم إسلامية"],
    });
  }, []);

  const filtered = useMemo(() => {
    let list = TERMS;
    if (activeCategory !== "all") list = list.filter(t => t.category === activeCategory);
    if (search.trim()) {
      const q = search.trim();
      list = list.filter(t =>
        t.term.includes(q) ||
        t.definition.includes(q) ||
        (t.detail ?? "").includes(q) ||
        (t.plural ?? "").includes(q),
      );
    }
    if (alpha) list = list.filter(t => t.term.startsWith(alpha));
    return list;
  }, [activeCategory, search, alpha]);

  const countByCat = useMemo(() => {
    const m: Record<string, number> = {};
    TERMS.forEach(t => { m[t.category] = (m[t.category] ?? 0) + 1; });
    m.all = TERMS.length;
    return m;
  }, []);

  return (
    <div className="gl-page" dir="rtl">
      {/* ══ Hero ══ */}
      <section className="gl-hero">
        <div className="gl-hero__inner">
          <div className="gl-hero__badge">القاموس الإسلامي</div>
          <h1 className="gl-hero__title">المصطلحات الإسلامية</h1>
          <p className="gl-hero__sub">
            تعريفات دقيقة موثّقة لأهم المصطلحات في العلوم الشرعية — مرجع لطالب العلم في رحلته العلمية
          </p>
          <div className="gl-hero__count">
            <BookOpen size={16} aria-hidden="true" />
            <span>{TERMS.length} مصطلحاً في ٦ علوم</span>
          </div>
          {/* بحث */}
          <div className="gl-search">
            <Search size={16} aria-hidden="true" />
            <input
              className="gl-search__input"
              placeholder="ابحث عن مصطلح…"
              value={search}
              onChange={e => { setSearch(e.target.value); setAlpha(""); }}
              aria-label="بحث في المصطلحات"
            />
            {search && (
              <button
                type="button"
                className="gl-search__clear"
                onClick={() => setSearch("")}
                aria-label="مسح"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="gl-container">
        {/* الفئات */}
        <div className="gl-cats" role="tablist">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              type="button"
              role="tab"
              className={`gl-cat${activeCategory === c.id ? " gl-cat--active" : ""}`}
              style={activeCategory === c.id ? { background: c.color, borderColor: c.color } : {}}
              onClick={() => { setActiveCategory(c.id); setAlpha(""); }}
              aria-selected={activeCategory === c.id}
            >
              {c.label}
              <span className="gl-cat__count">{countByCat[c.id] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* نتائج */}
        <div className="gl-results-meta">
          {filtered.length === 0 ? (
            <p className="gl-empty">لا توجد نتائج — جرّب بحثاً مختلفاً</p>
          ) : (
            <p className="gl-results-count">{filtered.length} مصطلح</p>
          )}
        </div>

        {/* قائمة المصطلحات */}
        <div className="gl-list">
          {filtered.map(term => {
            const cat = CATEGORIES.find(c => c.id === term.category)!;
            const isOpen = openTerm === term.id;
            return (
              <div key={term.id} className={`gl-term${isOpen ? " gl-term--open" : ""}`}>
                <div
                  className="gl-term__head"
                  onClick={() => setOpenTerm(isOpen ? null : term.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === "Enter" || e.key === " ") && setOpenTerm(isOpen ? null : term.id)}
                  aria-expanded={isOpen}
                >
                  <div className="gl-term__title-wrap">
                    <span className="gl-term__arabic">{term.term}</span>
                    {term.plural && <span className="gl-term__plural">(ج: {term.plural})</span>}
                    <span className={`gl-term__cat gl-cat--${cat.id}`}>
                      {cat.label}
                    </span>
                  </div>
                  <p className="gl-term__def-preview">{term.definition}</p>
                  <span className="gl-term__chevron" aria-hidden="true">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>

                {isOpen && (
                  <div className="gl-term__body">
                    {term.detail && (
                      <div className="gl-term__detail">
                        <span className="gl-label">تفصيل</span>
                        <p>{term.detail}</p>
                      </div>
                    )}
                    {term.related && term.related.length > 0 && (
                      <div className="gl-term__related">
                        <span className="gl-label">مصطلحات ذات صلة</span>
                        <div className="gl-related-tags">
                          {term.related.map((r, i) => (
                            <button
                              key={i}
                              type="button"
                              className="gl-related-tag"
                              onClick={() => { setSearch(r); setOpenTerm(null); }}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {term.source && (
                      <div className="gl-term__source">
                        <BookOpen size={12} aria-hidden="true" />
                        <span>{term.source}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
