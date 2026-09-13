import type { QuranNavigationSource } from "@/lib/quran-navigation";

/** مواضع مصحف منظَّمة لكل نبي — أرقام فقط، بلا استخراج من النص. */
export type ProphetMushafMention = {
  surahId: number;
  ayahId: number;
  noteAr: string;
};

/**
 * مواضع الذكر في المصحف — بيانات منظَّمة فقط (25 نبيًا).
 * المصدر: آيات صريحة في القرآن توافق بطاقات قصص الأنبياء؛ الصفحات عبر خدمة المصحف لا بالتخمين.
 * آدم: أربع آيات لسجود الملائكة + آية تعليم الأسماء.
 */
export const PROPHET_MUSHAF_MENTIONS: Record<string, readonly ProphetMushafMention[]> = {
  adam: [
    { surahId: 2, ayahId: 31, noteAr: "تعليم آدم الأسماء كلها" },
    { surahId: 2, ayahId: 34, noteAr: "أمر الملائكة بالسجود وإباء إبليس" },
    { surahId: 7, ayahId: 11, noteAr: "خلق آدم وأمر الملائكة بالسجود" },
    { surahId: 15, ayahId: 31, noteAr: "إباء إبليس عن السجود" },
    { surahId: 38, ayahId: 74, noteAr: "استكبار إبليس عن السجود" },
  ],
  idris: [{ surahId: 19, ayahId: 56, noteAr: "ذكر إدريس صدّيقًا نبيًّا" }],
  nuh: [
    { surahId: 11, ayahId: 40, noteAr: "أمر السفينة ونجاة المؤمنين" },
    { surahId: 71, ayahId: 1, noteAr: "إرسال نوح إلى قومه" },
  ],
  hud: [{ surahId: 11, ayahId: 50, noteAr: "إرسال هود إلى عاد" }],
  salih: [{ surahId: 7, ayahId: 73, noteAr: "ناقة الله آية لثمود" }],
  ibrahim: [
    { surahId: 21, ayahId: 69, noteAr: "النار بردًا وسلامًا على إبراهيم" },
    { surahId: 2, ayahId: 124, noteAr: "ابتلاء إبراهيم وجعله إمامًا" },
  ],
  lut: [{ surahId: 11, ayahId: 81, noteAr: "النجاة من العذاب مع أهله إلا امرأته" }],
  ismail: [{ surahId: 37, ayahId: 102, noteAr: "الرؤيا والذبح والفداء العظيم" }],
  "is-haq": [{ surahId: 37, ayahId: 112, noteAr: "البشارة بإسحاق نبيًّا من الصالحين" }],
  yaqub: [{ surahId: 12, ayahId: 96, noteAr: "عودة بصر يعقوب من قميص يوسف" }],
  yusuf: [{ surahId: 12, ayahId: 43, noteAr: "تأويل الرؤيا بإذن الله" }],
  ayyub: [{ surahId: 21, ayahId: 83, noteAr: "دعاء أيوب وكشف الضرّ عنه" }],
  shuayb: [{ surahId: 11, ayahId: 94, noteAr: "نجاة شعيب والمؤمنين من الصيحة" }],
  musa: [
    { surahId: 26, ayahId: 63, noteAr: "انفلاق البحر لبني إسرائيل" },
    { surahId: 20, ayahId: 77, noteAr: "أمر موسى بضرب طريق في البحر" },
  ],
  harun: [{ surahId: 20, ayahId: 29, noteAr: "طلب موسى هارون وزيرًا من أهله" }],
  "dhul-kifl": [{ surahId: 21, ayahId: 85, noteAr: "الثناء على ذي الكفل مع الصابرين" }],
  dawud: [{ surahId: 34, ayahId: 10, noteAr: "تليين الحديد وتسبيح الجبال مع داود" }],
  sulayman: [
    { surahId: 21, ayahId: 81, noteAr: "تسخير الريح لسليمان" },
    { surahId: 27, ayahId: 16, noteAr: "وراثة سليمان وفهم منطق الطير" },
  ],
  ilyas: [{ surahId: 37, ayahId: 123, noteAr: "دعوة إلياس قومه إلى التوحيد" }],
  "al-yasa": [{ surahId: 6, ayahId: 86, noteAr: "ذكر اليسع مع الأخيار من الأنبياء" }],
  yunus: [{ surahId: 21, ayahId: 87, noteAr: "دعاء يونس في الظلمات" }],
  zakariyya: [{ surahId: 19, ayahId: 8, noteAr: "بشارة الولد على كبر السن" }],
  yahya: [{ surahId: 19, ayahId: 12, noteAr: "أخذ يحيى الكتاب بقوة وهو صبي" }],
  isa: [
    { surahId: 3, ayahId: 49, noteAr: "إحياء الموتى وإبراء الأكمه والأبرص بإذن الله" },
    { surahId: 19, ayahId: 30, noteAr: "كلام عيسى في المهد" },
  ],
  muhammad: [
    { surahId: 2, ayahId: 23, noteAr: "تحدّي القرآن — المعجزة الخالدة" },
    { surahId: 33, ayahId: 40, noteAr: "محمد ﷺ خاتم النبيين" },
  ],
};

export const PROPHET_MUSHAF_NAV_SOURCE: QuranNavigationSource = "prophets-stories";
