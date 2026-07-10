import { useEffect, useState } from "react";
import { applyPageSeo } from "../lib/seo";


/* ────── types ────── */
type HajjTab = "overview" | "arkan" | "wajibat" | "mashaer" | "umra";

interface RuknHajj {
  id: string;
  num: string;
  icon: string;
  title: string;
  subtitle: string;
  dalil: string;
  dalilRef: string;
  details: string[];
}

interface WajibHajj {
  id: string;
  icon: string;
  title: string;
  description: string;
  penalty: string;
}

interface Mashar {
  id: string;
  name: string;
  icon: string;
  day: string;
  desc: string;
  dua?: string;
}

interface UmraStep {
  num: number;
  icon: string;
  title: string;
  desc: string;
}

/* ────── data ────── */
const ARKAN: RuknHajj[] = [
  {
    id: "ihram",
    num: "١",
    icon: "🕋",
    title: "الإحرام",
    subtitle: "النية للدخول في النسك",
    dalil: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
    dalilRef: "متفق عليه",
    details: [
      "يُحرم من المواقيت المكانية المحددة شرعاً",
      "يُستحب الاغتسال والتطيب قبل الإحرام",
      "للرجل: لبس الإزار والرداء غير المخيطَين",
      "للمرأة: تلبس ما شاءت ما عدا القفاز والنقاب على الوجه",
      "التلبية: لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ...",
    ],
  },
  {
    id: "wuquf",
    num: "٢",
    icon: "⛰️",
    title: "الوقوف بعرفة",
    subtitle: "ركن الحج الأعظم",
    dalil: "الحَجُّ عَرَفَةُ، مَنْ جَاءَ لَيْلَةَ جَمْعٍ قَبْلَ طُلُوعِ الفَجْرِ فَقَدْ أَدْرَكَ الحَجَّ",
    dalilRef: "سنن الترمذي، صحيح",
    details: [
      "وقته: من زوال الشمس يوم التاسع حتى فجر العاشر",
      "أفضله الوقوف إلى غروب الشمس ثم الإفاضة",
      "يستحب الإكثار من الدعاء والذكر والتلبية",
      "أفضل دعاء عرفة: لا إله إلا الله وحده لا شريك له",
    ],
  },
  {
    id: "tawaf",
    num: "٣",
    icon: "🌀",
    title: "طواف الإفاضة",
    subtitle: "طواف الزيارة، ركن لا يصح الحج بدونه",
    dalil: "وَلْيَطَّوَّفُوا بِالْبَيْتِ الْعَتِيقِ",
    dalilRef: "الحج: 29",
    details: [
      "يؤدَّى بعد الوقوف بعرفة ورمي جمرة العقبة",
      "سبعة أشواط حول الكعبة يبدأ من الحجر الأسود",
      "يشترط الطهارة من الحدثين الأكبر والأصغر",
      "يستحب الاضطباع والرمل للرجال في الأشواط الثلاثة الأولى",
    ],
  },
  {
    id: "say",
    num: "٤",
    icon: "🏃",
    title: "السعي",
    subtitle: "بين الصفا والمروة",
    dalil: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ",
    dalilRef: "البقرة: 158",
    details: [
      "سبعة أشواط بين الصفا والمروة",
      "يبدأ من الصفا وينتهي بالمروة",
      "يُستحب الإسراع في الوادي بين العلمين الأخضرين للرجال",
      "يشترط أن يكون بعد طواف صحيح",
    ],
  },
];

const WAJIBAT: WajibHajj[] = [
  {
    id: "miqat",
    icon: "📍",
    title: "الإحرام من الميقات",
    description: "الإحرام من أحد المواقيت المكانية المحددة، ومن جاوزها بلا إحرام وجب عليه الدم.",
    penalty: "دم (ذبح شاة)",
  },
  {
    id: "muzdalifa",
    icon: "🌙",
    title: "المبيت بمزدلفة",
    description: "المبيت بمزدلفة ليلة العاشر، والوقوف بها حتى بعد منتصف الليل على الأقل.",
    penalty: "دم",
  },
  {
    id: "rami",
    icon: "🪨",
    title: "رمي الجمرات",
    description: "رمي جمرة العقبة يوم العيد، ورمي الجمرات الثلاث في أيام التشريق.",
    penalty: "دم عن كل جمرة أهمل رميها",
  },
  {
    id: "halq",
    icon: "✂️",
    title: "الحلق أو التقصير",
    description: "حلق الرأس أو تقصيره بعد رمي جمرة العقبة، والحلق أفضل للرجال.",
    penalty: "دم",
  },
  {
    id: "mabeet-mina",
    icon: "⛺",
    title: "المبيت بمنى",
    description: "المبيت بمنى ليالي أيام التشريق (11، 12، وللمتعجل، 13 للمتأخر).",
    penalty: "دم",
  },
  {
    id: "tawaf-wada",
    icon: "👋",
    title: "طواف الوداع",
    description: "آخر عمل يفعله الحاج قبل مغادرة مكة، ويُعفى عنه الحائض والنفساء.",
    penalty: "دم",
  },
];

const MASHAER: Mashar[] = [
  {
    id: "miqaat",
    name: "المواقيت",
    icon: "📍",
    day: "قبل الإحرام",
    desc: "المواقيت المكانية هي الحدود التي يُحرم منها الحاج والمعتمر. للمدينة: ذو الحليفة. للشام: الجحفة. لليمن: يلملم. لنجد: قرن المنازل. للمشرق: ذات عِرق.",
  },
  {
    id: "mina",
    name: "منى",
    icon: "⛺",
    day: "8، 12 ذو الحجة",
    desc: "وادٍ قريب من مكة يمكث فيه الحجاج ليلة الثامن ويرمون فيه الجمرات في أيام التشريق.",
    dua: "اللهم هذه منى وأنا عبدك جئت أبتغي مرضاتك",
  },
  {
    id: "arafa",
    name: "عرفات",
    icon: "⛰️",
    day: "9 ذو الحجة",
    desc: "الوقوف بعرفة ركن الحج الأعظم. تقع على بعد 20 كم من مكة. يمتد وقت الوقوف من زوال الشمس يوم 9 إلى فجر 10.",
    dua: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد، وهو على كل شيء قدير",
  },
  {
    id: "muzdalifa",
    name: "مزدلفة",
    icon: "🌙",
    day: "ليلة 10 ذو الحجة",
    desc: "منطقة بين عرفات ومنى. يُبيت بها الحاج ويُصلي المغرب والعشاء جمعاً وقصراً ويجمع حصى الجمرات.",
    dua: "اللهم إنك قلت ادعوني أستجب لكم، اللهم إني أدعوك فاستجب",
  },
  {
    id: "kaaba",
    name: "الكعبة المشرفة",
    icon: "🕋",
    day: "طوال الحج",
    desc: "بيت الله الحرام في مكة، تتجه إليه القلوب في الصلاة، ويطاف بها في مناسك الحج والعمرة.",
    dua: "اللهم أنت السلام ومنك السلام، حيّنا ربنا بالسلام",
  },
  {
    id: "jamarat",
    name: "الجمرات",
    icon: "🪨",
    day: "10، 11، 12، 13 ذو الحجة",
    desc: "ثلاث جمرات في منى تُرمى في أيام التشريق: الجمرة الصغرى، الوسطى، والكبرى (العقبة). يُبدأ بالصغرى في أيام التشريق.",
    dua: "بسم الله والله أكبر، مع كل حصاة",
  },
];

const UMRA_STEPS: UmraStep[] = [
  { num: 1, icon: "🕌", title: "الإحرام من الميقات", desc: "الاغتسال ولبس ثياب الإحرام (للرجال) والنية من الميقات مع التلبية" },
  { num: 2, icon: "🌀", title: "الطواف", desc: "سبعة أشواط حول الكعبة تبدأ من الحجر الأسود مع الذكر والدعاء" },
  { num: 3, icon: "🙏", title: "صلاة ركعتين", desc: "ركعتان خلف مقام إبراهيم إن تيسّر، أو في أي مكان بالمسجد" },
  { num: 4, icon: "💧", title: "الشرب من زمزم", desc: "الشرب من ماء زمزم مع الدعاء (اللهم إني أسألك علماً نافعاً ورزقاً واسعاً وشفاءً من كل داء)" },
  { num: 5, icon: "🏃", title: "السعي", desc: "سبعة أشواط بين الصفا والمروة يبدأ من الصفا وينتهي بالمروة مع الدعاء" },
  { num: 6, icon: "✂️", title: "الحلق أو التقصير", desc: "حلق الرأس أو تقصيره للرجال، وتقصر المرأة بمقدار أنملة" },
];

const TALBIYA =
  "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ";

const TABS: { id: HajjTab; label: string; icon: string }[] = [
  { id: "overview", label: "نظرة عامة", icon: "📋" },
  { id: "arkan", label: "الأركان", icon: "🕋" },
  { id: "wajibat", label: "الواجبات", icon: "✅" },
  { id: "mashaer", label: "المشاعر", icon: "⛰️" },
  { id: "umra", label: "العمرة", icon: "🌙" },
];

/* ────── component ────── */
export default function HajjPage() {
  useEffect(() => {
      applyPageSeo({
      path: "/hajj",
      title: "الحج والعمرة، المجلس العلمي",
      description: "دليل شامل لأحكام الحج والعمرة: الأركان والواجبات والسنن والمشاعر والدعاء",
      keywords: ["الحج", "العمرة", "أركان الحج", "مناسك الحج", "أحكام الحج", "الإحرام"],
    });
  }, []);

  const [tab, setTab] = useState<HajjTab>("overview");
  const [openRukn, setOpenRukn] = useState<string | null>("ihram");

  return (
    <main className="hj-page" dir="rtl">
      {/* hero */}
      <section className="hj-hero">
        <div className="hj-hero__badge">أركان الإسلام</div>
        <div className="hj-hero__kaaba">🕋</div>
        <h1 className="hj-hero__title">الحج والعمرة</h1>
        <p className="hj-hero__sub">
          الركن الخامس من أركان الإسلام، دليل شامل للمناسك والمشاعر والأحكام
        </p>

        {/* talbiya */}
        <div className="hj-talbiya">
          <span className="hj-talbiya__label">التلبية</span>
          <p className="hj-talbiya__text">{TALBIYA}</p>
        </div>

        {/* tabs */}
        <nav className="hj-tabs" aria-label="أقسام الحج">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`hj-tab${tab === t.id ? " hj-tab--active" : ""}`}
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
            >
              <span className="hj-tab__icon">{t.icon}</span>
              <span className="hj-tab__label">{t.label}</span>
            </button>
          ))}
        </nav>
      </section>

      <div className="hj-body">
        {/* ── نظرة عامة ── */}
        {tab === "overview" && (
          <section className="hj-section">
            <div className="hj-overview-grid">
              {[
                { icon: "☪️", label: "الفريضة", value: "مرة في العمر لمن استطاع" },
                { icon: "📅", label: "وقت الحج", value: "شوال، ذو القعدة، ذو الحجة" },
                { icon: "🕋", label: "الموسم", value: "8–12 ذو الحجة كل عام" },
                { icon: "📖", label: "الدليل", value: "وَلِلَّهِ عَلَى النَّاسِ حِجُّ الْبَيْتِ (آل عمران: 97)" },
              ].map((item) => (
                <div key={item.label} className="hj-stat-card">
                  <span className="hj-stat-card__icon">{item.icon}</span>
                  <span className="hj-stat-card__label">{item.label}</span>
                  <span className="hj-stat-card__value">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="hj-hadith-box">
              <blockquote className="hj-hadith-box__text">
                بُنِيَ الإِسْلَامُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ،
                وَإِقَامِ الصَّلَاةِ، وَإِيتَاءِ الزَّكَاةِ، وَصَوْمِ رَمَضَانَ، وَحَجِّ الْبَيْتِ مَنِ اسْتَطَاعَ إِلَيْهِ سَبِيلًا
              </blockquote>
              <cite className="hj-hadith-box__ref">متفق عليه</cite>
            </div>

            <h2 className="hj-section__title">فضل الحج</h2>
            <div className="hj-fadl-grid">
              {[
                { icon: "🏆", text: "الحج المبرور ليس له جزاء إلا الجنة", ref: "متفق عليه" },
                { icon: "✨", text: "من حج فلم يرفث ولم يفسق رجع كيوم ولدته أمه", ref: "متفق عليه" },
                { icon: "💰", text: "تابعوا بين الحج والعمرة فإنهما ينفيان الفقر والذنوب", ref: "سنن الترمذي، صحيح" },
                { icon: "📿", text: "العمرة إلى العمرة كفارة لما بينهما", ref: "متفق عليه" },
              ].map((f) => (
                <div key={f.text} className="hj-fadl-card">
                  <span className="hj-fadl-card__icon">{f.icon}</span>
                  <p className="hj-fadl-card__text">{f.text}</p>
                  <cite className="hj-fadl-card__ref">{f.ref}</cite>
                </div>
              ))}
            </div>

            <h2 className="hj-section__title">أنواع الحج</h2>
            <div className="hj-types-grid">
              {[
                { name: "الإفراد", desc: "الإحرام بالحج وحده، ولا هدي واجب عليه" },
                { name: "القِران", desc: "الإحرام بالحج والعمرة معاً، ويلزمه الهدي" },
                { name: "التمتع", desc: "الإحرام بالعمرة أولاً ثم يتحلل ويُحرم بالحج، ويلزمه الهدي" },
              ].map((t) => (
                <div key={t.name} className="hj-type-card">
                  <strong className="hj-type-card__name">{t.name}</strong>
                  <p className="hj-type-card__desc">{t.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── الأركان ── */}
        {tab === "arkan" && (
          <section className="hj-section">
            <p className="hj-section__intro">
              أركان الحج هي ما لا يصح الحج بدونها ولا تجبر بالدم. من ترك ركناً لم يتم حجّه.
            </p>
            {ARKAN.map((rk) => {
              const isOpen = openRukn === rk.id;
              return (
                <article key={rk.id} className={`hj-card${isOpen ? " hj-card--open" : ""}`}>
                  <button
                    type="button"
                    className="hj-card__head"
                    onClick={() => setOpenRukn(isOpen ? null : rk.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="hj-card__num">{rk.num}</span>
                    <span className="hj-card__icon">{rk.icon}</span>
                    <div className="hj-card__info">
                      <span className="hj-card__title">{rk.title}</span>
                      <span className="hj-card__sub">{rk.subtitle}</span>
                    </div>
                    <span className="hj-card__badge">ركن</span>
                    <span className={`hj-card__chevron${isOpen ? " hj-card__chevron--open" : ""}`}>▾</span>
                  </button>
                  {isOpen && (
                    <div className="hj-card__body">
                      <blockquote className="hj-dalil">
                        <p className="hj-dalil__text">{rk.dalil}</p>
                        <cite className="hj-dalil__ref">{rk.dalilRef}</cite>
                      </blockquote>
                      <ul className="hj-detail-list">
                        {rk.details.map((d, i) => (
                          <li key={i} className="hj-detail-item">{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}

        {/* ── الواجبات ── */}
        {tab === "wajibat" && (
          <section className="hj-section">
            <p className="hj-section__intro">
              واجبات الحج هي ما يلزم فعله، ومن تركه أثم ويجبره بدم (ذبح شاة)، لكن حجّه صحيح.
            </p>
            {WAJIBAT.map((w) => (
              <div key={w.id} className="hj-wajib-card">
                <span className="hj-wajib-card__icon">{w.icon}</span>
                <div className="hj-wajib-card__content">
                  <strong className="hj-wajib-card__title">{w.title}</strong>
                  <p className="hj-wajib-card__desc">{w.description}</p>
                  <span className="hj-wajib-card__penalty">عقوبة تركه: {w.penalty}</span>
                </div>
              </div>
            ))}
            <div className="hj-info-box">
              <span className="hj-info-box__icon">💡</span>
              <p>الدم في الفقه يعني ذبح شاة وتوزيع لحمها على فقراء الحرم. لا يجوز أكلها للحاج وإن كان مضطراً.</p>
            </div>
          </section>
        )}

        {/* ── المشاعر ── */}
        {tab === "mashaer" && (
          <section className="hj-section">
            {MASHAER.map((m) => (
              <div key={m.id} className="hj-mashar-card">
                <div className="hj-mashar-card__head">
                  <span className="hj-mashar-card__icon">{m.icon}</span>
                  <div>
                    <strong className="hj-mashar-card__name">{m.name}</strong>
                    <span className="hj-mashar-card__day">{m.day}</span>
                  </div>
                </div>
                <p className="hj-mashar-card__desc">{m.desc}</p>
                {m.dua && (
                  <div className="hj-mashar-dua">
                    <span className="hj-mashar-dua__label">دعاء مقترح</span>
                    <p className="hj-mashar-dua__text">{m.dua}</p>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* ── العمرة ── */}
        {tab === "umra" && (
          <section className="hj-section">
            <p className="hj-section__intro">
              العمرة سنة مؤكدة يمكن أداؤها في أي وقت من السنة ما عدا أيام الحج عند بعض العلماء.
              تتكون من أربعة خطوات أساسية.
            </p>

            <div className="hj-umra-steps">
              {UMRA_STEPS.map((s) => (
                <div key={s.num} className="hj-umra-step">
                  <div className="hj-umra-step__num">{s.num}</div>
                  <div className="hj-umra-step__icon">{s.icon}</div>
                  <div className="hj-umra-step__content">
                    <strong className="hj-umra-step__title">{s.title}</strong>
                    <p className="hj-umra-step__desc">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="hj-info-box hj-info-box--mt">
              <span className="hj-info-box__icon">📌</span>
              <p>
                <strong>العمرة في رمضان:</strong> «عمرة في رمضان تعدل حجة، أو حجة معي»
                (متفق عليه)، أجرها كأجر الحج لا أنها تُسقطه.
              </p>
            </div>

            <h2 className="hj-section__title hj-section__title--mt">محظورات الإحرام</h2>
            <div className="hj-mahzurat-grid">
              {[
                { icon: "✂️", text: "حلق الشعر أو قصّه" },
                { icon: "💅", text: "قص الأظافر" },
                { icon: "🌹", text: "التطيب بعد الإحرام" },
                { icon: "🧥", text: "لبس المخيط للرجال" },
                { icon: "💍", text: "لبس القفاز للمرأة" },
                { icon: "🦁", text: "الصيد البري" },
                { icon: "💑", text: "الجماع أو مقدماته" },
                { icon: "💒", text: "عقد النكاح" },
              ].map((item) => (
                <div key={item.text} className="hj-mahzur-item">
                  <span className="hj-mahzur-item__icon">{item.icon}</span>
                  <span className="hj-mahzur-item__text">{item.text}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* related */}
        <nav className="hj-related" aria-label="صفحات ذات صلة">
          <h2 className="hj-related__title">استكشف أيضاً</h2>
          <div className="hj-related__grid">
            {[
              { href: "/arkan", label: "أركان الإسلام" },
              { href: "/arkan-iman", label: "أركان الإيمان" },
              { href: "/zakat", label: "الزكاة وأحكامها" },
              { href: "/sawm", label: "الصيام وأحكامه" },
              { href: "/duas", label: "الأدعية الشرعية" },
              { href: "/prayer-times", label: "مواقيت الصلاة" },
            ].map((r) => (
              <a key={r.href} href={r.href} className="hj-related__link">
                {r.label}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </main>
  );
}
