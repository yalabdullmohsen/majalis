import type { Fatwa } from "./platform-types";

export const FATWA_SEED: Fatwa[] = [
  {
    id: "fatwa-prayer-combine",
    external_key: "fatwa-prayer-combine",
    question: "هل يجوز الجمع بين الصلاتين للمسافر؟",
    answer: `نعم، يجوز للمسافر جمع الظهر مع العصر، والمغرب مع العشاء، جمع تقديم أو تأخير.

**الدليل:** فعل النبي ﷺ في غزو تبوك، وقوله: «إن الله لم يفرض عليكم صلاة إلا هذه الصلوات».

**الشروط:**
- أن يكون السفر مسافة القصر (حوالي 80 كم).
- أن يكون السفر غير معصية.
- يُفضّل الجمع عند الحاجة كالسفر أو المطر الشديد.`,
    summary: "يجوز للمسافر جمع الصلاتين جمع تقديم أو تأخير.",
    category: "الصلاة",
    format: "written",
    mufti_name: "اللجنة الدائمة للفتوى",
    keywords: ["جمع", "صلاة", "مسافر", "قصر"],
    status: "approved",
    view_count: 4520,
    search_count: 890,
    created_at: "2024-01-10T08:00:00Z",
  },
  {
    id: "fatwa-zakat-gold",
    external_key: "fatwa-zakat-gold",
    question: "هل تجب الزكاة في الذهب المُدّخر للزينة؟",
    answer: `تجب الزكاة في الذهب والفضة إذا بلغا النصاب (85 جراماً للذهب) وحال عليه الحول.

**الراجح:** الذهب المُدّخر للزينة يُزكّى إذا بلغ النصاب، لقوله ﷺ: «في كل أربعين ديناراً دينار».

**الاستثناء:** ما يُستخدم يومياً للزينة المعتادة ولا يُعدّ ادّخاراً.`,
    summary: "تجب الزكاة في الذهب المُدّخر إذا بلغ النصاب.",
    category: "الزكاة",
    format: "written",
    mufti_name: "ابن باز رحمه الله",
    keywords: ["زكاة", "ذهب", "نصاب"],
    status: "approved",
    view_count: 3200,
    search_count: 720,
    created_at: "2023-09-15T07:00:00Z",
  },
  {
    id: "fatwa-music-voice",
    external_key: "fatwa-music-voice",
    question: "ما حكم الاستماع إلى الأناشيد الإسلامية؟",
    answer: `الأناشيد الإسلامية التي لا تشتمل على آلات موسيقية محرّمة، ولا تُشبه أغاني الفسق، جائزة عند كثير من أهل العلم.

**الشروط:**
- أن تكون الكلمات حسنة.
- ألا تشتمل على آلات موسيقية.
- ألا تُلهي عن ذكر الله أو الصلاة.`,
    summary: "الأناشيد الإسلامية الخالية من الآلات جائزة بشروط.",
    category: "فقه عام",
    format: "audio",
    audio_url: "https://example.com/fatwa-audio/sample.mp3",
    mufti_name: "ابن عثيمين رحمه الله",
    keywords: ["أناشيد", "موسيقى", "استماع"],
    status: "approved",
    view_count: 2800,
    search_count: 650,
    created_at: "2023-07-22T06:00:00Z",
  },
  {
    id: "fatwa-fasting-travel",
    external_key: "fatwa-fasting-travel",
    question: "هل يجوز للمسافر الإفطار في رمضان؟",
    answer: `نعم، يجوز للمسافر الإفطار في رمضان، ويُستحب له الإفطار تيسيراً على نفسه.

**الدليل:** قوله تعالى: «فَمَنْ كَانَ مِنْكُمْ مَرِيضًا أَوْ عَلَى سَفَرٍ فَعِدَّةٌ مِنْ أَيَّامٍ أُخَرَ».

يجب عليه قضاء ما أفطر من أيام.`,
    summary: "يجوز للمسافر الإفطار في رمضان مع وجوب القضاء.",
    category: "الصيام",
    format: "both",
    mufti_name: "اللجنة الدائمة",
    keywords: ["صيام", "سفر", "إفطار", "رمضان"],
    status: "approved",
    view_count: 5100,
    search_count: 1100,
    created_at: "2024-02-28T09:00:00Z",
  },
  {
    id: "fatwa-inheritance-daughter",
    external_key: "fatwa-inheritance-daughter",
    question: "ما نصيب البنت من الميراث؟",
    answer: `البنت لها نصف ما للابن، فإن لم يكن ابن فلها النصف إن كانت واحدة، أو الثلثان إن كنّ اثنتين فأكثر.

**الدليل:** قوله تعالى: «وَلِلْإِنْثَىٰ نِصْفُ مَا لِلذَّكَرِ».

يُراعى الوصية والدين قبل توزيع الميراث.`,
    summary: "نصيب البنت نصف نصيب الابن في الميراث.",
    category: "النوازل",
    format: "written",
    mufti_name: "ابن قدامة رحمه الله",
    keywords: ["ميراث", "بنت", "مواريث"],
    status: "approved",
    view_count: 1900,
    search_count: 420,
    created_at: "2023-05-18T05:00:00Z",
  },
];

export function findFatwaById(id: string) {
  return FATWA_SEED.find((f) => f.id === id || f.external_key === id) || null;
}

export function getLatestFatwas(limit = 10) {
  return [...FATWA_SEED]
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
    .slice(0, limit);
}

export function getMostReadFatwas(limit = 10) {
  return [...FATWA_SEED]
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, limit);
}

export function getMostSearchedFatwas(limit = 10) {
  return [...FATWA_SEED]
    .sort((a, b) => (b.search_count || 0) - (a.search_count || 0))
    .slice(0, limit);
}
