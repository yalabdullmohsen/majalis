import type { QuranNavigationSource } from "@/lib/quran-navigation";

/** مواضع مصحف منظَّمة لكل نبي — أرقام فقط، بلا استخراج من النص. */
export type ProphetMushafMention = {
  surahId: number;
  ayahId: number;
  noteAr: string;
};

/**
 * مواضع الذكر في المصحف — بيانات منظَّمة (25 نبيًا)، آيات صريحة فقط.
 * المصدر: آيات صريحة في القرآن توافق بطاقات قصص الأنبياء؛
 * الصفحات تُحسب عبر خدمة المصحف (لا تخمين). ملاحظات قصيرة موحّدة الأسلوب.
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
  idris: [
    { surahId: 19, ayahId: 56, noteAr: "ذكر إدريس صدّيقًا نبيًا" },
    { surahId: 21, ayahId: 85, noteAr: "الثناء على إدريس مع الصابرين" },
  ],
  nuh: [
    { surahId: 11, ayahId: 40, noteAr: "أمر السفينة ونجاة المؤمنين" },
    { surahId: 71, ayahId: 1, noteAr: "إرسال نوح إلى قومه" },
  ],
  hud: [
    { surahId: 11, ayahId: 50, noteAr: "إرسال هود إلى عاد" },
    { surahId: 46, ayahId: 21, noteAr: "تحذير عادٍ في الأحقاف" },
  ],
  salih: [
    { surahId: 7, ayahId: 73, noteAr: "ناقة الله آية لثمود" },
    { surahId: 11, ayahId: 61, noteAr: "دعوة صالح ثمود إلى التوحيد" },
  ],
  ibrahim: [
    { surahId: 21, ayahId: 69, noteAr: "النار بردًا وسلامًا على إبراهيم" },
    { surahId: 2, ayahId: 124, noteAr: "ابتلاء إبراهيم وجعله إمامًا" },
    { surahId: 2, ayahId: 127, noteAr: "رفع قواعد البيت مع إسماعيل" },
  ],
  lut: [
    { surahId: 11, ayahId: 81, noteAr: "النجاة من العذاب إلا امرأته" },
    { surahId: 15, ayahId: 59, noteAr: "إنجاء آل لوط إلا امرأته" },
  ],
  ismail: [
    { surahId: 37, ayahId: 102, noteAr: "الرؤيا والذبح والفداء العظيم" },
    { surahId: 19, ayahId: 54, noteAr: "إسماعيل صادق الوعد نبيًا" },
  ],
  "is-haq": [
    { surahId: 37, ayahId: 112, noteAr: "البشارة بإسحاق نبيًا من الصالحين" },
    { surahId: 11, ayahId: 71, noteAr: "بشارة إبراهيم بإسحاق" },
  ],
  yaqub: [
    { surahId: 12, ayahId: 96, noteAr: "عودة بصر يعقوب من قميص يوسف" },
    { surahId: 12, ayahId: 13, noteAr: "خوف يعقوب على يوسف" },
  ],
  yusuf: [
    { surahId: 12, ayahId: 4, noteAr: "رؤيا يوسف في المنام" },
    { surahId: 12, ayahId: 43, noteAr: "تأويل رؤيا الملك بإذن الله" },
    { surahId: 12, ayahId: 90, noteAr: "عفو يوسف عن إخوته" },
  ],
  ayyub: [
    { surahId: 21, ayahId: 83, noteAr: "دعاء أيوب وكشف الضر عنه" },
    { surahId: 38, ayahId: 41, noteAr: "نداء أيوب وصبره" },
  ],
  shuayb: [
    { surahId: 7, ayahId: 85, noteAr: "دعوة شعيب إلى إيفاء الكيل" },
    { surahId: 11, ayahId: 94, noteAr: "نجاة شعيب والمؤمنين من الصيحة" },
  ],
  musa: [
    { surahId: 20, ayahId: 17, noteAr: "آية العصا لموسى" },
    { surahId: 26, ayahId: 63, noteAr: "انفلاق البحر لبني إسرائيل" },
    { surahId: 20, ayahId: 77, noteAr: "أمر موسى بسلوك طريق في البحر" },
  ],
  harun: [
    { surahId: 20, ayahId: 29, noteAr: "طلب موسى هارون وزيرًا" },
    { surahId: 20, ayahId: 36, noteAr: "إجابة الله طلب موسى في هارون" },
  ],
  "dhul-kifl": [
    { surahId: 21, ayahId: 85, noteAr: "الثناء على ذي الكفل مع الصابرين" },
    { surahId: 38, ayahId: 48, noteAr: "ذكر ذي الكفل مع الأخيار" },
  ],
  dawud: [
    { surahId: 34, ayahId: 10, noteAr: "تليين الحديد وتسبيح الجبال مع داود" },
    { surahId: 17, ayahId: 55, noteAr: "إيتاء داود الزبور" },
  ],
  sulayman: [
    { surahId: 21, ayahId: 81, noteAr: "تسخير الريح لسليمان" },
    { surahId: 27, ayahId: 16, noteAr: "وراثة سليمان وفهم منطق الطير" },
    { surahId: 34, ayahId: 12, noteAr: "تسخير الريح والجن لسليمان" },
  ],
  ilyas: [
    { surahId: 37, ayahId: 123, noteAr: "دعوة إلياس قومه إلى التوحيد" },
    { surahId: 6, ayahId: 85, noteAr: "ذكر إلياس مع الأخيار" },
  ],
  "al-yasa": [
    { surahId: 6, ayahId: 86, noteAr: "ذكر اليسع مع الأخيار من الأنبياء" },
    { surahId: 38, ayahId: 48, noteAr: "الثناء على اليسع مع الأخيار" },
  ],
  yunus: [
    { surahId: 21, ayahId: 87, noteAr: "دعاء يونس في الظلمات" },
    { surahId: 10, ayahId: 98, noteAr: "إيمان قوم يونس بعد العذاب" },
  ],
  zakariyya: [
    { surahId: 19, ayahId: 8, noteAr: "بشارة الولد على كبر السن" },
    { surahId: 3, ayahId: 38, noteAr: "دعاء زكريا ربّه خفية" },
  ],
  yahya: [
    { surahId: 19, ayahId: 12, noteAr: "أخذ يحيى الكتاب بقوة وهو صبي" },
    { surahId: 3, ayahId: 39, noteAr: "البشارة بيحيى سيدًا وحصورًا" },
  ],
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
