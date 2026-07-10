import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { BookOpen, Search, X } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";

/* ─── أنواع البيانات ─── */
type HadithTerm = {
  id: string;
  term: string;
  category: string;
  grade?: "accepted" | "rejected" | "neutral";
  definition: string;
  example?: string;
  note?: string;
};

const CATEGORIES = ["الكل", "أنواع الحديث", "السند", "الراوي", "الجرح والتعديل", "كتب الحديث"] as const;

const TERMS: HadithTerm[] = [
  /* ─── أنواع الحديث ─── */
  {
    id: "sahih",
    term: "الحديث الصحيح",
    category: "أنواع الحديث",
    grade: "accepted",
    definition: "ما اتصل سنده برواية العدل الضابط عن مثله من أوله إلى منتهاه، من غير شذوذ ولا علة قادحة.",
    example: "أحاديث صحيح البخاري ومسلم في معظمها صحيحة.",
    note: "أعلى درجات القبول، يُحتج به في العقائد والأحكام.",
  },
  {
    id: "hasan",
    term: "الحديث الحسن",
    category: "أنواع الحديث",
    grade: "accepted",
    definition: "ما اتصل سنده بنقل العدل الخفيف الضبط من غير شذوذ ولا علة قادحة.",
    example: "كثير من أحاديث سنن الترمذي حسنة.",
    note: "يُحتج به كالصحيح عند جمهور العلماء.",
  },
  {
    id: "daif",
    term: "الحديث الضعيف",
    category: "أنواع الحديث",
    grade: "rejected",
    definition: "ما لم تجتمع فيه صفات الصحيح أو الحسن بسبب ضعف في السند أو المتن.",
    example: "فقدان شرط الاتصال أو ضعف الراوي يجعل الحديث ضعيفاً.",
    note: "لا يُحتج به في العقائد والأحكام، وجائز روايته في الفضائل عند بعض العلماء بشروط.",
  },
  {
    id: "mawdu",
    term: "الحديث الموضوع",
    category: "أنواع الحديث",
    grade: "rejected",
    definition: "ما اختُلق ونُسب كذباً إلى النبي ﷺ، وهو أشد أنواع الحديث الضعيف حرمةً.",
    example: "كثير من الأحاديث المتعلقة بفضائل السور كل سورة على حدة موضوعة.",
    note: "يحرم روايته إلا مقروناً ببيان وضعه، ورواته على شفا جهنم.",
  },
  {
    id: "muttawatir",
    term: "الحديث المتواتر",
    category: "أنواع الحديث",
    grade: "accepted",
    definition: "ما رواه جمع كثير يستحيل تواطؤهم على الكذب، عن مثلهم من أوله إلى منتهاه.",
    example: "حديث «من كذب عليَّ متعمداً فليتبوأ مقعده من النار» متواتر.",
    note: "يُفيد العلم القطعي ولا يحتاج للبحث في رجاله.",
  },
  {
    id: "ahad",
    term: "حديث الآحاد",
    category: "أنواع الحديث",
    grade: "neutral",
    definition: "ما لم يبلغ درجة التواتر، ويُقسَّم إلى: غريب وعزيز ومشهور.",
    example: "معظم أحاديث الأحكام آحاد، وهي حجة عند جمهور العلماء.",
    note: "يُفيد الظن الغالب لا القطع، وهو حجة في الأحكام.",
  },
  {
    id: "mursal",
    term: "الحديث المرسَل",
    category: "أنواع الحديث",
    grade: "rejected",
    definition: "ما أسقط فيه التابعي الصحابي وأضاف الحديث مباشرةً إلى النبي ﷺ.",
    example: "«قال رسول الله ﷺ كذا» من تابعي دون ذكر الصحابي.",
    note: "ضعيف عند جمهور المحدثين، واحتجَّ به الشافعي إن عُضِّد بمرسَل آخر.",
  },
  {
    id: "munqati",
    term: "الحديث المنقطع",
    category: "أنواع الحديث",
    grade: "rejected",
    definition: "ما سقط من سنده راوٍ واحد في أي موضع من السند.",
    note: "يُعدّ ضعيفاً لعدم اتصال السند.",
  },
  {
    id: "mudal",
    term: "الحديث المعضَل",
    category: "أنواع الحديث",
    grade: "rejected",
    definition: "ما سقط من سنده اثنان فصاعداً متتاليان.",
    note: "أشد انقطاعاً من المنقطع وأضعف.",
  },
  {
    id: "mudallas",
    term: "الحديث المدلَّس",
    category: "أنواع الحديث",
    grade: "rejected",
    definition: "ما أوهم الراوي فيه سماعه ممن لم يسمع منه، أو أسقط ضعيفاً بين ثقتين.",
    note: "يُعدّ ضعيفاً وهو نوع من الخداع الإسنادي.",
  },
  {
    id: "shadh",
    term: "الحديث الشاذ",
    category: "أنواع الحديث",
    grade: "rejected",
    definition: "ما رواه الثقة مخالفاً لمن هو أوثق منه.",
    note: "المقبول هو المحفوظ، والشاذ مردود.",
  },

  /* ─── السند ─── */
  {
    id: "isnad",
    term: "الإسناد",
    category: "السند",
    grade: "neutral",
    definition: "سلسلة الرواة الذين نقلوا الحديث من النبي ﷺ إلى المصنِّف.",
    example: "حدثنا البخاري عن قتيبة عن مالك عن نافع عن ابن عمر مرفوعاً.",
    note: "قال ابن المبارك: الإسناد من الدين، ولولا الإسناد لقال من شاء ما شاء.",
  },
  {
    id: "matn",
    term: "المتن",
    category: "السند",
    grade: "neutral",
    definition: "نص الحديث وما تضمَّنه من كلام النبي ﷺ أو فعله أو تقريره.",
    note: "يُشترط في المتن ألا يخالف القرآن ولا صريح السنة المتواترة ولا صحيح العقل.",
  },
  {
    id: "musnad",
    term: "المسند",
    category: "السند",
    grade: "accepted",
    definition: "ما اتصل سنده مرفوعاً إلى النبي ﷺ من راويه الأخير.",
    note: "المسند أقوى من المرسل والمنقطع.",
  },
  {
    id: "marfu",
    term: "الحديث المرفوع",
    category: "السند",
    grade: "accepted",
    definition: "ما نُسب إلى النبي ﷺ قولاً أو فعلاً أو تقريراً أو صفةً.",
    note: "أعلى درجات الأثر، وهو الأصل في الاستدلال.",
  },
  {
    id: "mawquf",
    term: "الحديث الموقوف",
    category: "السند",
    grade: "neutral",
    definition: "ما نُسب إلى الصحابي قولاً أو فعلاً أو تقريراً، ولم يرفعه إلى النبي ﷺ.",
    note: "يُحتج به في تفسير الآيات والأحكام لقرب الصحابي من عصر الوحي.",
  },
  {
    id: "maqtu",
    term: "الحديث المقطوع",
    category: "السند",
    grade: "neutral",
    definition: "ما نُسب إلى التابعي قولاً أو فعلاً.",
    note: "لا يُحتج به مستقلاً لكنه مفيد في معرفة آراء التابعين.",
  },

  /* ─── الراوي ─── */
  {
    id: "adl",
    term: "العدالة",
    category: "الراوي",
    grade: "accepted",
    definition: "صفة ترجع إلى دينه وخُلقه: الإسلام والبلوغ والعقل والسلامة من الفسق.",
    note: "شرط أساسي في قبول الراوي لا يُساوَم عليه.",
  },
  {
    id: "dabt",
    term: "الضبط",
    category: "الراوي",
    grade: "accepted",
    definition: "إتقان الراوي لما سمع وحفظه في صدره أو كتابه، واستحضاره وقت الأداء.",
    note: "الضبط الصدري أقوى من ضبط الكتاب.",
  },
  {
    id: "thiqa",
    term: "الثقة",
    category: "الراوي",
    grade: "accepted",
    definition: "الراوي الجامع للعدالة والضبط معاً، وروايته مقبولة.",
    example: "مالك وشعبة والثوري وابن عيينة، أئمة ثقات.",
    note: "أعلى ألقاب التوثيق التي يُطلقها النقاد.",
  },
  {
    id: "majhul",
    term: "المجهول",
    category: "الراوي",
    grade: "rejected",
    definition: "من لم يُعرف فيه توثيق ولا جرح، أو عُرف اسمه دون حاله.",
    note: "الجهالة أقسام: جهالة العين وجهالة الحال، والأول أشد.",
  },
  {
    id: "mudallis-rawi",
    term: "المدلِّس",
    category: "الراوي",
    grade: "rejected",
    definition: "من يُوهم السماع ممن لم يسمع منه باستخدام عبارات مبهمة كـ «قال» أو «عن».",
    note: "يُحتاط في رواية المدلِّسين ولا تُقبل عنعنتهم.",
  },

  /* ─── الجرح والتعديل ─── */
  {
    id: "jarh",
    term: "الجرح",
    category: "الجرح والتعديل",
    grade: "rejected",
    definition: "وصف الراوي بما يُخل بعدالته أو ضبطه، فيُرد حديثه.",
    example: "ألفاظ الجرح: كذاب، متروك، ضعيف، سيئ الحفظ.",
    note: "الجرح مقدَّم على التعديل إذا كان مفسَّراً.",
  },
  {
    id: "tadil",
    term: "التعديل",
    category: "الجرح والتعديل",
    grade: "accepted",
    definition: "الحكم على الراوي بالعدالة والضبط وقبول روايته.",
    example: "ألفاظ التعديل: ثقة، ثبت، متقن، حجة، حافظ.",
    note: "مراتب التعديل ست درجات عند ابن حجر.",
  },
  {
    id: "muttahim",
    term: "المتَّهم بالكذب",
    category: "الجرح والتعديل",
    grade: "rejected",
    definition: "من اتُّهم بوضع الحديث وإن لم يُثبت عليه ذلك قطعاً.",
    note: "أحد أشد مراتب الجرح، يوجب رد روايته.",
  },
  {
    id: "munkar",
    term: "الراوي المنكَر",
    category: "الجرح والتعديل",
    grade: "rejected",
    definition: "من يروي ما يخالف الثقات مخالفة ظاهرة، فيُردّ حديثه.",
    note: "«المنكَر» لفظ جرح يُطلقه نقاد الحديث على من كثرت مخالفاته.",
  },

  /* ─── كتب الحديث ─── */
  {
    id: "bukhari",
    term: "صحيح البخاري",
    category: "كتب الحديث",
    grade: "accepted",
    definition: "الجامع الصحيح المسند من حديث رسول الله ﷺ وسننه وأيامه، للإمام محمد بن إسماعيل البخاري (ت256ه).",
    example: "يحتوي على 7563 حديثاً (بالمكررات)، وأصحها الإسناد في التاريخ.",
    note: "أصح كتاب بعد القرآن الكريم بإجماع العلماء.",
  },
  {
    id: "muslim",
    term: "صحيح مسلم",
    category: "كتب الحديث",
    grade: "accepted",
    definition: "الجامع الصحيح، للإمام مسلم بن الحجاج النيسابوري (ت261ه).",
    example: "يحتوي على 5362 حديثاً (بالمكررات).",
    note: "يمتاز بحسن الترتيب وجمع طرق الحديث في مكان واحد.",
  },
  {
    id: "kutub-sitta",
    term: "الكتب الستة",
    category: "كتب الحديث",
    grade: "accepted",
    definition: "المصادر الستة الرئيسية للسنة النبوية: صحيح البخاري، صحيح مسلم، سنن أبي داود، سنن الترمذي، سنن النسائي، سنن ابن ماجه.",
    note: "تُعدّ المرجع الأساسي لعلماء الحديث في استنباط الأحكام.",
  },
  {
    id: "musnad-ahmad",
    term: "مسند الإمام أحمد",
    category: "كتب الحديث",
    grade: "accepted",
    definition: "مسند الإمام أحمد بن حنبل (ت241ه)، يحتوي على أكثر من 27000 حديث مرتبة على مسانيد الصحابة.",
    note: "أكبر مسند في تاريخ علم الحديث.",
  },
  {
    id: "muwatta",
    term: "موطأ الإمام مالك",
    category: "كتب الحديث",
    grade: "accepted",
    definition: "أقدم كتب الحديث الجامعة للأحكام، للإمام مالك بن أنس (ت179ه).",
    note: "قال الشافعي: ما على ظهر الأرض كتاب بعد القرآن أصح من كتاب مالك.",
  },

  /* ── أنواع الحديث، إضافية ── */
  {
    id: "mutawatir-lafzi",
    term: "المتواتر اللفظي",
    category: "أنواع الحديث",
    grade: "accepted",
    definition: "ما تواتر لفظه ومعناه معاً، وهو أعلى درجات التواتر.",
    note: "مثاله: حديث «من كذب عليّ متعمداً فليتبوأ مقعده من النار».",
  },
  {
    id: "mutawatir-manawi",
    term: "المتواتر المعنوي",
    category: "أنواع الحديث",
    grade: "accepted",
    definition: "ما تواتر معناه دون لفظه، وهو أكثر وقوعاً من المتواتر اللفظي.",
    note: "كأحاديث رفع اليدين في الدعاء — كلٌّ منها منفردٌ آحاد، لكن مجموعها يُفيد القطع.",
  },
  {
    id: "mazid-fi-muttasil",
    term: "المزيد في متصل الأسانيد",
    category: "السند",
    grade: "rejected",
    definition: "ما زِيد في سنده راوٍ يتوهم أنه من جملة السند ولم يذكره الأحفظ.",
    note: "من أدق مباحث علم العلل، يتعلق بزيادة رواةٍ دون أصلٍ.",
  },
  {
    id: "maqlub",
    term: "الحديث المقلوب",
    category: "أنواع الحديث",
    grade: "rejected",
    definition: "ما قُلب فيه اسم الراوي أو متن الحديث بقصد الاختبار أو السهو.",
    note: "قد يكون في السند: بتبديل اسم الراوي باسم آخر، أو في المتن: بتقديم ما حقه التأخير.",
  },
  {
    id: "mudraj",
    term: "الحديث المدرج",
    category: "أنواع الحديث",
    grade: "rejected",
    definition: "ما أُدرج في متنه أو سنده ما ليس منه من كلام راوٍ أو تفسير.",
    note: "أشهر أنواعه: إدراج كلام الراوي في المتن فيُظن من الحديث. وهو نوع من التدليس.",
  },
  {
    id: "muallaq",
    term: "الحديث المعلّق",
    category: "السند",
    grade: "rejected",
    definition: "ما حُذف من مبدأ سنده راوٍ فأكثر على التوالي.",
    note: "وقع في صحيح البخاري عدد منه، لكنه أوردها استشهاداً لا احتجاجاً بها مستقلة.",
  },
  {
    id: "mutabi",
    term: "المتابع",
    category: "السند",
    grade: "accepted",
    definition: "رواية توافق رواية أخرى في السند أو المتن لتعزيز الحكم عليها.",
    note: "يُستخدم لتقوية الأحاديث الحسنة لغيرها. والمتابعة التامة: المشاركة من نفس الشيخ.",
  },
  {
    id: "shahid",
    term: "الشاهد",
    category: "السند",
    grade: "accepted",
    definition: "حديث يروى من طريق صحابي آخر يشهد لحديثٍ بنفس معناه ويقوّيه.",
    note: "الفرق بين الشاهد والمتابع: الشاهد من صحابي مختلف، والمتابعة من شيخ الراوي فصاعداً.",
  },

  /* ── الراوي، إضافية ── */
  {
    id: "kathibul-muttaham",
    term: "الوضّاع",
    category: "الراوي",
    grade: "rejected",
    definition: "من اشتُهر بوضع الأحاديث وإسنادها إلى النبي ﷺ كذباً وافتراءً.",
    note: "أشهر الوضّاعين: ابن أبي يحيى، ومأمون بن أحمد السلمي. لا تُقبل رواياتهم مطلقاً.",
  },
  {
    id: "saduq",
    term: "صدوق",
    category: "الراوي",
    grade: "accepted",
    definition: "مرتبة توثيق تعني أن الراوي صادق لكنه قد يخطئ أو يهم أحياناً.",
    note: "دون الثقة وفوق الضعيف. يُحتج به إذا لم يتفرد بما يخالف، وحديثه حسن في الغالب.",
  },

  /* ── كتب الحديث، إضافية ── */
  {
    id: "sunan-darimi",
    term: "سنن الدارمي",
    category: "كتب الحديث",
    grade: "accepted",
    definition: "كتاب حديثي للإمام الدارمي (ت255ه)، يُعدّ من أوثق المصادر الحديثية.",
    note: "يتمتع بأسانيد عالية الجودة، وبعض أهل العلم يُقدمه على بعض كتب السنن الأربعة.",
  },
  {
    id: "mustadrak-hakim",
    term: "مستدرك الحاكم",
    category: "كتب الحديث",
    grade: "accepted",
    definition: "كتاب الحاكم النيسابوري (ت405ه)، أودع فيه ما يرى أنه على شرط الشيخين وفاتهما.",
    note: "ينتقده كثير من الأئمة في التساهل، والذهبي اختصره ونقد كثيراً من أحاديثه.",
  },
];

export default function HadithSciencePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("الكل");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/hadith-science",
      title: "مصطلح الحديث | المجلس العلمي",
      description: "مرجع شامل لمصطلح الحديث وعلومه: أنواع الأحاديث والسند والرجال والجرح والتعديل وكتب الحديث.",
      keywords: ["مصطلح الحديث", "علوم الحديث", "الحديث الصحيح", "الجرح والتعديل", "الإسناد"],
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TERMS.filter((t) => {
      const matchCat = category === "الكل" || t.category === category;
      const matchQ = !q || t.term.includes(q) || t.definition.includes(q);
      return matchCat && matchQ;
    });
  }, [query, category]);

  function gradeClass(g?: HadithTerm["grade"]) {
    if (g === "accepted") return " hs-card--accepted";
    if (g === "rejected") return " hs-card--rejected";
    return "";
  }
  function gradeLabel(g?: HadithTerm["grade"]) {
    if (g === "accepted") return "مقبول";
    if (g === "rejected") return "مردود";
    return "محايد";
  }

  return (
    <main className="hs-page" dir="rtl">
      {/* هيرو */}
      <section className="hs-hero">
        <div className="hs-hero__badge">علوم الحديث</div>
        <h1 className="hs-hero__title">مصطلح الحديث</h1>
        <p className="hs-hero__sub">
          مرجع موجز لمصطلحات علم الحديث، من أنواع الأحاديث إلى الجرح والتعديل وأهم المصنَّفات
        </p>
        {/* إحصائيات */}
        <div className="hs-stats">
          <div className="hs-stat"><strong>{TERMS.length}</strong><span>مصطلح</span></div>
          <div className="hs-stat"><strong>{CATEGORIES.length - 1}</strong><span>أبواب</span></div>
          <div className="hs-stat"><strong>{TERMS.filter(t => t.grade === "accepted").length}</strong><span>مقبول</span></div>
          <div className="hs-stat"><strong>{TERMS.filter(t => t.grade === "rejected").length}</strong><span>مردود</span></div>
        </div>
      </section>

      {/* شريط التحكم */}
      <div className="hs-controls">
        <div className="hs-search-wrap">
          <Search size={16} className="hs-search-icon" aria-hidden="true" />
          <input
            className="hs-search"
            type="search"
            placeholder="ابحث في المصطلحات..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="بحث في مصطلح الحديث"
          />
          {query && (
            <button type="button" className="hs-search-clear" onClick={() => setQuery("")} aria-label="مسح البحث">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="hs-cats" role="list" aria-label="تصفية حسب الباب">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              role="listitem"
              className={`hs-cat-chip${category === cat ? " hs-cat-chip--active" : ""}`}
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* النتائج */}
      {filtered.length === 0 ? (
        <div className="hs-empty">
          <BookOpen size={36} aria-hidden="true" />
          <p>لا توجد نتائج للبحث</p>
        </div>
      ) : (
        <div className="hs-grid">
          {filtered.map((t) => {
            const isOpen = openId === t.id;
            return (
              <article key={t.id} className={`hs-card${gradeClass(t.grade)}${isOpen ? " hs-card--open" : ""}`}>
                <button
                  type="button"
                  className="hs-card__header"
                  onClick={() => setOpenId((prev) => (prev === t.id ? null : t.id))}
                  aria-expanded={isOpen}
                >
                  <div className="hs-card__header-main">
                    <div className="hs-card__cat">{t.category}</div>
                    <div className="hs-card__term">{t.term}</div>
                  </div>
                  {t.grade && (
                    <span className={`hs-grade hs-grade--${t.grade}`}>{gradeLabel(t.grade)}</span>
                  )}
                </button>
                {isOpen && (
                  <div className="hs-card__body">
                    <p className="hs-card__def">{t.definition}</p>
                    {t.example && (
                      <div className="hs-card__example">
                        <span className="hs-card__example-label">مثال:</span>
                        {t.example}
                      </div>
                    )}
                    {t.note && (
                      <div className="hs-card__note">{t.note}</div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="twh-share">
        <ShareButtons title="علوم الحديث — المجلس العلمي" url="https://majlisilm.com/hadith-science" />
      </div>

      {/* مصادر للمزيد */}
      <section className="hs-related">
        <h2 className="hs-related__title">استكشف أيضاً</h2>
        <div className="hs-related__grid">
          {[
            { href: "/hadith",         label: "الأحاديث النبوية" },
            { href: "/hadith/sahih",   label: "الأحاديث الصحيحة" },
            { href: "/hadith/daif",    label: "الأحاديث الضعيفة" },
            { href: "/hadith/mawdu",   label: "الأحاديث الموضوعة" },
            { href: "/arbaeen-nawawi", label: "الأربعون النووية" },
            { href: "/scholarly-research", label: "الباحث الشرعي" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="hs-related__link">{label}</Link>
          ))}
        </div>
      </section>
    </main>
  );
}
