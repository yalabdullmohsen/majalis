import type { QuranNavigationSource } from "@/lib/quran-navigation";

/** مواضع مصحف منظَّمة لكل نبي — أرقام فقط، بلا استخراج من النص. */
export type ProphetMushafMention = {
  surahId: number;
  ayahId: number;
  noteAr: string;
};

/**
 * مواضع الذكر في المصحف — بيانات منظَّمة فقط.
 * آدم P0: أربع آيات (سجود الملائكة وإباء إبليس).
 * الباقي: آية المعجزة المعتمدة في واجهة قصص الأنبياء (بلا تخمين صفحات).
 */
export const PROPHET_MUSHAF_MENTIONS: Record<string, readonly ProphetMushafMention[]> = {
  adam: [
    { surahId: 2, ayahId: 34, noteAr: "أمر الملائكة بالسجود وإباء إبليس" },
    { surahId: 7, ayahId: 11, noteAr: "خلق آدم وأمر الملائكة بالسجود" },
    { surahId: 15, ayahId: 31, noteAr: "إباء إبليس عن السجود" },
    { surahId: 38, ayahId: 74, noteAr: "استكبار إبليس عن السجود" },
  ],
  muhammad: [{ surahId: 2, ayahId: 23, noteAr: "تحدّي القرآن — المعجزة الخالدة" }],
  musa: [{ surahId: 26, ayahId: 63, noteAr: "انفلاق البحر لبني إسرائيل" }],
  isa: [{ surahId: 3, ayahId: 49, noteAr: "إحياء الموتى وإبراء الأكمه والأبرص بإذن الله" }],
  ibrahim: [{ surahId: 21, ayahId: 69, noteAr: "النار بردًا وسلامًا على إبراهيم" }],
  salih: [{ surahId: 7, ayahId: 73, noteAr: "ناقة الله آية لثمود" }],
  sulayman: [{ surahId: 21, ayahId: 81, noteAr: "تسخير الريح لسليمان" }],
  yunus: [{ surahId: 21, ayahId: 87, noteAr: "دعاء يونس في الظلمات" }],
  dawud: [{ surahId: 34, ayahId: 10, noteAr: "تليين الحديد والزبور" }],
  zakariyya: [{ surahId: 19, ayahId: 8, noteAr: "بشارة الولد على كبر السن" }],
  yaqub: [{ surahId: 12, ayahId: 96, noteAr: "عودة بصر يعقوب من قميص يوسف" }],
  nuh: [{ surahId: 11, ayahId: 40, noteAr: "أمر السفينة ونجاة المؤمنين" }],
  yusuf: [{ surahId: 12, ayahId: 43, noteAr: "تأويل الرؤيا بإذن الله" }],
  lut: [{ surahId: 11, ayahId: 81, noteAr: "النجاة من العذاب مع أهله إلا امرأته" }],
  shuayb: [{ surahId: 11, ayahId: 94, noteAr: "نجاة شعيب والمؤمنين من الصيحة" }],
  ilyas: [{ surahId: 37, ayahId: 123, noteAr: "دعوة إلياس قومه إلى التوحيد" }],
};

export const PROPHET_MUSHAF_NAV_SOURCE: QuranNavigationSource = "prophets-stories";
