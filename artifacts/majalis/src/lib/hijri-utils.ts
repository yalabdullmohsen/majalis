export type SacredMonthInfo = {
  name: string;
  virtue: string;
  deeds: string[];
};

export type HijriInfo = {
  day: number;
  month: number;
  monthName: string;
  year: number;
  isSacred: boolean;
  sacredInfo?: SacredMonthInfo;
};

const HIJRI_MONTH_NAMES: Record<number, string> = {
  1: "محرَّم", 2: "صَفَر", 3: "ربيع الأول", 4: "ربيع الآخر",
  5: "جُمادى الأولى", 6: "جُمادى الآخرة", 7: "رَجَب",
  8: "شَعبان", 9: "رمضان", 10: "شَوَّال",
  11: "ذو القَعدة", 12: "ذو الحِجَّة",
};

const SACRED_MONTH_INFO: Record<number, SacredMonthInfo> = {
  1: {
    name: "محرَّم",
    virtue: "شهر الله المحرَّم؛ أفضل الصيام بعد رمضان صيامُ شهر الله المحرَّم، وأفضله صيام عاشوراء.",
    deeds: ["صيام يوم عاشوراء (10 محرم)", "الإكثار من النوافل", "التوبة والاستغفار"],
  },
  7: {
    name: "رَجَب",
    virtue: "من الأشهر الحُرُم الأربعة التي عظَّمها الله؛ يُستحب فيه صيام النوافل والإكثار من الاستغفار.",
    deeds: ["الإكثار من الاستغفار", "صيام النوافل", "تجديد النية للعمل الصالح"],
  },
  11: {
    name: "ذو القَعدة",
    virtue: "من الأشهر الحُرُم؛ كانت العرب تُعظِّمه في الجاهلية موافقةً للشرع، وهو شهر هدنة وسلام.",
    deeds: ["الإكثار من الذكر", "صيام النوافل", "صلة الأرحام"],
  },
  12: {
    name: "ذو الحِجَّة",
    virtue: "أشرف شهور العام؛ أوائله العشر الأُوَل من ذي الحجة التي هي أفضل أيام الدنيا عند الله.",
    deeds: ["صيام التسع الأوائل", "الإكثار من التكبير والتهليل", "الأضحية", "صيام يوم عرفة (9 ذو الحجة)"],
  },
};

export function getCurrentHijriInfo(): HijriInfo | null {
  try {
    const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      timeZone: "Asia/Kuwait",
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
    const parts = formatter.formatToParts(new Date());
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";

    const day = parseInt(get("day"), 10);
    const month = parseInt(get("month"), 10);
    const year = parseInt(get("year"), 10);
    const monthName = HIJRI_MONTH_NAMES[month] ?? "";
    const isSacred = [1, 7, 11, 12].includes(month);

    // لمحرم: إذا مضى العاشر أزل فضيلة عاشوراء من القائمة
    let sacredInfo = isSacred ? SACRED_MONTH_INFO[month] : undefined;
    if (sacredInfo && month === 1 && day > 10) {
      sacredInfo = {
        ...sacredInfo,
        deeds: sacredInfo.deeds.filter((d) => !d.includes("عاشوراء")),
      };
    }

    return {
      day,
      month,
      monthName,
      year,
      isSacred,
      sacredInfo,
    };
  } catch {
    return null;
  }
}

export function getHijriDateString(): string {
  const info = getCurrentHijriInfo();
  if (!info) return "";
  return `${info.day} ${info.monthName} ${info.year} هـ`;
}

// ─────────────────────────────────────────────────────────────────────────
//  قائمة الأشهر الهجرية الرسمية — مرتّبة حسب ترتيبها الصحيح (1..12) لا أبجدياً
//  تُستخدم في النماذج والفلاتر والبحث والجداول. الأشهر الحُرُم مُعلَّمة.
// ─────────────────────────────────────────────────────────────────────────

/** أرقام الأشهر الحُرُم: محرَّم (1)، رجب (7)، ذو القعدة (11)، ذو الحجة (12) */
export const SACRED_MONTH_NUMBERS = [1, 7, 11, 12] as const;

export function isSacredMonth(month: number): boolean {
  return SACRED_MONTH_NUMBERS.includes(month as (typeof SACRED_MONTH_NUMBERS)[number]);
}

export function getHijriMonthName(month: number): string {
  return HIJRI_MONTH_NAMES[month] ?? "";
}

export type HijriMonth = {
  /** رقم الشهر 1..12 */
  number: number;
  /** الاسم بالحركات (كما يُعرض) */
  name: string;
  /** اسم مبسّط بلا حركات (للبحث/المطابقة) */
  plainName: string;
  /** هل هو من الأشهر الحُرُم */
  sacred: boolean;
};

const PLAIN_HIJRI_NAMES: Record<number, string> = {
  1: "محرم", 2: "صفر", 3: "ربيع الأول", 4: "ربيع الآخر",
  5: "جمادى الأولى", 6: "جمادى الآخرة", 7: "رجب",
  8: "شعبان", 9: "رمضان", 10: "شوال",
  11: "ذو القعدة", 12: "ذو الحجة",
};

/** القائمة الكاملة المرتّبة 1..12 — المصدر الموحّد للأشهر الهجرية عبر التطبيق. */
export const HIJRI_MONTHS: HijriMonth[] = Array.from({ length: 12 }, (_, i) => {
  const number = i + 1;
  return {
    number,
    name: HIJRI_MONTH_NAMES[number] ?? PLAIN_HIJRI_NAMES[number] ?? "",
    plainName: PLAIN_HIJRI_NAMES[number] ?? "",
    sacred: isSacredMonth(number),
  };
});

/** فضيلة الشهر الحرام إن وُجدت (للعرض في المؤشر/التلميح). */
export function getSacredMonthInfo(month: number): SacredMonthInfo | undefined {
  return isSacredMonth(month) ? SACRED_MONTH_INFO[month] : undefined;
}

/**
 * تحويل تاريخ ميلادي إلى هجري (تقويم أم القرى) — أساس دعم التحويل بين
 * الميلادي والهجري في النماذج والجداول مستقبلاً.
 */
export function gregorianToHijri(date: Date): { day: number; month: number; year: number; monthName: string } | null {
  try {
    const fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      timeZone: "Asia/Kuwait",
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
    const parts = fmt.formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
    const month = parseInt(get("month"), 10);
    return {
      day: parseInt(get("day"), 10),
      month,
      year: parseInt(get("year"), 10),
      monthName: getHijriMonthName(month),
    };
  } catch {
    return null;
  }
}
