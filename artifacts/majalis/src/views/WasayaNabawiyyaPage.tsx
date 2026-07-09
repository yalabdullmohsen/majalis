"use client";

import { useEffect, useState } from "react";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/elite-2026.css";

/* ══════════════════════════════════════════════════════════════════
   §248 — الوصايا النبوية  (.wn-*)
   ══════════════════════════════════════════════════════════════════ */

type Tab = "kabira" | "khasisa" | "lishakhsiyya" | "lil-umma" | "amal";

interface Wasiyya {
  id: number;
  title: string;
  text: string;
  source: string;
  benefit?: string;
  category?: string;
}

/* ══ وصايا نبوية كبيرة جامعة ══ */
const WASAYA_KABIRA: Wasiyya[] = [
  {
    id: 1,
    title: "وصية الإسلام الجامعة",
    text: "قال رجل للنبي ﷺ: أوصني. قال: «لا تغضب». فردَّدها مراراً قال: «لا تغضب».",
    source: "البخاري: ٦١١٦",
    benefit: "الغضب جامع للرذائل كما أن ضبطه جامع للفضائل. قال ﷺ: «ليس الشديد بالصُّرَعة، إنما الشديد الذي يملك نفسه عند الغضب».",
    category: "الأخلاق",
  },
  {
    id: 2,
    title: "وصية لمعاذ بن جبل",
    text: "قال ﷺ لمعاذ: «يا معاذ، إني أحبك، أوصيك: لا تدعنَّ في دُبُرِ كل صلاة أن تقول: اللهم أعنِّي على ذكرك وشكرك وحسن عبادتك».",
    source: "أبو داود: ١٥٢٢",
    benefit: "هذا الدعاء وصية يومية تحفظ العبد على الديمومة في الطاعة.",
    category: "العبادة",
  },
  {
    id: 3,
    title: "وصية لأبي هريرة",
    text: "قال ﷺ لأبي هريرة: «يا أبا هريرة، كن ورعاً تكن أعبد الناس، وكن قنِعاً تكن أشكر الناس، وأحبَّ للناس ما تحب لنفسك تكن مؤمناً، وأحسن مجاورة من جاورك تكن مسلماً».",
    source: "ابن ماجه: ٤٢١٧",
    benefit: "وصية جامعة لمنظومة من القيم: الورع، والقناعة، والمعاملة الحسنة.",
    category: "الأخلاق",
  },
  {
    id: 4,
    title: "وصية لأبي ذر الغفاري",
    text: "قال ﷺ لأبي ذر: «اتقِ الله حيثما كنت، وأتبِع السيئة الحسنة تمحُها، وخالق الناس بخُلُق حسن».",
    source: "الترمذي: ١٩٨٧",
    benefit: "ثلاثية ذهبية: التقوى أساس، التوبة علاج، حسن الخلق منهج.",
    category: "الأخلاق",
  },
  {
    id: 5,
    title: "وصية لابن عباس رضي الله عنهما",
    text: "قال ﷺ: «يا غلام، إني أعلِّمك كلمات: احفظ الله يحفظك، احفظ الله تجده تُجاهك، إذا سألت فاسأل الله، وإذا استعنت فاستعن بالله».",
    source: "الترمذي: ٢٥١٦",
    benefit: "قواعد التوكل الكامل: حفظ الله بالطاعة، وإفراده بالسؤال والاستعانة.",
    category: "التوحيد",
  },
  {
    id: 6,
    title: "وصية بحقوق الجار",
    text: "«ما زال جبريل يوصيني بالجار حتى ظننت أنه سيورِّثه».",
    source: "البخاري: ٦٠١٤",
    benefit: "حق الجار من أعظم الحقوق وأوكدها في الإسلام، وهو علامة صدق الإيمان.",
    category: "المعاملات",
  },
  {
    id: 7,
    title: "وصية الصمت",
    text: "«من كان يؤمن بالله واليوم الآخر فليقل خيراً أو ليصمت».",
    source: "البخاري: ٦٠١٨",
    benefit: "ضبط اللسان أصل الأخلاق. قال ﷺ: «المسلم من سلم المسلمون من لسانه ويده».",
    category: "الأخلاق",
  },
  {
    id: 8,
    title: "وصية التواضع",
    text: "«إن الله أوحى إليَّ أن تواضعوا حتى لا يفخر أحد على أحد ولا يَبغِ أحد على أحد».",
    source: "مسلم: ٢٨٦٥",
    benefit: "التواضع ليس ذلَّة بل عظمة حقيقية. المتكبر يرفضه الناس والمتواضع يحبونه.",
    category: "الأخلاق",
  },
  {
    id: 9,
    title: "وصية اغتنام الصحة والفراغ",
    text: "«اغتنم خمساً قبل خمس: شبابك قبل هرمك، وصحتك قبل سقمك، وغناك قبل فقرك، وفراغك قبل شغلك، وحياتك قبل موتك».",
    source: "الحاكم / صحيح",
    benefit: "وصية زمنية ذهبية في استثمار المُهَل قبل زوالها.",
    category: "الحياة",
  },
  {
    id: 10,
    title: "وصية في الاقتصاد والتوازن",
    text: "«إن لنفسك عليك حقاً، ولزوجك عليك حقاً، ولضيفك عليك حقاً، فأعطِ كل ذي حق حقه».",
    source: "البخاري: ١٩٦٨",
    benefit: "منهج التوازن بين حق الله وحق النفس وحق الآخرين — لا إفراط ولا تفريط.",
    category: "الحياة",
  },
];

/* ══ وصايا خاصة بأشخاص ══ */
const WASAYA_KHASISA: { name: string; wasiyya: string; source: string }[] = [
  {
    name: "لأنس بن مالك",
    wasiyya: "«يا بُنيَّ، إن قدرتَ أن تُصبح وتُمسي ليس في قلبك غشٌّ لأحد فافعل». ثم قال: «يا بُنيَّ، وذلك من سنتي، ومن أحيا سنتي فقد أحبَّني، ومن أحبَّني كان معي في الجنة».",
    source: "الترمذي: ٢٦٧٨",
  },
  {
    name: "لسعد بن أبي وقاص",
    wasiyya: "«أُوصيك بتقوى الله، فإنها رأس كل شيء، وعليك بالجهاد، فإنه رهبانية الإسلام».",
    source: "أبو يعلى",
  },
  {
    name: "لعمر بن أبي سلمة",
    wasiyya: "«يا غلام، سمِّ الله، وكل بيمينك، وكل مما يليك».",
    source: "البخاري: ٥٣٧٦",
  },
  {
    name: "لأبي سفيان بن حرب",
    wasiyya: "«يا أبا سفيان، ألا تُسلم وتشهد أن لا إله إلا الله؟ قال: بأبي أنت وأمي ما أحلمك وأكرمك وأوصلك».",
    source: "البخاري",
  },
  {
    name: "لفاطمة الزهراء",
    wasiyya: "علَّمها ﷺ ما هو خير من خادم: «أن تسبِّحا الله ثلاثاً وثلاثين، وتحمدا ثلاثاً وثلاثين، وتكبِّرا أربعاً وثلاثين إذا أخذتما مضاجعكما».",
    source: "البخاري: ٣٧٠٥",
  },
  {
    name: "للأنصار",
    wasiyya: "«أوصيكم بالأنصار، فإنهم كَرِشي وعيبتي، وقد قضَوا الذي عليهم، وبقي الذي لهم، فاقبلوا من محسنهم وتجاوزوا عن مسيئهم».",
    source: "البخاري: ٣٧٩٩",
  },
  {
    name: "لعلي بن أبي طالب",
    wasiyya: "«يا علي، لا تُتبِع النظرة النظرة، فإن لك الأولى وليست لك الآخرة».",
    source: "أبو داود: ٢١٤٩",
  },
];

/* ══ الوصايا للأمة عامة ══ */
const WASAYA_UMMA: { title: string; text: string; ref: string }[] = [
  { title: "التمسك بالكتاب والسنة", text: "«تركت فيكم أمرين لن تضلوا ما تمسكتم بهما: كتاب الله وسنة نبيه».", ref: "الموطأ" },
  { title: "السمع والطاعة", text: "«أوصيكم بتقوى الله والسمع والطاعة وإن أُمِّر عليكم عبد، فإنه من يعش منكم فسيرى اختلافاً كثيراً».", ref: "الترمذي: ٢٦٧٦" },
  { title: "لزوم الجماعة", text: "«عليكم بالجماعة، وإياكم والفرقة، فإن الشيطان مع الواحد وهو من الاثنين أبعد».", ref: "الترمذي: ٢١٦٥" },
  { title: "البلاغ عنه ﷺ", text: "«بلِّغوا عني ولو آية، وحدِّثوا عن بني إسرائيل ولا حرج، ومن كذب عليَّ متعمداً فليتبوَّأ مقعده من النار».", ref: "البخاري: ٣٤٦١" },
  { title: "صون الدماء والأعراض", text: "«إن دماءكم وأموالكم وأعراضكم عليكم حرام كحرمة يومكم هذا، في شهركم هذا، في بلدكم هذا».", ref: "البخاري: ١٧٤١" },
];

/* ══ الأعمال المستحبة بعد قراءة الوصايا ══ */
const AMAL_LIST: string[] = [
  "اختر وصيةً واحدةً واجعلها هدفك هذا الأسبوع",
  "اكتب الوصية في مكان مرئي — على الثلاجة أو شاشة الهاتف",
  "شارك وصيةً واحدةً مع شخص تحبه اليوم",
  "احفظ وصية ابن عباس — ستكفيك في التوكل طوال حياتك",
  "طبِّق وصية «لا تغضب» في أول فرصة تجد فيها نفسك على وشك الغضب",
  "كرِّر دعاء وصية معاذ بعد كل صلاة لمدة أسبوع",
];

const TABS: { id: Tab; label: string }[] = [
  { id: "kabira",       label: "الوصايا الكبرى" },
  { id: "khasisa",      label: "وصايا خاصة بأفراد" },
  { id: "lil-umma",    label: "للأمة عامة" },
  { id: "lishakhsiyya", label: "وصايا فردية" },
  { id: "amal",         label: "كيف تطبِّق؟" },
];

const CATS_COLORS: Record<string, string> = {
  الأخلاق: "#1F4D3A",
  العبادة: "#1a3a5c",
  التوحيد: "#7c3aed",
  المعاملات: "#b45309",
  الحياة: "#0f766e",
};

export default function WasayaNabawiyyaPage() {
  const [activeTab, setActiveTab] = useState<Tab>("kabira");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggleItem = (i: number) => setOpenIdx(prev => (prev === i ? null : i));

  useEffect(() => {
    applyPageSeo({
      path: "/wasaya-nabawiyya",
      title: "الوصايا النبوية | المجلس العلمي",
      description: "أجمل الوصايا النبوية الصحيحة — وصايا جامعة ووصايا خاصة بأفراد الصحابة ووصايا للأمة مع كيفية التطبيق.",
      keywords: ["الوصايا النبوية", "وصايا النبي", "أحاديث نبوية", "وصية لا تغضب", "وصية ابن عباس", "حديث معاذ"],
    });
  }, []);

  return (
    <div className="wn-page" dir="rtl">
      {/* Hero */}
      <section className="wn-hero">
        <div className="wn-hero__inner">
          <div className="wn-hero__badge">من كنز الحكمة النبوية</div>
          <h1 className="wn-hero__title">الوصايا النبوية</h1>
          <p className="wn-hero__sub">
            كلمات قصيرة وأثر عظيم — وصايا النبي ﷺ التي غيَّرت حياة أصحابه ولا تزال تُحيي القلوب
          </p>
          <div className="wn-hero__ayah">
            ﴿وَمَا يَنطِقُ عَنِ الْهَوَىٰ. إِنْ هُوَ إِلَّا وَحْيٌ يُوحَىٰ﴾
            <span> — النجم: ٣-٤</span>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="wn-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`wn-tab${activeTab === t.id ? " wn-tab--active" : ""}`}
            onClick={() => { setActiveTab(t.id); setOpenIdx(null); }}
          >{t.label}</button>
        ))}
      </div>

      <div className="wn-container">

        {/* الوصايا الكبرى */}
        {activeTab === "kabira" && (
          <div>
            <div className="wn-intro">
              <p>هذه وصايا جامعة أوصى بها ﷺ أصحابه في مواقف مختلفة — كل وصية كانت دواءً دقيقاً لحاجة تلك اللحظة، وهي في مجموعها دستور أخلاقي للمؤمن.</p>
            </div>
            <div className="wn-list">
              {WASAYA_KABIRA.map((w, i) => (
                <div key={w.id} className="wn-card">
                  <button
                    type="button"
                    className="wn-card__head"
                    onClick={() => toggleItem(i)}
                    aria-expanded={openIdx === i}
                  >
                    <div className="wn-card__left">
                      <span className="wn-card__num">{w.id}</span>
                      <span className="wn-card__title">{w.title}</span>
                    </div>
                    <div className="wn-card__right">
                      {w.category && (
                        <span className="wn-card__cat" style={{ "--wn-cat-color": CATS_COLORS[w.category] ?? "#1F4D3A", "--wn-cat-bg": (CATS_COLORS[w.category] ?? "#1F4D3A") + "1A" } as { [k: string]: string }}>
                          {w.category}
                        </span>
                      )}
                      <span className="wn-chevron">{openIdx === i ? "▲" : "▼"}</span>
                    </div>
                  </button>
                  {openIdx === i && (
                    <div className="wn-card__body">
                      <blockquote className="wn-hadith">{w.text}</blockquote>
                      <p className="wn-source">{w.source}</p>
                      {w.benefit && (
                        <div className="wn-benefit">
                          <span className="wn-benefit__label">الفائدة:</span>
                          <span>{w.benefit}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* وصايا خاصة بأفراد */}
        {activeTab === "khasisa" && (
          <div>
            <div className="wn-intro">
              <p>خصَّ النبي ﷺ كل صحابي بوصية تناسب حاله وحاجته، فكان طبيب القلوب يُعطي كل قلب دواءه.</p>
            </div>
            <div className="wn-khasisa-list">
              {WASAYA_KHASISA.map((w, i) => (
                <div key={i} className="wn-khasisa-card">
                  <h3 className="wn-khasisa-name">{w.name}</h3>
                  <blockquote className="wn-hadith wn-hadith--sm">{w.wasiyya}</blockquote>
                  <p className="wn-source">{w.source}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* للأمة */}
        {activeTab === "lil-umma" && (
          <div>
            <div className="wn-intro">
              <p>في خطبة الوداع وغيرها من المواطن الكبرى، أوصى ﷺ الأمة جمعاء بوصايا تحفظ تماسكها ووحدتها ودينها.</p>
            </div>
            <div className="wn-umma-list">
              {WASAYA_UMMA.map((w, i) => (
                <div key={i} className="wn-umma-card">
                  <div className="wn-umma-num">{i + 1}</div>
                  <div>
                    <h3 className="wn-umma-title">{w.title}</h3>
                    <blockquote className="wn-hadith wn-hadith--sm">{w.text}</blockquote>
                    <p className="wn-source">{w.ref}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* وصايا فردية */}
        {activeTab === "lishakhsiyya" && (
          <div>
            <div className="wn-intro">
              <p>اختر وصيةً واحدةً تناسبك الآن من وصايا النبي ﷺ، واجعلها برنامجك لهذا الشهر:</p>
            </div>
            <div className="wn-pick-grid">
              {WASAYA_KABIRA.filter(w => w.category).map((w, i) => (
                <div key={i} className="wn-pick-card">
                  <div className="wn-pick-cat" style={{ "--wn-cat-color": CATS_COLORS[w.category!] ?? "#1F4D3A" } as { [k: string]: string }}>
                    {w.category}
                  </div>
                  <h4 className="wn-pick-title">{w.title}</h4>
                  <p className="wn-pick-text">{w.text}</p>
                  <span className="wn-pick-source">{w.source}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* كيف تطبِّق؟ */}
        {activeTab === "amal" && (
          <div>
            <div className="wn-intro">
              <p>الوصية تصبح عادة حين تتحول إلى خطوات. هذه طريقة عملية لتحويل الوصايا النبوية من كلمات تُحفَظ إلى سلوك يُعاش.</p>
            </div>
            <div className="wn-amal-list">
              {AMAL_LIST.map((a, i) => (
                <div key={i} className="wn-amal-item">
                  <div className="wn-amal-num">{i + 1}</div>
                  <p className="wn-amal-text">{a}</p>
                </div>
              ))}
            </div>
            <div className="wn-amal-cta">
              <div className="wn-amal-cta__icon">﷽</div>
              <p className="wn-amal-cta__text">
                «من عمل بما علم أورثه الله علم ما لم يعلم» — قول الإمام الشافعي
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
