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
