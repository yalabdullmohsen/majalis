import { SectionIcon } from "@/components/ui/SectionIcon";
import { useEffect, useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Heart, Sparkles, Star } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/elite-2026.css";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { arabicMatchAny } from "@/lib/arabic-search";

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
  {
    id: 6,
    title: "طِيبُ رائحتِه ﷺ",
    icon: "🌹",
    hadiths: [
      { text: "مَسَّ رسولُ اللهِ ﷺ يَدَهُ فَرَأَيتُها طَيِّبةً، وإنَّ رِيحَها أَطيَبُ من رائحةِ المِسك", rawi: "جابر بن سمرة رضي الله عنه", source: "مسلم" },
      { text: "كانَ رسولُ اللهِ ﷺ لا يَمُرُّ في طريقٍ فَيَتبَعُه أحدٌ إلا عَرَفَ أنَّه مَرَّ فيه مِن طِيبِ عَرَقِه", rawi: "أنس بن مالك رضي الله عنه", source: "الترمذي في الشمائل" },
      { text: "مَسَّتْ يدُه يَدِي فَوَجَدتُها أَبرَدَ من الثَّلجِ وأَطيَبَ رِيحاً من المِسك", rawi: "أم سليم رضي الله عنها", source: "مسلم" },
    ],
  },
  {
    id: 7,
    title: "ابتسامته وبِشرُه ﷺ",
    icon: "😊",
    hadiths: [
      { text: "كانَ رسولُ اللهِ ﷺ أَكحَلَ العينَين طويلَ أشفارِ العينَين، في أجفانِه شيءٌ من حُمرةٍ", rawi: "علي بن أبي طالب رضي الله عنه", source: "الترمذي في الشمائل" },
      { text: "كانَ رسولُ اللهِ ﷺ دائمَ البِشرِ، سَهلَ الخُلُقِ، ليِّنَ الجانبِ، ليسَ بفَظٍّ ولا غليظٍ ولا صَخَّابٍ", rawi: "عائشة رضي الله عنها", source: "الترمذي في الشمائل" },
      { text: "ما كانَ رسولُ اللهِ ﷺ فاحِشاً ولا مُتفَحِّشاً، وكانَ يقول: «إنَّ خيارَكُم أَحاسِنُكُم أخلاقاً»", rawi: "عبد الله بن عمرو رضي الله عنهما", source: "البخاري" },
    ],
  },
  {
    id: 8,
    title: "أسنانُه الشريفة ﷺ",
    icon: "💫",
    hadiths: [
      { text: "كانَ رسولُ اللهِ ﷺ أَفلَجَ الثَّنايا، أي مُتفرِّقاً بين ثناياه، وكانَ إذا تكلَّمَ رُئيَ كالنُّورِ يخرجُ من بينِ ثَناياه", rawi: "عبد الله بن عباس رضي الله عنهما", source: "الشمائل المحمدية للترمذي" },
      { text: "رأيتُ النبيَّ ﷺ يتسوَّكُ حتى أُرى أنَّه يريدُ أن يَقتَلِعَ أسنانَه", rawi: "حذيفة بن اليمان رضي الله عنه", source: "أبو داود، صحيح" },
    ],
  },
  {
    id: 9,
    title: "صوتُه ونُطقُه ﷺ",
    icon: "🎙️",
    hadiths: [
      { text: "كانَ رسولُ اللهِ ﷺ يتكلَّمُ بجوامعِ الكَلِم؛ الكلامُ الكثيرُ الفائدةِ في اللفظِ القليل", rawi: "أبو هريرة رضي الله عنه", source: "البخاري ومسلم" },
      { text: "كانَ كلامُه فُصولاً يَفصِلُ بينَ الكلامِ فَصلاً بيِّناً يَحفَظُه من أَرادَ أن يَحفَظَه", rawi: "عائشة رضي الله عنها", source: "أبو داود، صحيح" },
      { text: "كانَ رسولُ اللهِ ﷺ أَجهَرَ الناسِ صوتاً إذا تكلَّمَ وأَفصَحَهُم لساناً وأَبيَنَهم بياناً", rawi: "البراء بن عازب رضي الله عنه", source: "الطبراني في الكبير" },
    ],
  },
  {
    id: 10,
    title: "يدُه وأصابعُه الشريفة ﷺ",
    icon: "🤲",
    hadiths: [
      { text: "كانَ كَفُّ رسولِ اللهِ ﷺ أَلينَ من الحريرِ وأَطيَبَ من المِسك", rawi: "أنس بن مالك رضي الله عنه", source: "البخاري" },
      { text: "مَدَّ رسولُ اللهِ ﷺ يدَه فَصافَحتُه فَوجَدتُها كأنَّها يَدُ تاجرٍ مُصمَّمة، عريضةٌ غليظةٌ كريمةٌ", rawi: "علي بن أبي طالب رضي الله عنه", source: "الترمذي في الشمائل" },
      { text: "كانَ رسولُ اللهِ ﷺ مُفاضَ الكفَّيْن والقدَمَيْن، سائِلَ الأطرافِ ممتلئاً", rawi: "أبو هريرة رضي الله عنه", source: "الترمذي في الشمائل" },
    ],
  },
  {
    id: 11,
    title: "عُنقُه وصَدرُه الشريف ﷺ",
    icon: "🌿",
    hadiths: [
      { text: "كانَ عُنُقُ رسولِ اللهِ ﷺ كعُنُقِ إبريقِ الفضَّةِ في صَفائِه ونَقائِه، يُرى فيه نُورٌ يَتلألأ", rawi: "علي بن أبي طالب رضي الله عنه", source: "الترمذي في الشمائل" },
      { text: "كانَ رسولُ اللهِ ﷺ عريضَ الصَّدرِ بَعيدَ ما بينَ المِنكَبَين، أبيضَ اللَّونِ مُشرَباً بحُمرةٍ", rawi: "البراء بن عازب رضي الله عنه", source: "البخاري ومسلم" },
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
  {
    id: 7,
    title: "صِدقُه وعَدلُه ﷺ",
    icon: "⚖️",
    hadiths: [
      { text: "واللهِ إنَّهُ لَصادِقٌ، وما كَذَبَ قَطُّ — شهادة ورقة بن نوفل أول من سمع قصة الوحي", rawi: "خديجة رضي الله عنها تنقل قول ورقة", source: "البخاري" },
      { text: "لو أنَّ فاطمةَ بِنتَ محمدٍ سَرَقَتْ لَقَطَعتُ يَدَها، إنَّما أَهلَكَ الذينَ قَبلَكُم أنَّهم كانوا إذا سَرَقَ فيهم الشريفُ تَرَكوه", rawi: "عائشة رضي الله عنها", source: "البخاري ومسلم" },
      { text: "ودَّعَ ﷺ في حَجَّةِ الوداعِ فقال: «ألا إنَّ كُلَّ دَمٍ من دِماءِ الجاهليَّةِ مَوضوعٌ، وأوَّلُ دَمٍ أَضَعُه دَمُ رَبيعةَ بنِ الحارث»، فبدأَ بأهلِ بيتِه", rawi: "جابر بن عبد الله رضي الله عنه", source: "مسلم" },
    ],
  },
  {
    id: 8,
    title: "عفوه ﷺ عن المسيئين",
    icon: "🕊️",
    hadiths: [
      { text: "دَخَلَ مكَّةَ فاتِحاً ومُنتَصِراً فقال لأهلِها: «اذهَبوا فأنتُم الطُّلَقاء»، وكانَ أشَدُّهم أذىً له يَنتَظِرُ حُكمَه فأَطلَقَهم", rawi: "ابن إسحاق", source: "السيرة النبوية الكبرى" },
      { text: "ما انتَقَمَ رسولُ اللهِ ﷺ لنفسِه قَطُّ إلا أن تُنتَهَكَ حُرمةُ اللهِ فيَنتَقِمَ لله", rawi: "عائشة رضي الله عنها", source: "البخاري ومسلم" },
    ],
  },
  {
    id: 9,
    title: "زهدُه ﷺ في الدنيا",
    icon: "🌱",
    hadiths: [
      { text: "ما شَبِعَ رسولُ اللهِ ﷺ وأهلُه ثَلاثةَ أيامٍ تِباعاً من خُبزِ بُرٍّ حتى لَقِيَ اللهَ", rawi: "عائشة رضي الله عنها", source: "البخاري ومسلم" },
      { text: "ما لِيَ وللدُّنيا؟ إنَّما مَثَلِي ومَثَلُ الدُّنيا كَمَثَلِ راكبٍ قالَ في ظِلِّ شَجرةٍ ثم راحَ وتَرَكَها", rawi: "عبد الله بن مسعود رضي الله عنه", source: "الترمذي، صحيح" },
    ],
  },
  {
    id: 10,
    title: "رفقُه ﷺ بالمستضعفين",
    icon: "🤲",
    hadiths: [
      { text: "ابغُوني الضُّعفاء، فإنَّما تُرزَقونَ وتُنصَرونَ بضُعَفائِكُم", rawi: "أبو الدرداء رضي الله عنه", source: "أبو داود والترمذي، صحيح" },
      { text: "كانَ رسولُ اللهِ ﷺ يأتي بني مَزيدةَ فيُصبِحُهُم فيُقبِّلُ صبيانَهم ويَمسَحُ رُؤوسَهم ويدعو لَهُم", rawi: "أنس بن مالك رضي الله عنه", source: "الطبراني في الكبير" },
      { text: "إنَّ اللهَ يُوحي إليَّ: تَواضَعوا حتى لا يَبغِيَ أحدٌ على أحدٍ ولا يَفخَرَ أحدٌ على أحدٍ", rawi: "عِياض بن حِمار المجاشعي رضي الله عنه", source: "مسلم" },
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
  {
    id: 6,
    title: "هَدْيه في عيادة المريض",
    icon: "💙",
    hadiths: [
      { text: "كانَ رسولُ اللهِ ﷺ إذا عادَ مَريضاً دَعا له ومَسَحَ عنه وقال: «أَذهِبِ الباسَ رَبَّ الناسِ، اشفِ وأنتَ الشافي»", rawi: "عائشة رضي الله عنها", source: "البخاري ومسلم" },
      { text: "مَن عادَ مريضاً لم يَزَل في خُرفةِ الجنَّة حتى يَرجِعَ، وكانَ ﷺ يَعودُ المسلمَ والكافرَ على السواء دعوةً إلى الإسلام", rawi: "ثوبان رضي الله عنه", source: "مسلم" },
    ],
  },
  {
    id: 7,
    title: "هَدْيه مع الأطفال",
    icon: "🌷",
    hadiths: [
      { text: "كانَ رسولُ اللهِ ﷺ يأتي بني مَزيدَةَ الأنصارَ فيُصبِّحُهُم فيُقَبِّلُ صبيانَهم ويَمسَحُ رُؤوسَهم ويَدعو لَهُم", rawi: "أنس بن مالك رضي الله عنه", source: "الطبراني" },
      { text: "أخَذَ رسولُ اللهِ ﷺ الحسنَ فقبَّلَه، فقال الأقرعُ بن حابس: إنَّ لي عَشَرةً مِن الوَلَد ما قَبَّلتُ أحداً منهم، فقال ﷺ: مَن لا يَرحَم لا يُرحَم", rawi: "أبو هريرة رضي الله عنه", source: "البخاري ومسلم" },
    ],
  },
  {
    id: 8,
    title: "هَدْيه في التعليم",
    icon: "📖",
    hadiths: [
      { text: "كانَ رسولُ اللهِ ﷺ إذا تكلَّمَ تكلَّمَ بَيِّناً فَصلاً يَحفَظُه كلُّ مَن سَمِعَه، وكانَ كلامُه فُصولاً يَحصُرُه مَن أَرادَ أن يَحصُرَه", rawi: "عائشة رضي الله عنها", source: "أبو داود، صحيح" },
      { text: "كانَ رسولُ اللهِ ﷺ يُعيدُ الكلامَ ثَلاثاً لِيُفهَمَ عنه، ويُقَرِّبُ العِلمَ بالأمثالِ والقِصَص ليَرسَخَ في القلوب", rawi: "أنس بن مالك رضي الله عنه", source: "البخاري" },
    ],
  },
  {
    id: 9,
    title: "هَدْيه في السفر",
    icon: "🚶",
    hadiths: [
      { text: "كانَ رسولُ اللهِ ﷺ إذا سافَرَ أَخَّرَ المغربَ وجَمَعَها مع العشاء، وكانَ يُسرِعُ السيرَ إذا اقتَرَبَ من المدينة", rawi: "أنس بن مالك رضي الله عنه", source: "البخاري ومسلم" },
      { text: "السفرُ قِطعةٌ من العَذاب يَمنَعُ أحدَكُم نَومَه وطعامَه وشرابَه، فإذا قَضى أحدُكُم نَهمَتَه من سَفَرِه فليُسرِعْ إلى أهلِه", rawi: "أبو هريرة رضي الله عنه", source: "البخاري ومسلم" },
    ],
  },
  {
    id: 10,
    title: "هَدْيه في الدعاء والذكر",
    icon: "🤲",
    hadiths: [
      { text: "كانَ رسولُ اللهِ ﷺ يَذكُرُ اللهَ على كُلِّ أحيانِه ويَستَعيذُ باللهِ من شَرِّ ما صَنَعَ ومن شرِّ ما لم يَصنَع", rawi: "عائشة رضي الله عنها", source: "مسلم" },
      { text: "كانَ ﷺ يُكثِرُ من قولِه: «يا مُقَلِّبَ القلوبِ ثبِّتْ قلبِي على دِينِكَ»", rawi: "أم سلمة رضي الله عنها", source: "الترمذي، صحيح" },
      { text: "كانَ أكثرُ دعائِه ﷺ: «اللهمَّ آتِنا في الدنيا حسنةً وفي الآخرةِ حسنةً وقِنا عذابَ النار»", rawi: "أنس بن مالك رضي الله عنه", source: "البخاري ومسلم" },
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
  {
    title: "أجر الصلاة عليه ﷺ",
    text: "مَن صَلَّى عَلَيَّ واحدةً صَلَّى اللهُ عليه عَشراً",
    source: "مسلم",
    rawi: "أبو هريرة رضي الله عنه",
  },
  {
    title: "البُخل الحقيقي",
    text: "البَخيلُ مَن ذُكِرتُ عِندَه ولم يُصَلِّ عَلَيَّ",
    source: "الترمذي، صحيح",
    rawi: "علي بن أبي طالب رضي الله عنه",
  },
  {
    title: "أقرب الناس منه ﷺ يوم القيامة",
    text: "أَولى الناسِ بي يومَ القيامةِ أَكثَرُهُم عَلَيَّ صَلاةً",
    source: "الترمذي، حسن",
    rawi: "ابن مسعود رضي الله عنه",
  },
  {
    title: "الشوق إلى لقائه ﷺ",
    text: "وَدِدتُ أنِّي رأيتُ إخوانِي، قالوا: أَولَسنا إخوانَكَ؟ قال: «أنتُم أصحابي، وإخواني الذينَ آمَنوا بي ولم يَرَوني»",
    source: "أحمد، صحيح",
    rawi: "أبو هريرة رضي الله عنه",
  },
  {
    title: "اتباع السنة أصدق دليل على المحبة",
    text: "مَن أَحيا سُنَّتي فقد أَحَبَّني، ومَن أَحَبَّني كانَ مَعي في الجنَّة",
    source: "الترمذي، حسن",
    rawi: "أنس بن مالك رضي الله عنه",
  },
  {
    title: "قراءة السيرة والتأمل في الشمائل",
    text: "مَن أرادَ أن يُحِبَّ النبيَّ ﷺ حُبًّا صادقاً فلْيُديمِ النظرَ في سيرتِه وشمائلِه ومواقفِه مع أصحابِه، فإنَّ ذلك يُولِّدُ في القلبِ محبةً لا تنطفئ",
    source: "الشفا بتعريف حقوق المصطفى، القاضي عياض",
  },
  {
    title: "نصرة سنته ﷺ والذبّ عن شريعته",
    text: "مَن ردَّ على أهلِ البِدَعِ فله أجرُ شهيد، والذبُّ عن سُنَّةِ النبيِّ ﷺ ورِثةً لمنهجِه هو من أعلى علاماتِ المحبةِ الصادقة",
    source: "الدارمي في مسنده، والطبراني في الأوسط",
  },
  {
    title: "محبة آل بيته وأصحابه ﷺ",
    text: "قال ﷺ: «لا يُؤمنُ أحدُكُم حتى أَكونَ أَحَبَّ إليهِ من والِدِه وولَدِه والناسِ أَجمعين». ومن علامات هذه المحبة محبةُ آل بيته الأطهار وصحابته الكرام، فإنهم امتداد لنوره ﷺ.",
    source: "البخاري ومسلم",
    rawi: "أنس بن مالك رضي الله عنه",
  },
  {
    title: "الغيرة على عرضه ﷺ",
    text: "مَن أهانَ النبيَّ ﷺ أو نقصَ من شأنِه فقد خالف ما أوجبه الله من تعظيمه. والغيرةُ على عرضِه ﷺ وصونُ كرامتِه بكلِّ ما أوتي المؤمن من قول وقلم وموقف من أعظم مقتضيات محبته الصادقة.",
    source: "الشفا بتعريف حقوق المصطفى، القاضي عياض",
  },
  {
    title: "تمنّي لقائه ﷺ في الجنة",
    text: "قال ﷺ: «المرءُ مع مَن أَحَبَّ». والمحب الصادق يعيش على أمل لقاء النبيِّ ﷺ في الجنة. وقد بكى الصحابة عند نزول هذا الحديث فرحاً، وقال أنس: «ما فَرِحنا بشيءٍ كفَرَحِنا بهذه الآية».",
    source: "البخاري ومسلم",
    rawi: "أنس بن مالك رضي الله عنه",
  },
];

const MAWLID_STATS = [
  { label: "عام الميلاد", value: "٥٧١ م" },
  { label: "مكان الميلاد", value: "مكة المكرمة" },
  { label: "سنوات الرسالة", value: "٢٣ سنة" },
  { label: "عمره الشريف", value: "٦٣ سنة" },
  { label: "تاريخ الهجرة", value: "١ هـ / ٦٢٢ م — هجرة إلى المدينة المنورة" },
  { label: "تاريخ الوفاة", value: "١٢ ربيع الأول ١١ هـ / ٦٣٢ م" },
  { label: "عدد الغزوات", value: "٢٧ غزوة، قاتل ﷺ فيها بنفسه في ٩ غزوات" },
  { label: "عدد السرايا", value: "نحو ٦٠ سريّة وبعثاً بعثها ﷺ" },
  { label: "أمهات المؤمنين", value: "١١ زوجة، ٩ توفّي عنهن جميعاً" },
  { label: "مُرضِعاته الشريفات", value: "ثُوَيبة مولاة أبي لهب، ثم حليمة السعدية" },
];

/* ─── شميلة اليوم ─── */
type FlatHadith = { babTitle: string; text: string; rawi: string; source: string };

const ALL_HADITHS: FlatHadith[] = [
  ...ABWAB_KHALQ.flatMap(b => b.hadiths.map(h => ({ babTitle: b.title, ...h }))),
  ...ABWAB_KHULUQ.flatMap(b => b.hadiths.map(h => ({ babTitle: b.title, ...h }))),
  ...ABWAB_SIRA.flatMap(b => b.hadiths.map(h => ({ babTitle: b.title, ...h }))),
];

function todaysHadith(): FlatHadith {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return ALL_HADITHS[(dayOfYear - 1 + ALL_HADITHS.length) % ALL_HADITHS.length];
}

function ShamilaOfDayCard({ hadith }: { hadith: FlatHadith }) {
  return (
    <div className="shod-card">
      <div className="shod-card__badge"><Sparkles size={11} aria-hidden="true" /> شميلة اليوم</div>
      <div className="shod-card__bab">{hadith.babTitle}</div>
      <blockquote className="shod-card__text">«{hadith.text}»</blockquote>
      <div className="shod-card__footer">
        <span className="shod-card__rawi">{hadith.rawi}</span>
        <span className="shod-card__source">{hadith.source}</span>
      </div>
    </div>
  );
}

export default function ShimaelPage() {
  const [activeTab, setActiveTab] = useState<TabId>("khalq");
  const [openBab, setOpenBab] = useState<number | null>(null);
  const [openMahabbah, setOpenMahabbah] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const todayHadith = useMemo(() => todaysHadith(), []);

  useEffect(() => {
    applyPageSeo({
      path: "/shamael",
      title: "الشمائل المحمدية | المجلس العلمي",
      description: "تعرّف على صفة النبي محمد ﷺ خَلقاً وخُلُقاً وهَديه في حياته من أصحِّ الروايات.",
      keywords: ["شمائل النبي", "صفة النبي", "الشمائل المحمدية", "سيرة نبوية", "حب النبي"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "أبواب الشمائل المحمدية — الخَلق",
          description: "صفة النبي ﷺ خَلقاً من أصح الروايات",
          numberOfItems: ABWAB_KHALQ.length,
          itemListElement: ABWAB_KHALQ.map((b, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: b.title,
            url: `https://majlisilm.com/shamael#khalq-${b.id}`,
          })),
        },
      ],
    });
  }, []);

  const khalqBabs = useMemo(() =>
    search.trim() ? ABWAB_KHALQ.filter(b => arabicMatchAny([b.title], search)) : ABWAB_KHALQ,
  [search]);
  const khuluqBabs = useMemo(() =>
    search.trim() ? ABWAB_KHULUQ.filter(b => arabicMatchAny([b.title], search)) : ABWAB_KHULUQ,
  [search]);
  const siraBabs = useMemo(() =>
    search.trim() ? ABWAB_SIRA.filter(b => arabicMatchAny([b.title], search)) : ABWAB_SIRA,
  [search]);
  const filteredMahabbah = useMemo(() =>
    search.trim() ? MAHABBAH_ABWAB.filter(m => arabicMatchAny([m.title, m.text], search)) : MAHABBAH_ABWAB,
  [search]);

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

      {/* شميلة اليوم */}
      <ShamilaOfDayCard hadith={todayHadith} />

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

        <div className="sh-search-wrap">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث في الشمائل..."
            className="page-search-input sh-search-input"
            aria-label="بحث في الشمائل المحمدية"
          />
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
                  <span className="sh-bab__icon" aria-hidden="true"><SectionIcon name={bab.icon} size={24} /></span>
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
                  <span className="sh-bab__icon" aria-hidden="true"><SectionIcon name={bab.icon} size={24} /></span>
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
                  <span className="sh-bab__icon" aria-hidden="true"><SectionIcon name={bab.icon} size={24} /></span>
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
              {filteredMahabbah.map((m, i) => (
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

      <div className="twh-share">
        <ShareButtons title="الشمائل المحمدية — المجلس العلمي" url="https://majlisilm.com/shimail" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="sira" title="اختبر معلوماتك في السيرة النبوية" count={4} />
      </div>
      </div>
    </div>
  );
}
