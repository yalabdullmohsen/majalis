import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Heart, Star } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/elite-2026.css";

/* ══════════════════════════════════════════════════════════════════
   §240، الشمائل المحمدية  (.sh-*)
   ══════════════════════════════════════════════════════════════════ */

type TabId = "khalq" | "khuluq" | "sira" | "mahabbah";

interface ShamilBab {
  id: number;
  title: string;
  icon: string;
  hadiths: { text: string; rawi: string; source: string }[];
}

const TABS: { id: TabId; label: string }[] = [
  { id: "khalq",    label: "الخَلْق (الصفة الجسدية)" },
  { id: "khuluq",   label: "الخُلُق (الصفة الأخلاقية)" },
  { id: "sira",     label: "هَدْيه في حياته" },
  { id: "mahabbah", label: "حب النبي ﷺ" },
];

const ABWAB_KHALQ: ShamilBab[] = [
  {
    id: 1,
    title: "صفة وجهه الشريف",
    icon: "☀️",
    hadiths: [
      { text: "كان رسولُ الله ﷺ أَبيضَ مُشرَباً بحُمرةٍ، وكان وجهُه مُستديراً لا مُكلثَماً ولا مُسهَباً", rawi: "علي بن أبي طالب رضي الله عنه", source: "الشمائل المحمدية للترمذي" },
      { text: "ما رأيتُ قبلَه ولا بعدَه مثلَه ﷺ", rawi: "أبو هريرة رضي الله عنه", source: "البخاري" },
      { text: "كان رسولُ الله ﷺ إذا سُرَّ استنارَ وجهُه كأنَّه قِطعةُ قمرٍ، وكنَّا نعرفُ ذلك منه", rawi: "أبو هريرة رضي الله عنه", source: "البخاري ومسلم" },
    ],
  },
  {
    id: 2,
    title: "قامته وجسده الشريف",
    icon: "🌿",
    hadiths: [
      { text: "كان رسولُ الله ﷺ ليس بالطويل البائِن ولا بالقصير، رَبعةً من القوم", rawi: "أنس بن مالك رضي الله عنه", source: "البخاري" },
      { text: "كان رسولُ الله ﷺ مُفاضَ الجِسم، أي ضخمَ الجِسم مُمتلِئه", rawi: "علي بن أبي طالب رضي الله عنه", source: "الترمذي في الشمائل" },
      { text: "كان رسولُ الله ﷺ شثنَ الكفَّين والقدمَين، عريضَ الكفَّين والقدمَين", rawi: "أنس بن مالك رضي الله عنه", source: "البخاري ومسلم" },
    ],
  },
  {
    id: 3,
    title: "شعره ولحيته الشريفة",
    icon: "✨",
    hadiths: [
      { text: "كان شَعرُ رسولِ الله ﷺ لا جَعداً ولا سَبِطاً، بَيناً بين ذلك، يبلُغ شَحمةَ أُذنَيه", rawi: "أنس بن مالك رضي الله عنه", source: "مسلم" },
      { text: "كان رسولُ الله ﷺ كَثَّ اللحيةِ", rawi: "علي بن أبي طالب رضي الله عنه", source: "الترمذي في الشمائل" },
      { text: "توفِّيَ رسولُ الله ﷺ وفي رأسِه ولحيتِه نحوٌ من عشرين شعرةً بيضاء", rawi: "أنس بن مالك رضي الله عنه", source: "البخاري" },
    ],
  },
  {
    id: 4,
    title: "خاتم النبوة",
    icon: "💎",
    hadiths: [
      { text: "رأيتُ خاتمَ النبوة بين كتفَيه مثلَ زِرِّ الحَجَلة", rawi: "جابر بن سَمُرة رضي الله عنه", source: "مسلم" },
      { text: "خاتَمُه مثلُ بَيضة الحمامة يُشبه جسدَه", rawi: "السائب بن يزيد رضي الله عنه", source: "البخاري" },
    ],
  },
  {
    id: 5,
    title: "مَشيته ونُوره ﷺ",
    icon: "🌟",
    hadiths: [
      { text: "كانَ رسولُ الله ﷺ إذا مَشى يتقلَّع، يعني مَشَى بقوَّةٍ وجِدٍّ، كأنَّما يَنحطُّ من صَبَبٍ", rawi: "علي بن أبي طالب رضي الله عنه", source: "الترمذي في الشمائل" },
      { text: "كان رسولُ الله ﷺ أبيضَ اللونِ وكان النُّورُ يَتلألأُ في وجهِه", rawi: "أنس بن مالك رضي الله عنه", source: "الترمذي" },
    ],
  },
];

const ABWAB_KHULUQ: ShamilBab[] = [
  {
    id: 1,
    title: "رحمته ﷺ",
    icon: "❤️",
    hadiths: [
      { text: "وما أرسلناكَ إلا رحمةً للعالمين", rawi: "القرآن الكريم", source: "سورة الأنبياء: ١٠٧" },
      { text: "أنا أَرحمُكُم وأبَرُّكُم، وكان ﷺ يُقبِّلُ الحسنَ والحُسَين وهما صغيران", rawi: "أنس بن مالك رضي الله عنه", source: "البخاري" },
      { text: "إنَّ لي فيهم سُنَّةً: وَدُّوا أن لو أَبكَيتُهم فإنَّهم لو أبكَوني لَبكَيتُ معهم", rawi: "عبد الله بن عمر رضي الله عنهما", source: "البخاري" },
    ],
  },
  {
    id: 2,
    title: "حياؤه ﷺ",
    icon: "🌸",
    hadiths: [
      { text: "كان رسولُ الله ﷺ أشدَّ حياءً من العَذراءِ في خِدرِها، وإذا كَرِهَ شيئاً عُرِفَ في وجهِه", rawi: "أبو سعيد الخدري رضي الله عنه", source: "البخاري ومسلم" },
    ],
  },
  {
    id: 3,
    title: "كرمه وجوده ﷺ",
    icon: "🎁",
    hadiths: [
      { text: "كان رسولُ الله ﷺ أجودَ الناسِ بالخيرِ، وكان أجودَ ما يكونُ في شهرِ رمضانَ", rawi: "عبد الله بن عباس رضي الله عنهما", source: "البخاري ومسلم" },
      { text: "ما سُئِلَ رسولُ اللهِ ﷺ شيئاً فقال: لا", rawi: "جابر بن عبد الله رضي الله عنه", source: "البخاري ومسلم" },
    ],
  },
  {
    id: 4,
    title: "تواضعه ﷺ",
    icon: "🌾",
    hadiths: [
      { text: "لا تُطرُوني كما أَطرَتِ النصارى ابنَ مَريم، إنَّما أنا عبدٌ، فقولوا: عبدُ اللهِ ورسولُه", rawi: "عمر بن الخطاب رضي الله عنه", source: "البخاري" },
      { text: "كانَ يُجالِسُ الفُقراءَ، ويُجيبُ دعوةَ المملوك، ويَركَبُ الحمارَ مُؤكَفاً", rawi: "أنس بن مالك رضي الله عنه", source: "الترمذي" },
    ],
  },
  {
    id: 5,
    title: "صبره وحلمه ﷺ",
    icon: "🏔️",
    hadiths: [
      { text: "ما انتَقَمَ رسولُ اللهِ ﷺ لنفسِه في شيءٍ قَطُّ إلا أن تُنتَهَكَ حُرمةُ اللهِ", rawi: "عائشة رضي الله عنها", source: "البخاري ومسلم" },
      { text: "ثمَّ عادَ إلى مكةَ فاتحاً ومنتصراً فقال: «اذهَبوا فأنتُم الطُّلَقاء»", rawi: "ابن إسحاق", source: "السيرة النبوية" },
    ],
  },
  {
    id: 6,
    title: "شجاعته ﷺ",
    icon: "⚔️",
    hadiths: [
      { text: "لقد رأيتُنا يوم بدرٍ ونحن نَلوذُ برسولِ الله ﷺ وهو أَقرَبُنا مِن العَدُوِّ", rawi: "علي بن أبي طالب رضي الله عنه", source: "أحمد" },
      { text: "كان أشجعَ الناسِ وأجودَهم وأصدقَهم لَهجةً", rawi: "أنس بن مالك رضي الله عنه", source: "الترمذي" },
    ],
  },
];

const ABWAB_SIRA: ShamilBab[] = [
  {
    id: 1,
    title: "هَدْيه في الأكل والشرب",
    icon: "🍽️",
    hadiths: [
      { text: "ما عَابَ رسولُ اللهِ ﷺ طعاماً قَطُّ، كان إذا اشتَهاه أَكَلَه وإن كَرِهَه تَرَكَه", rawi: "أبو هريرة رضي الله عنه", source: "البخاري ومسلم" },
      { text: "كانَ ﷺ يأكلُ بأصابعِه الثلاثِ ويَلعَقُها وقال: «إنَّكُم لا تَدرونَ في أيِّها البَرَكة»", rawi: "كعب بن مالك رضي الله عنه", source: "مسلم" },
    ],
  },
  {
    id: 2,
    title: "هَدْيه في النوم",
    icon: "🌙",
    hadiths: [
      { text: "كان رسولُ اللهِ ﷺ إذا أَخَذَ مَضجَعَه جَعَلَ يَدَه اليُمنى تحتَ خَدِّه الأيمنِ وقال: «اللهمَّ قِنِي عَذابَكَ يومَ تَبعَثُ عِبادَكَ»", rawi: "حذيفة رضي الله عنه", source: "أبو داود والترمذي" },
      { text: "كانَ ﷺ يَنامُ على يَمِينِه ويَضَعُ يدَه تحتَ خَدِّه ثم يقول: «بِاسمِكَ اللهمَّ أَحيا وأَموت»", rawi: "البراء بن عازب رضي الله عنه", source: "البخاري" },
    ],
  },
  {
    id: 3,
    title: "هَدْيه في اللباس",
    icon: "👘",
    hadiths: [
      { text: "كانَ أحبُّ الثيابِ إلى رسولِ اللهِ ﷺ القَميصَ", rawi: "أم سلمة رضي الله عنها", source: "أبو داود والترمذي" },
      { text: "كانَ رسولُ اللهِ ﷺ إذا لَبِسَ ثوباً بَدَأَ بِيَمينِه وسَمَّى الله", rawi: "أبو هريرة رضي الله عنه", source: "الترمذي" },
    ],
  },
  {
    id: 4,
    title: "هَدْيه في التعامل مع الناس",
    icon: "🤝",
    hadiths: [
      { text: "كان رسولُ اللهِ ﷺ أَوَّلَ مَن يُسَلِّمُ إذا لَقِيَ أحداً، وآخِرَ مَن يَرفَعُ يدَه في المُصافَحة", rawi: "أنس بن مالك رضي الله عنه", source: "الترمذي" },
      { text: "ما جَلَسَ إليه أحدٌ إلا أَقبَلَ عليه بوجهِه كلِّه كأنَّه ليسَ عِندَه غيرُه", rawi: "أبو الدرداء رضي الله عنه", source: "الطبراني" },
    ],
  },
  {
    id: 5,
    title: "هَدْيه في بيته",
    icon: "🏡",
    hadiths: [
      { text: "كانَ ﷺ في بيتِه في مِهنةِ أهلِه، فإذا أَذَّنَ المُؤذِّنُ خَرَجَ إلى الصلاة", rawi: "عائشة رضي الله عنها", source: "البخاري" },
      { text: "كانَ يَخصِفُ نَعلَه ويُرَقِّعُ ثوبَه ويَحلُبُ شاتَه في البيت", rawi: "عائشة رضي الله عنها", source: "أحمد" },
    ],
  },
];

interface MahabbahBab {
  title: string;
  text: string;
  source: string;
  rawi?: string;
}

const MAHABBAH_ABWAB: MahabbahBab[] = [
  {
    title: "محبته ﷺ فريضة",
    text: "قُلْ إِن كُنتُمْ تُحِبُّونَ اللَّهَ فَاتَّبِعُونِي يُحْبِبْكُمُ اللَّهُ وَيَغْفِرْ لَكُمْ ذُنُوبَكُمْ",
    source: "سورة آل عمران: ٣١",
  },
  {
    title: "لا يكمُل الإيمان إلا بها",
    text: "لا يُؤمِنُ أحدُكُم حتى أَكونَ أَحَبَّ إليهِ من والدِه وولَدِه والناسِ أَجمعين",
    source: "البخاري ومسلم",
    rawi: "أنس بن مالك رضي الله عنه",
  },
  {
    title: "ثمرة المحبة: الرفقة في الجنة",
    text: "المَرءُ مع مَن أَحَبَّ، فقال أنس: فما فَرِحنا بشيءٍ كفَرَحِنا بهذا الحديث",
    source: "البخاري ومسلم",
    rawi: "أنس بن مالك رضي الله عنه",
  },
  {
    title: "علامة المحبة الصادقة",
    text: "مَن أَحَبَّ سُنَّتي فقد أَحَبَّني، ومَن أَحَبَّني كانَ مَعي في الجنَّة",
    source: "الترمذي",
    rawi: "أنس بن مالك رضي الله عنه",
  },
  {
    title: "الصلاة على النبي ﷺ",
    text: "إنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا",
    source: "سورة الأحزاب: ٥٦",
  },
  {
    title: "أفضل الصلوات على النبي ﷺ",
    text: "اللهمَّ صَلِّ على محمدٍ وعلى آلِ محمدٍ كما صلَّيتَ على إبراهيمَ وعلى آلِ إبراهيم إنَّكَ حميدٌ مجيد",
    source: "البخاري ومسلم",
    rawi: "كعب بن عُجرة رضي الله عنه",
  },
];

const MAWLID_STATS = [
  { label: "عام الميلاد", value: "٥٧١ م" },
  { label: "مكان الميلاد", value: "مكة المكرمة" },
  { label: "سنوات الرسالة", value: "٢٣ سنة" },
  { label: "عمره الشريف", value: "٦٣ سنة" },
];

export default function ShimaelPage() {
  const [activeTab, setActiveTab] = useState<TabId>("khalq");
  const [openBab, setOpenBab] = useState<number | null>(null);
  const [openMahabbah, setOpenMahabbah] = useState<number | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/shamael",
      title: "الشمائل المحمدية | المجلس العلمي",
      description: "تعرّف على صفة النبي محمد ﷺ خَلقاً وخُلُقاً وهَديه في حياته من أصحِّ الروايات.",
      keywords: ["شمائل النبي", "صفة النبي", "الشمائل المحمدية", "سيرة نبوية", "حب النبي"],
    });
  }, []);

  const khalqBabs = ABWAB_KHALQ;
  const khuluqBabs = ABWAB_KHULUQ;
  const siraBabs = ABWAB_SIRA;

  return (
    <div className="sh-page" dir="rtl">
      {/* ══ Hero ══ */}
      <section className="sh-hero">
        <div className="sh-hero__glow" aria-hidden="true" />
        <div className="sh-hero__inner">
          <div className="sh-hero__badge">الشمائل المحمدية</div>
          <h1 className="sh-hero__title">
            صفةُ سيِّد الخلقِ
            <span className="sh-hero__sallam"> ﷺ </span>
          </h1>
          <p className="sh-hero__sub">
            خُلاصةُ ما رواه الصحابةُ الكرامُ في صفةِ النبيِّ ﷺ خَلقاً وخُلُقاً وهَدياً، مأخوذٌ من كُتُب الصِّحاح والشمائل
          </p>
          <div className="sh-hero__stats">
            {MAWLID_STATS.map((s, i) => (
              <div key={i} className="sh-stat">
                <span className="sh-stat__val">{s.value}</span>
                <span className="sh-stat__lbl">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="sh-container">
        {/* ══ التبويبات ══ */}
        <div className="sh-tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              className={`sh-tab${activeTab === t.id ? " sh-tab--active" : ""}`}
              onClick={() => { setActiveTab(t.id); setOpenBab(null); }}
              aria-selected={activeTab === t.id}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── الخَلق ── */}
        {activeTab === "khalq" && (
          <div className="sh-section">
            <div className="sh-intro-box">
              <Star size={16} aria-hidden="true" />
              <p>قال الإمام الترمذي رحمه الله: «باب ما جاء في خَلق رسول الله ﷺ»، وهذه أصحُّ ما وردَ في وصفِ صورتِه الشريفة.</p>
            </div>
            {khalqBabs.map(bab => (
              <div key={bab.id} className="sh-bab">
                <div
                  className="sh-bab__head"
                  onClick={() => setOpenBab(openBab === bab.id ? null : bab.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === "Enter" || e.key === " ") && setOpenBab(openBab === bab.id ? null : bab.id)}
                  aria-expanded={openBab === bab.id}
                >
                  <span className="sh-bab__icon" aria-hidden="true">{bab.icon}</span>
                  <span className="sh-bab__title">{bab.title}</span>
                  <span className="sh-bab__count">{bab.hadiths.length} روايات</span>
                  <span className="sh-bab__chevron" aria-hidden="true">
                    {openBab === bab.id ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                  </span>
                </div>
                {openBab === bab.id && (
                  <div className="sh-bab__body">
                    {bab.hadiths.map((h, j) => (
                      <div key={j} className="sh-hadith">
                        <p className="sh-hadith__text">«{h.text}»</p>
                        <div className="sh-hadith__meta">
                          <span className="sh-hadith__rawi">رواه: {h.rawi}</span>
                          <span className="sh-hadith__src">{h.source}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── الخُلُق ── */}
        {activeTab === "khuluq" && (
          <div className="sh-section">
            <div className="sh-intro-box">
              <Heart size={16} aria-hidden="true" />
              <p>قال اللهُ تعالى: ﴿وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ﴾ [القلم: ٤]، وهذه أبوابُ ما وُصِفَ به النبيُّ ﷺ في أخلاقِه.</p>
            </div>
            {khuluqBabs.map(bab => (
              <div key={bab.id} className="sh-bab">
                <div
                  className="sh-bab__head"
                  onClick={() => setOpenBab(openBab === bab.id + 100 ? null : bab.id + 100)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === "Enter" || e.key === " ") && setOpenBab(openBab === bab.id + 100 ? null : bab.id + 100)}
                  aria-expanded={openBab === bab.id + 100}
                >
                  <span className="sh-bab__icon" aria-hidden="true">{bab.icon}</span>
                  <span className="sh-bab__title">{bab.title}</span>
                  <span className="sh-bab__count">{bab.hadiths.length} روايات</span>
                  <span className="sh-bab__chevron" aria-hidden="true">
                    {openBab === bab.id + 100 ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                  </span>
                </div>
                {openBab === bab.id + 100 && (
                  <div className="sh-bab__body">
                    {bab.hadiths.map((h, j) => (
                      <div key={j} className="sh-hadith">
                        <p className="sh-hadith__text">«{h.text}»</p>
                        <div className="sh-hadith__meta">
                          <span className="sh-hadith__rawi">رواه: {h.rawi}</span>
                          <span className="sh-hadith__src">{h.source}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── السيرة والهَدي ── */}
        {activeTab === "sira" && (
          <div className="sh-section">
            <div className="sh-intro-box">
              <Star size={16} aria-hidden="true" />
              <p>كانَ هَدْيُه ﷺ في حياتِه كلِّها عِبادةً، حتى في أكلِه وشُربِه ونَومِه ولِباسِه وتعامُلِه مع الناس.</p>
            </div>
            {siraBabs.map(bab => (
              <div key={bab.id} className="sh-bab">
                <div
                  className="sh-bab__head"
                  onClick={() => setOpenBab(openBab === bab.id + 200 ? null : bab.id + 200)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === "Enter" || e.key === " ") && setOpenBab(openBab === bab.id + 200 ? null : bab.id + 200)}
                  aria-expanded={openBab === bab.id + 200}
                >
                  <span className="sh-bab__icon" aria-hidden="true">{bab.icon}</span>
                  <span className="sh-bab__title">{bab.title}</span>
                  <span className="sh-bab__count">{bab.hadiths.length} روايات</span>
                  <span className="sh-bab__chevron" aria-hidden="true">
                    {openBab === bab.id + 200 ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                  </span>
                </div>
                {openBab === bab.id + 200 && (
                  <div className="sh-bab__body">
                    {bab.hadiths.map((h, j) => (
                      <div key={j} className="sh-hadith">
                        <p className="sh-hadith__text">«{h.text}»</p>
                        <div className="sh-hadith__meta">
                          <span className="sh-hadith__rawi">رواه: {h.rawi}</span>
                          <span className="sh-hadith__src">{h.source}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── المحبة ── */}
        {activeTab === "mahabbah" && (
          <div className="sh-section">
            <div className="sh-mahabbah-intro">
              <Heart size={40} className="sh-mahabbah-intro__icon" aria-hidden="true" />
              <h2 className="sh-mahabbah-intro__title">حبُّ النبيِّ ﷺ</h2>
              <p className="sh-mahabbah-intro__text">
                محبةُ النبيِّ ﷺ أصلٌ من أصولِ الإيمان، لا تَكمُلُ العقيدةُ بدونِها،
                وثَمرتُها صُحبتُه ﷺ في الجنَّةِ يومَ القيامة.
              </p>
            </div>
            <div className="sh-mahabbah-list">
              {MAHABBAH_ABWAB.map((m, i) => (
                <div key={i} className="sh-mahabbah-card">
                  <div
                    className="sh-mahabbah-card__head"
                    onClick={() => setOpenMahabbah(openMahabbah === i ? null : i)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => (e.key === "Enter" || e.key === " ") && setOpenMahabbah(openMahabbah === i ? null : i)}
                    aria-expanded={openMahabbah === i}
                  >
                    <span className="sh-mahabbah-card__num">{(i + 1).toLocaleString("ar-EG")}</span>
                    <span className="sh-mahabbah-card__title">{m.title}</span>
                    <span className="sh-bab__chevron" aria-hidden="true">
                      {openMahabbah === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </div>
                  {openMahabbah === i && (
                    <div className="sh-mahabbah-card__body">
                      <p className="sh-mahabbah-card__text">«{m.text}»</p>
                      <div className="sh-hadith__meta">
                        {m.rawi && <span className="sh-hadith__rawi">رواه: {m.rawi}</span>}
                        <span className="sh-hadith__src">{m.source}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* الصلاة على النبي ﷺ */}
            <div className="sh-salat-box">
              <div className="sh-salat-box__head">
                <Star size={18} aria-hidden="true" />
                <span>صَلِّ على النبيِّ ﷺ الآن</span>
              </div>
              <p className="sh-salat-box__text">
                اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ ﷺ
              </p>
              <p className="sh-salat-box__sub">
                مَن صَلَّى عَلَيَّ صلاةً واحدةً صَلَّى اللهُ عليهِ بها عشراً، رواه مسلم
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
