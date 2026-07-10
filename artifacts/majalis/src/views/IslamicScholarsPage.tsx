import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Search, ChevronLeft, BookOpen, Star, Filter } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";

/* ── بيانات العلماء ──────────────────────────────────────── */
type Scholar = {
  id: string;
  name: string;
  fullName: string;
  era: string;
  specialty: string[];
  bio: string;
  key_works: string[];
  died: string;
  region: string;
  madhhab?: string;
  quote?: string;
};

const SCHOLARS: Scholar[] = [
  // الأئمة الأربعة
  {
    id: "abu-hanifa",
    name: "أبو حنيفة النعمان",
    fullName: "النعمان بن ثابت الكوفي",
    era: "الأئمة الأربعة",
    specialty: ["فقه", "أصول"],
    bio: "إمام المذهب الحنفي، أول من دوّن الفقه وصنّفه، عُرف بعمق النظر واستقراء مسائل النوازل",
    key_works: ["المسند", "الفقه الأكبر", "العالم والمتعلم"],
    died: "١٥٠ هـ",
    region: "الكوفة / بغداد",
    madhhab: "حنفي",
    quote: "العلم لا يُعطيك بعضه حتى تُعطيه كلّك",
  },
  {
    id: "malik",
    name: "الإمام مالك",
    fullName: "مالك بن أنس الأصبحي",
    era: "الأئمة الأربعة",
    specialty: ["حديث", "فقه"],
    bio: "إمام دار الهجرة، صاحب الموطأ، أقدم كتب الحديث الموثقة، اشتُهر بعلمه بعمل أهل المدينة",
    key_works: ["الموطأ", "المدونة الكبرى"],
    died: "١٧٩ هـ",
    region: "المدينة المنورة",
    madhhab: "مالكي",
    quote: "لا يُفتي بهذا الأمر حتى تأتيه الآثار من ثلاثة وجوه",
  },
  {
    id: "shafi",
    name: "الإمام الشافعي",
    fullName: "محمد بن إدريس الشافعي",
    era: "الأئمة الأربعة",
    specialty: ["فقه", "أصول", "شعر"],
    bio: "مؤسس علم أصول الفقه، جمع بين المنهج المدني والعراقي، صاحب الرسالة، أول كتاب في الأصول",
    key_works: ["الرسالة", "الأم", "ديوان الشافعي"],
    died: "٢٠٤ هـ",
    region: "فلسطين / مصر",
    madhhab: "شافعي",
    quote: "كلما ازددتُ علماً ازددتُ علماً بجهلي",
  },
  {
    id: "ahmad",
    name: "الإمام أحمد",
    fullName: "أحمد بن محمد بن حنبل الشيباني",
    era: "الأئمة الأربعة",
    specialty: ["حديث", "فقه", "عقيدة"],
    bio: "إمام أهل السنة، ثبت على المحنة وأبى القول بخلق القرآن، جمع المسند الكبير",
    key_works: ["المسند", "الزهد", "العلل"],
    died: "٢٤١ هـ",
    region: "بغداد",
    madhhab: "حنبلي",
    quote: "المحنة ميزان بين المؤمن وأهل النفاق",
  },
  // علماء الحديث
  {
    id: "bukhari",
    name: "الإمام البخاري",
    fullName: "محمد بن إسماعيل البخاري",
    era: "المحدثون",
    specialty: ["حديث"],
    bio: "صاحب أصح كتاب بعد كتاب الله، الجامع الصحيح، حفظ ستمئة ألف حديث",
    key_works: ["صحيح البخاري", "الأدب المفرد", "التاريخ الكبير"],
    died: "٢٥٦ هـ",
    region: "بخارى (أوزبكستان)",
    quote: "ما وضعتُ في الصحيح حديثاً إلا اغتسلتُ وصليتُ ركعتين",
  },
  {
    id: "muslim",
    name: "الإمام مسلم",
    fullName: "مسلم بن الحجاج القشيري النيسابوري",
    era: "المحدثون",
    specialty: ["حديث"],
    bio: "صاحب الصحيح الثاني، اشتُهر بالتنظيم المنهجي واختيار المتون الأحاديث",
    key_works: ["صحيح مسلم", "الكنى والأسماء"],
    died: "٢٦١ هـ",
    region: "نيسابور (إيران)",
  },
  // علماء العقيدة والتفسير
  {
    id: "ibn-taymiyya",
    name: "ابن تيمية",
    fullName: "أحمد بن عبد الحليم بن تيمية الحراني",
    era: "العلماء الكبار",
    specialty: ["عقيدة", "فقه", "تفسير"],
    bio: "شيخ الإسلام، مجدد القرن السابع، صاحب الدعوة إلى السنة ومحاربة البدعة",
    key_works: ["مجموع الفتاوى", "درء تعارض العقل والنقل", "منهاج السنة", "الفتاوى الكبرى"],
    died: "٧٢٨ هـ",
    region: "الشام (سوريا)",
    quote: "ما يصنع أعدائي بي؟ سجني خلوة، ونفيي سياحة، وقتلي شهادة",
  },
  {
    id: "ibn-qayyim",
    name: "ابن القيم",
    fullName: "محمد بن أبي بكر بن قيم الجوزية",
    era: "العلماء الكبار",
    specialty: ["عقيدة", "فقه", "أخلاق", "تربية"],
    bio: "تلميذ ابن تيمية الأبرز، عُرف بعمق التحليل ودقة الاستنباط وجمال الأسلوب",
    key_works: ["زاد المعاد", "إغاثة اللهفان", "مدارج السالكين", "الروح"],
    died: "٧٥١ هـ",
    region: "دمشق",
    quote: "القلوب الحية تُحيي بذكر الله كما تُحيي الأرض الميتة بالمطر",
  },
  {
    id: "nawawi",
    name: "الإمام النووي",
    fullName: "يحيى بن شرف النووي",
    era: "العلماء الكبار",
    specialty: ["حديث", "فقه", "لغة"],
    bio: "إمام الشافعية في عصره، ألّف في الحديث والفقه واللغة، عُرف بالزهد والتقوى",
    key_works: ["الأذكار", "رياض الصالحين", "شرح صحيح مسلم", "الأربعون النووية"],
    died: "٦٧٦ هـ",
    region: "نوى (سوريا)",
  },
  {
    id: "ibn-hajar",
    name: "ابن حجر العسقلاني",
    fullName: "أحمد بن علي بن حجر العسقلاني",
    era: "العلماء الكبار",
    specialty: ["حديث", "تاريخ", "رجال"],
    bio: "حافظ العصر، شيخ الإسلام في الحديث، أعظم شراح صحيح البخاري",
    key_works: ["فتح الباري", "الإصابة في تمييز الصحابة", "تهذيب التهذيب"],
    died: "٨٥٢ هـ",
    region: "القاهرة",
  },
  {
    id: "shawkani",
    name: "الشوكاني",
    fullName: "محمد بن علي بن محمد الشوكاني",
    era: "المجددون",
    specialty: ["حديث", "فقه", "أصول"],
    bio: "إمام اليمن في عصره، صاحب نيل الأوطار، جمع بين الحديث والفقه الاستدلالي",
    key_works: ["نيل الأوطار", "إرشاد الفحول", "فتح القدير"],
    died: "١٢٥٠ هـ",
    region: "اليمن",
    quote: "الدليل لا يُعارَض بكثرة القائلين ولا بقِدَم المذاهب",
  },
  // العلماء المعاصرون
  {
    id: "ibn-baz",
    name: "الشيخ ابن باز",
    fullName: "عبد العزيز بن عبد الله بن باز",
    era: "المعاصرون",
    specialty: ["فقه", "عقيدة", "حديث"],
    bio: "مفتي المملكة العربية السعودية السابق، رئيس هيئة كبار العلماء، إمام وقته في الفتوى",
    key_works: ["مجموع الفتاوى", "التحذير من البدع", "نقد القومية العربية"],
    died: "١٤٢٠ هـ",
    region: "السعودية",
    quote: "العلم النافع يورث الخشية والإنابة والتواضع",
  },
  {
    id: "ibn-uthaymeen",
    name: "الشيخ ابن عثيمين",
    fullName: "محمد بن صالح بن محمد العثيمين",
    era: "المعاصرون",
    specialty: ["فقه", "عقيدة", "تفسير"],
    bio: "من أبرز علماء المملكة، عُرف بوضوح الشرح وسعة الاطلاع وربط الفقه بالواقع",
    key_works: ["الشرح الممتع", "القول المفيد", "مجموع الفتاوى"],
    died: "١٤٢١ هـ",
    region: "عنيزة، السعودية",
    quote: "أنعم الله علينا بنعمة الإسلام فاشكروا الله عليها",
  },
  {
    id: "albani",
    name: "الشيخ الألباني",
    fullName: "محمد ناصر الدين الألباني",
    era: "المعاصرون",
    specialty: ["حديث", "فقه"],
    bio: "محدّث العصر، عمل طول حياته على تمييز الصحيح من الضعيف في السنة النبوية",
    key_works: ["سلسلة الأحاديث الصحيحة", "سلسلة الأحاديث الضعيفة", "إرواء الغليل"],
    died: "١٤٢٠ هـ",
    region: "ألبانيا / الأردن",
    quote: "التمسك بالسنة هو الطريق الصحيح المأمون",
  },
  {
    id: "qaradawi",
    name: "الشيخ القرضاوي",
    fullName: "يوسف بن عبد الله القرضاوي",
    era: "المعاصرون",
    specialty: ["فقه", "دعوة", "أصول"],
    bio: "من أبرز العلماء في الفقه الإسلامي المعاصر، اشتُهر بالمنهج الوسطي وفقه الأولويات",
    key_works: ["الحلال والحرام", "فقه الزكاة", "فقه الأولويات", "فتاوى معاصرة"],
    died: "١٤٤٣ هـ",
    region: "مصر / قطر",
    quote: "الإسلام هو الحل، لأنه دين ودنيا وعبادة وسياسة",
  },
  // محدثون بارزون
  {
    id: "tirmidhi",
    name: "الإمام الترمذي",
    fullName: "محمد بن عيسى بن سَوْرة الترمذي",
    era: "المحدثون",
    specialty: ["حديث", "علل", "رجال"],
    bio: "صاحب الجامع الصحيح (سنن الترمذي)، أحد الكتب الستة، اشتُهر بذكر علل الأحاديث وبيان درجاتها وهو منهج فريد في كتب السنة",
    key_works: ["الجامع الصحيح", "الشمائل المحمدية", "العلل الكبير"],
    died: "٢٧٩ هـ",
    region: "ترمذ / خراسان",
    madhhab: "شافعي",
    quote: "ما وضعتُ في كتابي هذا حديثاً إلا وقد أخرجتُه إلى بغداد",
  },
  {
    id: "ibn-majah",
    name: "ابن ماجه",
    fullName: "محمد بن يزيد القزويني",
    era: "المحدثون",
    specialty: ["حديث", "تفسير", "تاريخ"],
    bio: "صاحب سنن ابن ماجه، السادس من الكتب الستة، رحل في طلب الحديث إلى الحجاز والعراق ومصر والشام",
    key_works: ["سنن ابن ماجه", "التاريخ", "تفسير القرآن"],
    died: "٢٧٣ هـ",
    region: "قزوين / إيران",
    quote: "كتبتُ عن رسول الله ﷺ ما لم يكتبه أحد قبلي",
  },
  {
    id: "ghazali",
    name: "الإمام الغزالي",
    fullName: "محمد بن محمد الغزالي الطوسي",
    era: "العلماء الكبار",
    specialty: ["فقه", "أصول", "تصوف", "عقيدة"],
    bio: "حجة الإسلام، أعاد ترتيب أولويات الإسلام في كتابه إحياء علوم الدين، وكان إماماً في الفقه الشافعي والكلام والفلسفة",
    key_works: ["إحياء علوم الدين", "تهافت الفلاسفة", "المستصفى", "المنقذ من الضلال"],
    died: "٥٠٥ هـ",
    region: "طوس / خراسان",
    madhhab: "شافعي",
    quote: "العلم بلا عمل جنون، والعمل بلا علم لا يكون",
  },
  {
    id: "ibn-kathir",
    name: "ابن كثير",
    fullName: "إسماعيل بن عمر بن كثير الدمشقي",
    era: "العلماء الكبار",
    specialty: ["تفسير", "حديث", "تاريخ"],
    bio: "المفسر المحدث المؤرخ، صاحب أشهر تفسير للقرآن الكريم حتى اليوم، تلميذ ابن تيمية وابن الدقيق العيد",
    key_works: ["تفسير القرآن العظيم", "البداية والنهاية", "الباعث الحثيث"],
    died: "٧٧٤ هـ",
    region: "الشام / دمشق",
    madhhab: "شافعي",
    quote: "أصحّ ما يُفسَّر به القرآن القرآنُ ثم السنة ثم أقوال الصحابة",
  },
  {
    id: "ibn-khaldun",
    name: "ابن خلدون",
    fullName: "عبد الرحمن بن محمد بن خلدون",
    era: "العلماء الكبار",
    specialty: ["تاريخ", "فقه", "أصول"],
    bio: "مؤسس علم الاجتماع والتاريخ الحضاري، صاحب المقدمة الشهيرة التي وضع فيها أسساً لفهم ظاهرة العمران البشري",
    key_works: ["المقدمة", "العبر وديوان المبتدأ والخبر", "التعريف بابن خلدون"],
    died: "٨٠٨ هـ",
    region: "تونس / الأندلس / مصر",
    madhhab: "مالكي",
    quote: "التاريخ في ظاهره لا يزيد على الإخبار عن الأيام والدول، وفي باطنه نظر وتحقيق",
  },
  {
    id: "ibn-ashur",
    name: "ابن عاشور",
    fullName: "محمد الطاهر بن محمد ابن عاشور",
    era: "المجددون",
    specialty: ["تفسير", "أصول", "مقاصد"],
    bio: "عَلَم التفسير والمقاصد في القرن العشرين، صاحب التحرير والتنوير، أضخم تفسير عربي حديث في نحو ثلاثين مجلداً",
    key_works: ["التحرير والتنوير", "مقاصد الشريعة الإسلامية", "أصول النظام الاجتماعي في الإسلام"],
    died: "١٣٩٣ هـ",
    region: "تونس",
    madhhab: "مالكي",
    quote: "الشريعة كلها مبنية على تحقيق مصالح العباد في العاجل والآجل",
  },
  {
    id: "fawzan",
    name: "الشيخ صالح الفوزان",
    fullName: "صالح بن فوزان بن عبد الله الفوزان",
    era: "المعاصرون",
    specialty: ["فقه", "عقيدة", "فتوى"],
    bio: "عضو هيئة كبار العلماء في المملكة العربية السعودية، من أبرز مراجع الفتوى المعاصرة في العقيدة والفقه",
    key_works: ["الملخص الفقهي", "إعانة المستفيد بشرح كتاب التوحيد", "الأطعمة وأحكام الصيد والذبائح"],
    died: "—",
    region: "المملكة العربية السعودية",
    quote: "العلم الشرعي فريضة، والجهل به خطر على الفرد والمجتمع",
  },
  {
    id: "al-suyuti",
    name: "الإمام السيوطي",
    fullName: "جلال الدين عبد الرحمن السيوطي",
    era: "العلماء الكبار",
    specialty: ["تفسير", "حديث", "فقه", "لغة"],
    bio: "من أغزر العلماء تأليفاً في تاريخ الإسلام، ادّعى الاجتهاد المطلق، وصنّف في كل فنون الإسلام ما يتجاوز ستمائة مصنف",
    key_works: ["الإتقان في علوم القرآن", "الجامع الصغير", "الدر المنثور", "جمع الجوامع"],
    died: "٩١١ هـ",
    region: "مصر / القاهرة",
    madhhab: "شافعي",
    quote: "أهل الحديث حملة الإسلام والمدافعون عنه إلى يوم القيامة",
  },
];

const ERAS = ["الكل", "الأئمة الأربعة", "المحدثون", "العلماء الكبار", "المجددون", "المعاصرون"];
const SPECIALTIES = ["الكل", "فقه", "حديث", "عقيدة", "تفسير", "أصول"];

export default function IslamicScholarsPage() {
  const [era, setEra] = useState("الكل");
  const [specialty, setSpecialty] = useState("الكل");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/scholars",
      title: "أعلام الإسلام، العلماء والمحدثون والفقهاء | مجالس",
      description: "سِيَر أبرز علماء الإسلام عبر القرون، الأئمة الأربعة، المحدثون، العلماء المعاصرون",
    });
  }, []);

  const filtered = SCHOLARS.filter(s => {
    const matchEra = era === "الكل" || s.era === era;
    const matchSpec = specialty === "الكل" || s.specialty.includes(specialty);
    const q = query.trim();
    const matchQ = !q ||
      s.name.includes(q) ||
      s.fullName.includes(q) ||
      s.bio.includes(q) ||
      s.specialty.some(sp => sp.includes(q));
    return matchEra && matchSpec && matchQ;
  });

  return (
    <div className="sch-page" dir="rtl">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="sch-hero">
        <h1 className="sch-hero__title">أعلام الإسلام</h1>
        <p className="sch-hero__sub">
          سِيَر أبرز علماء الإسلام عبر القرون، الأئمة الأربعة والمحدثون والعلماء المعاصرون
        </p>
        <div className="sch-hero__stats">
          <span><strong>{SCHOLARS.length}</strong> عالماً</span>
          <span><strong>{ERAS.length - 1}</strong> حقبة</span>
          <span><strong>١٤٠٠</strong> سنة من العلم</span>
        </div>
      </section>

      {/* ── بحث وتصفية ────────────────────────────────────────── */}
      <div className="sch-controls">
        <div className="sch-search-wrap">
          <Search size={16} className="sch-search-icon" />
          <input
            className="sch-search-input"
            type="search"
            placeholder="ابحث في العلماء..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="sch-filters">
          <div className="sch-filter-group">
            <Filter size={13} />
            <span>الحقبة:</span>
            {ERAS.map(e => (
              <button
                key={e}
                type="button"
                className={["sch-filter-btn", era === e ? "sch-filter-btn--active" : ""].join(" ")}
                onClick={() => setEra(e)}
                aria-pressed={era === e}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="sch-filter-group">
            <span>التخصص:</span>
            {SPECIALTIES.map(s => (
              <button
                key={s}
                type="button"
                className={["sch-filter-btn", specialty === s ? "sch-filter-btn--active" : ""].join(" ")}
                onClick={() => setSpecialty(s)}
                aria-pressed={specialty === s}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── نتيجة البحث ────────────────────────────────────────── */}
      <p className="sch-results-count" aria-live="polite" aria-atomic="true">
        {filtered.length === SCHOLARS.length
          ? `${SCHOLARS.length} عالماً`
          : `${filtered.length} من ${SCHOLARS.length} عالماً`}
      </p>

      {/* ── شبكة العلماء ──────────────────────────────────────── */}
      <div className="sch-grid">
        {filtered.map(s => {
          const isOpen = expanded === s.id;
          return (
            <article key={s.id} className={["sch-card", isOpen ? "sch-card--open" : ""].join(" ")}>
              <div className="sch-card__header" role="button" tabIndex={0}
                onClick={() => setExpanded(isOpen ? null : s.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setExpanded(isOpen ? null : s.id)}
                aria-expanded={isOpen} aria-controls={`sch-body-${s.id}`}>
                <div className="sch-card__avatar">
                  <span className="sch-card__initial">{s.name[0]}</span>
                </div>
                <div className="sch-card__meta">
                  <h2 className="sch-card__name">{s.name}</h2>
                  <p className="sch-card__fullname">{s.fullName}</p>
                  <div className="sch-card__tags">
                    {s.specialty.map(sp => (
                      <span key={sp} className="sch-tag">{sp}</span>
                    ))}
                    {s.madhhab && <span className="sch-tag sch-tag--madhhab">{s.madhhab}</span>}
                  </div>
                </div>
                <div className="sch-card__right">
                  <span className="sch-card__era">{s.era}</span>
                  <span className="sch-card__died">ت {s.died}</span>
                </div>
              </div>

              <p className="sch-card__bio">{s.bio}</p>

              {isOpen && (
                <div id={`sch-body-${s.id}`} className="sch-card__details">
                  {s.quote && (
                    <blockquote className="sch-card__quote">
                      <Star size={14} className="sch-card__quote-icon" />
                      «{s.quote}»
                    </blockquote>
                  )}
                  <div className="sch-card__works">
                    <h3 className="sch-card__works-title">
                      <BookOpen size={14} /> أبرز المؤلفات
                    </h3>
                    <ul className="sch-card__works-list">
                      {s.key_works.map(w => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </div>
                  <p className="sch-card__region">📍 {s.region}</p>
                  <button type="button" className="sch-card__close" onClick={() => setExpanded(null)}>
                    إغلاق التفاصيل
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="sch-empty">
          <Search size={40} />
          <p>لا توجد نتائج للبحث عن «{query}»</p>
          <button type="button" onClick={() => { setQuery(""); setEra("الكل"); setSpecialty("الكل"); }}>
            مسح التصفية
          </button>
        </div>
      )}

      {/* ── روابط ذات صلة ─────────────────────────────────────── */}
      <div className="twh-share">
        <ShareButtons title="العلماء المسلمون — المجلس العلمي" url="https://majlisilm.com/scholars" />
      </div>

      <div className="sch-related">
        <Link href="/lessons" className="sch-related-link">
          <BookOpen size={16} /> دروس المشايخ <ChevronLeft size={14} />
        </Link>
        <Link href="/knowledge-map" className="sch-related-link">
          <Star size={16} /> الخريطة المعرفية <ChevronLeft size={14} />
        </Link>
        <Link href="/library" className="sch-related-link">
          <BookOpen size={16} /> المكتبة الإسلامية <ChevronLeft size={14} />
        </Link>
      </div>
    </div>
  );
}
