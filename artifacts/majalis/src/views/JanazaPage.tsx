import { useEffect, useState } from "react";
import { applyPageSeo } from "../lib/seo";


type JanazaTab = "ghusl" | "takfin" | "salah" | "dafn" | "aadab";

/* ─── data ─── */
const GHUSL_STEPS = [
  { num: "١", title: "النية والبسملة", desc: "يبدأ بالنية ثم التسمية، وينبغي ستر العورة طوال الغسل" },
  { num: "٢", title: "إزالة الأذى", desc: "يُغسَّل الفرج وتُزال القاذورات إن وُجدت" },
  { num: "٣", title: "الوضوء", desc: "يُوضَّأ كوضوء الصلاة تماماً دون إدخال الماء في الأنف والفم" },
  { num: "٤", title: "الغسل بالماء والسدر", desc: "يُغسَّل الرأس والوجه أولاً، ثم الشق الأيمن، ثم الأيسر ثلاثاً" },
  { num: "٥", title: "الغسلة الأخيرة بالكافور", desc: "تُختم الغسلة الأخيرة بكافور (إن وُجد) لحسن الرائحة وتجميد الجسد" },
  { num: "٦", title: "تجفيف الجسد", desc: "يُجفَّف الجسد ثم يُطيَّب ويُكفَّن" },
];

const GHUSL_NOTES = [
  "يجب ستر الميت وعدم كشفه أمام غير المحارم",
  "لا يُقصُّ شعر الميت ولا أظفاره ولا يُحلق",
  "الشهيد في المعركة لا يُغسَّل ويُدفن بدمه وثيابه",
  "الطفل يُغسَّل كالبالغ ويُصلَّى عليه",
  "يُستحب أن يتولى الغسل أقارب الميت الثقات",
  "يُستحسن أن يغسل الرجلَ الرجالُ والمرأةَ النساءُ، ويجوز للزوج غسل زوجته والعكس عند جمهور العلماء",
  "لا بأس بالبكاء على الميت بكاءً هادئاً دون نياحة ولا لطم — فعله النبي ﷺ على ابنه إبراهيم",
  "إذا تعذَّر الغسل لجرح أو مرض أو غيره جُمِعَ معه التيمم عند جمع من الفقهاء",
];

const TAKFIN_ITEMS = [
  {
    title: "تكفين الرجل",
    icon: "👨",
    desc: "السنة: ثلاثة أثواب بيض تُلفُّ لفاً. الواجب: ثوب واحد يستر جميع بدنه. لا عمامة ولا قميص",
    dalil: "كُفِّنَ النَّبِيُّ ﷺ فِي ثَلَاثَةِ أَثْوَابٍ يَمَانِيَّةٍ بِيضٍ",
    ref: "متفق عليه",
  },
  {
    title: "تكفين المرأة",
    icon: "👩",
    desc: "السنة: خمسة أثواب (إزار، خمار، قميص، ولفافتان). والواجب: ثوب يستر جميع بدنها",
    dalil: "كَفِّنُوا نِسَاءَكُمْ فِي خَمْسَةِ أَثْوَابٍ",
    ref: "المغني لابن قدامة",
  },
  {
    title: "التحنيط",
    icon: "🌿",
    desc: "يُوضَع الطيب (الكافور وما أشبهه) على مواضع السجود: الجبهة والأنف واليدين والركبتين وأطراف القدمين",
    dalil: "اجْعَلُوا فِي كَفَنِهِ شَيْئًا مِنَ الْكَافُورِ",
    ref: "سنن النسائي — صحيح",
  },
  {
    title: "لون الكفن وجودته",
    icon: "⚪",
    desc: "يُستحب أن يكون الكفن أبيضاً نظيفاً وسطاً غير مسرف ولا مبخوس، ويؤخذ من مال الميت قبل الديون والميراث",
    dalil: "البسوا من ثيابكم البياض فإنها من خير ثيابكم وكفِّنوا فيها موتاكم",
    ref: "رواه أبو داود والترمذي — صحيح",
  },
  {
    title: "ترتيب لف الكفن",
    icon: "🔄",
    desc: "تُبسط اللفائف بعضها فوق بعض ثم يُوضَع الميت عليها على ظهره ثم تُلفُّ اللفافة اليسرى على اليمنى ثم اليمنى على اليسرى",
    dalil: "كُفِّنَ رسول الله ﷺ في ثلاثة أثواب سحولية بيض لم يكن فيها قميص ولا عمامة",
    ref: "رواه البخاري ومسلم",
  },
];

const SALAH_ARKAN = [
  { num: "١", title: "النية", desc: "نية الصلاة على الميت في القلب، ولا يُشترط التلفظ بها" },
  { num: "٢", title: "القيام", desc: "الصلاة واقفاً قادراً ولا قعود فيها ولا ركوع ولا سجود" },
  { num: "٣", title: "التكبيرات الأربع", desc: "أربع تكبيرات، يرفع يديه مع كل تكبيرة إلى حذو المنكبين أو شحمتَي الأذنين" },
  { num: "٤", title: "الفاتحة", desc: "قراءة فاتحة الكتاب سراً بعد التكبيرة الأولى، ويُستحب التعوذ قبلها" },
  { num: "٥", title: "الصلاة على النبي", desc: "الصلاة الإبراهيمية كاملة بعد التكبيرة الثانية كما في التشهد" },
  { num: "٦", title: "الدعاء للميت", desc: "الدعاء المأثور للميت بعد التكبيرة الثالثة، ثم يدعو لنفسه وللمسلمين بعد الرابعة" },
  { num: "٧", title: "التسليم", desc: "تسليمة واحدة عن اليمين عند جمهور العلماء، أو تسليمتان عند بعضهم" },
  { num: "٨", title: "ترتيب الإمام", desc: "يقف الإمام عند رأس الرجل ووسط المرأة. وأفضل الصفوف الأول فالأول كالصلاة المعتادة" },
];

const DUA_MAYYIT =
  "اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ وَعَافِهِ وَاعْفُ عَنْهُ، وَأَكْرِمْ نُزُلَهُ، وَوَسِّعْ مُدْخَلَهُ، وَاغْسِلْهُ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ";

const DAFN_ITEMS = [
  { icon: "⛏️", title: "حفر القبر", desc: "يُحفَر القبر ذراعاً ونصفاً في العمق تقريباً، ويُلحَد له في جانبه (اللحد أفضل من الشق)" },
  { icon: "🌙", title: "الاتجاه", desc: "يُدفَن الميت على جنبه الأيمن متجهاً نحو القبلة، فيُستحسن أن تكون رأسه جهة الشمال" },
  { icon: "🌿", title: "وضع الجريدة", desc: "يُستحب وضع جريدتين رطبتين على القبر اقتداءً بفعل النبي ﷺ" },
  { icon: "📿", title: "الدعاء عند الدفن", desc: "يُقال: بسم الله وعلى سنة رسول الله ﷺ — ويُنثَر التراب بيده ثلاثاً من جهة الرأس" },
  { icon: "🗿", title: "العلامة على القبر", desc: "يُجعَل على القبر حجر أو ما يشبهه علامةً لمعرفته، ويُكره تجصيصه والبناء عليه" },
  { icon: "🙏", title: "الدعاء بعد الدفن", desc: "يُستحب أن يقف المشيِّعون ويدعوا للميت بالثبات عند السؤال، ويقرؤوا له الفاتحة" },
];

const TAAZIYA_AADAB = [
  { icon: "🤲", title: "تعجيل التعزية", desc: "يُستحب تعجيل التعزية قبل الدفن وبعده ما لم يمض ثلاثة أيام في الغالب" },
  { icon: "🍽️", title: "إعداد الطعام لأهل الميت", desc: "يُستحب أن يُعِدَّ جيران الميت وأقاربه طعاماً لأهل الميت لأنهم مشغولون عن أنفسهم" },
  { icon: "🕌", title: "ألفاظ التعزية", desc: "يُقال: إن لله ما أخذ وله ما أعطى وكل شيء عنده بأجل مسمى فاصبر واحتسب" },
  { icon: "🚫", title: "المنهيات", desc: "يُكره البكاء بصوت عال والنياحة وشق الجيوب ولطم الخدود والدعاء بالويل والثبور" },
  { icon: "📅", title: "زيارة القبور", desc: "زيارة القبور مشروعة للرجال بإجماع، وللنساء خلاف — والغاية التذكر والدعاء للأموات" },
  { icon: "📖", title: "قراءة القرآن عند القبر", desc: "يُستحب قراءة شيء من القرآن عند القبر إحساناً بالميت، ويُختلف في بلوغ الثواب" },
  { icon: "💔", title: "الصبر والاحتساب", desc: "الصبر عند المصيبة فريضة، والاحتساب بقول: إنا لله وإنا إليه راجعون يمحو ذنوباً ويرفع درجات" },
  { icon: "🌹", title: "الدعاء للميت بعد الدفن", desc: "يُستحب أن يقول المشيِّعون بعد الدفن: اللهم اغفر له، اللهم ثبِّته. قال ﷺ: استغفروا لأخيكم وسلوا له التثبيت فإنه الآن يُسأَل" },
  { icon: "🤍", title: "ذكر الميت بخير", desc: "قال ﷺ: اذكروا محاسن موتاكم وكُفُّوا عن مساوئهم — رواه أبو داود. ومن مات على الإسلام فله الترحم والاستغفار" },
];

const TABS: { id: JanazaTab; label: string; icon: string }[] = [
  { id: "ghusl", label: "الغسل", icon: "💧" },
  { id: "takfin", label: "التكفين", icon: "🌿" },
  { id: "salah", label: "الصلاة", icon: "🕌" },
  { id: "dafn", label: "الدفن", icon: "⛏️" },
  { id: "aadab", label: "التعزية والآداب", icon: "🤲" },
];

export default function JanazaPage() {
  useEffect(() => {
      applyPageSeo({
      path: "/janaza",
      title: "أحكام الجنائز — المجلس العلمي",
      description: "دليل شامل لأحكام الجنائز: الغسل والتكفين والصلاة والدفن والتعزية والزيارة",
      keywords: ["الجنائز", "أحكام الجنازة", "صلاة الجنازة", "التكفين", "الدفن", "التعزية"],
    });
  }, []);

  const [tab, setTab] = useState<JanazaTab>("ghusl");

  return (
    <main className="jn-page" dir="rtl">
      {/* hero */}
      <section className="jn-hero">
        <div className="jn-hero__badge">الفقه الإسلامي</div>
        <h1 className="jn-hero__title">أحكام الجنائز</h1>
        <p className="jn-hero__sub">
          دليل شامل لما يجب على المسلمين تجاه موتاهم من الغسل والتكفين والصلاة والدفن والتعزية
        </p>

        <div className="jn-ayah">
          <p className="jn-ayah__text">
            كُلُّ نَفْسٍ ذَائِقَةُ الْمَوْتِ ثُمَّ إِلَيْنَا تُرْجَعُونَ
          </p>
          <cite className="jn-ayah__ref">العنكبوت: 57</cite>
        </div>

        <nav className="jn-tabs" aria-label="أقسام الجنائز">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`jn-tab${tab === t.id ? " jn-tab--active" : ""}`}
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
            >
              <span className="jn-tab__icon">{t.icon}</span>
              <span className="jn-tab__label">{t.label}</span>
            </button>
          ))}
        </nav>
      </section>

      <div className="jn-body">
        {/* ── الغسل ── */}
        {tab === "ghusl" && (
          <section className="jn-section">
            <div className="jn-info">
              <span className="jn-info__icon">📌</span>
              <p>
                <strong>حكم غسل الميت:</strong> فرض كفاية على المسلمين إذا قام به بعضهم سقط عن الباقين.
                ويُشترط أن يكون الغاسل مسلماً بالغاً عاقلاً.
              </p>
            </div>

            <div className="jn-steps">
              {GHUSL_STEPS.map((s) => (
                <div key={s.num} className="jn-step">
                  <div className="jn-step__num">{s.num}</div>
                  <div className="jn-step__content">
                    <strong className="jn-step__title">{s.title}</strong>
                    <p className="jn-step__desc">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="jn-subtitle">تنبيهات مهمة</h2>
            <ul className="jn-notes">
              {GHUSL_NOTES.map((n) => (
                <li key={n} className="jn-note">{n}</li>
              ))}
            </ul>
          </section>
        )}

        {/* ── التكفين ── */}
        {tab === "takfin" && (
          <section className="jn-section">
            <div className="jn-info">
              <span className="jn-info__icon">📌</span>
              <p>
                <strong>حكم التكفين:</strong> فرض كفاية. يُؤخذ كفن الميت من ماله قبل قسمة التركة،
                ويُستحب أن يكون أبيض نظيفاً.
              </p>
            </div>
            {TAKFIN_ITEMS.map((item) => (
              <div key={item.title} className="jn-takfin-card">
                <div className="jn-takfin-card__head">
                  <span className="jn-takfin-card__icon">{item.icon}</span>
                  <strong className="jn-takfin-card__title">{item.title}</strong>
                </div>
                <p className="jn-takfin-card__desc">{item.desc}</p>
                <blockquote className="jn-dalil">
                  <p className="jn-dalil__text">{item.dalil}</p>
                  <cite className="jn-dalil__ref">{item.ref}</cite>
                </blockquote>
              </div>
            ))}
          </section>
        )}

        {/* ── الصلاة ── */}
        {tab === "salah" && (
          <section className="jn-section">
            <div className="jn-info">
              <span className="jn-info__icon">📌</span>
              <p>
                <strong>حكم صلاة الجنازة:</strong> فرض كفاية. تصح منفردة وفي جماعة، وتُؤدَّى بعد الغسل
                والتكفين قبل الدفن. لا سجود فيها ولا ركوع.
              </p>
            </div>

            <h2 className="jn-subtitle">أركان صلاة الجنازة</h2>
            <div className="jn-arkan-grid">
              {SALAH_ARKAN.map((rk) => (
                <div key={rk.num} className="jn-rukn-card">
                  <span className="jn-rukn-card__num">{rk.num}</span>
                  <div>
                    <strong className="jn-rukn-card__title">{rk.title}</strong>
                    <p className="jn-rukn-card__desc">{rk.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="jn-subtitle">دعاء الميت</h2>
            <div className="jn-dua-box">
              <span className="jn-dua-box__label">يُقال بعد التكبيرة الثالثة</span>
              <p className="jn-dua-box__text">{DUA_MAYYIT}</p>
              <cite className="jn-dua-box__ref">متفق عليه</cite>
            </div>

            <div className="jn-info jn-info--mt">
              <span className="jn-info__icon">💡</span>
              <p>
                من فاتته التكبيرة الأولى يدخل مع الإمام ثم يقضي ما فاته بعد التسليم.
                ويُستحب أن يكون الإمام أمام صدر الرجل ووسط المرأة.
              </p>
            </div>
          </section>
        )}

        {/* ── الدفن ── */}
        {tab === "dafn" && (
          <section className="jn-section">
            <div className="jn-info">
              <span className="jn-info__icon">📌</span>
              <p>
                <strong>حكم الدفن:</strong> فرض كفاية، ويُستحب الإسراع به. ولا يجوز حرق الميت المسلم
                ولا دفنه في البحر إلا لضرورة. ولا يُدفن في تابوت إلا لرطوبة الأرض.
              </p>
            </div>
            <div className="jn-dafn-grid">
              {DAFN_ITEMS.map((d) => (
                <div key={d.title} className="jn-dafn-card">
                  <span className="jn-dafn-card__icon">{d.icon}</span>
                  <div>
                    <strong className="jn-dafn-card__title">{d.title}</strong>
                    <p className="jn-dafn-card__desc">{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── التعزية والآداب ── */}
        {tab === "aadab" && (
          <section className="jn-section">
            <div className="jn-info">
              <span className="jn-info__icon">📌</span>
              <p>
                <strong>التعزية:</strong> سنة مؤكدة، وهي مواساة أهل الميت وتخفيف حزنهم.
                قال النبي ﷺ: «مَا مِنْ مُؤْمِنٍ يُعَزِّي أَخَاهُ بِمُصِيبَةٍ إِلَّا كَسَاهُ اللَّهُ مِنْ حُلَلِ الْكَرَامَةِ يَوْمَ الْقِيَامَةِ». (سنن ابن ماجه — صحيح)
              </p>
            </div>
            {TAAZIYA_AADAB.map((a) => (
              <div key={a.title} className="jn-adab-card">
                <span className="jn-adab-card__icon">{a.icon}</span>
                <div>
                  <strong className="jn-adab-card__title">{a.title}</strong>
                  <p className="jn-adab-card__desc">{a.desc}</p>
                </div>
              </div>
            ))}

            <div className="jn-hadith-box">
              <blockquote className="jn-hadith-box__text">
                أَكْثِرُوا ذِكْرَ هَاذِمِ اللَّذَّاتِ
              </blockquote>
              <cite className="jn-hadith-box__ref">سنن الترمذي — صحيح | المعنى: الموت</cite>
            </div>
          </section>
        )}

        {/* related */}
        <nav className="jn-related" aria-label="صفحات ذات صلة">
          <h2 className="jn-related__title">استكشف أيضاً</h2>
          <div className="jn-related__grid">
            {[
              { href: "/tahara", label: "الطهارة وأحكامها" },
              { href: "/sawm", label: "الصيام وأحكامه" },
              { href: "/fiqh", label: "الفقه الإسلامي" },
              { href: "/adhkar", label: "الأذكار" },
              { href: "/duas", label: "الأدعية الشرعية" },
              { href: "/arkan", label: "أركان الإسلام" },
            ].map((r) => (
              <a key={r.href} href={r.href} className="jn-related__link">{r.label}</a>
            ))}
          </div>
        </nav>
      </div>
    </main>
  );
}
