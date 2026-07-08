export type IslamicOccasion = {
  id: string;
  name: string;
  hijriMonth: number;
  hijriDay: number;
  summary: string;
  deeds: string[];
  evidence: string;
  recurring: boolean;
};

/** Approximate hijri mapping — verified occasions with established sunnah. */
export const ISLAMIC_OCCASIONS: IslamicOccasion[] = [
  {
    id: "ashura",
    name: "يوم عاشوراء",
    hijriMonth: 1,
    hijriDay: 10,
    summary: "يوم عظيم من أيام الله، صامه النبي ﷺ وآمر بصيامه.",
    deeds: ["صيام يوم عاشوراء", "الإكثار من ذكر الله", "الصدقة"],
    evidence: "رواه البخاري ومسلم في صيام النبي ﷺ ليوم عاشوراء",
    recurring: true,
  },
  {
    id: "arafah",
    name: "يوم عرفة",
    hijriMonth: 12,
    hijriDay: 9,
    summary: "خير دعاء دعاء يوم عرفة، وصيامه يكفر سنتين.",
    deeds: ["الإكثار من الدعاء", "صيام يوم عرفة لغير الحاج", "التوبة"],
    evidence: "رواه مسلم من حديث عائشة رضي الله عنها",
    recurring: true,
  },
  {
    id: "ramadan",
    name: "شهر رمضان",
    hijriMonth: 9,
    hijriDay: 1,
    summary: "شهر الصيام والقرآن والقيام.",
    deeds: ["صيام فرض رمضان", "قراءة القرآن", "قيام الليل", "الصدقة"],
    evidence: "قال تعالى: ﴿شَهْرُ رَمَضَانَ الَّذِي أُنْزِلَ فِيهِ الْقُرْآنُ﴾",
    recurring: true,
  },
  {
    id: "laylat-alqadr",
    name: "ليلة القدر",
    hijriMonth: 9,
    hijriDay: 27,
    summary: "ليلة خير من ألف شهر، يحرص المسلم على قيامها.",
    deeds: ["الاجتهاد في العبادة", "الدعاء", "قراءة القرآن", "الاستغفار"],
    evidence: "رواه البخاري ومسلم في فضل ليلة القدر",
    recurring: true,
  },
  {
    id: "eid-fitr",
    name: "عيد الفطر",
    hijriMonth: 10,
    hijriDay: 1,
    summary: "عيد المسلمين بعد رمضان — تكبير وصلاة.",
    deeds: ["صلاة العيد", "التكبير", "صلة الرحم", "الفرح بالطاعة"],
    evidence: "رواه البخاري ومسلم في صلاة العيدين",
    recurring: true,
  },
  {
    id: "eid-adha",
    name: "عيد الأضحى",
    hijriMonth: 12,
    hijriDay: 10,
    summary: "أيام التشريق أيام أكل وشرب وذكر لله.",
    deeds: ["صلاة العيد", "ذبح الأضحية", "التكبير", "صلة الرحم"],
    evidence: "رواه مسلم في أيام التشريق",
    recurring: true,
  },
  {
    id: "white-days",
    name: "الأيام البيض",
    hijriMonth: 0,
    hijriDay: 13,
    summary: "صيام ثلاثة أيام من كل شهر: 13 و14 و15.",
    deeds: ["صيام الأيام البيض", "ذكر الله", "صدقة"],
    evidence: "رواه النسائي وصححه الألباني",
    recurring: true,
  },
  {
    id: "mon-thu",
    name: "الإثنين والخميس",
    hijriMonth: 0,
    hijriDay: 0,
    summary: "يومان تُعرض فيهما الأعمال على الله.",
    deeds: ["صيام الاثنين والخميس", "ذكر الله", "قراءة القرآن"],
    evidence: "رواه الترمذي وصححه الألباني",
    recurring: true,
  },
  {
    id: "dhul-hijjah-ten",
    name: "عشر ذي الحجة",
    hijriMonth: 12,
    hijriDay: 1,
    summary: "أيام عظيمة، من أحب إليه الله العمل الصالح فيها.",
    deeds: ["صيام تاسوعاء وعاشوراء من الحجة", "التكبير", "الصدقة", "ذكر الله"],
    evidence: "رواه البخاري في فضل العمل في عشر ذي الحجة",
    recurring: true,
  },
  {
    id: "hijri-new-year",
    name: "بداية السنة الهجرية",
    hijriMonth: 1,
    hijriDay: 1,
    summary: "مناسبة للتوبة والتزود بالعمل الصالح.",
    deeds: ["ذكر الله", "حسن الظن بالله", "التوبة", "الدعاء"],
    evidence: "من السنة حسن البدايات بالعبادة دون بدع",
    recurring: true,
  },
  {
    id: "mawlid-annabawi",
    name: "المولد النبوي الشريف",
    hijriMonth: 3,
    hijriDay: 12,
    summary: "ذكرى مولد النبي ﷺ — فرصة للصلاة عليه والتعرف على سيرته.",
    deeds: ["الإكثار من الصلاة على النبي ﷺ", "قراءة السيرة النبوية", "الصدقة"],
    evidence: "يُستحب الإكثار من الصلاة على النبي ﷺ في كل وقت",
    recurring: true,
  },
  {
    id: "rajab-first",
    name: "دخول شهر رجب",
    hijriMonth: 7,
    hijriDay: 1,
    summary: "شهر من الأشهر الحرم، استحب فيه بعض العلماء صيامه.",
    deeds: ["الدعاء: اللهم بارك لنا في رجب وشعبان", "الصدقة", "الاستغفار"],
    evidence: "رواه البزار بإسناد حسن في دعاء دخول رجب",
    recurring: true,
  },
  {
    id: "isra-miraj",
    name: "ليلة الإسراء والمعراج",
    hijriMonth: 7,
    hijriDay: 27,
    summary: "ذكرى رحلة النبي ﷺ إلى بيت المقدس والسماوات، وفيها فُرضت الصلوات الخمس.",
    deeds: ["الصلاة على النبي ﷺ", "قراءة القصة من الكتاب والسنة", "شكر الله على نعمة الصلاة"],
    evidence: "قال تعالى: ﴿سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا مِّنَ الْمَسْجِدِ الْحَرَامِ﴾",
    recurring: true,
  },
  {
    id: "shaaban-fifteen",
    name: "ليلة النصف من شعبان",
    hijriMonth: 8,
    hijriDay: 15,
    summary: "ليلة تُرفع فيها الأعمال وفيها رأي لبعض العلماء في فضل إحيائها.",
    deeds: ["الاستغفار", "الصلاة", "الدعاء والتوبة"],
    evidence: "أحاديث في فضلها، وقد ضعّفها بعض العلماء وصحّحها آخرون",
    recurring: true,
  },
  {
    id: "shaaban-entry",
    name: "دخول شهر شعبان",
    hijriMonth: 8,
    hijriDay: 1,
    summary: "شهر يغفل عنه الناس بين رجب ورمضان، وكان النبي ﷺ يكثر الصيام فيه.",
    deeds: ["الإكثار من الصيام تطوعاً", "قراءة القرآن تهيؤاً لرمضان", "الصدقة"],
    evidence: "رواه البخاري: «كان أكثر صيامه في شعبان»",
    recurring: true,
  },
  {
    id: "friday-weekly",
    name: "يوم الجمعة",
    hijriMonth: 0,
    hijriDay: 0,
    summary: "سيد الأيام وعيد الأسبوع للمسلمين — يوم فاضل تُغفر فيه الذنوب.",
    deeds: [
      "صلاة الجمعة",
      "الإكثار من الصلاة على النبي ﷺ",
      "قراءة سورة الكهف",
      "الدعاء في ساعة الإجابة",
      "الاغتسال والتطيب",
    ],
    evidence: "رواه البخاري ومسلم في فضل يوم الجمعة",
    recurring: true,
  },
  {
    id: "last-ten-ramadan",
    name: "العشر الأواخر من رمضان",
    hijriMonth: 9,
    hijriDay: 21,
    summary: "أفضل ليالي السنة وفيها ليلة القدر خير من ألف شهر.",
    deeds: [
      "الاعتكاف في المسجد",
      "قيام الليل",
      "الإكثار من الدعاء",
      "التماس ليلة القدر في الأوتار",
      "قراءة القرآن",
    ],
    evidence: "رواه البخاري ومسلم: «كان يشدّ المئزر ويُحيي الليل في العشر الأواخر»",
    recurring: true,
  },
  {
    id: "days-tashriq",
    name: "أيام التشريق",
    hijriMonth: 12,
    hijriDay: 11,
    summary: "أيام 11 و12 و13 من ذي الحجة — أيام أكل وشرب وذكر لله.",
    deeds: ["التكبير المقيد بعد الصلوات", "ذكر الله", "الفرح والعبادة"],
    evidence: "رواه مسلم: «أيام التشريق أيام أكل وشرب وذكر الله»",
    recurring: true,
  },
  {
    id: "day-tarwiyah",
    name: "يوم التروية",
    hijriMonth: 12,
    hijriDay: 8,
    summary: "الثامن من ذي الحجة — يوم يتروّى فيه الحجاج ويُهيئون أنفسهم للوقوف.",
    deeds: ["صيامه لغير الحاج", "الصلاة على النبي ﷺ", "الدعاء"],
    evidence: "استحسنه بعض العلماء لأن النبي ﷺ أهلّ فيه",
    recurring: true,
  },
  {
    id: "fajr-prayer",
    name: "صلاة الفجر",
    hijriMonth: 0,
    hijriDay: 0,
    summary: "صلاة الفجر في جماعة تعدل قيام نصف الليل — حرص المؤمن على أدائها.",
    deeds: ["أداء صلاة الفجر في جماعة", "قراءة أذكار الصباح", "الجلوس في المصلى حتى الإشراق"],
    evidence: "رواه مسلم: «من صلى العشاء في جماعة كأنما قام نصف الليل»",
    recurring: true,
  },
  {
    id: "isha-prayer",
    name: "صلاة العشاء",
    hijriMonth: 0,
    hijriDay: 0,
    summary: "صلاة العشاء في جماعة تعدل قيام نصف الليل — فضيلة عظيمة.",
    deeds: ["أداء صلاة العشاء في جماعة", "الوتر", "أذكار المساء"],
    evidence: "رواه مسلم: «من صلى العشاء في جماعة كأنما قام نصف الليل»",
    recurring: true,
  },
  {
    id: "birth-prophet-day-27-rajab",
    name: "يوم البعثة النبوية",
    hijriMonth: 7,
    hijriDay: 27,
    summary: "ذكرى نزول الوحي الأول على النبي ﷺ في غار حراء.",
    deeds: ["تلاوة أوائل سورة العلق", "مراجعة السيرة", "الصلاة على النبي ﷺ"],
    evidence: "ثابت في صحيح البخاري: «فجاءه الملك فقال: اقرأ»",
    recurring: true,
  },
  {
    id: "jumadal-oula",
    name: "شهر جمادى الأولى",
    hijriMonth: 5,
    hijriDay: 1,
    summary: "شهر من الأشهر القمرية — مناسبة للاستزادة من العبادات.",
    deeds: ["الإكثار من النوافل", "الاستغفار", "الصدقة"],
    evidence: "من الأشهر التي ينبغي عمارتها بالعبادة",
    recurring: true,
  },
  {
    id: "shawwal-six",
    name: "صيام ستة من شوال",
    hijriMonth: 10,
    hijriDay: 2,
    summary: "من صام رمضان وأتبعه ستاً من شوال كصيام الدهر.",
    deeds: ["صيام ستة أيام من شوال", "الشكر على إتمام رمضان", "الدعاء"],
    evidence: "رواه مسلم من حديث أبي أيوب الأنصاري",
    recurring: true,
  },
];

/** Simple hijri estimate from Gregorian (Umm al-Qura approximation). */
export function estimateHijriDate(date = new Date()) {
  const gregorian = new Date(date);
  const jd =
    Math.floor((1461 * (gregorian.getFullYear() + 4800 + Math.floor((gregorian.getMonth() - 14) / 12))) / 4) +
    Math.floor((367 * (gregorian.getMonth() - 2 - 12 * Math.floor((gregorian.getMonth() - 14) / 12))) / 12) -
    Math.floor(3 * Math.floor((gregorian.getFullYear() + 4900 + Math.floor((gregorian.getMonth() - 14) / 12)) / 100) / 4) +
    gregorian.getDate() -
    32075;

  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l3) / 709);
  const day = l3 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;

  return { year, month, day };
}

export function daysUntilOccasion(occasion: IslamicOccasion, today = estimateHijriDate()) {
  if (occasion.hijriMonth === 0) {
    if (occasion.id === "mon-thu") {
      const dow = new Date().getDay();
      const mon = 1;
      const thu = 4;
      const next = [mon, thu].map((d) => (d - dow + 7) % 7 || 7);
      return Math.min(...next);
    }
    if (occasion.id === "white-days") {
      const d = today.day;
      if (d >= 13 && d <= 15) return 0;
      return d < 13 ? 13 - d : 30 - d + 13;
    }
    return null;
  }

  let months = occasion.hijriMonth - today.month;
  if (months < 0) months += 12;
  let days = occasion.hijriDay - today.day + months * 29.5;
  if (days < 0) days += 354;
  return Math.round(days);
}

export function filterOccasions(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return ISLAMIC_OCCASIONS;
  return ISLAMIC_OCCASIONS.filter(
    (o) =>
      o.name.includes(q) ||
      o.summary.includes(q) ||
      o.deeds.some((d) => d.includes(q)),
  );
}
