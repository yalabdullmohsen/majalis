import { useEffect, useState, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { applyPageSeo } from "../lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { SectionIcon } from "@/components/ui/SectionIcon";


type TaharaTab = "wudu" | "ghusl" | "tayammum" | "najasat";

/* ── Wudu ── */
const WUDU_FARDH = [
  { num: "١", icon: "🤲", title: "النية", desc: "نية الوضوء في القلب لرفع الحدث" },
  { num: "٢", icon: "💦", title: "غسل الوجه", desc: "من منابت شعر الرأس إلى الذقن طولاً، ومن أذن إلى أذن عرضاً" },
  { num: "٣", icon: "🖐️", title: "غسل اليدين", desc: "مع المرفقين من رؤوس الأصابع إلى المرفقين" },
  { num: "٤", icon: "🧠", title: "مسح الرأس", desc: "مسح كامل الرأس مرة واحدة عند الجمهور" },
  { num: "٥", icon: "🦶", title: "غسل القدمين", desc: "مع الكعبين من رؤوس الأصابع إلى الكعبين" },
  { num: "٦", icon: "⬇️", title: "الترتيب", desc: "الترتيب بين الأعضاء كما جاء في الآية الكريمة" },
];

const WUDU_SUNNAH = [
  "التسمية (بسم الله) في أوله",
  "غسل الكفين ثلاثاً في البداية",
  "المضمضة والاستنشاق والاستنثار",
  "تثليث غسل الأعضاء (ثلاث مرات)",
  "البدء باليمين قبل اليسار",
  "التخليل بين الأصابع",
  "مسح الأذنين ظاهراً وباطناً",
  "قول الشهادتين بعد الانتهاء",
  "الموالاة (عدم التفريق بين الأعضاء)",
  "الدعاء بعد الوضوء: أشهد أن لا إله إلا الله وحده لا شريك له، اللهم اجعلني من التوابين",
  "استخدام السواك قبل الوضوء أو عند المضمضة تأسياً بالنبي ﷺ",
  "الابتداء بأعلى الوجه عند غسله ومن رؤوس الأصابع عند غسل اليدين والقدمين",
  "إمرار الإصبع الصغيرة في باطن الأذنين عند مسحهما",
  "إدارة خاتم الإصبع لإيصال الماء تحته إن كان واسعاً",
  "تجديد الوضوء لكل صلاة استحباباً إن كان على وضوء",
  "إتباع الوضوء بصلاة ركعتين: «من توضأ نحو وضوئي ثم صلى ركعتين لا يُحدِّث فيهما نفسه غُفر له ما تقدَّم من ذنبه» — البخاري",
  "تفضيل الاقتصاد في الماء وعدم الإسراف فيه اقتداءً بالنبي ﷺ الذي كان يتوضأ بالمُدّ",
  "المسح على الخفين للمقيم يوماً وليلة وللمسافر ثلاثة أيام ولياليهن بدلاً من غسل القدمين",
];

const WUDU_NAWAQIDH = [
  { icon: "💨", title: "خروج الريح", desc: "من الدبر صوتاً أو بلا صوت" },
  { icon: "🚽", title: "خروج البول أو الغائط", desc: "من القبل أو الدبر" },
  { icon: "💤", title: "النوم المستغرق", desc: "النوم الثقيل الذي يزيل الشعور، أما النعاس اليسير فلا ينقض" },
  { icon: "😵", title: "زوال العقل", desc: "الإغماء أو الجنون أو السكر" },
  { icon: "👄", title: "لمس الفرج", desc: "باليد مباشرة بشهوة أو بلا شهوة عند الجمهور" },
  { icon: "🔥", title: "أكل لحم الإبل", desc: "عند الحنابلة، وهو قول لبعض أهل العلم بدليل صحيح" },
  { icon: "🩸", title: "الفصد والحجامة وخروج الدم الكثير", desc: "يرى الحنفية والحنابلة أن خروج الدم الكثير من الجرح ينقض الوضوء، ويرى الشافعية والمالكية أنه لا ينقض مطلقاً" },
  { icon: "🤮", title: "القيء الكثير الملء", desc: "يرى الحنفية أن القيء الكثير ينقض الوضوء لحديث معاوية، ويذهب الجمهور إلى أنه لا ينقض" },
  { icon: "🩹", title: "لمس الأجنبية عند الشافعية", desc: "يرى الشافعية أن مسَّ المرأة الأجنبية ينقض الوضوء مطلقاً، ويرى المالكية: إن كان بشهوة نقض، وذهب الحنفية والحنابلة إلى أنه لا ينقض إلا بالإنزال" },
];

/* ── Ghusl ── */
const GHUSL_MUJIBAT = [
  { icon: "🌙", title: "الجنابة", desc: "بإنزال المني أو الجماع، وهي أعظم موجبات الغسل" },
  { icon: "🌸", title: "انقطاع الحيض", desc: "يجب على المرأة الغسل بعد انقطاع دم الحيض" },
  { icon: "🤱", title: "انقطاع النفاس", desc: "يجب الغسل بعد انتهاء دم النفاس" },
  { icon: "☠️", title: "الموت", desc: "يُغسَّل الميت المسلم قبل الصلاة عليه" },
  { icon: "☪️", title: "الإسلام", desc: "يُستحب الغسل عند الإسلام وإن قيل بوجوبه" },
  { icon: "💤", title: "الاحتلام", desc: "إذا استيقظ وأيقن خروج المني وجب الغسل، وإن احتلم ولم يجد بللاً فلا غسل عليه" },
  { icon: "🤰", title: "الولادة", desc: "يجب الغسل على المرأة بعد الولادة حتى وإن لم يعقبها دم نفاس عند جمهور العلماء" },
];

const GHUSL_FARAIDH = [
  { icon: "💭", title: "النية", desc: "نية رفع الجنابة أو الحدث الأكبر" },
  { icon: "💧", title: "التعميم بالماء", desc: "إفاضة الماء على جميع البدن حتى يصل إلى كل جزء" },
];

const GHUSL_SIFAT = [
  "يبدأ بغسل اليدين والاستنجاء",
  "ثم يتوضأ وضوءاً كاملاً كوضوء الصلاة",
  "يُفيض الماء على رأسه ثلاثاً",
  "ثم يُفيض على شقه الأيمن ثم الأيسر",
  "يدلك بدنه جيداً ويُخلل الشعر",
  "يغسل رجليه إن لم يغسلهما في الوضوء",
  "يتأكد من وصول الماء إلى أصول الشعر والآباط والخلف وسُرَّة البطن",
  "يُستحب استخدام الصابون أو الخِطمي لإزالة الأدران والدهون التي تمنع وصول الماء",
];

/* ── Tayammum ── */
const TAYAMMUM_IBAHA = [
  { icon: "🏜️", title: "عدم الماء", desc: "إذا عُدم الماء أو كان بعيداً لا يصل إليه" },
  { icon: "🏥", title: "المرض", desc: "إذا خاف أن يضره استعمال الماء بسبب مرض أو برد شديد" },
  { icon: "⏰", title: "ضيق الوقت", desc: "إذا خاف خروج وقت الصلاة لو اشتغل بطلب الماء عند بعض العلماء" },
  { icon: "⚕️", title: "الجرح أو الكسر", desc: "إذا كان في بعض أعضائه جرح أو كسر يضره الماء" },
  { icon: "❄️", title: "البرد الشديد", desc: "إذا خشي المصلي الضرر من استعمال الماء البارد عند عدم إمكانية تسخينه، يجوز له التيمم عند جمهور العلماء" },
  { icon: "🚰", title: "الحاجة إلى الماء للشرب", desc: "إذا كان الماء الموجود محتاجاً إليه للشرب أو لعطش حيوان محترم، قُدِّم حق الآدمي أو الحيوان وجاز التيمم للصلاة" },
  { icon: "🔒", title: "تعذُّر استعمال الماء بحكم شرعي", desc: "كالمرأة المحرمة التي أصابتها الجنابة وخافت الضرر من برد الماء، أو المريض الذي نهاه الطبيب عن مس الماء" },
];

const TAYAMMUM_KAYFIYYA = [
  { num: "١", step: "النية", desc: "نية التيمم لاستباحة الصلاة" },
  { num: "٢", step: "التسمية", desc: "قول بسم الله" },
  { num: "٣", step: "ضرب الأرض", desc: "ضربة واحدة بباطن الكفين على الصعيد الطاهر" },
  { num: "٤", step: "المسح على الوجه", desc: "مسح الوجه كاملاً بباطن الكفين" },
  { num: "٥", step: "مسح اليدين", desc: "مسح ظاهر اليد اليسرى باليمنى والعكس إلى الرسغين" },
];

/* ── Najasat ── */
const NAJASAT_ITEMS = [
  {
    type: "mughallaza",
    label: "نجاسة مغلظة",
    color: "red",
    items: [
      { icon: "🐶", title: "لعاب الكلب", desc: "يُغسَّل المحل سبع مرات إحداها بالتراب عند الشافعية والحنابلة" },
      { icon: "🐷", title: "الخنزير", desc: "يُحكم بنجاسة ذاته وما يتصل بها من رطوبة" },
    ],
  },
  {
    type: "mukhaffafa",
    label: "نجاسة مخففة",
    color: "amber",
    items: [
      { icon: "👶", title: "بول الرضيع الذكر", desc: "يكفي نضحه (رشّه بالماء) دون حاجة لغسل، الذكر الذي لم يأكل الطعام" },
    ],
  },
  {
    type: "mutawassita",
    label: "النجاسة المعتادة",
    color: "orange",
    items: [
      { icon: "🩸", title: "الدم السائل والقيح", desc: "يُعفى عن يسيره، ويُغسل الكثير منه" },
      { icon: "🚽", title: "البول والغائط", desc: "من الآدمي وغيره من الحيوانات التي لا يؤكل لحمها" },
      { icon: "🐄", title: "ميتة الحيوانات", desc: "ما عدا السمك والجراد والشهيد في سبيل الله" },
      { icon: "🍺", title: "الخمر السائل", desc: "نجس عند الجمهور، ويطهر بتخليله إلى خل" },
      { icon: "💦", title: "المذي والودي", desc: "المذي: ماء رقيق أبيض يخرج عند الشهوة، والودي: ماء أبيض ثخين بعد البول، كلاهما نجس يوجب الوضوء لا الغسل" },
      { icon: "🐾", title: "روث ما لا يؤكل وبوله", desc: "بول وروث الحيوان الذي لا يؤكل لحمه نجس عند الجمهور كالحمار والبغل والقطط، وما يؤكل لحمه فيه خلاف مشهور" },
    ],
  },
];

const TABS: { id: TaharaTab; label: string; icon: string }[] = [
  { id: "wudu", label: "الوضوء", icon: "💧" },
  { id: "ghusl", label: "الغسل", icon: "🚿" },
  { id: "tayammum", label: "التيمم", icon: "🏜️" },
  { id: "najasat", label: "النجاسات", icon: "⚠️" },
];

export default function TaharaPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/tahara",
      title: "الطهارة وأحكامها، المجلس العلمي",
      description: "دليل شامل لأحكام الطهارة: الوضوء والغسل والتيمم وأنواع المياه والنجاسات",
      keywords: ["الطهارة", "الوضوء", "الغسل", "التيمم", "أحكام الطهارة", "الفقه"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "فرائض الوضوء",
          description: "فرائض الوضوء الستة مع الأدلة والأحكام",
          numberOfItems: WUDU_FARDH.length,
          itemListElement: WUDU_FARDH.map((w, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${w.num}: ${w.title} — ${w.desc}`,
            url: `https://majlisilm.com/tahara#wudu-fardh-${i + 1}`,
          })),
        },
      ],
    });
  }, []);

  const todayFardh = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const day = Math.floor((now.getTime() - start.getTime()) / 86400000);
    return WUDU_FARDH[(day - 1 + WUDU_FARDH.length) % WUDU_FARDH.length];
  }, []);
  const [tab, setTab] = useState<TaharaTab>("wudu");
  const [search, setSearch] = useState("");
  const filteredWuduNawaqidh = useMemo(() =>
    search.trim() ? WUDU_NAWAQIDH.filter(n => arabicMatchAny([n.title, n.desc], search)) : WUDU_NAWAQIDH,
  [search]);
  const filteredGhusulMujibat = useMemo(() =>
    search.trim() ? GHUSL_MUJIBAT.filter(m => arabicMatchAny([m.title, m.desc], search)) : GHUSL_MUJIBAT,
  [search]);
  const filteredTayammumIbaha = useMemo(() =>
    search.trim() ? TAYAMMUM_IBAHA.filter(i => arabicMatchAny([i.title, i.desc], search)) : TAYAMMUM_IBAHA,
  [search]);
  const filteredNajasat = useMemo(() => {
    if (!search.trim()) return NAJASAT_ITEMS;
    return NAJASAT_ITEMS
      .map(g => ({ ...g, items: g.items.filter(i => arabicMatchAny([i.title, i.desc], search)) }))
      .filter(g => g.items.length > 0);
  }, [search]);

  return (
    <main className="th-page" dir="rtl">
      {/* hero */}
      <section className="th-hero">
        <div className="th-hero__badge">الفقه والعبادة</div>
        <div className="th-hero__emoji">💧</div>
        <h1 className="th-hero__title">الطهارة وأحكامها</h1>
        <p className="th-hero__sub">
          الطهارة مفتاح الصلاة، دليل شامل للوضوء والغسل والتيمم والنجاسات
        </p>

        <div className="th-ayah">
          <p className="th-ayah__text">
            إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ
          </p>
          <cite className="th-ayah__ref">البقرة: 222</cite>
        </div>

        <nav className="th-tabs" aria-label="أقسام الطهارة" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              id={`thr-tab-${t.id}`}
              type="button"
              role="tab"
              className={`th-tab${tab === t.id ? " th-tab--active" : ""}`}
              onClick={() => setTab(t.id)}
              aria-selected={tab === t.id}
              aria-controls={`thr-panel-${t.id}`}
            >
              <span className="th-tab__icon"><SectionIcon name={t.icon} size={24} /></span>
              <span className="th-tab__label">{t.label}</span>
            </button>
          ))}
        </nav>
      </section>

      {/* فرض الوضوء اليوم */}
      <div className="thod-card">
        <div className="thod-card__badge"><Sparkles size={11} aria-hidden="true" /> فرض الوضوء اليوم</div>
        <span className="thod-card__icon"><SectionIcon name={todayFardh.icon} size={26} /></span>
        <div className="thod-card__num">الفرض {todayFardh.num}</div>
        <h2 className="thod-card__title">{todayFardh.title}</h2>
        <p className="thod-card__desc">{todayFardh.desc}</p>
      </div>

      <div className="th-body">
        <div className="th-search-wrap">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث في أحكام الطهارة..."
            className="page-search-input th-search-input"
            aria-label="بحث في أحكام الطهارة"
          />
        </div>

        {/* ── الوضوء ── */}
        {tab === "wudu" && (
          <section role="tabpanel" id="thr-panel-wudu" aria-labelledby="thr-tab-wudu" className="th-section">
            <h2 className="th-section__title">فرائض الوضوء</h2>
            <div className="th-fardh-grid">
              {WUDU_FARDH.map((f) => (
                <div key={f.num} className="th-fardh-card">
                  <div className="th-fardh-card__head">
                    <span className="th-fardh-card__num">{f.num}</span>
                    <span className="th-fardh-card__icon"><SectionIcon name={f.icon} size={24} /></span>
                    <strong className="th-fardh-card__title">{f.title}</strong>
                  </div>
                  <p className="th-fardh-card__desc">{f.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="th-section__title">سنن الوضوء</h2>
            <ul className="th-sunnah-list">
              {WUDU_SUNNAH.map((s) => (
                <li key={s} className="th-sunnah-item">{s}</li>
              ))}
            </ul>

            <h2 className="th-section__title">نواقض الوضوء</h2>
            <div className="th-nawaqidh-grid">
              {filteredWuduNawaqidh.map((n) => (
                <div key={n.title} className="th-naqidh-card">
                  <span className="th-naqidh-card__icon"><SectionIcon name={n.icon} size={24} /></span>
                  <div>
                    <strong className="th-naqidh-card__title">{n.title}</strong>
                    <p className="th-naqidh-card__desc">{n.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="th-info-box">
              <span>💡</span>
              <p>
                <strong>الحديث:</strong> «مِفْتَاحُ الصَّلَاةِ الطُّهُورُ، وَتَحْرِيمُهَا التَّكْبِيرُ، وَتَحْلِيلُهَا التَّسْلِيمُ»
                (سنن الترمذي، صحيح)
              </p>
            </div>
          </section>
        )}

        {/* ── الغسل ── */}
        {tab === "ghusl" && (
          <section role="tabpanel" id="thr-panel-ghusl" aria-labelledby="thr-tab-ghusl" className="th-section">
            <h2 className="th-section__title">موجبات الغسل</h2>
            <div className="th-mujibat-grid">
              {filteredGhusulMujibat.map((m) => (
                <div key={m.title} className="th-mujib-card">
                  <span className="th-mujib-card__icon"><SectionIcon name={m.icon} size={24} /></span>
                  <div>
                    <strong className="th-mujib-card__title">{m.title}</strong>
                    <p className="th-mujib-card__desc">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="th-section__title">فرائض الغسل</h2>
            <div className="th-faraidh-grid">
              {GHUSL_FARAIDH.map((f) => (
                <div key={f.title} className="th-faridh-card">
                  <span className="th-faridh-card__icon"><SectionIcon name={f.icon} size={24} /></span>
                  <div>
                    <strong className="th-faridh-card__title">{f.title}</strong>
                    <p className="th-faridh-card__desc">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="th-section__title">صفة الغسل الكامل (المستحب)</h2>
            <ol className="th-steps-list">
              {GHUSL_SIFAT.map((s, i) => (
                <li key={i} className="th-step-item">
                  <span className="th-step-item__num">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>

            <div className="th-info-box">
              <span>💡</span>
              <p>
                <strong>تنبيه:</strong> الغسل الصحيح يكفي بمجرد النية وإفاضة الماء على الجسد كله،
                وما زاد فهو من السنن المستحبة.
              </p>
            </div>
          </section>
        )}

        {/* ── التيمم ── */}
        {tab === "tayammum" && (
          <section role="tabpanel" id="thr-panel-tayammum" aria-labelledby="thr-tab-tayammum" className="th-section">
            <div className="th-ayah th-ayah--body">
              <p className="th-ayah__text">
                وَإِن كُنتُم مَّرْضَىٰ أَوْ عَلَىٰ سَفَرٍ أَوْ جَاءَ أَحَدٌ مِّنكُم مِّنَ الْغَائِطِ
                أَوْ لَامَسْتُمُ النِّسَاءَ فَلَمْ تَجِدُوا مَاءً فَتَيَمَّمُوا صَعِيدًا طَيِّبًا
              </p>
              <cite className="th-ayah__ref">النساء: 43</cite>
            </div>

            <h2 className="th-section__title">مبيحات التيمم</h2>
            <div className="th-ibaha-grid">
              {filteredTayammumIbaha.map((item) => (
                <div key={item.title} className="th-ibaha-card">
                  <span className="th-ibaha-card__icon"><SectionIcon name={item.icon} size={24} /></span>
                  <div>
                    <strong className="th-ibaha-card__title">{item.title}</strong>
                    <p className="th-ibaha-card__desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="th-section__title">كيفية التيمم</h2>
            <div className="th-steps-timeline">
              {TAYAMMUM_KAYFIYYA.map((k) => (
                <div key={k.num} className="th-timeline-step">
                  <div className="th-timeline-step__num">{k.num}</div>
                  <div className="th-timeline-step__content">
                    <strong className="th-timeline-step__title">{k.step}</strong>
                    <p className="th-timeline-step__desc">{k.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="th-info-box th-info-box--mt">
              <span>📌</span>
              <p>
                <strong>نواقض التيمم:</strong> ينتقض التيمم بوجود الماء وبكل ما ينقض الوضوء.
                كما ينتقض بزوال العذر الذي أباح التيمم.
              </p>
            </div>
          </section>
        )}

        {/* ── النجاسات ── */}
        {tab === "najasat" && (
          <section role="tabpanel" id="thr-panel-najasat" aria-labelledby="thr-tab-najasat" className="th-section">
            <p className="th-section__intro">
              النجاسة: كل عين حكم الشارع بنجاستها. إزالتها شرط لصحة الصلاة.
            </p>
            {filteredNajasat.map((group) => (
              <div key={group.type} className="th-naj-group">
                <h2 className={`th-naj-group__title th-naj-group__title--${group.color}`}>
                  {group.label}
                </h2>
                {group.items.map((item) => (
                  <div key={item.title} className="th-naj-card">
                    <span className="th-naj-card__icon"><SectionIcon name={item.icon} size={24} /></span>
                    <div>
                      <strong className="th-naj-card__title">{item.title}</strong>
                      <p className="th-naj-card__desc">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <h2 className="th-section__title">أنواع المياه من حيث الطهورية</h2>
            <div className="th-water-grid">
              {[
                { label: "طهور مطهِّر", color: "green", desc: "الماء المطلق: ماء المطر، البحر، الأنهار، الآبار" },
                { label: "طاهر غير مطهِّر", color: "blue", desc: "الماء المستعمل في الوضوء أو الغسل، طاهر لكن لا يرفع الحدث" },
                { label: "ماء نجس", color: "red", desc: "ما وقعت فيه نجاسة وتغير أحد أوصافه (لون، طعم، ريح)" },
              ].map((w) => (
                <div key={w.label} className={`th-water-card th-water-card--${w.color}`}>
                  <strong className="th-water-card__label">{w.label}</strong>
                  <p className="th-water-card__desc">{w.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="twh-share">
          <ShareButtons title="الطهارة وأحكامها — المجلس العلمي" url="https://majlisilm.com/tahara" />
        </div>

        {/* related */}
        <nav className="th-related" aria-label="مواضيع ذات صلة">
          <h2 className="th-related__title">استكشف أيضاً</h2>
          <div className="th-related__grid">
            {[
              { href: "/sawm", label: "الصيام وأحكامه" },
              { href: "/hajj", label: "الحج والعمرة" },
              { href: "/prayer-times", label: "مواقيت الصلاة" },
              { href: "/adhkar", label: "الأذكار" },
              { href: "/arkan", label: "أركان الإسلام" },
              { href: "/fiqh", label: "الفقه الإسلامي" },
            ].map((r) => (
              <a key={r.href} href={r.href} className="th-related__link">{r.label}</a>
            ))}
          </div>
        </nav>
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="fiqh" title="اختبر معلوماتك في الفقه" count={4} />
      </div>
    </main>
  );
}
