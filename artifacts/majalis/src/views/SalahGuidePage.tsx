import { useState } from "react";
import { applyPageSeo } from "../lib/seo";

applyPageSeo({
  path: "/salah-guide",
  title: "دليل الصلاة الكامل — المجلس العلمي",
  description: "الدليل الشامل للصلاة: شروطها وأركانها وواجباتها وسننها ومبطلاتها وكيفية الخشوع فيها",
  keywords: ["الصلاة", "كيفية الصلاة", "أركان الصلاة", "شروط الصلاة", "خشوع الصلاة"],
});

type SalahTab = "shurut" | "kayfiyya" | "mubtilatat" | "khushuu" | "fawaid";

const TABS: { id: SalahTab; label: string; icon: string }[] = [
  { id: "shurut",      label: "الشروط والأركان", icon: "📋" },
  { id: "kayfiyya",    label: "كيفية الصلاة",    icon: "🕌" },
  { id: "mubtilatat",  label: "المبطلات والمكروهات", icon: "⛔" },
  { id: "khushuu",     label: "الخشوع",          icon: "🤲" },
  { id: "fawaid",      label: "فضائل الصلاة",    icon: "⭐" },
];

/* ── الشروط والأركان ── */
const SHURUT = [
  { title: "الإسلام", desc: "الصلاة لا تصح من كافر" },
  { title: "العقل", desc: "لا تجب على المجنون حتى يُفيق" },
  { title: "البلوغ", desc: "تجب على البالغ ويُؤمَر بها الصبي لسبع" },
  { title: "دخول الوقت", desc: "لكل صلاة وقت محدد شرعاً بدايةً ونهايةً" },
  { title: "الطهارة من الحدث", desc: "الوضوء للأصغر والغسل للأكبر" },
  { title: "الطهارة من النجاسة", desc: "في البدن والثوب والمكان" },
  { title: "استقبال القبلة", desc: "إلا لعاجز أو خائف أو في صلاة النافلة سفراً" },
  { title: "ستر العورة", desc: "عورة الرجل من السرة إلى الركبة — عورة المرأة جسدها كله" },
  { title: "النية", desc: "في القلب لا يشترط التلفظ بها" },
];

const ARKAN = [
  { num: 1, title: "القيام", desc: "للقادر في الفريضة" },
  { num: 2, title: "تكبيرة الإحرام", desc: "«الله أكبر» — ركن قولي" },
  { num: 3, title: "قراءة الفاتحة", desc: "في كل ركعة — «لا صلاة لمن لم يقرأ بفاتحة الكتاب»" },
  { num: 4, title: "الركوع", desc: "الانحناء حتى تطمئن اليدان على الركبتين" },
  { num: 5, title: "الاعتدال من الركوع", desc: "الرفع والطمأنينة" },
  { num: 6, title: "السجود", desc: "على سبعة أعظم — الجبهة والأنف واليدان والركبتان والقدمان" },
  { num: 7, title: "الرفع من السجود", desc: "والجلوس بين السجدتين" },
  { num: 8, title: "السجدة الثانية", desc: "مثل الأولى" },
  { num: 9, title: "الطمأنينة", desc: "في كل ركن — الهدوء والاستقرار" },
  { num: 10, title: "الترتيب", desc: "بين الأركان" },
  { num: 11, title: "التشهد الأخير", desc: "والجلوس له" },
  { num: 12, title: "الصلاة على النبي ﷺ", desc: "في التشهد الأخير" },
  { num: 13, title: "التسليم", desc: "السلام عليكم ورحمة الله — مرتين" },
];

/* ── كيفية الصلاة ── */
interface SalahStep {
  num: number;
  action: string;
  dhikr?: string;
  note?: string;
}
const KAYFIYYA: SalahStep[] = [
  { num: 1, action: "الوقوف مستقبلاً القبلة بنية الصلاة", note: "اليدان على الجانبين أو متقاطعتان على الصدر" },
  { num: 2, action: "رفع اليدين إلى حذو المنكبين أو الأذنين", dhikr: "الله أكبر", note: "تكبيرة الإحرام — يدخل في الصلاة" },
  { num: 3, action: "وضع اليد اليمنى على اليسرى على الصدر والقراءة", dhikr: "دعاء الاستفتاح ثم الفاتحة ثم سورة قصيرة", note: "يُسَرّ في الظهر والعصر ويُجهَر في الفجر والمغرب والعشاء" },
  { num: 4, action: "الركوع — وضع اليدين على الركبتين مع تسوية الظهر", dhikr: "سبحان ربي العظيم (3 مرات)" },
  { num: 5, action: "الرفع من الركوع", dhikr: "سمع الله لمن حمده — ربنا ولك الحمد حمداً كثيراً طيباً مباركاً فيه", note: "يرفع يديه عند الرفع" },
  { num: 6, action: "السجود — ينزل بالتكبير ويضع الجبهة والأنف أولاً", dhikr: "سبحان ربي الأعلى (3 مرات)" },
  { num: 7, action: "الجلوس بين السجدتين", dhikr: "رب اغفر لي رب اغفر لي", note: "يجلس على القدم اليسرى مفروشة ويستوي" },
  { num: 8, action: "السجدة الثانية", dhikr: "سبحان ربي الأعلى (3 مرات)" },
  { num: 9, action: "القيام للركعة الثانية بالتكبير", note: "يقوم معتمداً على ركبتيه" },
  { num: 10, action: "في الركعة الأخيرة يجلس للتشهد", dhikr: "التحيات لله والصلوات والطيبات... ثم الصلاة الإبراهيمية" },
  { num: 11, action: "التسليم عن اليمين ثم اليسار", dhikr: "السلام عليكم ورحمة الله" },
];

/* ── المبطلات والمكروهات ── */
const MUBTILATAT = [
  { title: "الحدث (نقض الطهارة)", desc: "الريح أو البول أو غيره أثناء الصلاة — تبطل فوراً" },
  { title: "الكلام العمد", desc: "الكلام الآدمي عمداً دون ضرورة يبطل الصلاة" },
  { title: "الضحك", desc: "الضحك الصوتي (القهقهة) — بخلاف التبسم" },
  { title: "الأكل والشرب", desc: "ولو شيئاً يسيراً بالعمد" },
  { title: "العبث الكثير المتوالي", desc: "الحركة المتكررة التي لا تناسب الصلاة" },
  { title: "كشف العورة", desc: "إذا انكشف شيء من العورة عمداً" },
  { title: "ترك ركن أو شرط", desc: "كنسيان تكبيرة الإحرام أو الفاتحة عمداً" },
];

const MAKRUHAT = [
  "الالتفات بالوجه يميناً وشمالاً",
  "النظر للسماء",
  "البصاق أمام المصلي أو عن يمينه",
  "وضع اليد على الخصر",
  "الصلاة مع وجود ما يشغل البال (حاقناً أو حاقباً)",
  "الصلاة وأمامه ما يشغله من نار أو صورة",
  "العبث باللحية أو الثوب",
];

/* ── الخشوع ── */
const KHUSHUU_WAYS = [
  { icon: "🧠", title: "حضور القلب", desc: "تذكر أنك بين يدي الله — أعظم من خلق السموات والأرض" },
  { icon: "👁️", title: "إدامة النظر لموضع السجود", desc: "لا تنظر يميناً وشمالاً — وهو خُلسة الشيطان" },
  { icon: "🎵", title: "التدبر في القراءة", desc: "تأمل معاني ما تقرأ وحاول أن تشعر بالكلمات" },
  { icon: "⏱️", title: "الطمأنينة والترتيل", desc: "لا تتعجل في الأركان — أقصر صلاة طمأنينة خير من طويلة بلا خشوع" },
  { icon: "🌟", title: "تصغير الدنيا في قلبك", desc: "استحضر عظمة الله وحقارة الدنيا قبل الصلاة" },
  { icon: "🚪", title: "التجديد والتهيؤ", desc: "توضأ بانتباه، واقرأ دعاء الدخول للمسجد، وصلّ تحية المسجد" },
  { icon: "📵", title: "إبعاد المشتتات", desc: "ضع الهاتف في الصامت، واختر مكاناً هادئاً بلا صور" },
  { icon: "🤲", title: "الدعاء في السجود", desc: "«أقرب ما يكون العبد من ربه وهو ساجد فأكثروا الدعاء» — مسلم" },
];

/* ── فضائل الصلاة ── */
const FAWAID = [
  { ayah: "إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ", ref: "العنكبوت: 45", note: "الصلاة حصن من الذنوب والفواحش" },
  { ayah: "قَدْ أَفْلَحَ الْمُؤْمِنُونَ ۖ الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ", ref: "المؤمنون: 1-2", note: "الفلاح مرتبط بالخشوع" },
  { ayah: "وَأَقِمِ الصَّلَاةَ لِذِكْرِي", ref: "طه: 14", note: "الصلاة ذكر لله — الغاية العليا" },
];

const AHADITH_FAWAID = [
  { text: "«الصلوات الخمس والجمعة إلى الجمعة كفّارة لما بينهن إذا اجتُنبت الكبائر»", source: "مسلم" },
  { text: "«أول ما يُحاسَب الناس به يوم القيامة من أعمالهم الصلاة»", source: "النسائي — صحيح" },
  { text: "«الصلاة نور» — نور في القلب ونور في الوجه ونور في القبر ونور يوم القيامة", source: "مسلم" },
  { text: "«مثل الصلوات الخمس كمثل نهر غَمْر على باب أحدكم يغتسل منه خمس مرات»", source: "مسلم" },
];

export default function SalahGuidePage() {
  const [tab, setTab] = useState<SalahTab>("shurut");
  const [openStep, setOpenStep] = useState<number | null>(null);

  return (
    <main className="sg-page" dir="rtl">
      {/* hero */}
      <section className="sg-hero">
        <div className="sg-hero__badge">العبادة والأركان</div>
        <h1 className="sg-hero__title">دليل الصلاة الكامل</h1>
        <p className="sg-hero__sub">
          من الشروط والأركان إلى الخشوع والفضائل — كل ما تحتاجه لصلاة صحيحة مقبولة
        </p>
        <div className="sg-times-row">
          {[
            { name: "الفجر", rakat: "2", color: "#1e3a5f" },
            { name: "الظهر", rakat: "4", color: "#b45309" },
            { name: "العصر", rakat: "4", color: "#0e6e52" },
            { name: "المغرب", rakat: "3", color: "#7c3aed" },
            { name: "العشاء", rakat: "4", color: "#1e3a5f" },
          ].map((p) => (
            <div key={p.name} className="sg-salah-chip" style={{ "--sg-chip-color": p.color } as { [k: string]: string }}>
              <span className="sg-salah-chip__name">{p.name}</span>
              <span className="sg-salah-chip__rakat">{p.rakat} ركعات</span>
            </div>
          ))}
        </div>
      </section>

      {/* tabs */}
      <div className="sg-tabs-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`sg-tab${tab === t.id ? " sg-tab--active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="sg-body">

        {/* ── الشروط والأركان ── */}
        {tab === "shurut" && (
          <div className="sg-section">
            <h2 className="sg-subhead">شروط صحة الصلاة (9 شروط)</h2>
            <div className="sg-shurut-grid">
              {SHURUT.map((s, i) => (
                <div key={i} className="sg-shart-card">
                  <span className="sg-shart-num">{i + 1}</span>
                  <div>
                    <span className="sg-shart-title">{s.title}</span>
                    <span className="sg-shart-desc">{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="sg-subhead sg-subhead--mt">أركان الصلاة (13 ركناً)</h2>
            <div className="sg-arkan-list">
              {ARKAN.map((r) => (
                <div key={r.num} className="sg-rukn-row">
                  <span className="sg-rukn-num">{r.num}</span>
                  <div>
                    <span className="sg-rukn-title">{r.title}</span>
                    <span className="sg-rukn-desc">{r.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── كيفية الصلاة ── */}
        {tab === "kayfiyya" && (
          <div className="sg-section">
            <p className="sg-lead">خطوات الصلاة بالترتيب — اضغط على كل خطوة لمزيد من التفاصيل</p>
            <div className="sg-steps-list">
              {KAYFIYYA.map((s) => {
                const isOpen = openStep === s.num;
                return (
                  <div key={s.num} className={`sg-step-card${isOpen ? " sg-step-card--open" : ""}`}>
                    <button
                      type="button"
                      className="sg-step-head"
                      onClick={() => setOpenStep(isOpen ? null : s.num)}
                    >
                      <span className="sg-step-num">{s.num}</span>
                      <span className="sg-step-action">{s.action}</span>
                      <span className={`sg-chevron${isOpen ? " sg-chevron--open" : ""}`}>▾</span>
                    </button>
                    {isOpen && (
                      <div className="sg-step-body">
                        {s.dhikr && (
                          <div className="sg-dhikr-box">
                            <span className="sg-dhikr-box__label">الذكر:</span>
                            <span className="sg-dhikr-box__text">{s.dhikr}</span>
                          </div>
                        )}
                        {s.note && (
                          <div className="sg-step-note">
                            <span>📌</span>
                            <span>{s.note}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── المبطلات ── */}
        {tab === "mubtilatat" && (
          <div className="sg-section">
            <h2 className="sg-subhead">مبطلات الصلاة</h2>
            <div className="sg-mubtilatat-list">
              {MUBTILATAT.map((m, i) => (
                <div key={i} className="sg-mubtil-card">
                  <span className="sg-mubtil-icon">✗</span>
                  <div>
                    <span className="sg-mubtil-title">{m.title}</span>
                    <span className="sg-mubtil-desc">{m.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="sg-subhead sg-subhead--mt">مكروهات الصلاة</h2>
            <ul className="sg-makruhat-list">
              {MAKRUHAT.map((m, i) => (
                <li key={i} className="sg-makruh-item">{m}</li>
              ))}
            </ul>

            <div className="sg-info-box">
              <span>💡</span>
              <p>الفرق بين المُبطِل والمكروه: المُبطِل يُلغي الصلاة وتجب إعادتها — المكروه يُنقص الأجر ولا يُلغيها. والسهو يُعالَج بسجدتَي السهو.</p>
            </div>
          </div>
        )}

        {/* ── الخشوع ── */}
        {tab === "khushuu" && (
          <div className="sg-section">
            <p className="sg-lead">
              الخشوع روح الصلاة — بلا خشوع تكون الصلاة قشراً بلا لبّ. قال تعالى:
              <strong> (وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى الْخَاشِعِينَ)</strong>
            </p>
            <div className="sg-khushuu-grid">
              {KHUSHUU_WAYS.map((k) => (
                <div key={k.title} className="sg-khushuu-card">
                  <span className="sg-khushuu-icon">{k.icon}</span>
                  <h3 className="sg-khushuu-title">{k.title}</h3>
                  <p className="sg-khushuu-desc">{k.desc}</p>
                </div>
              ))}
            </div>

            <div className="sg-khushuu-hadith">
              <p className="sg-khushuu-hadith__text">
                «إن الرجل لينصرف وما كُتب له إلا عُشر صلاته، تُسعها، ثمنها... إلى أن قال: نصفها»
              </p>
              <cite className="sg-khushuu-hadith__ref">أبو داود — صحيح</cite>
            </div>
          </div>
        )}

        {/* ── فضائل الصلاة ── */}
        {tab === "fawaid" && (
          <div className="sg-section">
            <h2 className="sg-subhead">من القرآن الكريم</h2>
            <div className="sg-ayaat-list">
              {FAWAID.map((f, i) => (
                <div key={i} className="sg-ayah-card">
                  <p className="sg-ayah-card__text">{f.ayah}</p>
                  <cite className="sg-ayah-card__ref">{f.ref}</cite>
                  <span className="sg-ayah-card__note">{f.note}</span>
                </div>
              ))}
            </div>

            <h2 className="sg-subhead sg-subhead--mt">من السنة النبوية</h2>
            <div className="sg-ahadith-list">
              {AHADITH_FAWAID.map((h, i) => (
                <div key={i} className="sg-hadith-item">
                  <p className="sg-hadith-item__text">{h.text}</p>
                  <cite className="sg-hadith-item__source">{h.source}</cite>
                </div>
              ))}
            </div>

            <div className="sg-reminder-box">
              <h3 className="sg-reminder-box__title">تذكّر</h3>
              <p className="sg-reminder-box__text">
                الصلاة أول ما يُحاسَب عليه العبد يوم القيامة — إن صلحت صلح سائر عمله وإن فسدت فسد سائر عمله.
                خمس صلوات في اليوم تساوي 17 ركعة — كل ركعة وقفة بين يدي الله.
              </p>
            </div>
          </div>
        )}

        {/* related */}
        <nav className="sg-related" aria-label="صفحات ذات صلة">
          <h2 className="sg-related__title">استكشف أيضاً</h2>
          <div className="sg-related__grid">
            {[
              { href: "/prayer-times", label: "مواقيت الصلاة" },
              { href: "/prayer-ranks", label: "فضائل الصلاة" },
              { href: "/tahara", label: "الطهارة وأحكامها" },
              { href: "/adhkar", label: "الأذكار اليومية" },
              { href: "/sunan-yawmiyya", label: "السنن اليومية" },
              { href: "/qibla", label: "اتجاه القبلة" },
            ].map((r) => (
              <a key={r.href} href={r.href} className="sg-related__link">{r.label}</a>
            ))}
          </div>
        </nav>
      </div>
    </main>
  );
}
