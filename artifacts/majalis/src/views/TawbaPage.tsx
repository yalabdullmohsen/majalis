import { useEffect, useState } from "react";
import { applyPageSeo } from "../lib/seo";
import { ShareButtons } from "@/components/ContentActions";


type TawbaTab = "shurut" | "anwaa" | "adhkar" | "mawani" | "athaar";

interface TabDef {
  id: TawbaTab;
  label: string;
  icon: string;
}

const TABS: TabDef[] = [
  { id: "shurut",  label: "شروط التوبة",    icon: "✅" },
  { id: "anwaa",   label: "أنواع وأحكام",    icon: "📖" },
  { id: "adhkar",  label: "أذكار الاستغفار", icon: "🤲" },
  { id: "mawani",  label: "موانع التوبة",    icon: "⛔" },
  { id: "athaar",  label: "آثار التوبة",     icon: "🌱" },
];

/* ── شروط التوبة ── */
interface Shart {
  num: number;
  title: string;
  desc: string;
  dalil?: string;
}
const SHURUT: Shart[] = [
  { num: 1, title: "الإقلاع عن الذنب", desc: "الكفّ الفوري والكامل عن المعصية التي يتوب منها، ولا تصح التوبة مع الاستمرار في الذنب.", dalil: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ، الزمر: 53" },
  { num: 2, title: "الندم على ما فات", desc: "أن يتألم العبد ويحزن على ما صدر منه من معصية، وهو من أعظم شروط التوبة.", dalil: "الندم توبة، الحديث" },
  { num: 3, title: "العزم على عدم العودة", desc: "تصميم قلبي حقيقي بعدم الرجوع إلى المعصية في المستقبل، وهو يختلف عن مجرد القول." },
  { num: 4, title: "ردّ المظالم (إن كانت)", desc: "إذا كانت التوبة من حق آدمي كسرقة أو غيبة فلا بد من ردّ الحق أو طلب العفو من صاحبه.", dalil: "من كان لأخيه عنده ظُلامة من مال أو عرض فليتحلّله، البخاري" },
  { num: 5, title: "أن تكون قبل الغرغرة", desc: "تُقبل التوبة ما لم تُغرغر الروح (ما لم يبلغ الأجل)، فإذا حضر الأجل أُغلق باب التوبة.", dalil: "إن الله يقبل توبة العبد ما لم يُغرغر، الترمذي" },
];

/* ── أنواع وأحكام ── */
interface Nawaa {
  title: string;
  icon: string;
  desc: string;
  hukm: string;
}
const ANWAA: Nawaa[] = [
  {
    title: "التوبة من الكبائر",
    icon: "🔥",
    desc: "كالزنا والقتل والسحر والشرك وعقوق الوالدين، تجب التوبة منها فوراً ويُخشى إن ماتَ عليها.",
    hukm: "واجبة فوراً",
  },
  {
    title: "التوبة من الصغائر",
    icon: "⚠️",
    desc: "تُكفَّر بالحسنات وباجتناب الكبائر، لكن التوبة منها أفضل وأعلى درجة وأدعى للقبول.",
    hukm: "مستحبة",
  },
  {
    title: "التوبة الكلية",
    icon: "♻️",
    desc: "التوبة الشاملة من جميع الذنوب والعصيان دفعة واحدة، وهي المراد بقوله: (تُوبُوا إِلَى اللَّهِ تَوْبَةً نَّصُوحًا).",
    hukm: "مأمور بها",
  },
  {
    title: "التوبة من حق الله",
    icon: "🕌",
    desc: "كتارك الصلاة والصيام، يتوب ويستأنف العبادة ويُكثر من النوافل جبراً للفريضة.",
    hukm: "واجبة",
  },
  {
    title: "التوبة من حق الإنسان",
    icon: "🤝",
    desc: "كالسرقة والغيبة والنميمة، لا تكتمل إلا بردّ الحق أو الاستحلال ممن وقع عليه الظلم.",
    hukm: "واجبة مع الاستحلال",
  },
];

/* ── أذكار الاستغفار ── */
interface Dhikr {
  arabic: string;
  transliteration?: string;
  reward: string;
  source: string;
  times?: string;
}
const ADHKAR: Dhikr[] = [
  {
    arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ",
    reward: "غُفر له وإن كان فرّ من الزحف",
    source: "أبو داود والترمذي",
    times: "مرة واحدة",
  },
  {
    arabic: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ",
    reward: "كان النبي ﷺ يقولها مئة مرة في المجلس",
    source: "أبو داود، صحيح",
    times: "100 مرة",
  },
  {
    arabic: "سَيِّدُ الاسْتِغْفَار: اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    reward: "من قالها صباحاً ثم مات دخل الجنة، وكذلك مساءً",
    source: "البخاري",
    times: "صباحاً ومساءً",
  },
  {
    arabic: "اللَّهُمَّ اغْفِرْ لِي ذَنْبِي كُلَّهُ دِقَّهُ وَجِلَّهُ وَأَوَّلَهُ وَآخِرَهُ وَعَلَانِيَتَهُ وَسِرَّهُ",
    reward: "شامل لكل أنواع الذنوب",
    source: "مسلم",
    times: "متكررة",
  },
  {
    arabic: "أَسْتَغْفِرُ اللَّهَ",
    reward: "«من لزم الاستغفار جعل الله له من كل هم فرجاً ومن كل ضيق مخرجاً ورزقه من حيث لا يحتسب»",
    source: "أبو داود، صحيح",
    times: "70+ مرة يومياً",
  },
];

/* ── موانع قبول التوبة ── */
const MAWANI: { title: string; desc: string }[] = [
  { title: "الإصرار على الذنب", desc: "استمرار العبد في المعصية مع إظهار التوبة بالكلام، وهو تناقض يُفسد التوبة." },
  { title: "اليأس من رحمة الله", desc: "القنوط من العفو الإلهي كبيرة بذاتها، قال تعالى: (لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ)." },
  { title: "الأمن من مكر الله", desc: "الاتكال المذموم على العفو مع التسويف والتمادي في الذنوب، قال تعالى: (أَفَأَمِنُوا مَكْرَ اللَّهِ)." },
  { title: "تأخير التوبة حتى الاحتضار", desc: "قال تعالى: (وَلَيْسَتِ التَّوْبَةُ لِلَّذِينَ يَعْمَلُونَ السَّيِّئَاتِ حَتَّىٰ إِذَا حَضَرَ أَحَدَهُمُ الْمَوْتُ قَالَ إِنِّي تُبْتُ الْآنَ)." },
  { title: "عدم ردّ المظالم", desc: "إذا كانت التوبة من حق آدمي فلا يُقبل استغفار المرء ما لم يردّ الحق أو يستحلّ صاحبه." },
  { title: "التوبة بلا عزم صادق", desc: "إذا كانت التوبة على اللسان فقط دون إرادة حقيقية للترك فهي كاذبة لا تُقبل." },
];

/* ── آثار التوبة ── */
const ATHAAR: { icon: string; title: string; desc: string; dalil?: string }[] = [
  { icon: "❤️", title: "محبة الله للتائبين", desc: "قال تعالى: (إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ)، البقرة: 222" },
  { icon: "🌧️", title: "إرسال السماء مدراراً", desc: "«استغفروا ربكم إنه كان غفاراً يُرسل السماء عليكم مدراراً»، نوح: 10-11", dalil: "سورة نوح" },
  { icon: "✨", title: "تبديل السيئات حسنات", desc: "قال تعالى: (إِلَّا مَن تَابَ وَآمَنَ وَعَمِلَ عَمَلًا صَالِحًا فَأُولَٰئِكَ يُبَدِّلُ اللَّهُ سَيِّئَاتِهِمْ حَسَنَاتٍ)، الفرقان: 70" },
  { icon: "🚪", title: "فتح أبواب الرزق", desc: "«من لزم الاستغفار جعل الله له من كل هم فرجاً ومن كل ضيق مخرجاً ورزقه من حيث لا يحتسب»، أبو داود" },
  { icon: "😌", title: "انشراح الصدر وطمأنينة القلب", desc: "التوبة تُزيل ثقل المعاصي عن القلب وتملأه بالإيمان والأنس بالله تعالى." },
  { icon: "🌟", title: "فرحة الله بتوبة العبد", desc: "«لله أشد فرحاً بتوبة عبده من رجل...»، مثل ضربه النبي ﷺ لشدة فرح الله بالتائب، البخاري ومسلم" },
  { icon: "💎", title: "محو الذنوب ورفع الدرجات", desc: "«التائب من الذنب كمن لا ذنب له»، ابن ماجه. والتوبة الصادقة ترفع صاحبها إلى منازل المقربين." },
  { icon: "🛡️", title: "الحماية من عذاب الآخرة", desc: "قال تعالى: (وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا)، النساء: 110" },
];

export default function TawbaPage() {
  useEffect(() => {
      applyPageSeo({
      path: "/tawba",
      title: "التوبة والاستغفار، المجلس العلمي",
      description: "دليل شامل للتوبة النصوح: شروطها وأنواعها وآداب الاستغفار وأفضل أدعية المغفرة",
      keywords: ["التوبة", "الاستغفار", "التوبة النصوح", "شروط التوبة", "أدعية المغفرة"],
    });
  }, []);

  const [tab, setTab] = useState<TawbaTab>("shurut");
  const [openDhikr, setOpenDhikr] = useState<number | null>(null);

  return (
    <main className="tw-page" dir="rtl">
      {/* hero */}
      <section className="tw-hero">
        <div className="tw-hero__badge">التزكية والسلوك</div>
        <h1 className="tw-hero__title">التوبة والاستغفار</h1>
        <p className="tw-hero__sub">
          باب التوبة مفتوح ما لم تطلع الشمس من مغربها، لا تيأس من رحمة الله
        </p>
        <div className="tw-ayah">
          <p className="tw-ayah__text">
            قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ
            ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ
          </p>
          <cite className="tw-ayah__ref">الزمر: 53</cite>
        </div>
      </section>

      {/* tabs */}
      <div className="tw-tabs-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tw-tab${tab === t.id ? " tw-tab--active" : ""}`}
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
          >
            <span className="tw-tab__icon">{t.icon}</span>
            <span className="tw-tab__label">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="tw-body">
        {/* ── شروط التوبة ── */}
        {tab === "shurut" && (
          <div className="tw-section">
            <p className="tw-section-lead">
              اتفق العلماء على أن للتوبة شروطاً لا تصح إلا بها، وتزداد شرطاً إذا تعلّقت بحق آدمي
            </p>
            <div className="tw-shurut-list">
              {SHURUT.map((s) => (
                <div key={s.num} className="tw-shart-card">
                  <div className="tw-shart-num">{s.num}</div>
                  <div className="tw-shart-content">
                    <h3 className="tw-shart-title">{s.title}</h3>
                    <p className="tw-shart-desc">{s.desc}</p>
                    {s.dalil && (
                      <div className="tw-shart-dalil">
                        <span className="tw-shart-dalil__icon">📜</span>
                        <span>{s.dalil}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="tw-note-box">
              <span className="tw-note-box__icon">💡</span>
              <div>
                <strong>ملاحظة:</strong> إذا كانت التوبة من معصية تتعلق بحق شخص آخر يُزاد شرط رابع هو ردّ الحق أو الاستحلال، فتصبح الشروط خمسة.
              </div>
            </div>
          </div>
        )}

        {/* ── أنواع وأحكام ── */}
        {tab === "anwaa" && (
          <div className="tw-section">
            <div className="tw-anwaa-grid">
              {ANWAA.map((n) => (
                <div key={n.title} className="tw-nawaa-card">
                  <div className="tw-nawaa-head">
                    <span className="tw-nawaa-icon">{n.icon}</span>
                    <div>
                      <span className="tw-nawaa-title">{n.title}</span>
                      <span className={`tw-nawaa-hukm tw-nawaa-hukm--${n.hukm.includes("واجب") ? "wajib" : "mustahabb"}`}>{n.hukm}</span>
                    </div>
                  </div>
                  <p className="tw-nawaa-desc">{n.desc}</p>
                </div>
              ))}
            </div>

            <div className="tw-tawba-nasuh">
              <h3 className="tw-tawba-nasuh__title">التوبة النصوح</h3>
              <p className="tw-tawba-nasuh__text">
                هي التوبة الخالصة الصادقة التي لا يرجع صاحبها إلى الذنب، سُمّيت «نصوحاً» من النصح أي الإخلاص.
                قال تعالى: <strong>(يَا أَيُّهَا الَّذِينَ آمَنُوا تُوبُوا إِلَى اللَّهِ تَوْبَةً نَّصُوحًا)</strong>، التحريم: 8
              </p>
              <p className="tw-tawba-nasuh__text">
                قال عمر رضي الله عنه: «التوبة النصوح أن يتوب من الذنب ثم لا يعود إليه كما لا يعود اللبن إلى الضرع».
              </p>
            </div>
          </div>
        )}

        {/* ── أذكار الاستغفار ── */}
        {tab === "adhkar" && (
          <div className="tw-section">
            <p className="tw-section-lead">أفضل صيغ الاستغفار المأثورة عن النبي ﷺ</p>
            <div className="tw-dhikr-list">
              {ADHKAR.map((d, i) => {
                const isOpen = openDhikr === i;
                return (
                  <div key={i} className={`tw-dhikr-card${isOpen ? " tw-dhikr-card--open" : ""}`}>
                    <button
                      type="button"
                      className="tw-dhikr-head"
                      onClick={() => setOpenDhikr(isOpen ? null : i)}
                    >
                      <span className="tw-dhikr-num">{i + 1}</span>
                      {d.times && <span className="tw-dhikr-times">{d.times}</span>}
                      <span className={`tw-dhikr-chevron${isOpen ? " tw-dhikr-chevron--open" : ""}`}>▾</span>
                    </button>
                    <p className="tw-dhikr-arabic">{d.arabic}</p>
                    {isOpen && (
                      <div className="tw-dhikr-body">
                        <div className="tw-dhikr-reward">
                          <span className="tw-dhikr-reward__icon">⭐</span>
                          <span>{d.reward}</span>
                        </div>
                        <span className="tw-dhikr-source">المصدر: {d.source}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="tw-afdhal-awqat">
              <h3 className="tw-afdhal-awqat__title">أفضل أوقات الاستغفار</h3>
              <div className="tw-awqat-grid">
                {[
                  { waqt: "الأسحار", desc: "آخر الليل قبيل الفجر، (وَبِالْأَسْحَارِ هُمْ يَسْتَغْفِرُونَ)" },
                  { waqt: "بعد الصلوات", desc: "ثلاث مرات بعد كل صلاة، من هدي النبي ﷺ" },
                  { waqt: "يوم الجمعة", desc: "فيه ساعة إجابة تُستحب فيها الأدعية والاستغفار" },
                  { waqt: "بين الأذان والإقامة", desc: "لا يُرد فيها الدعاء، من أفضل أوقات الاستجابة" },
                  { waqt: "عند المطر", desc: "الدعاء لا يُرد وقت نزول الغيث" },
                  { waqt: "في السجود", desc: "أقرب ما يكون العبد من ربه وهو ساجد، فأكثر من الدعاء" },
                ].map((a) => (
                  <div key={a.waqt} className="tw-awqat-item">
                    <span className="tw-awqat-item__waqt">{a.waqt}</span>
                    <span className="tw-awqat-item__desc">{a.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── موانع التوبة ── */}
        {tab === "mawani" && (
          <div className="tw-section">
            <p className="tw-section-lead">أمور تحول دون قبول التوبة أو صحتها، يجب الحذر منها</p>
            <div className="tw-mawani-list">
              {MAWANI.map((m, i) => (
                <div key={i} className="tw-mani-card">
                  <div className="tw-mani-num">⛔</div>
                  <div>
                    <h3 className="tw-mani-title">{m.title}</h3>
                    <p className="tw-mani-desc">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="tw-hope-box">
              <h3 className="tw-hope-box__title">الأمل في رحمة الله</h3>
              <p className="tw-hope-box__text">
                مع الحذر من موانع التوبة، لا تنسَ أن رحمة الله وسعت كل شيء، ولو كانت ذنوبك بلغت عنان السماء
                ثم استغفرت غفر الله لك. قال ﷺ: «إن الله يبسط يده بالليل ليتوب مسيء النهار ويبسط يده بالنهار ليتوب مسيء الليل»، مسلم.
              </p>
            </div>
          </div>
        )}

        {/* ── آثار التوبة ── */}
        {tab === "athaar" && (
          <div className="tw-section">
            <p className="tw-section-lead">ثمرات التوبة الصادقة وآثارها في الدنيا والآخرة</p>
            <div className="tw-athaar-grid">
              {ATHAAR.map((a) => (
                <div key={a.title} className="tw-athar-card">
                  <span className="tw-athar-icon">{a.icon}</span>
                  <h3 className="tw-athar-title">{a.title}</h3>
                  <p className="tw-athar-desc">{a.desc}</p>
                </div>
              ))}
            </div>

            <blockquote className="tw-hadith-box">
              <p className="tw-hadith-box__text">
                «لو أخطأتم حتى تبلغ خطاياكم السماء ثم تبتم لتاب الله عليكم»
              </p>
              <cite className="tw-hadith-box__ref">ابن ماجه، صحيح</cite>
            </blockquote>
          </div>
        )}

        <div className="twh-share">
          <ShareButtons title="التوبة والاستغفار — المجلس العلمي" url="https://majlisilm.com/tawba" />
        </div>

        {/* related */}
        <nav className="tw-related" aria-label="صفحات ذات صلة">
          <h2 className="tw-related__title">استكشف أيضاً</h2>
          <div className="tw-related__grid">
            {[
              { href: "/adhkar", label: "الأذكار اليومية" },
              { href: "/duas", label: "الأدعية الشرعية" },
              { href: "/fadail-aamal", label: "فضائل الأعمال" },
              { href: "/akhlaq", label: "الأخلاق الإسلامية" },
              { href: "/daily-wird", label: "الورد اليومي" },
              { href: "/arkan-iman", label: "أركان الإيمان" },
            ].map((r) => (
              <a key={r.href} href={r.href} className="tw-related__link">{r.label}</a>
            ))}
          </div>
        </nav>
      </div>
    </main>
  );
}
