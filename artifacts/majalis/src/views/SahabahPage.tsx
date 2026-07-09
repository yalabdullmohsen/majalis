import { useEffect, useState } from "react";
import { applyPageSeo } from "../lib/seo";


type SahabiCategory = "الكل" | "الخلفاء" | "العشرة" | "النساء" | "العلماء" | "الفاتحون";

interface Sahabi {
  id: string;
  name: string;
  kunya?: string;
  icon: string;
  category: SahabiCategory[];
  born: string;
  died: string;
  origin: string;
  islam: string;
  fadl: string;
  quote?: string;
  legacy: string[];
}

const SAHABAH: Sahabi[] = [
  {
    id: "abubakr",
    name: "أبو بكر الصديق",
    kunya: "عبد الله بن عثمان",
    icon: "👑",
    category: ["الخلفاء", "العشرة"],
    born: "51 ق.هـ — مكة المكرمة",
    died: "13 هـ — المدينة المنورة (63 عاماً)",
    origin: "من قبيلة قريش — بني تيم",
    islam: "أول البالغين الذكور إسلاماً، وأوثق صاحب للنبي ﷺ",
    fadl: "«لو وُزِنَ إيمانُ أبي بكر بإيمان الأمة لرجح» — وصفه النبي ﷺ بالصديق لتصديقه حادثة الإسراء فوراً",
    quote: "أنا الراضي بقضاء الله، فإن كان فيه بلاء فيرجى ثوابه، وإن كان فيه نعمة فليشكر الله",
    legacy: [
      "أول خليفة للمسلمين بعد النبي ﷺ",
      "جمع القرآن الكريم في مصحف واحد",
      "أخمد حروب الردة وثبّت دولة الإسلام",
      "فتح بلاد الشام والعراق في عهده",
    ],
  },
  {
    id: "umar",
    name: "عمر بن الخطاب",
    kunya: "الفاروق",
    icon: "⚔️",
    category: ["الخلفاء", "العشرة"],
    born: "40 ق.هـ — مكة المكرمة",
    died: "23 هـ — المدينة المنورة (63 عاماً)",
    origin: "من قبيلة قريش — بني عدي",
    islam: "أسلم في السنة السادسة للبعثة، وكان إسلامه عزاً للمسلمين",
    fadl: "«لو كان بعدي نبي لكان عمر» — صلى المسلمون جهاراً عند إسلامه لأول مرة",
    quote: "حاسبوا أنفسكم قبل أن تحاسبوا، وزنوا أعمالكم قبل أن توزن عليكم",
    legacy: [
      "الخليفة الثاني — وسّع رقعة الدولة الإسلامية",
      "أسس نظام الدواوين ووضع التقويم الهجري",
      "فتح مصر وبلاد فارس والشام والعراق",
      "سمّاه النبي ﷺ الفاروق لفرقه بين الحق والباطل",
    ],
  },
  {
    id: "uthman",
    name: "عثمان بن عفان",
    kunya: "ذو النورين",
    icon: "📖",
    category: ["الخلفاء", "العشرة"],
    born: "47 ق.هـ — الطائف",
    died: "35 هـ — المدينة المنورة (82 عاماً)",
    origin: "من قبيلة قريش — بني أمية",
    islam: "أسلم مبكراً بدعوة أبي بكر، وهاجر الهجرتين",
    fadl: "سمّي ذا النورين لزواجه من ابنتَي النبي ﷺ رقية ثم أم كلثوم. اشترى بئر رومة ووقفها للمسلمين",
    legacy: [
      "جمع المصحف العثماني وأرسله إلى الأمصار",
      "وسّع المسجد النبوي الشريف",
      "فتح إفريقيا وبلاد السند",
      "مدّ نفوذ الدولة الإسلامية إلى خراسان",
    ],
  },
  {
    id: "ali",
    name: "علي بن أبي طالب",
    kunya: "أبو الحسن — أسد الله الغالب",
    icon: "🦁",
    category: ["الخلفاء", "العشرة"],
    born: "23 ق.هـ — مكة المكرمة",
    died: "40 هـ — الكوفة (63 عاماً)",
    origin: "من بني هاشم — ابن عم النبي ﷺ",
    islam: "أول من أسلم من الصبيان، ونشأ في بيت النبي ﷺ",
    fadl: "قال له النبي ﷺ: «أنت مني بمنزلة هارون من موسى» — وكان من أشجع الناس وأعلمهم",
    quote: "قيمة كل امرئ ما يحسنه",
    legacy: [
      "الخليفة الرابع الراشد — الإمام والفقيه والخطيب",
      "راوي كثير من الأحاديث النبوية",
      "أبو الحسن والحسين — ريحانتَا النبي ﷺ",
      "زوج فاطمة الزهراء بنت النبي ﷺ",
    ],
  },
  {
    id: "khadija",
    name: "خديجة بنت خويلد",
    kunya: "أم المؤمنين — سيدة نساء العالمين",
    icon: "🌹",
    category: ["النساء"],
    born: "68 ق.هـ — مكة المكرمة",
    died: "3 ق.هـ — مكة المكرمة (65 عاماً)",
    origin: "من قبيلة قريش — بني أسد",
    islam: "أول من أسلم من البشر مطلقاً، وأول زوجات النبي ﷺ",
    fadl: "«ما أبدلني الله خيراً منها، آمنت بي حين كفر الناس، وصدّقتني حين كذّبني الناس، وواستني بمالها» (النبي ﷺ)",
    legacy: [
      "أول المؤمنين وداعمة النبي ﷺ الأولى",
      "أم أبناء النبي ﷺ الأحياء",
      "أنفقت ثروتها في سبيل الإسلام",
      "بشّرها جبريل بالسلام من الله ومن النبي ﷺ",
    ],
  },
  {
    id: "aisha",
    name: "عائشة بنت أبي بكر",
    kunya: "أم المؤمنين — الحميراء",
    icon: "📚",
    category: ["النساء", "العلماء"],
    born: "9 ق.هـ — مكة المكرمة",
    died: "58 هـ — المدينة المنورة (66 عاماً)",
    origin: "من قبيلة قريش — بني تيم",
    islam: "ولدت مسلمة وهي أعلم نساء الأمة",
    fadl: "«خذوا نصف دينكم عن الحميراء» — روت أكثر من 2200 حديث وكانت مرجع الصحابة في الفقه والطب",
    quote: "كان خلقه ﷺ القرآن",
    legacy: [
      "أكثر النساء رواية للحديث (2210 حديثاً)",
      "مرجع الصحابة في الفقه والطب",
      "حفظت شمائل النبي ﷺ وبيّنتها للناس",
      "كانت تُعلِّم الرجال والنساء بعد وفاة النبي ﷺ",
    ],
  },
  {
    id: "ibn-masud",
    name: "عبد الله بن مسعود",
    kunya: "أبو عبد الرحمن",
    icon: "🎓",
    category: ["العلماء"],
    born: "مكة المكرمة",
    died: "32 هـ — المدينة المنورة (60+ عاماً)",
    origin: "من هذيل — حليف قريش",
    islam: "من السابقين الأولين، وسادس من أسلم",
    fadl: "«من أراد أن يسمع القرآن غضاً طرياً كما أُنزل فليسمعه من ابن أم عبد» (النبي ﷺ)",
    legacy: [
      "أحد كبار علماء الصحابة في الفقه والقرآن",
      "راوي مئات الأحاديث النبوية",
      "مؤسس مدرسة الكوفة الفقهية",
      "أشبه الصحابة هدياً ودلاً بالنبي ﷺ",
    ],
  },
  {
    id: "khalid",
    name: "خالد بن الوليد",
    kunya: "سيف الله المسلول",
    icon: "⚔️",
    category: ["الفاتحون"],
    born: "585م — مكة المكرمة",
    died: "21 هـ — حمص (58 عاماً)",
    origin: "من قبيلة قريش — بني مخزوم",
    islam: "أسلم عام 8 هـ وقاد الجيوش فوراً",
    fadl: "لم يُهزَم في معركة قط — خاض أكثر من 100 معركة. قال النبي ﷺ: «سيف من سيوف الله سلّه على الكفار»",
    legacy: [
      "أعظم قادة عسكريين في التاريخ",
      "فتح الشام والعراق وهزم الفرس والروم",
      "معركة اليرموك نموذج استراتيجي حربي دراسي",
      "لم يُهزَم في أي معركة طوال حياته",
    ],
  },
  {
    id: "ibn-abbas",
    name: "عبد الله بن عباس",
    kunya: "حبر الأمة — البحر",
    icon: "🌊",
    category: ["العلماء"],
    born: "3 ق.هـ — شعب أبي طالب",
    died: "68 هـ — الطائف (71 عاماً)",
    origin: "ابن عم النبي ﷺ من بني هاشم",
    islam: "ولد في الإسلام وتفقّه بدعاء النبي ﷺ",
    fadl: "دعا له النبي ﷺ: «اللهم فقّهه في الدين وعلّمه التأويل» — فكان إمام المفسرين",
    quote: "ثلاثة إذا أكرمتهم أكرموك، وإذا أهنتهم أهانوك: العالم والأمير والمعلم",
    legacy: [
      "إمام المفسرين وأعلم الناس بكتاب الله",
      "راوي 1700+ حديث نبوي شريف",
      "أسس علم التفسير بالمأثور",
      "سيد الفقهاء في زمانه",
    ],
  },
  {
    id: "amr-ibn-al-as",
    name: "عمرو بن العاص",
    kunya: "الصحابي الداهية",
    icon: "🗺️",
    category: ["الفاتحون"],
    born: "مكة المكرمة",
    died: "43 هـ — مصر (قرابة 100 عاماً)",
    origin: "من قبيلة قريش — بني سهم",
    islam: "أسلم عام 8 هـ قبيل فتح مكة",
    fadl: "«إن عمراً لمن صالحي قريش» — بعثه النبي ﷺ أميراً على جيش السلاسل",
    legacy: [
      "فاتح مصر وأميرها الأول",
      "بنى مدينة الفسطاط (القاهرة القديمة)",
      "داهية العرب وصاحب المواقف السياسية الحكيمة",
      "من القادة العسكريين الفذّين في التاريخ الإسلامي",
    ],
  },
  {
    id: "salman",
    name: "سلمان الفارسي",
    kunya: "سلمان المحمدي",
    icon: "🌍",
    category: ["العلماء"],
    born: "فارس (إيران)",
    died: "35 هـ — المدائن (150+ سنة تقريباً)",
    origin: "فارسي الأصل من أصفهان",
    islam: "رحل من فارس إلى الشام إلى الجزيرة العربية بحثاً عن النبي الخاتم",
    fadl: "قال النبي ﷺ: «سلمان منا أهل البيت» — وهو صاحب فكرة الخندق في غزوة الأحزاب",
    quote: "صحبت ثلاثمائة من العلماء أو يزيد، ما ازددت بصحبتهم إلا تواضعاً",
    legacy: [
      "صاحب فكرة الخندق في غزوة الأحزاب",
      "أمير المدائن في عهد عمر",
      "رمز الأخوة الإسلامية الجامعة بين الأمم",
      "حكيم الصحابة وصاحب التجارب الواسعة",
    ],
  },
  {
    id: "bilal",
    name: "بلال بن رباح",
    kunya: "مؤذن النبي ﷺ",
    icon: "🔔",
    category: ["العشرة"],
    born: "مكة المكرمة",
    died: "20 هـ — دمشق (63 عاماً)",
    origin: "حبشي الأصل — كان عبداً عند أمية بن خلف",
    islam: "من السابقين الأولين، عُذِّب على إسلامه واشتراه أبو بكر وأعتقه",
    fadl: "«إني لسمعت خشخشة نعليك في الجنة» (النبي ﷺ لبلال) — كان مؤذن النبي الأول",
    legacy: [
      "أول مؤذن في الإسلام وأشهرهم",
      "رمز المقاومة والثبات أمام الاضطهاد",
      "رمز المساواة الإسلامية — عبد حبشي بلغ أعلى المراتب",
      "اعتزل الأذان بعد وفاة النبي ﷺ حزناً عليه",
    ],
  },
];

const CATEGORIES: SahabiCategory[] = ["الكل", "الخلفاء", "العشرة", "النساء", "العلماء", "الفاتحون"];

export default function SahabahPage() {
  useEffect(() => {
      applyPageSeo({
      path: "/sahabah",
      title: "أعلام الصحابة الكرام — المجلس العلمي",
      description: "موسوعة كبار الصحابة رضي الله عنهم: سيرتهم وفضائلهم وإرثهم في الإسلام",
      keywords: ["الصحابة", "الخلفاء الراشدون", "أصحاب النبي", "سيرة الصحابة", "فضائل الصحابة"],
    });
  }, []);

  const [activeCat, setActiveCat] = useState<SahabiCategory>("الكل");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = SAHABAH.filter((s) => {
    const matchCat = activeCat === "الكل" || s.category.includes(activeCat);
    const matchSearch = !search.trim() ||
      s.name.includes(search) || (s.kunya?.includes(search) ?? false);
    return matchCat && matchSearch;
  });

  return (
    <main className="sb-page" dir="rtl">
      {/* hero */}
      <section className="sb-hero">
        <div className="sb-hero__badge">السيرة والتاريخ</div>
        <h1 className="sb-hero__title">أعلام الصحابة الكرام</h1>
        <p className="sb-hero__sub">
          موسوعة كبار الصحابة رضي الله عنهم — سيرتهم وفضائلهم وإرثهم في الإسلام
        </p>

        <div className="sb-ayah">
          <p className="sb-ayah__text">
            وَالسَّابِقُونَ الْأَوَّلُونَ مِنَ الْمُهَاجِرِينَ وَالْأَنصَارِ وَالَّذِينَ اتَّبَعُوهُم بِإِحْسَانٍ
            رَّضِيَ اللَّهُ عَنْهُمْ وَرَضُوا عَنْهُ
          </p>
          <cite className="sb-ayah__ref">التوبة: 100</cite>
        </div>
      </section>

      <div className="sb-body">
        {/* search */}
        <input
          type="search"
          className="sb-search"
          placeholder="ابحث بالاسم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* categories */}
        <div className="sb-cats">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`sb-cat-btn${activeCat === cat ? " sb-cat-btn--active" : ""}`}
              onClick={() => setActiveCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="sb-count">{filtered.length} صحابي</p>

        {/* cards */}
        <div className="sb-list">
          {filtered.map((s) => {
            const isOpen = openId === s.id;
            return (
              <article key={s.id} className={`sb-card${isOpen ? " sb-card--open" : ""}`}>
                <button
                  type="button"
                  className="sb-card__head"
                  onClick={() => setOpenId(isOpen ? null : s.id)}
                  aria-expanded={isOpen}
                >
                  <span className="sb-card__icon">{s.icon}</span>
                  <div className="sb-card__info">
                    <span className="sb-card__name">{s.name}</span>
                    {s.kunya && <span className="sb-card__kunya">{s.kunya}</span>}
                  </div>
                  <div className="sb-card__tags">
                    {s.category.slice(0, 2).map((c) => (
                      <span key={c} className="sb-card__tag">{c}</span>
                    ))}
                  </div>
                  <span className={`sb-card__chevron${isOpen ? " sb-card__chevron--open" : ""}`}>▾</span>
                </button>

                {isOpen && (
                  <div className="sb-card__body">
                    <div className="sb-card__meta-grid">
                      {[
                        { label: "الميلاد", value: s.born },
                        { label: "الوفاة", value: s.died },
                        { label: "الأصل", value: s.origin },
                        { label: "إسلامه", value: s.islam },
                      ].map((m) => (
                        <div key={m.label} className="sb-meta-item">
                          <span className="sb-meta-item__label">{m.label}</span>
                          <span className="sb-meta-item__value">{m.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="sb-fadl-box">
                      <span className="sb-fadl-box__label">الفضل والمنزلة</span>
                      <p className="sb-fadl-box__text">{s.fadl}</p>
                    </div>

                    {s.quote && (
                      <blockquote className="sb-quote">
                        <p className="sb-quote__text">{s.quote}</p>
                      </blockquote>
                    )}

                    <div className="sb-legacy">
                      <span className="sb-legacy__label">الإرث والأثر</span>
                      <ul className="sb-legacy__list">
                        {s.legacy.map((item) => (
                          <li key={item} className="sb-legacy__item">{item}</li>
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
          <div className="sb-empty">
            <span>🔍</span>
            <p>لا توجد نتائج مطابقة</p>
          </div>
        )}

        {/* related */}
        <nav className="sb-related" aria-label="صفحات ذات صلة">
          <h2 className="sb-related__title">استكشف أيضاً</h2>
          <div className="sb-related__grid">
            {[
              { href: "/seerah", label: "السيرة النبوية" },
              { href: "/scholars", label: "أعلام الإسلام" },
              { href: "/stories", label: "القصص الإسلامية" },
              { href: "/arbaeen-nawawi", label: "الأربعون النووية" },
              { href: "/hikam-salaf", label: "حكم السلف" },
              { href: "/hadith", label: "الأحاديث النبوية" },
            ].map((r) => (
              <a key={r.href} href={r.href} className="sb-related__link">{r.label}</a>
            ))}
          </div>
        </nav>
      </div>
    </main>
  );
}
