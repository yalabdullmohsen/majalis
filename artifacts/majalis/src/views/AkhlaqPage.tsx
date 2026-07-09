import { useEffect, useMemo, useState } from "react";
import { Heart, Star, Users, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";

/* ─── بيانات الأخلاق ─── */
type AkhlaqEntry = {
  id: string;
  title: string;
  category: string;
  icon: string;
  summary: string;
  ayah: string;
  ayahRef: string;
  hadith: string;
  hadithSource: string;
  scholarQuote: string;
  scholarName: string;
  practices: string[];
};

const CATEGORIES = ["الكل", "مع الله", "مع النفس", "مع الناس", "في الأسرة", "في المجتمع"];

const AKHLAQ: AkhlaqEntry[] = [
  {
    id: "tawadu",
    title: "التواضع",
    category: "مع الناس",
    icon: "🤲",
    summary: "التواضع هو التذلل لأمر الله واحترام الناس وعدم الاستعلاء عليهم. قال الله تعالى أن عباد الرحمن يمشون على الأرض هوناً.",
    ayah: "وَعِبَادُ الرَّحْمَٰنِ الَّذِينَ يَمْشُونَ عَلَى الْأَرْضِ هَوْنًا",
    ayahRef: "الفرقان: 63",
    hadith: "ما نقصت صدقة من مال، وما زاد الله عبداً بعفو إلا عزاً، وما تواضع أحد لله إلا رفعه الله.",
    hadithSource: "صحيح مسلم",
    scholarQuote: "التواضع أن تعلم أن الناس يعرفون من نفسك ما تعرفه، فلا تطلب منهم الإجلال.",
    scholarName: "الإمام الغزالي",
    practices: ["تذكر أن كل إنسان له فضل عليك في شيء", "لا تحتقر أحداً من خلق الله", "تقبل النصيحة برحابة صدر", "قل لا أعلم إن لم تعلم"],
  },
  {
    id: "sidq",
    title: "الصدق",
    category: "مع الناس",
    icon: "✅",
    summary: "الصدق أساس الأخلاق ومفتاح الثقة. وهو التطابق بين الكلام والواقع. قال النبي ﷺ أن الصدق يهدي إلى البر وأن البر يهدي إلى الجنة.",
    ayah: "يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَكُونُوا مَعَ الصَّادِقِينَ",
    ayahRef: "التوبة: 119",
    hadith: "عليكم بالصدق فإن الصدق يهدي إلى البر وإن البر يهدي إلى الجنة.",
    hadithSource: "متفق عليه",
    scholarQuote: "الصدق سيف الله في أرضه، لا يضع على شيء إلا قطعه.",
    scholarName: "ابن القيم",
    practices: ["التزم الصدق حتى في المزاح", "لا تبالغ في المدح أو الذم", "أوفِ بوعودك دائماً", "صحح أخطاءك بصراحة"],
  },
  {
    id: "amanah",
    title: "الأمانة",
    category: "مع الناس",
    icon: "🛡️",
    summary: "الأمانة من أعظم الأخلاق وأرفعها. وهي أداء الحق لأصحابه وصون ما يُؤتمن عليه. وفقدانها من علامات قيام الساعة.",
    ayah: "إِنَّ اللَّهَ يَأْمُرُكُمْ أَن تُؤَدُّوا الْأَمَانَاتِ إِلَىٰ أَهْلِهَا",
    ayahRef: "النساء: 58",
    hadith: "لا إيمان لمن لا أمانة له، ولا دين لمن لا عهد له.",
    hadithSource: "رواه أحمد",
    scholarQuote: "الأمانة عماد الإيمان وقوام الاجتماع، وبها يثق الناس ببعضهم.",
    scholarName: "الإمام الشافعي",
    practices: ["أدِّ الأمانة لأصحابها", "احفظ أسرار الناس", "لا تخن من ائتمنك", "كن أميناً في عملك وعلمك"],
  },
  {
    id: "sabr",
    title: "الصبر",
    category: "مع الله",
    icon: "⚖️",
    summary: "الصبر شعار المؤمن في مواجهة المصائب والطاعات والمعاصي. وهو ثلاثة أنواع: الصبر على الطاعة، والصبر عن المعصية، والصبر على قضاء الله.",
    ayah: "وَاصْبِرُوا ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    ayahRef: "الأنفال: 46",
    hadith: "ما أُعطي أحد عطاءً خيراً وأوسع من الصبر.",
    hadithSource: "متفق عليه",
    scholarQuote: "الصبر نصف الإيمان، والشكر نصفه الآخر، واليقين جماعه.",
    scholarName: "الإمام أحمد بن حنبل",
    practices: ["تذكر أن الأجر على قدر المصيبة", "لا تشكو إلا لله", "اصبر عن المحرمات", "اصبر على العبادات وإن ثقلت"],
  },
  {
    id: "shukr",
    title: "الشكر",
    category: "مع الله",
    icon: "🙏",
    summary: "الشكر هو الاعتراف بالنعمة وإضافتها لمن أنعم وهو الله سبحانه، واستعمالها في مرضاته. وقد وعد الله الشاكرين بالمزيد.",
    ayah: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",
    ayahRef: "إبراهيم: 7",
    hadith: "انظروا إلى من هو أسفل منكم، ولا تنظروا إلى من هو فوقكم، فهو أجدر أن لا تزدروا نعمة الله عليكم.",
    hadithSource: "متفق عليه",
    scholarQuote: "دوام النعمة بالشكر، وزوالها بالكفران.",
    scholarName: "ابن القيم",
    practices: ["قل الحمد لله على كل حال", "استعمل النعم في طاعة الله", "اذكر نعم الله التي لا تُحصى", "شكر الناس شكر لله"],
  },
  {
    id: "tawakul",
    title: "التوكل",
    category: "مع الله",
    icon: "🌟",
    summary: "التوكل هو تفويض الأمر إلى الله مع الأخذ بالأسباب. ليس كسلاً أو تواكلاً، بل عزيمة على العمل واعتماد على الله في النتائج.",
    ayah: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    ayahRef: "الطلاق: 3",
    hadith: "لو أنكم توكلتم على الله حق توكله لرزقكم كما يرزق الطير، تغدو خماصاً وتروح بطاناً.",
    hadithSource: "رواه الترمذي",
    scholarQuote: "التوكل على الله نصف الدين، والإنابة إليه نصفه الآخر.",
    scholarName: "ابن تيمية",
    practices: ["خذ بالأسباب ثم فوِّض النتيجة لله", "لا تقلق على الرزق", "ثق بأن الله لن يضيعك", "التوكل قبل الشروع في أي عمل"],
  },
  {
    id: "rahma",
    title: "الرحمة",
    category: "مع الناس",
    icon: "💚",
    summary: "الرحمة خلق جليل يربط المؤمنين بعضهم ببعض وبسائر الخلق. والنبي ﷺ قال: الراحمون يرحمهم الرحمن.",
    ayah: "وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ",
    ayahRef: "الأنبياء: 107",
    hadith: "ارحموا من في الأرض يرحمكم من في السماء.",
    hadithSource: "رواه الترمذي",
    scholarQuote: "الرحمة جماع الخير، وإذا أراد الله بعبد خيراً جعل له رحمة يرحم بها الناس.",
    scholarName: "الإمام النووي",
    practices: ["ارحم الصغير وأكرم الكبير", "تصدق على الفقراء والمساكين", "ارحم الحيوان والبهائم", "اعذر الناس واحسن الظن بهم"],
  },
  {
    id: "adl",
    title: "العدل",
    category: "في المجتمع",
    icon: "⚖️",
    summary: "العدل خلق عظيم أمر الله به في كل شأن. وهو إعطاء كل ذي حق حقه، وهو أساس الحكم والمعاملات والأحكام.",
    ayah: "إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ",
    ayahRef: "النحل: 90",
    hadith: "المقسطون عند الله على منابر من نور عن يمين الرحمن، الذين يعدلون في حكمهم وأهليهم وما ولوا.",
    hadithSource: "رواه مسلم",
    scholarQuote: "العدل أساس الملك، وبه تقوم الحضارات وتعمر الأرض.",
    scholarName: "ابن خلدون",
    practices: ["اعدل بين أولادك", "لا تحابي أحداً في الحكم", "قل الحق ولو على نفسك", "لا تظلم ولو استطعت"],
  },
  {
    id: "karam",
    title: "الكرم والسخاء",
    category: "مع الناس",
    icon: "🎁",
    summary: "الكرم من أشرف الأخلاق التي حثّ عليها الإسلام. وأفضله ما كان في سبيل الله وابتغاء مرضاته.",
    ayah: "وَيُؤْثِرُونَ عَلَىٰ أَنفُسِهِمْ وَلَوْ كَانَ بِهِمْ خَصَاصَةٌ",
    ayahRef: "الحشر: 9",
    hadith: "اتقوا النار ولو بشق تمرة.",
    hadithSource: "متفق عليه",
    scholarQuote: "السخاء يزيد الصديق مودةً ويكسب العدو مودةً، فكيف بالصديق؟",
    scholarName: "الإمام مالك",
    practices: ["تصدق يومياً ولو بقليل", "أطعم الطعام", "لا تمنّ بما أعطيت", "ابدأ بمن هو أحوج"],
  },
  {
    id: "ihtirm",
    title: "احترام الوالدين",
    category: "في الأسرة",
    icon: "👴",
    summary: "بر الوالدين من أعظم العبادات وأجلّ القرب. وقد قرن الله طاعته بطاعة الوالدين في أكثر من موضع.",
    ayah: "وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا",
    ayahRef: "الإسراء: 23",
    hadith: "رضا الله في رضا الوالدين، وسخط الله في سخط الوالدين.",
    hadithSource: "رواه الترمذي",
    scholarQuote: "بر الوالدين بعد وفاتهما بالدعاء لهما والصدقة عنهما وصلة أقاربهما.",
    scholarName: "الإمام الشافعي",
    practices: ["لا تقل لهما أف", "كن رحيماً بهما كما كانا برحيمين بك", "ادعُ لهما في الصلاة", "أكثر من زيارتهما"],
  },
  {
    id: "wafaa",
    title: "الوفاء بالعهد",
    category: "مع الناس",
    icon: "🤝",
    summary: "الوفاء بالعهد من أخص صفات المؤمن. وإخلاف الوعد نفاق. والله يأمر بالوفاء بالعهود والعقود.",
    ayah: "يَا أَيُّهَا الَّذِينَ آمَنُوا أَوْفُوا بِالْعُقُودِ",
    ayahRef: "المائدة: 1",
    hadith: "آية المنافق ثلاث: إذا حدَّث كذب، وإذا وعد أخلف، وإذا ائتُمن خان.",
    hadithSource: "متفق عليه",
    scholarQuote: "من أعطاك عهده فقد وضع ثقته في كفّيك، فاصنه صيانة مالك.",
    scholarName: "عمر بن الخطاب",
    practices: ["لا تعد بما لا تستطيع", "أوفِ بوعودك حتى للصغار", "اكتب التزاماتك لتذكرها", "بادر بالإنجاز قبل المطالبة"],
  },
  {
    id: "hilm",
    title: "الحلم وكظم الغيظ",
    category: "مع النفس",
    icon: "😌",
    summary: "الحلم هو ضبط النفس عند الغضب. والنبي ﷺ مدح من يملك نفسه عند الغضب أكثر من مدح القوي جسدياً.",
    ayah: "وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ ۗ وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ",
    ayahRef: "آل عمران: 134",
    hadith: "ليس الشديد بالصُّرَعَة، إنما الشديد الذي يملك نفسه عند الغضب.",
    hadithSource: "متفق عليه",
    scholarQuote: "الحلم رأس مكارم الأخلاق، لا يُبلَّغ بالتكلف بل بالتمرين والممارسة.",
    scholarName: "ابن القيم",
    practices: ["قل أعوذ بالله من الشيطان عند الغضب", "اجلس إن كنت قائماً", "اصمت حتى يهدأ الغضب", "تذكر أن الأجر على الحلم"],
  },
  {
    id: "haya",
    title: "الحياء",
    category: "مع النفس",
    icon: "🌹",
    summary: "الحياء خلق إسلامي رفيع ينهى عما يعيبه الشرع والعقل. قال النبي ﷺ أن الحياء كله خير.",
    ayah: "وَإِذَا سَأَلْتُمُوهُنَّ مَتَاعًا فَاسْأَلُوهُنَّ مِن وَرَاءِ حِجَابٍ",
    ayahRef: "الأحزاب: 53",
    hadith: "الحياء لا يأتي إلا بخير.",
    hadithSource: "متفق عليه",
    scholarQuote: "الحياء والإيمان قُرناء جميعاً، فإذا رُفع أحدهما رُفع الآخر.",
    scholarName: "ابن حجر العسقلاني",
    practices: ["استحِ من الله في السر والعلن", "الحياء من المظالم", "لا تفعل ما يخجلك", "الحياء لا يمنع الحق"],
  },
  {
    id: "tawbah",
    title: "التوبة والإنابة",
    category: "مع الله",
    icon: "🔄",
    summary: "التوبة هي العودة إلى الله بعد الذنب. والله يفرح بتوبة عبده فرحاً شديداً. والتوبة واجبة فوراً من كل ذنب.",
    ayah: "إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ",
    ayahRef: "البقرة: 222",
    hadith: "كل ابن آدم خطاء، وخير الخطائين التوابون.",
    hadithSource: "رواه الترمذي",
    scholarQuote: "التوبة واجبة من كل ذنب، وهي الندم على ما مضى والعزم على الترك والتقصير.",
    scholarName: "الإمام النووي",
    practices: ["أكثر من الاستغفار", "اندم على ما فات", "اعزم على عدم العودة", "ردّ المظالم لأصحابها"],
  },
  {
    id: "silat",
    title: "صلة الرحم",
    category: "في الأسرة",
    icon: "👨‍👩‍👧‍👦",
    summary: "صلة الرحم واجبة وقطعها محرم. والله علّق رحمته برحمته بالأرحام.",
    ayah: "وَاتَّقُوا اللَّهَ الَّذِي تَسَاءَلُونَ بِهِ وَالْأَرْحَامَ",
    ayahRef: "النساء: 1",
    hadith: "من أحب أن يُبسط له في رزقه ويُنسأ له في أثره فليصل رحمه.",
    hadithSource: "متفق عليه",
    scholarQuote: "الواصل ليس بالمكافئ، بل الواصل الذي إذا قطعته رحمه وصلها.",
    scholarName: "البخاري",
    practices: ["زر أقاربك بانتظام", "صل من قطعك", "تفقّد أحوالهم", "ادعُ لهم في الصلاة"],
  },
];

export default function AkhlaqPage() {
  const [category, setCategory] = useState("الكل");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    applyPageSeo({
      path: "/akhlaq",
      title: "الأخلاق الإسلامية — القيم والآداب | مجالس",
      description: "موسوعة الأخلاق الإسلامية: التواضع، الصدق، الأمانة، الصبر، الكرم — مع الآيات والأحاديث وأقوال العلماء.",
      keywords: ["أخلاق إسلامية", "قيم", "آداب", "تواضع", "صدق", "أمانة", "صبر"],
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim();
    return AKHLAQ.filter((a) => {
      const matchCat = category === "الكل" || a.category === category;
      const matchQ = !q || a.title.includes(q) || a.summary.includes(q);
      return matchCat && matchQ;
    });
  }, [category, search]);

  const toggle = (id: string) => setExpanded((p) => (p === id ? null : id));

  return (
    <div className="page-shell akl-page">
      {/* ═══ Hero ═══ */}
      <div className="akl-hero">
        <p className="akl-hero__eyebrow">الأخلاق الإسلامية</p>
        <h1 className="akl-hero__title">مكارم الأخلاق</h1>
        <p className="akl-hero__sub">
          «إِنَّمَا بُعِثْتُ لِأُتَمِّمَ مَكَارِمَ الْأَخْلَاقِ»
          <span className="akl-hero__source">رواه أحمد — النبي محمد ﷺ</span>
        </p>
        <div className="akl-hero__badges">
          <span><Heart size={13} /> {AKHLAQ.length} خلقاً</span>
          <span><BookOpen size={13} /> آيات وأحاديث</span>
          <span><Star size={13} /> أقوال علماء</span>
          <span><Users size={13} /> تطبيق عملي</span>
        </div>
      </div>

      {/* ═══ فلاتر وبحث ═══ */}
      <div className="akl-controls">
        <input
          className="akl-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث في الأخلاق..."
          aria-label="بحث"
        />
        <div className="akl-cats">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`akl-cat${category === c ? " akl-cat--active" : ""}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ قائمة الأخلاق ═══ */}
      <div className="akl-list">
        {filtered.map((a) => {
          const open = expanded === a.id;
          return (
            <article key={a.id} className={`akl-card${open ? " akl-card--open" : ""}`}>
              <button
                type="button"
                className="akl-card__header"
                onClick={() => toggle(a.id)}
                aria-expanded={open}
              >
                <span className="akl-card__icon" aria-hidden="true">{a.icon}</span>
                <div className="akl-card__title-wrap">
                  <h2 className="akl-card__title">{a.title}</h2>
                  <span className="akl-card__cat">{a.category}</span>
                </div>
                <span className="akl-card__chevron" aria-hidden="true">
                  {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </button>

              <p className="akl-card__summary">{a.summary}</p>

              {open && (
                <div className="akl-card__body">
                  {/* الآية */}
                  <div className="akl-block akl-block--quran">
                    <span className="akl-block__label">الدليل القرآني</span>
                    <p className="akl-block__quran">﴿{a.ayah}﴾</p>
                    <span className="akl-block__ref">{a.ayahRef}</span>
                  </div>

                  {/* الحديث */}
                  <div className="akl-block akl-block--hadith">
                    <span className="akl-block__label">الحديث النبوي</span>
                    <p className="akl-block__text">«{a.hadith}»</p>
                    <span className="akl-block__ref">{a.hadithSource}</span>
                  </div>

                  {/* قول العالم */}
                  <div className="akl-block akl-block--scholar">
                    <span className="akl-block__label">قال العلماء</span>
                    <blockquote className="akl-block__quote">
                      «{a.scholarQuote}»
                    </blockquote>
                    <span className="akl-block__scholar">— {a.scholarName}</span>
                  </div>

                  {/* التطبيق العملي */}
                  <div className="akl-block">
                    <span className="akl-block__label">كيف تطبّقه؟</span>
                    <ul className="akl-practices">
                      {a.practices.map((p) => (
                        <li key={p} className="akl-practice">
                          <span aria-hidden="true">✓</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="akl-empty">لا يوجد خلق مطابق للبحث.</p>
      )}

      {/* روابط ذات صلة */}
      <div className="akl-related">
        <h2 className="akl-related__title">استكشف أيضاً</h2>
        <div className="akl-related__grid">
          {[
            { href: "/asma-husna",   label: "الأسماء الحسنى",   desc: "99 اسماً لله" },
            { href: "/tawhid",       label: "التوحيد",           desc: "العقيدة الإسلامية" },
            { href: "/seerah",       label: "السيرة النبوية",    desc: "أخلاق النبي ﷺ" },
            { href: "/adhkar",       label: "الأذكار",           desc: "أذكار يومية" },
            { href: "/scholars",     label: "أعلام الإسلام",     desc: "علماء ربانيون" },
            { href: "/hadith",       label: "الأحاديث",          desc: "السنة النبوية" },
          ].map(({ href, label, desc }) => (
            <Link key={href} href={href} className="akl-related__card">
              <strong>{label}</strong>
              <span>{desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
