import { arabicMatchAny } from "@/lib/arabic-search";
import type { SeerahEvent, SeerahPhase } from "./types";

/**
 * أحداث السيرة المصدَّرة للعرض — من المولد إلى الوفاة.
 * لا يُدرج هنا إلا ما له مصدر (عمل + مرجع). الناقص في review-queue.
 */
export const SEERAH_EVENTS: SeerahEvent[] = [
  {
    id: "birth",
    titleAr: "المولد الشريف",
    phase: "pre_prophethood",
    yearHijri: null,
    yearGregorian: 571,
    place: "مكة المكرمة",
    people: ["عبد الله بن عبد المطلب", "آمنة بنت وهب", "عبد المطلب"],
    shortDescription:
      "وُلد النبي ﷺ بمكة في عام الفيل من نسب هاشمي قرشي. واختلف أهل السيرة في تعيين يوم المولد وشهره؛ فلا يُبنى على يومٍ بعينه عبادة لم تُشرع.",
    sources: [
      { work: "ibn_hisham", reference: "سيرة ابن هشام — باب مولد رسول الله ﷺ" },
      { work: "ibn_kathir_bidayah", reference: "البداية والنهاية — مولد النبي ﷺ" },
      {
        work: "mubarakfuri_rahiq",
        reference: "الرحيق المختوم — المولد والنسب",
        note: "عرض مبسّط يُستأنس به مع الرجوع للأصول",
      },
    ],
    dateCertainty: "disputed",
    caveat: "المشهور ١٢ ربيع الأول مع خلاف؛ لا يُشرع احتفال بالمولد.",
  },
  {
    id: "nursing-halima",
    titleAr: "الرضاعة عند حليمة السعدية",
    phase: "pre_prophethood",
    yearHijri: null,
    yearGregorian: 571,
    place: "بادية بني سعد",
    people: ["حليمة السعدية", "ثويبة"],
    shortDescription:
      "أرضعته ثويبة مولاة أبي لهب أياماً ثم أُرسل إلى بني سعد، فأرضعته حليمة السعدية. وذكر أهل السيرة بركةً في قومها بسببه على ما اشتهر في المغازي.",
    sources: [
      { work: "ibn_hisham", reference: "سيرة ابن هشام — رضاعة النبي ﷺ" },
      { work: "ibn_saad", reference: "الطبقات الكبرى — ذكر رضاعه ﷺ" },
      { work: "mubarakfuri_rahiq", reference: "الرحيق المختوم — الرضاعة والطفولة" },
    ],
    dateCertainty: "approximate",
  },
  {
    id: "chest-opening-childhood",
    titleAr: "شق الصدر في الطفولة",
    phase: "pre_prophethood",
    yearHijri: null,
    yearGregorian: 575,
    place: "بادية بني سعد",
    people: ["أنس بن مالك"],
    shortDescription:
      "شقّ الصدر في طفولته ثابتٌ في الصحيح من حديث أنس رضي الله عنه. ويُفرَّق بينه وبين ما يُروى من شق الصدر في المعراج.",
    sources: [
      { work: "sahih_muslim", reference: "صحيح مسلم — كتاب الإيمان — حديث أنس في شق الصدر" },
      { work: "sahih_bukhari", reference: "صحيح البخاري — بدء الوحي / الأنبياء (روايات ذات صلة)" },
      { work: "ibn_kathir_bidayah", reference: "البداية والنهاية — شق صدر النبي ﷺ" },
    ],
    dateCertainty: "approximate",
    caveat: "الثبوت في المعنى من الصحيح؛ تفاصيل التوقيت من السيرة.",
  },
  {
    id: "marriage-khadija",
    titleAr: "الزواج من خديجة رضي الله عنها",
    phase: "pre_prophethood",
    yearHijri: null,
    yearGregorian: 595,
    place: "مكة المكرمة",
    people: ["خديجة بنت خويلد", "محمد ﷺ"],
    shortDescription:
      "تزوج خديجة بنت خويلد وعمره خمس وعشرون سنة. والمشهور أنها كانت في الأربعين وقيل دون ذلك؛ ولا يثبت تحديد عمرها بحديث صحيح.",
    sources: [
      { work: "ibn_hisham", reference: "سيرة ابن هشام — تزويج خديجة" },
      { work: "ibn_saad", reference: "الطبقات الكبرى — زوجاته ﷺ — خديجة" },
      { work: "ibn_kathir_bidayah", reference: "البداية والنهاية — زواجه من خديجة" },
    ],
    dateCertainty: "approximate",
    caveat: "عمر خديجة عند الزواج محل اختلاف؛ لا يُجزم برقم بلا سند صحيح.",
  },
  {
    id: "first-revelation",
    titleAr: "نزول الوحي الأول",
    phase: "makki",
    yearHijri: null,
    yearGregorian: 610,
    place: "غار حراء — مكة",
    people: ["جبريل عليه السلام", "خديجة بنت خويلد", "ورقة بن نوفل"],
    shortDescription:
      "نزل جبريل عليه السلام في غار حراء بأوائل سورة العلق: ﴿اقْرَأْ بِاسْمِ رَبِّكَ﴾. فثبّتته خديجة، وأرشدها ورقة بن نوفل إلى حقيقة الوحي.",
    sources: [
      { work: "sahih_bukhari", reference: "صحيح البخاري — بدء الوحي — حديث عائشة" },
      { work: "sahih_muslim", reference: "صحيح مسلم — بدء الوحي" },
      { work: "ibn_hisham", reference: "سيرة ابن هشام — مبعث النبي ﷺ" },
    ],
    dateCertainty: "approximate",
  },
  {
    id: "open-dawah",
    titleAr: "الجهر بالدعوة",
    phase: "makki",
    yearHijri: null,
    yearGregorian: 613,
    place: "الصفا — مكة",
    people: ["قريش", "أبو طالب"],
    shortDescription:
      "بعد الأمر بالصدع، صعد النبي ﷺ الصفا ونادى قريشاً. فاشتد الأذى، وتعرّض المستضعفون للتعذيب، ثم كان الحصار في شعب أبي طالب.",
    sources: [
      { work: "ibn_hisham", reference: "سيرة ابن هشام — إظهار الدعوة" },
      { work: "ibn_kathir_bidayah", reference: "البداية والنهاية — الجهر بالدعوة" },
      { work: "mubarakfuri_rahiq", reference: "الرحيق المختوم — الجهر بالدعوة" },
    ],
    dateCertainty: "approximate",
  },
  {
    id: "abyssinia-hijra",
    titleAr: "الهجرة إلى الحبشة",
    phase: "makki",
    yearHijri: null,
    yearGregorian: 615,
    place: "الحبشة (أرض النجاشي)",
    people: ["جعفر بن أبي طالب", "أم سلمة", "النجاشي"],
    shortDescription:
      "أذن النبي ﷺ للمستضعفين بالهجرة إلى الحبشة. أحسن النجاشي وفادتهم ورفض تسليمهم لقريش. والخبر ثابت المعنى في السيرة الصحيحة؛ وتختلف الروايات في العدد الدقيق.",
    sources: [
      { work: "ibn_hisham", reference: "سيرة ابن هشام — الهجرة إلى أرض الحبشة" },
      { work: "ibn_saad", reference: "الطبقات الكبرى — ذكر من هاجر إلى الحبشة" },
      { work: "akram_diya_umari", reference: "السيرة النبوية الصحيحة — الهجرة إلى الحبشة" },
    ],
    dateCertainty: "approximate",
  },
  {
    id: "year-of-sorrow",
    titleAr: "عام الحزن",
    phase: "makki",
    yearHijri: null,
    yearGregorian: 619,
    place: "مكة المكرمة",
    people: ["خديجة بنت خويلد", "أبو طالب"],
    shortDescription:
      "توفيت خديجة رضي الله عنها وأبو طالب في عامٍ واحد سُمّي عام الحزن. ففقد النبي ﷺ الناصرة في البيت والحماية في القبيلة، ثم خرج إلى الطائف يطلب النصرة.",
    sources: [
      { work: "ibn_hisham", reference: "سيرة ابن هشام — وفاة أبي طالب وخديجة" },
      { work: "ibn_kathir_bidayah", reference: "البداية والنهاية — عام الحزن" },
      { work: "mubarakfuri_rahiq", reference: "الرحيق المختوم — عام الحزن" },
    ],
    dateCertainty: "approximate",
  },
  {
    id: "isra-miraj",
    titleAr: "الإسراء والمعراج",
    phase: "makki",
    yearHijri: null,
    yearGregorian: 620,
    place: "المسجد الحرام → المسجد الأقصى → السماوات",
    people: ["جبريل عليه السلام", "الأنبياء عليهم السلام"],
    shortDescription:
      "أُسري بالنبي ﷺ ليلاً من المسجد الحرام إلى المسجد الأقصى، ثم عُرج به إلى السماوات، وفيه فُرضت الصلوات الخمس. وهو تثبيط بعد عام الحزن.",
    sources: [
      { work: "sahih_bukhari", reference: "صحيح البخاري — كتاب الصلاة / بدء الخلق — أحاديث الإسراء" },
      { work: "sahih_muslim", reference: "صحيح مسلم — كتاب الإيمان — الإسراء" },
      { work: "ibn_hisham", reference: "سيرة ابن هشام — الإسراء والمعراج" },
    ],
    dateCertainty: "disputed",
    caveat: "الثبوت في الجملة قطعي المعنى من الكتاب والسنة؛ تعيين السنة فيه خلاف بين أهل السيرة.",
  },
  {
    id: "hijra-madinah",
    titleAr: "الهجرة إلى المدينة",
    phase: "madani",
    yearHijri: 1,
    yearGregorian: 622,
    place: "مكة → غار ثور → قباء → المدينة",
    people: ["أبو بكر الصديق", "علي بن أبي طالب", "الأنصار"],
    shortDescription:
      "أذن الله بالهجرة إلى يثرب، فخرج ﷺ مع أبي بكر وآويا إلى غار ثور، ثم وصل المدينة فبنى المسجد وآخى بين المهاجرين والأنصار، ووضع وثيقة المدينة.",
    sources: [
      { work: "sahih_bukhari", reference: "صحيح البخاري — كتاب مناقب الأنصار — باب هجرة النبي ﷺ" },
      { work: "ibn_hisham", reference: "سيرة ابن هشام — الهجرة" },
      { work: "ibn_kathir_bidayah", reference: "البداية والنهاية — الهجرة النبوية" },
    ],
    dateCertainty: "certain",
  },
  {
    id: "badr",
    titleAr: "غزوة بدر الكبرى",
    phase: "madani",
    yearHijri: 2,
    yearGregorian: 624,
    place: "بدر",
    people: ["المهاجرون", "الأنصار", "قريش"],
    shortDescription:
      "نصر الله المؤمنين في بدر بأقلّ عددٍ على ما اشتهر في المغازي. نزلت أحكام في الأسرى والفداء، وسُمّيت يوم الفرقان.",
    sources: [
      { work: "sahih_bukhari", reference: "صحيح البخاري — كتاب المغازي — باب غزوة بدر" },
      { work: "ibn_hisham", reference: "سيرة ابن هشام — غزوة بدر" },
      { work: "ibn_kathir_bidayah", reference: "البداية والنهاية — غزوة بدر الكبرى" },
    ],
    dateCertainty: "certain",
    caveat: "الأعداد التفصيلية مما تتداوله كتب السيرة ويحتاج تمحيصاً عند التعارض.",
  },
  {
    id: "uhud",
    titleAr: "غزوة أُحد",
    phase: "madani",
    yearHijri: 3,
    yearGregorian: 625,
    place: "جبل أُحد — المدينة",
    people: ["حمزة بن عبد المطلب", "الرماة", "قريش"],
    shortDescription:
      "ابتلاء بعد مخالفة الرماة أمر النبي ﷺ. جُرح ﷺ واستُشهد عشرات الصحابة رضي الله عنهم، وظهر فقه الصبر والشورى.",
    sources: [
      { work: "sahih_bukhari", reference: "صحيح البخاري — كتاب المغازي — باب غزوة أحد" },
      { work: "ibn_hisham", reference: "سيرة ابن هشام — غزوة أحد" },
      { work: "ibn_al_qayyim_zad", reference: "زاد المعاد — غزوة أحد" },
    ],
    dateCertainty: "certain",
  },
  {
    id: "khandaq",
    titleAr: "غزوة الخندق (الأحزاب)",
    phase: "madani",
    yearHijri: 5,
    yearGregorian: 627,
    place: "المدينة المنورة",
    people: ["سلمان الفارسي", "الأحزاب", "نعيم بن مسعود"],
    shortDescription:
      "حاصر الأحزاب المدينة، فحُفر الخندق بمشورة سلمان الفارسي. ثم فرّق الله الأحزاب بعد الشدة، ونزلت سورة الأحزاب.",
    sources: [
      { work: "sahih_bukhari", reference: "صحيح البخاري — كتاب المغازي — باب غزوة الخندق" },
      { work: "ibn_hisham", reference: "سيرة ابن هشام — غزوة الخندق" },
      { work: "ibn_al_qayyim_zad", reference: "زاد المعاد — غزوة الخندق" },
    ],
    dateCertainty: "certain",
  },
  {
    id: "hudaybiyya",
    titleAr: "صلح الحديبية",
    phase: "madani",
    yearHijri: 6,
    yearGregorian: 628,
    place: "الحديبية",
    people: ["سهيل بن عمرو", "أبو جندل", "عثمان بن عفان"],
    shortDescription:
      "عُقدت هدنة مع قريش رغم ظاهر الشروط الثقيلة، فسمّاه الله فتحاً مبيناً. مهّد الصلح لانتشار الدعوة وعمرة القضاء في العام التالي.",
    sources: [
      { work: "sahih_bukhari", reference: "صحيح البخاري — كتاب الشروط / المغازي — الحديبية" },
      { work: "ibn_hisham", reference: "سيرة ابن هشام — عمرة الحديبية" },
      { work: "ibn_al_qayyim_zad", reference: "زاد المعاد — صلح الحديبية" },
    ],
    dateCertainty: "certain",
  },
  {
    id: "khaybar",
    titleAr: "غزوة خيبر",
    phase: "madani",
    yearHijri: 7,
    yearGregorian: 628,
    place: "خيبر",
    people: ["علي بن أبي طالب", "أهل خيبر"],
    shortDescription:
      "فُتحت حصون خيبر، وبقي أهلها على عهد يعملون في الأرض ثم جُلّيَ من بقي في عهد عمر رضي الله عنه على ما تقرّر عند أهل المغازي.",
    sources: [
      { work: "sahih_bukhari", reference: "صحيح البخاري — كتاب المغازي — باب غزوة خيبر" },
      { work: "ibn_hisham", reference: "سيرة ابن هشام — غزوة خيبر" },
      { work: "ibn_kathir_bidayah", reference: "البداية والنهاية — فتح خيبر" },
    ],
    dateCertainty: "certain",
  },
  {
    id: "fath-makkah",
    titleAr: "فتح مكة",
    phase: "madani",
    yearHijri: 8,
    yearGregorian: 630,
    place: "مكة المكرمة",
    people: ["أبو سفيان", "الطلقاء", "الأنصار"],
    shortDescription:
      "دخل النبي ﷺ مكة في جمعٍ كبير بأقلّ قتال، وحُطّمت الأصنام حول الكعبة، وأعلن العفو: «اذهبوا فأنتم الطلقاء» على ما اشتهر في السيرة.",
    sources: [
      { work: "sahih_bukhari", reference: "صحيح البخاري — كتاب المغازي — باب فتح مكة" },
      { work: "ibn_hisham", reference: "سيرة ابن هشام — فتح مكة" },
      { work: "ibn_al_qayyim_zad", reference: "زاد المعاد — فتح مكة" },
    ],
    dateCertainty: "certain",
  },
  {
    id: "hunayn",
    titleAr: "غزوة حنين",
    phase: "madani",
    yearHijri: 8,
    yearGregorian: 630,
    place: "حنين → الطائف",
    people: ["هوازن", "ثقيف", "الأنصار"],
    shortDescription:
      "بعد فتح مكة خرجت هوازن وثقيف، فكانت شدة أول الأمر ثم نصر الله المؤمنين. وفيها مواعظ في العُجب والتوكل وتقسيم الغنائم.",
    sources: [
      { work: "sahih_bukhari", reference: "صحيح البخاري — كتاب المغازي — باب غزوة حنين" },
      { work: "ibn_hisham", reference: "سيرة ابن هشام — غزوة حنين" },
      { work: "ibn_kathir_bidayah", reference: "البداية والنهاية — غزوة حنين" },
    ],
    dateCertainty: "certain",
  },
  {
    id: "farewell-hajj",
    titleAr: "حجة الوداع",
    phase: "madani",
    yearHijri: 10,
    yearGregorian: 631,
    place: "مكة — عرفات — منى",
    people: ["الصحابة رضي الله عنهم"],
    shortDescription:
      "حج النبي ﷺ حجة الوداع وخطب في عرفات، ونزل إكمال الدين. أوصى بالاعتصام بكتاب الله كما في الصحيح؛ وأما صيغ بعض الألفاظ فمحل نقد عند أهل الحديث.",
    sources: [
      { work: "sahih_bukhari", reference: "صحيح البخاري — كتاب الحج — حجة الوداع" },
      { work: "sahih_muslim", reference: "صحيح مسلم — كتاب الحج — حجة النبي ﷺ" },
      { work: "ibn_hisham", reference: "سيرة ابن هشام — حجة الوداع" },
    ],
    dateCertainty: "certain",
    caveat: "عدد الحجيج مما اختلفت فيه الروايات؛ يُذكر المعنى دون الجزم برقم.",
  },
  {
    id: "death",
    titleAr: "وفاة النبي ﷺ",
    phase: "madani",
    yearHijri: 11,
    yearGregorian: 632,
    place: "المدينة — حجرة عائشة رضي الله عنها",
    people: ["عائشة بنت أبي بكر", "أبو بكر الصديق", "عمر بن الخطاب"],
    shortDescription:
      "مرض النبي ﷺ في أواخر صفر سنة ١١هـ، وانتقل إلى الرفيق الأعلى ضحى يوم الإثنين في ربيع الأول، ودُفن في حجرة عائشة رضي الله عنها. ثبّت أبو بكر الناس بكلمة الحق.",
    sources: [
      { work: "sahih_bukhari", reference: "صحيح البخاري — كتاب المغازي — باب مرض النبي ﷺ ووفاته" },
      { work: "sahih_muslim", reference: "صحيح مسلم — فضائل الصحابة / الجنائز — روايات الوفاة" },
      { work: "ibn_hisham", reference: "سيرة ابن هشام — وفاة رسول الله ﷺ" },
    ],
    dateCertainty: "disputed",
    caveat: "اليوم والشهر في ربيع الأول محل خلاف؛ المشهور ١٢ منه ولا يُقطع به عبادة.",
  },
];

export function getSeerahEvent(id: string): SeerahEvent | undefined {
  return SEERAH_EVENTS.find((e) => e.id === id);
}

export type SeerahEventFilter = {
  phase?: SeerahPhase | "all";
  yearHijri?: number | null;
  search?: string;
};

/** تصفية بالمرحلة والسنة الهجرية والبحث العربي (تطبيع + مرادفات). */
export function filterSeerahEvents(
  filter: SeerahEventFilter = {},
  events: readonly SeerahEvent[] = SEERAH_EVENTS,
): SeerahEvent[] {
  const phase = filter.phase ?? "all";
  const yearHijri = filter.yearHijri;
  const search = filter.search?.trim() ?? "";

  return events.filter((event) => {
    if (phase !== "all" && event.phase !== phase) return false;
    if (yearHijri != null && event.yearHijri !== yearHijri) return false;
    if (!search) return true;
    return arabicMatchAny(
      [
        event.titleAr,
        event.shortDescription,
        event.place,
        event.caveat ?? "",
        ...event.people,
        ...event.sources.map((s) => s.reference),
      ],
      search,
    );
  });
}
