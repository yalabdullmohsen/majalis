import { SectionIcon } from "@/components/ui/SectionIcon";
import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, Sparkles, Star } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

/* ─── بيانات أركان الإسلام ─── */
type Rukn = {
  num: number;
  numAr: string;
  title: string;
  subtitle: string;
  icon: string;
  summary: string;
  dalilQuran: { text: string; ref: string }[];
  dalilHadith: { text: string; source: string }[];
  details: { label: string; body: string }[];
  scholarQuote: { text: string; scholar: string };
  color: string;
};

const ARKAN: Rukn[] = [
  {
    num: 1,
    numAr: "الأول",
    title: "شهادة أن لا إله إلا الله وأن محمداً رسول الله",
    subtitle: "أساس الدين ومفتاح الجنة",
    icon: "☝️",
    summary: "الشهادتان هما أول أركان الإسلام وأعظمها، وهما كلمة التوحيد التي لا يُقبل إسلام أحد بدونها. وهي إقرار باللسان واعتقاد بالقلب وعمل بالجوارح.",
    dalilQuran: [
      { text: "فَاعْلَمْ أَنَّهُ لَا إِلَٰهَ إِلَّا اللَّهُ وَاسْتَغْفِرْ لِذَنبِكَ", ref: "محمد: 19" },
      { text: "شَهِدَ اللَّهُ أَنَّهُ لَا إِلَٰهَ إِلَّا هُوَ وَالْمَلَائِكَةُ وَأُولُو الْعِلْمِ", ref: "آل عمران: 18" },
    ],
    dalilHadith: [
      { text: "بُنِيَ الإسلام على خمس: شهادة أن لا إله إلا الله وأن محمداً رسول الله...", source: "متفق عليه" },
      { text: "من شهد أن لا إله إلا الله وحده لا شريك له وأن محمداً عبده ورسوله، وأن عيسى عبد الله...", source: "رواه البخاري" },
    ],
    details: [
      { label: "معنى لا إله إلا الله", body: "نفي الألوهية عن كل ما سوى الله، وإثباتها لله وحده. فـ«لا إله» نفي، «إلا الله» إثبات." },
      { label: "شروط الشهادة السبعة", body: "العلم · اليقين · القبول · الانقياد · الصدق · الإخلاص · المحبة." },
      { label: "نواقض الشهادة", body: "الشرك بالله · إنكار الرسالة · استحلال المحرمات · الردة، نعوذ بالله من ذلك." },
      { label: "ثمرات الشهادتين في الحياة", body: "الشهادتان تُفضيان إلى: راحة النفس بالتوكل على الله، والعدل في التعامل إذ لا يُرى غير الله، وتحرير الإنسان من العبودية للأهواء والبشر والمادة." },
    ],
    scholarQuote: { text: "لا إله إلا الله كلمة يتضمن إثباتها ونفيها توحيد الله في ربوبيته وألوهيته وأسمائه وصفاته.", scholar: "ابن تيمية" },
    color: "#176B57",
  },
  {
    num: 2,
    numAr: "الثاني",
    title: "إقامة الصلاة",
    subtitle: "عمود الدين وصلة العبد بربه",
    icon: "🕌",
    summary: "الصلاة هي الركن الثاني من أركان الإسلام، وهي أول ما يُسأل عنه العبد يوم القيامة. وهي الصلة المباشرة بين العبد وربه. وتُقام خمس مرات في اليوم والليلة.",
    dalilQuran: [
      { text: "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَارْكَعُوا مَعَ الرَّاكِعِينَ", ref: "البقرة: 43" },
      { text: "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا", ref: "النساء: 103" },
    ],
    dalilHadith: [
      { text: "الصلوات الخمس والجمعة إلى الجمعة كفارة لما بينهن ما اجتُنبت الكبائر.", source: "رواه مسلم" },
      { text: "أول ما يُحاسَب به العبد يوم القيامة الصلاة، فإن صلحت صلح سائر عمله.", source: "رواه النسائي" },
    ],
    details: [
      { label: "الصلوات الخمس المفروضة", body: "الفجر (2) · الظهر (4) · العصر (4) · المغرب (3) · العشاء (4)، جمعاً 17 ركعة." },
      { label: "شروط صحة الصلاة", body: "الإسلام · العقل · البلوغ · دخول الوقت · الطهارة · استقبال القبلة · ستر العورة · النية." },
      { label: "فضل الصلاة في المسجد", body: "الصلاة في المسجد تفضل صلاة البيت بسبع وعشرين درجة، متفق عليه." },
      { label: "قضاء الصلاة وأحوالها", body: "تُجمع الصلاة في السفر والمرض. وتُقصَر رباعية الركعات إلى ركعتين في السفر. وتُصلَّى قاعداً إن تعذَّر القيام. ولا يسقط فرضها عن المسلم بأي عذر." },
    ],
    scholarQuote: { text: "الصلاة معراج المؤمنين، وإقامتها على وجهها تُصلح باقي الأعمال.", scholar: "الإمام النووي" },
    color: "#123F36",
  },
  {
    num: 3,
    numAr: "الثالث",
    title: "إيتاء الزكاة",
    subtitle: "ركيزة التكافل الاجتماعي في الإسلام",
    icon: "💰",
    summary: "الزكاة هي الركن الثالث من أركان الإسلام، وهي حق الفقراء في أموال الأغنياء. وهي تطهير للمال والنفس، وفيها تحقيق للتكافل الاجتماعي. وقد قرنها القرآن بالصلاة في 82 موضعاً.",
    dalilQuran: [
      { text: "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَمَا تُقَدِّمُوا لِأَنفُسِكُم مِّنْ خَيْرٍ تَجِدُوهُ عِندَ اللَّهِ", ref: "البقرة: 110" },
      { text: "خُذْ مِنْ أَمْوَالِهِمْ صَدَقَةً تُطَهِّرُهُمْ وَتُزَكِّيهِم بِهَا", ref: "التوبة: 103" },
    ],
    dalilHadith: [
      { text: "ما نقصت صدقة من مال، ومن تواضع لله رفعه الله.", source: "رواه مسلم" },
      { text: "ما من صاحب ذهب ولا فضة لا يؤدي منها حقها إلا إذا كان يوم القيامة صُفِّحَت له صفائح.", source: "رواه مسلم" },
    ],
    details: [
      { label: "شروط وجوب الزكاة", body: "الإسلام · الحرية · ملك النصاب · حولان الحول · عدم الدين المحيط." },
      { label: "أنواع الزكاة", body: "زكاة الذهب والفضة · زكاة عروض التجارة · زكاة الزروع والثمار · زكاة الأنعام · زكاة الفطر." },
      { label: "مصارف الزكاة", body: "الفقراء · المساكين · العاملون عليها · المؤلفة قلوبهم · في الرقاب · الغارمون · في سبيل الله · ابن السبيل." },
      { label: "أثر الزكاة في المجتمع", body: "الزكاة تُوثِّق أواصر الأخوة الإسلامية وتُقلِّص الفقر، وقد بلغت في عهد عمر بن عبد العزيز حدَّها من الانتشار حتى عَزَّ وجود الفقير الذي يقبلها." },
    ],
    scholarQuote: { text: "الزكاة قنطرة الإسلام، فمن عبرها كان في الجنة ومن تخلف عنها هلك.", scholar: "أبو بكر الصديق" },
    color: "#126650",
  },
  {
    num: 4,
    numAr: "الرابع",
    title: "صوم رمضان",
    subtitle: "شهر القرآن والرحمة والمغفرة",
    icon: "🌙",
    summary: "صيام رمضان هو الركن الرابع من أركان الإسلام. وهو شهر كريم خصّه الله بنزول القرآن الكريم، وفُرض الصيام في السنة الثانية من الهجرة. وفيه تضاعف الأجور وتُفتح أبواب الجنة.",
    dalilQuran: [
      { text: "يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ كَمَا كُتِبَ عَلَى الَّذِينَ مِن قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ", ref: "البقرة: 183" },
      { text: "شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ هُدًى لِّلنَّاسِ", ref: "البقرة: 185" },
    ],
    dalilHadith: [
      { text: "من صام رمضان إيماناً واحتساباً غُفر له ما تقدم من ذنبه.", source: "متفق عليه" },
      { text: "إذا جاء رمضان فُتِّحت أبواب الجنة وغُلِّقت أبواب النار وصُفِّدت الشياطين.", source: "متفق عليه" },
    ],
    details: [
      { label: "شروط وجوب الصيام", body: "الإسلام · العقل · البلوغ · الإقامة (القدرة) · الصحة، ويُقضى على المريض والمسافر." },
      { label: "مبطلات الصيام", body: "الأكل والشرب عمداً · الجماع · الاستقاء · الحيض والنفاس · الردة." },
      { label: "فضائل خاصة برمضان", body: "ليلة القدر خير من ألف شهر · مضاعفة الأجر · إجابة الدعاء عند الإفطار · العمرة فيه كالحج." },
      { label: "الاعتكاف وإحياء العشر الأواخر", body: "كان النبي ﷺ يعتكف العشر الأواخر من رمضان حتى وفاته، ويتحرَّى ليلة القدر في الوتر منها. والاعتكاف سنة مؤكدة يُستحب فيها التفرغ للعبادة في المسجد." },
    ],
    scholarQuote: { text: "رمضان موسم الطاعات، فأكثِر فيه من القرآن والذكر والصدقة، واجعله بداية التحول.", scholar: "ابن القيم" },
    color: "#052E16",
  },
  {
    num: 5,
    numAr: "الخامس",
    title: "حج بيت الله الحرام",
    subtitle: "التوحيد العملي ورحلة الروح",
    icon: "🕋",
    summary: "الحج هو الركن الخامس من أركان الإسلام، وهو فريضة على المستطيع مرة واحدة في العمر. وهو جامع لجميع أنواع العبادة: صلاة ودعاء وذكر وطواف وسعياً وقربة. وفيه يلتقي المسلمون من أنحاء العالم.",
    dalilQuran: [
      { text: "وَلِلَّهِ عَلَى النَّاسِ حِجُّ الْبَيْتِ مَنِ اسْتَطَاعَ إِلَيْهِ سَبِيلًا", ref: "آل عمران: 97" },
      { text: "وَأَذِّن فِي النَّاسِ بِالْحَجِّ يَأْتُوكَ رِجَالًا وَعَلَىٰ كُلِّ ضَامِرٍ يَأْتِينَ مِن كُلِّ فَجٍّ عَمِيقٍ", ref: "الحج: 27" },
    ],
    dalilHadith: [
      { text: "من حج هذا البيت فلم يرفث ولم يفسق رجع كيوم ولدته أمه.", source: "متفق عليه" },
      { text: "العمرة إلى العمرة كفارة لما بينهما، والحج المبرور ليس له جزاء إلا الجنة.", source: "رواه مسلم" },
    ],
    details: [
      { label: "شروط وجوب الحج", body: "الإسلام · العقل · البلوغ · الحرية · الاستطاعة (المالية والجسدية وأمن الطريق)." },
      { label: "أركان الحج", body: "الإحرام · الوقوف بعرفة · طواف الإفاضة · السعي بين الصفا والمروة." },
      { label: "واجبات الحج", body: "الإحرام من الميقات · الوقوف بعرفة حتى الغروب · المبيت بمزدلفة · رمي الجمرات · الحلق · طواف الوداع." },
      { label: "الحج والعمرة والفرق بينهما", body: "العمرة تُؤدَّى في أي وقت، وأركانها: الإحرام والطواف والسعي والحلق. أما الحج فله مواقيت محددة في ذي الحجة، وهو أكمل وأشمل. ويمكن الجمع بينهما في الحج القِران أو التمتع." },
    ],
    scholarQuote: { text: "الحج مؤتمر إسلامي سنوي يجمع المسلمين على كلمة التوحيد ويذكّرهم بيوم القيامة.", scholar: "الإمام الشافعي" },
    color: "#176B57",
  },
];

export default function ArkanIslamPage() {
  const [expanded, setExpanded] = useState<number | null>(1);
  const todayRukn = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const day = Math.floor((now.getTime() - start.getTime()) / 86400000);
    return ARKAN[(day - 1 + ARKAN.length) % ARKAN.length];
  }, []);

  useEffect(() => {
    applyPageSeo({
      path: "/arkan",
      title: "أركان الإسلام الخمسة | مجالس",
      description: "شرح تفصيلي لأركان الإسلام الخمسة: الشهادتان، الصلاة، الزكاة، الصوم، الحج، مع الأدلة وأقوال العلماء.",
      keywords: ["أركان الإسلام", "الشهادتان", "الصلاة", "الزكاة", "رمضان", "الحج"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "أركان الإسلام الخمسة",
          description: "شرح أركان الإسلام الخمسة بالأدلة وأقوال العلماء",
          numberOfItems: ARKAN.length,
          itemListElement: ARKAN.map((r, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: r.title,
            url: `https://majlisilm.com/arkan#rukn-${r.num}`,
          })),
        },
      ],
    });
  }, []);

  return (
    <div className="page-shell arkan-page">
      {/* ═══ Hero ═══ */}
      <div className="arkan-hero">
        <div className="arkan-hero__hadith">
          «بُنِيَ الإِسْلَامُ عَلَى خَمْسٍ»
        </div>
        <h1 className="arkan-hero__title">أركان الإسلام الخمسة</h1>
        <p className="arkan-hero__sub">
          شرح تفصيلي بالأدلة من القرآن والسنة وأقوال العلماء
        </p>
        <div className="arkan-hero__icons">
          {ARKAN.map((r) => (
            <button
              key={r.num}
              type="button"
              className={`arkan-hero__icon-btn${expanded === r.num ? " is-active" : ""}`}
              onClick={() => setExpanded(expanded === r.num ? null : r.num)}
              title={r.title}
            >
              <span className="arkan-hero__icon-emoji"><SectionIcon name={r.icon} size={28} /></span>
              <span className="arkan-hero__icon-num">{r.numAr}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ركن الإسلام اليوم */}
      <div className="arod-card">
        <div className="arod-card__badge"><Sparkles size={11} aria-hidden="true" /> ركن الإسلام اليوم</div>
        <span className="arod-card__icon"><SectionIcon name={todayRukn.icon} size={28} /></span>
        <div className="arod-card__num">الركن {todayRukn.numAr}</div>
        <h2 className="arod-card__title">{todayRukn.title}</h2>
        <p className="arod-card__sub">{todayRukn.subtitle}</p>
        <p className="arod-card__summary">{todayRukn.summary}</p>
        <p className="arod-card__quote">«{todayRukn.scholarQuote.text}»<span className="arod-card__scholar"> — {todayRukn.scholarQuote.scholar}</span></p>
      </div>

      {/* ═══ الأركان ═══ */}
      <div className="arkan-list">
        {ARKAN.map((r) => {
          const open = expanded === r.num;
          return (
            <article key={r.num} className={`arkan-card${open ? " arkan-card--open" : ""}`}>
              <button
                type="button"
                className="arkan-card__header"
                onClick={() => setExpanded(open ? null : r.num)}
                aria-expanded={open}
              >
                <span className="arkan-card__emoji" aria-hidden="true"><SectionIcon name={r.icon} size={26} /></span>
                <div className="arkan-card__info">
                  <span className="arkan-card__num">الركن {r.numAr}</span>
                  <h2 className="arkan-card__title">{r.title}</h2>
                  <span className="arkan-card__sub">{r.subtitle}</span>
                </div>
                <span className="arkan-card__chevron" aria-hidden="true">
                  {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </button>

              <p className="arkan-card__summary">{r.summary}</p>

              {open && (
                <div className="arkan-card__body">
                  {/* الأدلة القرآنية */}
                  <div className="arkan-section">
                    <h3 className="arkan-section__title">الأدلة القرآنية</h3>
                    <div className="arkan-dalil-list">
                      {r.dalilQuran.map((d) => (
                        <div key={d.ref} className="arkan-dalil arkan-dalil--quran">
                          <p className="arkan-dalil__text">﴿{d.text}﴾</p>
                          <span className="arkan-dalil__ref">{d.ref}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* الأحاديث */}
                  <div className="arkan-section">
                    <h3 className="arkan-section__title">من السنة النبوية</h3>
                    <div className="arkan-dalil-list">
                      {r.dalilHadith.map((h) => (
                        <div key={h.source} className="arkan-dalil arkan-dalil--hadith">
                          <p className="arkan-dalil__text">«{h.text}»</p>
                          <span className="arkan-dalil__ref">{h.source}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* التفاصيل الفقهية */}
                  <div className="arkan-section">
                    <h3 className="arkan-section__title">معلومات فقهية</h3>
                    <div className="arkan-details">
                      {r.details.map((d) => (
                        <div key={d.label} className="arkan-detail">
                          <span className="arkan-detail__label">{d.label}</span>
                          <p className="arkan-detail__body">{d.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* قول عالم */}
                  <div className="arkan-scholar">
                    <Star size={13} className="arkan-scholar__icon" aria-hidden="true" />
                    <blockquote className="arkan-scholar__quote">«{r.scholarQuote.text}»</blockquote>
                    <span className="arkan-scholar__name">— {r.scholarQuote.scholar}</span>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* روابط ذات صلة */}
      <div className="arkan-related">
        <h2 className="arkan-related__title">استكشف أيضاً</h2>
        <div className="arkan-related__grid">
          {[
            { href: "/arkan-iman", label: "أركان الإيمان الستة" },
            { href: "/tawhid",     label: "التوحيد والعقيدة" },
            { href: "/asma-husna", label: "الأسماء الحسنى" },
            { href: "/akhlaq",     label: "الأخلاق الإسلامية" },
            { href: "/duas",       label: "الأدعية الشرعية" },
            { href: "/prayer-ranks", label: "فضائل الصلاة" },
            { href: "/hadith",     label: "الأحاديث النبوية" },
            { href: "/rulings",    label: "الأحكام الشرعية" },
            { href: "/fiqh",       label: "الفقه الإسلامي" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="arkan-related__link">
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div className="zk-share">
        <ShareButtons title="أركان الإسلام الخمسة — المجلس العلمي" url="https://majlisilm.com/arkan-islam" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["fiqh", "aqeeda"]} title="اختبر معلوماتك في أركان الإسلام" count={4} />
      </div>
    </div>
  );
}
