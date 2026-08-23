import { useEffect, useState } from "react";
import { Bird, BookOpen, Gem, Heart, Landmark, Lightbulb, Library, MapPin, Megaphone, Moon, ScrollText, Sparkles, Sprout, Swords } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { Link } from "wouter";
import { usePageView } from "@/hooks/usePageView";
import { AdminQuickEdit } from "@/components/AdminQuickEdit";
import { ShareButton } from "@/components/ShareButton";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import "@/styles/pages/seerah.css";

const PHASES: { id: string; num: number; title: string; year: string; Icon: LucideIcon; color: string; desc: string; topics: string[]; keyEvents: string[] }[] = [
  {
    id: "lineage-birth",
    num: 1,
    title: "النسب والمولد",
    year: "عام الفيل، 571م",
    Icon: Moon,
    color: "var(--mj-brand-deep)",
    desc: "وُلد النبي ﷺ بمكة في عام الفيل من نسب هاشمي قرشي إلى إسماعيل عليه السلام. وفي العام نفسه حفظ الله البيت من أبرهة. واختلف أهل السيرة في تعيين يوم المولد، فلا يُبنى على يومٍ بعينه عبادة لم تُشرع.",
    topics: ["نسبه الشريف ﷺ", "مولده في مكة", "حادثة الفيل"],
    keyEvents: [
      "وُلد ﷺ يوم الاثنين في عام الفيل. واختلف أهل السيرة في تحديد يوم وشهر مولده — والمشهور 12 ربيع الأول؛ ولا يُبنى على يومٍ بعينه عبادةٌ لم تُشرع",
      "نسبه: محمد بن عبد الله بن عبد المطلب من بني هاشم، قريش، إلى إسماعيل عليه السلام",
      "توفي والده عبد الله وأمّه حاملٌ به على المشهور في كتب السيرة — وفي بعض الروايات خلافٌ يسير في التوقيت",
      "في العام نفسه: قصة أصحاب الفيل وحفظ البيت، كما في سورة الفيل والأخبار التاريخية المشهورة",
    ],
  },
  {
    id: "childhood",
    num: 2,
    title: "الطفولة والرضاعة",
    year: "571–576م",
    Icon: Sprout,
    color: "var(--mj-brand-deep)",
    desc: "نشأ ﷺ يتيماً: أرضعته حليمة السعدية، وتوفيت أمه وهو صغير، فكفله عبد المطلب ثم أبو طالب. وفي هذه المرحلة تظهر آثار الحفظ الإلهي والتربية في كنف قريش قبل البعثة.",
    topics: ["رضاعته عند حليمة", "يتمه ﷺ", "كفالة جده وعمه"],
    keyEvents: [
      "أرضعته ثويبة مولاة أبي لهب أياماً ثم أُرسل إلى بني سعد للرضاعة — على ما اشتهر في المغازي",
      "أرضعته حليمة السعدية من بني سعد، وذكر أهل السيرة بركةً في قومها بسببه",
      "شقّ الصدر في طفولته ثابتٌ في الصحيح من حديث أنس؛ ويُفرَّق بينه وبين ما يُروى في المعراج",
      "توفيت أمه آمنة بنت وهب وهو صغير — والمشهور عند الأبواء في الطريق من المدينة",
      "كفله جده عبد المطلب ثم توفي وهو صبي، فآل الأمر إلى عمه أبي طالب",
      "ربّاه أبو طالب وحماه في مكة حتى البعثة وما بعدها",
    ],
  },
  {
    id: "youth",
    num: 3,
    title: "الشباب قبل البعثة",
    year: "576–610م",
    Icon: ScrollText,
    color: "var(--mj-brand-deep)",
    desc: "عُرف بالصادق الأمين، وشارك في حلف الفضول، وتاجر، وتزوج خديجة رضي الله عنها، وكان يتحنث في حراء. وعمر خديجة عند الزواج مما اختلف فيه، ولا يثبت تحديده بحديث صحيح، ورواية بحيرا تاريخية تحتاج تمحيص التفاصيل.",
    topics: ["الصادق الأمين", "حلف الفضول", "زواجه من خديجة رضي الله عنها", "تحنّثه في حراء"],
    keyEvents: [
      "سافر مع عمه إلى الشام، وتذكر بعض الروايات التاريخية ملاحظة الراهب بحيرا لعلامات النبوة عليه (رواية تاريخية، تفاصيلها المطوَّلة تحتاج تحقيقًا)",
      "لقّبه أهل مكة «الصادق الأمين» لأمانته وصدقه",
      "شارك في حلف الفضول لنصرة المظلوم وقال: لو دُعيت إليه في الإسلام لأجبت",
      "تزوج خديجة بنت خويلد وعمره 25، والمشهور أنها كانت في الأربعين وقيل دون ذلك ولا يثبت في تحديد عمرها حديث صحيح",
      "أنجب منها: القاسم والزينب ورقية وأم كلثوم وفاطمة وعبد الله",
      "كان يتحنث في غار حراء كل عام في رمضان قبيل البعثة",
      "أعاد وضع الحجر الأسود مكانه عام 605م دون إراقة دماء: جعل الزعماء يحملونه معاً على ثوب بيده الشريفة",
    ],
  },
  {
    id: "prophethood",
    num: 4,
    title: "البعثة",
    year: "610م",
    Icon: Sparkles,
    color: "var(--mj-brand-deep)",
    desc: "نزل جبريل عليه السلام في غار حراء بأوائل العلق، فكانت بداية الرسالة الخاتمة. ثبتته خديجة، وأرشدها ورقة بن نوفل إلى حقيقة الوحي. ثم كانت فترة الوحي ثم عودته، فبدأ طور النبوة والبلاغ.",
    topics: ["نزول الوحي الأول", "غار حراء", "أوائل المؤمنين"],
    keyEvents: [
      "نزول جبريل في غار حراء بأوائل العلق: ﴿اقْرَأْ بِاسْمِ رَبِّكَ﴾",
      "رجع ﷺ يرتجف فدثّرته خديجة وقالت: والله لا يخزيك الله أبداً",
      "ذهب به إلى ورقة بن نوفل الذي أخبره بحقيقة الوحي وبشّره",
      "فترة انقطاع الوحي (الفترة) ثم عودته بسورة المدثر",
      "أول من آمن من النساء خديجة رضي الله عنها باتفاق؛ واختلف أهل العلم في ترتيب أوائل الرجال بين عليّ وأبي بكر وزيد رضي الله عنهم بحسب قيد «الحرّ/الصبي/العبد»",
    ],
  },
  {
    id: "secret-dawah",
    num: 5,
    title: "الدعوة السرية",
    year: "610–613م",
    Icon: Bird,
    color: "#1E4A37",
    desc: "بدأت الدعوة سرًّا بين الأهل والمقربين، فأسلم السابقون كخديجة وعلي وأبي بكر وزيد رضي الله عنهم، واجتمع المسلمون في دار الأرقم. والتدرج هنا فقه دعوي يحفظ الدعوة والمستضعفين قبل الجهر.",
    topics: ["الدعوة في السر", "أوائل المسلمين", "الهجرة إلى الحبشة"],
    keyEvents: [
      "دخل دار الأرقم بن أبي الأرقم مقراً للتعليم السري",
      "أسلم عثمان بن عفان والزبير وطلحة وسعد وأبو عبيدة",
      "الهجرة الأولى إلى الحبشة في نفرٍ قليل — وتختلف الروايات في العدد الدقيق",
      "الهجرة الثانية بعد اشتداد الأذى، في جمعٍ أكبر على ما اشتهر في المغازي",
      "أحسن النجاشي وفادة المهاجرين ورفض تسليمهم لقريش — والخبر ثابت المعنى في السيرة الصحيحة",
      "أسلم عبد الله بن مسعود في مرحلة مبكرة، وروى أهل السيرة سماعه القرآن وهو يرعى",
      "في مواسم الحج ظهرت بوادر بيعة الأوس والخزرج قبل الهجرة — والتفصيل في مرحلة الهجرة",
    ],
  },
  {
    id: "open-dawah",
    num: 6,
    title: "الدعوة الجهرية",
    year: "613–619م",
    Icon: Megaphone,
    color: "#9B1C1C",
    desc: "جهر النبي ﷺ بالدعوة على الصفا، فاشتد أذى قريش، وهاجر المستضعفون إلى الحبشة، وحُصر بنو هاشم في شعب أبي طالب. وقصة الأرضة في صحيفة المقاطعة من المراسيل عند أهل النقد، فتُذكر بحذر لا كخبرٍ مسند قاطع.",
    topics: ["الجهر بالدعوة", "إيذاء قريش", "الحصار في الشعب"],
    keyEvents: [
      "نزل: ﴿فَاصْدَعْ بِمَا تُؤْمَرُ﴾ فصعد الصفا ونادى قريشاً",
      "عرض على قبائل العرب في موسم الحج الإسلام",
      "تعذيب بلال وعمار وخبّاب وسمية وياسر على الإيمان",
      "إسلام حمزة بن عبد المطلب وعمر بن الخطاب كان تحولاً كبيراً",
      "حصار المسلمين في شعب أبي طالب ثلاث سنوات، جوع وشدة شديدة",
      "يُروى في كتب السيرة أن الأرضة أكلت صحيفة المقاطعة إلا ما كان من ذكر الله — ويُذكر بتحفّظ لأنه من مراسيل السيرة لا من الصحيح المسند",
    ],
  },
  {
    id: "year-of-sorrow",
    num: 7,
    title: "عام الحزن والإسراء",
    year: "619–620م",
    Icon: Moon,
    color: "#2A3E50",
    desc: "توفيت خديجة وأبو طالب في عامٍ واحد سُمّي عام الحزن، ثم كان الإسراء إلى المسجد الأقصى والمعراج تثبيتاً للنبي ﷺ، وفيه فرضت الصلاة. فالابتلاء والتكريم يجتمعان في تربية الأنبياء.",
    topics: ["وفاة خديجة رضي الله عنها", "وفاة أبي طالب", "الإسراء والمعراج"],
    keyEvents: [
      "وفاة خديجة رضي الله عنها بعد خمسة وعشرين عاماً من الوفاء والنصرة",
      "وفاة أبي طالب الذي ظل درعاً حامياً للنبي ﷺ من قريش",
      "خروجه إلى الطائف يطلب النصرة، رفضوه وأُذوا وجُرح",
      "الإسراء: رحلة ليلية من المسجد الحرام إلى المسجد الأقصى",
      "المعراج: صعوده إلى السماوات ومقابلة الأنبياء وفرض الصلوات",
      "كانت خمسين صلاة فراجع حتى صارت خمساً في الفعل وخمسين في الأجر",
    ],
  },
  {
    id: "hijra",
    num: 8,
    title: "الهجرة إلى المدينة",
    year: "622م",
    Icon: MapPin,
    color: "var(--mj-brand-deep)",
    desc: "أذن الله بالهجرة إلى يثرب، فخرج ﷺ مع أبي بكر، وآويا إلى غار ثور، ثم وصل المدينة فبنى المسجد وآخى بين المهاجرين والأنصار، ووضع وثيقة المدينة. والهجرة تحول من الاستضعاف إلى تأسيس مجتمع الرسالة.",
    topics: ["مغادرة مكة", "الوصول للمدينة", "بناء المسجد النبوي", "الأخوّة بين المهاجرين والأنصار"],
    keyEvents: [
      "بيعة العقبة الثانية مع 73 رجلاً وامرأتين من الأنصار",
      "خرج ﷺ مع أبي بكر ليلاً ومكثا في غار ثور ثلاثة أيام",
      "وصل المدينة فاستقبله أهلها بالتهليل والفرح",
      "بنى مسجد قباء ثم المسجد النبوي بيده الشريفة",
      "عقد المؤاخاة بين المهاجرين والأنصار، أخوة الإسلام",
      "وضع وثيقة المدينة، وهي من أوائل الوثائق السياسية المكتوبة في التاريخ الإسلامي",
    ],
  },
  {
    id: "ghazawat",
    num: 9,
    title: "الغزوات الكبرى",
    year: "624–627م",
    Icon: Swords,
    color: "#5C1C2A",
    desc: "شهدت المرحلة غزوات بدر وأحد والخندق وغيرها؛ وفيها نصر وابتلاء، وشورى وصبر. والجهاد هنا حماية للدعوة والأمة لا طلبًا للدنيا، ويُقرأ في ضوء مقاصد الشريعة وأخلاق النبي ﷺ.",
    topics: ["غزوة بدر الكبرى", "غزوة أُحد", "غزوة الأحزاب، الخندق"],
    keyEvents: [
      "بدر الكبرى (٢هـ/٦٢٤م): نصرٌ عظيم بأقلّ عددٍ على ما اشتهر في المغازي؛ والأعداد التقريبية مما تتداوله كتب السيرة",
      "أُسر من المشركين وقُتل منهم عددٌ كبير في بدر، ونزلت أحكامٌ في الأسرى والفداء",
      "أُحد (٣هـ): ابتلاءٌ بعد مخالفة الرماة؛ استُشهد عشرات الصحابة رضي الله عنهم",
      "جُرح النبي ﷺ في أُحد، وثبت صبره وثباته مع أصحابه",
      "الخندق/الأحزاب (٥هـ): حصار المدينة بجمعٍ عظيم من الأحزاب",
      "حفر الخندق بمشورة سلمان الفارسي، ثم فرّق الله الأحزاب بعد الشدة",
      "بنو قينقاع (٢هـ): نقضوا العهد فجُلّوا من المدينة على ما قرّره أهل المغازي",
      "بنو النضير (٤هـ): نقضوا العهد فحُوصروا ثم جُلّوا — والتفاصيل في كتب السيرة المحرَّرة",
    ],
  },
  {
    id: "hudaybiyya-mecca",
    num: 10,
    title: "الحديبية وفتح مكة",
    year: "628–630م",
    Icon: Landmark,
    color: "var(--mj-brand-deep)",
    desc: "كان صلح الحديبية فتحاً مبيناً رغم ظاهره، ثم كان فتح مكة سنة ٨هـ بعفوٍ عظيم. وفي ذلك فقه السياسة الشرعية: تقديم المصلحة العامة، وكسر دائرة الثأر، وضبط القوة بالرحمة.",
    topics: ["صلح الحديبية", "فتح مكة", "العفو العام"],
    keyEvents: [
      "صلح الحديبية (٦هـ): هدنةٌ مهّدت لانتشار الدعوة؛ وعمرة القضاء في العام التالي",
      "سمّاه الله فتحاً مبيناً، فدخل الناس في الإسلام أفواجاً بعد الصلح",
      "كُتبت رسائل دعوة إلى ملوك الأمصار (هرقل وكسرى والنجاشي والمقوقس وغيرهم) على ما ثبت في المغازي",
      "فتح مكة (٨هـ) في جمعٍ كبير، ودخلها ﷺ بأقلّ قتال",
      "حُطّمت الأصنام حول الكعبة، وتُليت: ﴿جَاءَ الْحَقُّ وَزَهَقَ الْبَاطِلُ﴾",
      "أعلن العفو عن أهل مكة: «اذهبوا فأنتم الطلقاء» — على ما اشتهر في السيرة",
      "فتح خيبر (٧هـ): فُتحت الحصون، وبقي أهلها على عهدٍ ثم جُلّيَ من بقي في عهد عمر",
    ],
  },
  {
    id: "farewell",
    num: 11,
    title: "حجة الوداع",
    year: "السنة العاشرة، 631م",
    Icon: Gem,
    color: "var(--mj-brand-deep)",
    desc: "حج النبي ﷺ حجة الوداع، وخطب في عرفات في جمع عظيم اختلفت الروايات في عدده، وأُنزل إكمال الدين. وألفاظ الوصية بالكتاب والسنة مما يُروى بوجوه؛ فيُذكر المعنى الثابت دون الجزم بصيغة لم تتحرر عند أهل الحديث.",
    topics: ["حجة الوداع", "خطبة عرفة", "اكتمال الدين"],
    keyEvents: [
      "خرج في ذي القعدة سنة عشر في جمعٍ عظيم اختلفت الروايات في تقدير عدده",
      "أدّى مناسك الحج ووقف في عرفات يوم التاسع من ذي الحجة",
      "ألقى خطبته العظيمة: حرمة الدماء والأموال والأعراض محفوظة",
      "نزل: ﴿الْيَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ وَأَتْمَمْتُ عَلَيْكُمْ نِعْمَتِي﴾",
      "أوصى بالاعتصام بكتاب الله كما في الصحيح؛ وأما لفظ «كتاب الله وسنتي» فمروي بطرق تُضعَّف عند كثير من أهل الحديث",
      "سأل الصحابة: أبلّغت؟ فقالوا: نعم، فقال: اللهم اشهد",
    ],
  },
  {
    id: "death",
    num: 12,
    title: "الوفاة",
    year: "السنة الحادية عشرة، 632م",
    Icon: Heart,
    color: "#1E4A37",
    desc: "مرض النبي ﷺ في أواخر صفر سنة ١١هـ، وانتقل إلى الرفيق الأعلى في ربيع الأول — والمشهور ١٢ منه مع خلاف في التعيين — ودُفن في حجرة عائشة رضي الله عنها. فبشريته ﷺ ظاهرة، ورسالته قد كملت، وثبّت أبو بكر الناس بكلمة الحق.",
    topics: ["مرضه ﷺ الأخير", "وفاته ودفنه", "الحزن العظيم"],
    keyEvents: [
      "بدأ مرضه ﷺ في صفر سنة إحدى عشرة بعد رحلة للبقيع",
      "صلّى بالناس في مرضه، ثم أمر أبا بكر أن يؤمهم في أيامه الأخيرة",
      "انتقل إلى الرفيق الأعلى ضحى يوم الإثنين في ربيع الأول سنة ١١هـ — والمشهور تعيين ١٢ منه مع خلاف بين أهل السيرة",
      "أعلن أبو بكر: «من كان يعبد محمداً فإن محمداً قد مات»",
      "دُفن في حجرة عائشة رضي الله عنها في الموضع الذي قُبض فيه",
      "بكى الصحابة بكاءً شديداً، وكان عمره ثلاثة وستين عاماً",
    ],
  },
];

const SOURCES = [
  "السيرة النبوية — ابن هشام (بعد تمحيص ما رواه عن ابن إسحاق)",
  "الطبقات الكبرى — ابن سعد",
  "زاد المعاد في هدي خير العباد — ابن القيم",
  "البداية والنهاية — ابن كثير (مع الحذر مما أورده من الواهي)",
  "السيرة النبوية — الذهبي",
  "الشفا بتعريف حقوق المصطفى — القاضي عياض",
  "السيرة النبوية الصحيحة — أكرم ضياء العمري",
  "مصادر السيرة النبوية وتقويمها — فاروق حمادة",
  "السيرة النبوية في ضوء المصادر الأصلية — مهدي رزق الله أحمد",
  "الرحيق المختوم — المباركفوري (عرض مبسّط معاصر يُستأنس به مع الرجوع للأصول)",
];

export default function SeerahPage() {
  usePageView("seerah", null);
  const [activeId, setActiveId] = useState(PHASES[0].id);
  const filteredPhases = PHASES;

  useEffect(() => {
    applyPageSeo({
      path: "/seerah",
      title: "السيرة النبوية | المجلس العلمي",
      description: "السيرة النبوية مرتّبة من المولد إلى الوفاة، مع تنبيه منهجي لما ثبت وما اشتهر وما يحتاج تحقيقاً عند أهل المغازي.",
      keywords: ["السيرة النبوية", "سيرة النبي", "محمد ﷺ", "تاريخ الإسلام", "الهجرة النبوية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "مراحل السيرة النبوية",
          description: "مراحل حياة النبي محمد ﷺ مرتّبة زمنياً، مع اعتماد المصادر المحررة وتجنب الجزم بما لم يثبت.",
          numberOfItems: PHASES.length,
          itemListElement: PHASES.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${p.title} (${p.year})`,
            url: `https://www.majlisilm.com/seerah#${p.id}`,
          })),
        },
      ],
    });
  }, []);

  const activeIdx = PHASES.findIndex(p => p.id === activeId);
  const active = PHASES[activeIdx];

  const goTo = (id: string) => {
    setActiveId(id);
    if (window.innerWidth <= 720) {
      const panel = document.getElementById("seerah-panel");
      if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <SectionTemplatePage
      route="/seerah"
      eyebrow="سيرة النبي ﷺ"
      title="السيرة النبوية الشريفة"
      subtitle="امتداداً لرسالة الأنبياء، حياة خاتمهم محمد ﷺ من المولد إلى الوفاة في 12 مرحلة"
      groupTitle="مراحل السيرة النبوية"
    >
      <div className="seerah-page" dir="rtl">

        {/* رابط عكسي لقصص الأنبياء */}
        <div className="seerah-back-wrap">
          <Link href="/prophets" className="seerah-back-link">
            ← قصص الأنبياء الكرام
          </Link>
        </div>

        {/* لافتة الربط: السيرة امتداد لقصص الأنبياء */}
        <div className="seerah-prophets-banner" dir="rtl">
          <span className="seerah-prophets-banner__icon" aria-hidden="true"><BookOpen size={20} strokeWidth={1.5} /></span>
          <p className="seerah-prophets-banner__text">
            <strong>السيرة النبوية</strong> خاتمة قصص الأنبياء الكرام وامتدادها الطبيعي، فهي بعثة خاتم الأنبياء والمرسلين محمد ﷺ التي أتمّ الله بها الدين وأكمل النعمة.
          </p>
          <Link href="/prophets/muhammad" className="seerah-prophets-banner__link">
            خاتم الأنبياء محمد ﷺ
            <span aria-hidden="true"> ←</span>
          </Link>
        </div>

        {/* Notice */}
        <div className="seerah-notice">
          <strong><Lightbulb size={14} className="inline ms-1" /> منهج القسم:</strong> نعتمد المصادر المحرَّرة (ابن هشام بعد التمحيص، وابن سعد، وزاد المعاد، وما وافق الصحيحين والسنن). نميّز بين الثابت والمشهور والمراسيل، ونتجنّب الإسرائيليات والجزم بما لم يثبت، ولا نُشرع احتفالاً بالمولد أو عبادةً بلا دليل.
        </div>

        {/* Timeline Layout */}
        <div className="seerah-layout">

          {/* Sidebar، قائمة المراحل */}
          <nav className="seerah-timeline" aria-label="مراحل السيرة النبوية">
            <div className="seerah-timeline__line" aria-hidden="true" />
            {filteredPhases.length === 0 ? (
              <p className="seerah-timeline__empty" role="status">
                لا نتائج لهذا البحث. جرّب كلمة أخرى، أو راجع المصادر أدناه للتفصيل.
              </p>
            ) : filteredPhases.map(phase => (
              <button
                key={phase.id}
                type="button"
                className={`seerah-timeline__item seerah-phase--${phase.id}${activeId === phase.id ? " seerah-timeline__item--active" : ""}`}
                onClick={() => goTo(phase.id)}
                aria-current={activeId === phase.id ? "true" : undefined}
                aria-label={`المرحلة ${phase.num}: ${phase.title}`}
              >
                <span className="seerah-timeline__dot">
                  {phase.num}
                </span>
                <span className="seerah-timeline__label">
                  <span className="seerah-timeline__title">{phase.title}</span>
                  <span className="seerah-timeline__year">{phase.year.split("—")[0].trim()}</span>
                </span>
              </button>
            ))}
          </nav>

          {/* Detail Panel */}
          <div className={`seerah-panel seerah-phase--${active.id}`} id="seerah-panel">
            <div className="seerah-panel__header">
              <span className="seerah-panel__icon">{(() => { const I = active.Icon; return <I size={28} strokeWidth={1.3} />; })()}</span>
              <div className="seerah-panel__header-body">
                <div className="seerah-panel__num">
                  المرحلة {active.num} من {PHASES.length}
                </div>
                <h2 className="seerah-panel__title">{active.title}</h2>
                <div className="seerah-panel__year">
                  {active.year}
                </div>
              </div>
            </div>

            <p className="seerah-panel__desc">{active.desc}</p>

            <div className="seerah-panel__topics">
              {active.topics.map(t => (
                <span key={t} className="seerah-panel__topic">{t}</span>
              ))}
            </div>

            {active.keyEvents.length > 0 && (
              <div className="seerah-panel__events">
                <h3 className="seerah-panel__events-title">أبرز الأحداث</h3>
                <ul className="seerah-panel__events-list">
                  {active.keyEvents.map((ev, i) => (
                    <li key={i} className="seerah-panel__event-item">
                      <span className="seerah-panel__event-dot" aria-hidden="true" />
                      {ev}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <ShareButton
              title={`السيرة النبوية، ${active.title}`}
              text={`${active.title} (${active.year})\n${active.desc}`}
              size="sm"
              className="seerah-panel__share"
            />

            {/* Navigation */}
            <div className="seerah-panel__nav">
              {activeIdx > 0 && (
                <button
                  type="button"
                  className="seerah-panel__nav-btn"
                  onClick={() => goTo(PHASES[activeIdx - 1].id)}
                >
                  ← {PHASES[activeIdx - 1].title}
                </button>
              )}
              {activeIdx < PHASES.length - 1 && (
                <button
                  type="button"
                  className="seerah-panel__nav-btn seerah-panel__nav-btn--next"
                  onClick={() => goTo(PHASES[activeIdx + 1].id)}
                >
                  {PHASES[activeIdx + 1].title} →
                </button>
              )}
            </div>
          </div>
        </div>

        <nav className="seerah-related" aria-label="موضوعات ذات صلة">
          <h2 className="seerah-related__title">موضوعات ذات صلة</h2>
          <div className="seerah-related__grid">
            {[
              { href: "/prophets/muhammad", label: "خاتم الأنبياء محمد ﷺ" },
              { href: "/prophets", label: "قصص الأنبياء" },
              { href: "/shamael", label: "الشمائل المحمدية" },
              { href: "/wasaya-nabawiyya", label: "الوصايا النبوية" },
              { href: "/tawhid", label: "التوحيد" },
              { href: "/hadith", label: "الأحاديث الصحيحة" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="seerah-related__link">{l.label}</Link>
            ))}
          </div>
        </nav>

        {/* المصادر */}
        <div className="seerah-sources">
          <h2 className="seerah-sources__title"><Library size={18} className="inline ms-2" /> مصادر السيرة المعتمدة</h2>
          <ul className="seerah-sources__list">
            {SOURCES.map(src => (
              <li key={src} className="seerah-sources__item">
                <span className="seerah-sources__bullet">•</span>
                {src}
              </li>
            ))}
          </ul>
          <p className="seerah-sources__note">
            تنبيه منهجي: ما نُسب للصحيحين أو السنن يُقدَّم؛ وما كان من مراسيل المغازي أو الأخبار التاريخية يُذكر بتحفّظ، ولا يُبنى عليه حكمٌ تعبّدي بلا دليل.
          </p>
        </div>

      </div>

      <div className="page-shell narrow">
        <SectionQuiz sectionId="seerah" title="اختبر معلوماتك في السيرة النبوية" count={4} />
      </div>

      <AdminQuickEdit section="prophet-stories" />
    </SectionTemplatePage>
  );
}
