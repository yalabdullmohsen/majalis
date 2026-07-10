import { useEffect, useState } from "react";
import { applyPageSeo } from "../lib/seo";


type UQTab = "nuzul" | "jam" | "tafsir" | "ijaz" | "ahkam";

const TABS: { id: UQTab; label: string; icon: string }[] = [
  { id: "nuzul",  label: "النزول والتنجيم", icon: "🌙" },
  { id: "jam",    label: "الجمع والتدوين",  icon: "📜" },
  { id: "tafsir", label: "التفسير وأنواعه",  icon: "🔍" },
  { id: "ijaz",   label: "الإعجاز القرآني",  icon: "✨" },
  { id: "ahkam",  label: "أحكام القرآن",     icon: "⚖️" },
];

/* ── النزول ── */
const NUZUL_FACTS = [
  { label: "مدة النزول", value: "23 سنة (13 مكة + 10 المدينة)" },
  { label: "أول ما نزل", value: "اقرأ باسم ربك، سورة العلق: 1-5" },
  { label: "آخر ما نزل", value: "اليوم أكملت لكم دينكم، المائدة: 3 (يوم عرفة)" },
  { label: "أول المكي", value: "سورة العلق" },
  { label: "أطول السور", value: "البقرة (286 آية)" },
  { label: "أقصر السور", value: "الكوثر (3 آيات)" },
  { label: "سور المدنية", value: "28 سورة" },
  { label: "السور المكية", value: "86 سورة" },
];

const NUZUL_TYPES = [
  { title: "منجّم (مفرّق)", desc: "نزل القرآن مفرّقاً لا دفعة واحدة، ليُثبّت به فؤاد النبي ﷺ ويتلقّاه الصحابة ويعمل الناس به آية آية.", dalil: "وَقُرْآنًا فَرَقْنَاهُ لِتَقْرَأَهُ عَلَى النَّاسِ عَلَىٰ مُكْثٍ، الإسراء: 106" },
  { title: "مكي ومدني", desc: "المكي ما نزل قبل الهجرة ولو في غير مكة، موضوعه العقيدة والتوحيد. المدني ما نزل بعد الهجرة، موضوعه التشريع والأحكام.", dalil: "ضابط الاصطلاح: الزمان لا المكان" },
  { title: "أسباب النزول", desc: "أحداث أو أسئلة كانت سبباً مباشراً لنزول الآيات، العبرة بعموم اللفظ لا بخصوص السبب.", dalil: "العبرة بعموم اللفظ لا بخصوص السبب، قاعدة أصولية" },
];

/* ── الجمع والتدوين ── */
const JAM_STAGES = [
  {
    stage: "في عهد النبي ﷺ",
    icon: "1",
    items: [
      "حُفظ في الصدور، كان الصحابة يحفظونه غيباً",
      "كُتب في الرقاع والأكتاف والعُسُب (جريد النخل)",
      "كان الكتّاب المعيّنون يدوّنون ما يُملى عليهم",
      "لم يُجمع في مصحف واحد في حياته ﷺ",
    ],
  },
  {
    stage: "في عهد أبي بكر (12 هـ)",
    icon: "2",
    items: [
      "بعد معركة اليمامة واستشهاد 70 قارئاً أقترح عمر الجمع",
      "أمر أبو بكر زيد بن ثابت بجمع القرآن",
      "اشترط زيد التثبت بالكتابة المكتوبة + شاهدَين",
      "وُجد في مصحف واحد محفوظ عند أبي بكر ثم حفصة",
    ],
  },
  {
    stage: "في عهد عثمان (25 هـ)",
    icon: "3",
    items: [
      "بسبب اختلاف الصحابة في القراءات أمر عثمان بنسخ المصاحف",
      "أرسل المصاحف العثمانية إلى الأمصار (7 نسخ)",
      "أحرق ما سواها من صحف الآحاد غير المتّفق عليها",
      "بنى على مصحف حفصة وزاد نسخ لجنة من الصحابة",
    ],
  },
];

/* ── التفسير ── */
const TAFSIR_TYPES = [
  { title: "التفسير بالمأثور", icon: "📖", desc: "يعتمد على تفسير القرآن بالقرآن ثم بالسنة ثم بكلام الصحابة والتابعين. أعلاه مرتبةً وأصحّه.", ex: "تفسير الطبري، ابن كثير" },
  { title: "التفسير بالرأي", icon: "🧠", desc: "يعتمد على الاجتهاد مع التزام ضوابط اللغة والشريعة، قسمٌ محمود وقسمٌ مذموم.", ex: "تفسير الزمخشري، تفسير الرازي" },
  { title: "التفسير الإشاري", icon: "🔮", desc: "يستنبط الصوفية معاني باطنية من الآيات، مقبول إذا وافق الظاهر ولم يُعارض الشريعة.", ex: "تفسير القشيري" },
  { title: "التفسير العلمي", icon: "🔬", desc: "يستنبط الحقائق العلمية الكونية من القرآن، مشروط بعدم الجزم والتزام الموضوعية.", ex: "التفسير العلمي للزنداني" },
];

const MUFASSIRUN = [
  { name: "ابن جرير الطبري", kitab: "جامع البيان", era: "ت 310هـ", note: "أوثق تفسير بالمأثور" },
  { name: "ابن كثير", kitab: "تفسير القرآن العظيم", era: "ت 774هـ", note: "أشهر التفاسير وأيسرها" },
  { name: "القرطبي", kitab: "الجامع لأحكام القرآن", era: "ت 671هـ", note: "عمدة في آيات الأحكام" },
  { name: "السعدي", kitab: "تيسير الكريم الرحمن", era: "ت 1376هـ", note: "يسير واضح للجميع" },
  { name: "ابن عاشور", kitab: "التحرير والتنوير", era: "ت 1393هـ", note: "أشمل تفاسير العصر الحديث" },
];

/* ── الإعجاز ── */
const IJAZ_TYPES = [
  { title: "الإعجاز اللغوي والبياني", icon: "🗣️", desc: "أسلوب القرآن يفوق كلام البشر في الفصاحة والبلاغة والجمال، عجز العرب عن معارضته وهم أهل اللغة." },
  { title: "الإعجاز التشريعي", icon: "⚖️", desc: "منظومة تشريعية متكاملة تحكم حياة الإنسان والمجتمع، جاء بها رجل لم يتلقَّ تعليماً." },
  { title: "الإعجاز العلمي", icon: "🔭", desc: "إشارات علمية دقيقة في مجالات الفلك والبيولوجيا وعلم الأجنة وعلم البحار، لم يكن للبشر علم بها." },
  { title: "الإعجاز الغيبي", icon: "🔮", desc: "إخبار بغيوب مضت وغيوب مستقبلية تحقق كثيرٌ منها، كانتصار الروم وحفظ فرعون جسداً." },
  { title: "إعجاز الحفظ والانتشار", icon: "🌍", desc: "وحده من بين الكتب السماوية بقي محفوظاً بالنص والسند دون تحريف، قال تعالى: (إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ)." },
  { title: "التحدي المفتوح", icon: "🏆", desc: "طالب القرآن بمثله ثم بعشر سور ثم بسورة واحدة، وظل التحدي قائماً إلى يوم القيامة دون مجاراة." },
];

/* ── أحكام القرآن ── */
const MUHKAM_MUTASHABIH = {
  muhkam: {
    title: "المحكم",
    def: "ما تبيّن معناه واستقل بنفسه ولا لبس فيه، وهو أم الكتاب.",
    ex: ["قل هو الله أحد", "لا إله إلا الله", "آيات الأحكام الصريحة"],
  },
  mutashabih: {
    title: "المتشابه",
    def: "ما خفي معناه ولم يتضح وحده، كالحروف المقطعة والصفات الإلهية.",
    ex: ["الم، حم، كهيعص", "الرحمن على العرش استوى", "يَدُ اللَّهِ فَوْقَ أَيْدِيهِمْ"],
  },
};

const NASKH_TYPES = [
  { title: "نسخ الحكم والتلاوة", desc: "رُفع الحكم ورُفع النص معاً، وهو الأقل.", ex: "عشر رضعات معلومات كن يُحرّمن" },
  { title: "نسخ التلاوة دون الحكم", desc: "رُفع النص وبقي حكمه معمولاً به.", ex: "الشيخ والشيخة إذا زنيا فارجموهما" },
  { title: "نسخ الحكم دون التلاوة", desc: "أكثر أنواع النسخ وأشهرها، بقي النص يُتلى ورُفع حكمه.", ex: "نسخ وجوب التصدق قبل مناجاة النبي ﷺ" },
];

export default function UlumQuranPage() {
  useEffect(() => {
      applyPageSeo({
      path: "/ulum-quran",
      title: "علوم القرآن الكريم، المجلس العلمي",
      description: "مقدمة شاملة في علوم القرآن: النزول والجمع والتفسير والإعجاز والمحكم والمتشابه والناسخ والمنسوخ",
      keywords: ["علوم القرآن", "أسباب النزول", "الناسخ والمنسوخ", "المحكم والمتشابه", "إعجاز القرآن"],
    });
  }, []);

  const [tab, setTab] = useState<UQTab>("nuzul");
  const [openJam, setOpenJam] = useState<number | null>(null);

  return (
    <main className="uq-page" dir="rtl">
      {/* hero */}
      <section className="uq-hero">
        <div className="uq-hero__badge">علوم القرآن</div>
        <h1 className="uq-hero__title">علوم القرآن الكريم</h1>
        <p className="uq-hero__sub">
          مقدمة شاملة في علوم القرآن: من النزول والجمع إلى الإعجاز والتفسير والأحكام
        </p>
        <div className="uq-stats-row">
          {[
            { num: "114", label: "سورة" },
            { num: "6236", label: "آية" },
            { num: "30", label: "جزءاً" },
            { num: "23", label: "سنة نزول" },
          ].map((s) => (
            <div key={s.label} className="uq-stat">
              <span className="uq-stat__num">{s.num}</span>
              <span className="uq-stat__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* tabs */}
      <div className="uq-tabs-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`uq-tab${tab === t.id ? " uq-tab--active" : ""}`}
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="uq-body">

        {/* ── النزول ── */}
        {tab === "nuzul" && (
          <div className="uq-section">
            <div className="uq-facts-grid">
              {NUZUL_FACTS.map((f) => (
                <div key={f.label} className="uq-fact-item">
                  <span className="uq-fact-item__label">{f.label}</span>
                  <span className="uq-fact-item__value">{f.value}</span>
                </div>
              ))}
            </div>

            <h2 className="uq-subhead">أنواع النزول</h2>
            <div className="uq-types-list">
              {NUZUL_TYPES.map((n) => (
                <div key={n.title} className="uq-type-card">
                  <h3 className="uq-type-card__title">{n.title}</h3>
                  <p className="uq-type-card__desc">{n.desc}</p>
                  {n.dalil && (
                    <div className="uq-dalil-box">
                      <span className="uq-dalil-box__icon">📜</span>
                      <span>{n.dalil}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── الجمع ── */}
        {tab === "jam" && (
          <div className="uq-section">
            <p className="uq-lead">
              مرّ جمع القرآن وتدوينه بثلاث مراحل تاريخية متتالية ضمنت حفظه من الضياع والتحريف
            </p>
            <div className="uq-jam-list">
              {JAM_STAGES.map((s, i) => {
                const isOpen = openJam === i;
                return (
                  <div key={i} className={`uq-jam-card${isOpen ? " uq-jam-card--open" : ""}`}>
                    <button
                      type="button"
                      className="uq-jam-head"
                      onClick={() => setOpenJam(isOpen ? null : i)}
                    >
                      <span className="uq-jam-num">{s.icon}</span>
                      <span className="uq-jam-title">{s.stage}</span>
                      <span className={`uq-jam-chevron${isOpen ? " uq-jam-chevron--open" : ""}`}>▾</span>
                    </button>
                    {isOpen && (
                      <ul className="uq-jam-body">
                        {s.items.map((item) => (
                          <li key={item} className="uq-jam-item">{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="uq-info-box">
              <span className="uq-info-box__icon">ℹ️</span>
              <p>الفرق بين جمع أبي بكر وجمع عثمان: الأول جمع المتفرق في مكان واحد، والثاني وحّد القراءة على حرف واحد وأرسل نسخاً موحّدة للأمصار.</p>
            </div>
          </div>
        )}

        {/* ── التفسير ── */}
        {tab === "tafsir" && (
          <div className="uq-section">
            <div className="uq-tafsir-types">
              {TAFSIR_TYPES.map((t) => (
                <div key={t.title} className="uq-tafsir-card">
                  <span className="uq-tafsir-icon">{t.icon}</span>
                  <div>
                    <h3 className="uq-tafsir-title">{t.title}</h3>
                    <p className="uq-tafsir-desc">{t.desc}</p>
                    <span className="uq-tafsir-ex">مثال: {t.ex}</span>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="uq-subhead">أبرز المفسّرين وكتبهم</h2>
            <div className="uq-mufassirun">
              {MUFASSIRUN.map((m) => (
                <div key={m.name} className="uq-mufassir-row">
                  <div className="uq-mufassir-info">
                    <span className="uq-mufassir-name">{m.name}</span>
                    <span className="uq-mufassir-era">{m.era}</span>
                  </div>
                  <div>
                    <span className="uq-mufassir-kitab">{m.kitab}</span>
                    <span className="uq-mufassir-note">{m.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── الإعجاز ── */}
        {tab === "ijaz" && (
          <div className="uq-section">
            <div className="uq-ijaz-grid">
              {IJAZ_TYPES.map((j) => (
                <div key={j.title} className="uq-ijaz-card">
                  <span className="uq-ijaz-icon">{j.icon}</span>
                  <h3 className="uq-ijaz-title">{j.title}</h3>
                  <p className="uq-ijaz-desc">{j.desc}</p>
                </div>
              ))}
            </div>

            <div className="uq-ijaz-ayah">
              <p className="uq-ijaz-ayah__text">
                قُل لَّئِنِ اجْتَمَعَتِ الْإِنسُ وَالْجِنُّ عَلَىٰ أَن يَأْتُوا بِمِثْلِ هَٰذَا الْقُرْآنِ لَا يَأْتُونَ بِمِثْلِهِ
                وَلَوْ كَانَ بَعْضُهُمْ لِبَعْضٍ ظَهِيرًا
              </p>
              <cite className="uq-ijaz-ayah__ref">الإسراء: 88</cite>
            </div>
          </div>
        )}

        {/* ── أحكام القرآن ── */}
        {tab === "ahkam" && (
          <div className="uq-section">
            <h2 className="uq-subhead">المحكم والمتشابه</h2>
            <div className="uq-mm-grid">
              {[MUHKAM_MUTASHABIH.muhkam, MUHKAM_MUTASHABIH.mutashabih].map((m) => (
                <div key={m.title} className="uq-mm-card">
                  <h3 className="uq-mm-title">{m.title}</h3>
                  <p className="uq-mm-def">{m.def}</p>
                  <div className="uq-mm-examples">
                    <span className="uq-mm-examples__label">أمثلة:</span>
                    {m.ex.map((e) => (
                      <span key={e} className="uq-mm-examples__item">{e}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <h2 className="uq-subhead uq-subhead--mt">الناسخ والمنسوخ</h2>
            <p className="uq-lead">النسخ لغةً: الإزالة. اصطلاحاً: رفع حكم شرعي متقدم بحكم متأخر، وللنسخ ثلاثة أنواع:</p>
            <div className="uq-naskh-list">
              {NASKH_TYPES.map((n, i) => (
                <div key={i} className="uq-naskh-card">
                  <div className="uq-naskh-num">{i + 1}</div>
                  <div>
                    <h3 className="uq-naskh-title">{n.title}</h3>
                    <p className="uq-naskh-desc">{n.desc}</p>
                    <span className="uq-naskh-ex">مثال: {n.ex}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="uq-info-box uq-info-box--mt">
              <span className="uq-info-box__icon">📌</span>
              <p>آيات الأحكام في القرآن تُقدَّر بـ 500 آية، بعض العلماء يقدّرها بـ 200 آية آية صريحة الحكم.</p>
            </div>
          </div>
        )}

        {/* related */}
        <nav className="uq-related" aria-label="صفحات ذات صلة">
          <h2 className="uq-related__title">استكشف أيضاً</h2>
          <div className="uq-related__grid">
            {[
              { href: "/quran", label: "المصحف الشريف" },
              { href: "/quran/tajweed", label: "علم التجويد" },
              { href: "/quran-hub", label: "مركز القرآن" },
              { href: "/hadith-science", label: "مصطلح الحديث" },
              { href: "/tawhid", label: "التوحيد" },
              { href: "/arbaeen-nawawi", label: "الأربعون النووية" },
            ].map((r) => (
              <a key={r.href} href={r.href} className="uq-related__link">{r.label}</a>
            ))}
          </div>
        </nav>
      </div>
    </main>
  );
}
