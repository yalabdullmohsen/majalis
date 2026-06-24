import type { Book, DailyContent, LessonSeries, Mosque, PlatformLesson } from "./platform-types";
import { KUWAIT_LESSONS } from "./home-content";

export const SEED_MOSQUES: Mosque[] = [
  {
    id: "mosque-mawdi",
    name: "مسجد موضي",
    governorate: "العاصمة",
    area: "الصديق",
    address: "الصديق، محافظة العاصمة",
    latitude: 29.3396,
    longitude: 47.9689,
    google_maps_url: "https://maps.google.com/?q=مسجد+موضي+الصديق+الكويت",
  },
  {
    id: "mosque-yaqout",
    name: "مسجد الياقوت",
    governorate: "العاصمة",
    area: "الصديق",
    address: "الصديق، محافظة العاصمة",
    latitude: 29.3412,
    longitude: 47.9712,
    google_maps_url: "https://maps.google.com/?q=مسجد+الياقوت+الصديق+الكويت",
  },
  {
    id: "mosque-abu-waqid",
    name: "مسجد أبي واقد الليثي",
    governorate: "العاصمة",
    area: "القيروان",
    address: "القيروان، محافظة العاصمة",
    latitude: 29.3654,
    longitude: 47.9912,
    google_maps_url: "https://maps.google.com/?q=مسجد+أبي+واقد+الليثي+الكويت",
  },
];

export const SEED_BOOKS: Book[] = [
  {
    id: "book-wasitiyah",
    title: "شرح العقيدة الواسطية",
    author: "ابن تيمية — شرح الشيخ العثيمين",
    category: "العقيدة",
    cover_url: "/logo-icon.png",
    description: "سلسلة علمية في العقيدة على متن الواسطية.",
    pdf_url: "#",
  },
  {
    id: "book-tawhid",
    title: "كتاب التوحيد",
    author: "محمد بن عبد الوهاب",
    category: "العقيدة",
    cover_url: "/logo-icon.png",
    description: "متن أساس في توحيد الله وإخلاص العبادة.",
    pdf_url: "#",
  },
  {
    id: "book-riyadh",
    title: "رياض الصالحين",
    author: "النووي",
    category: "الحديث",
    cover_url: "/logo-icon.png",
    description: "مختارات من الأحاديث النبوية مع شرح يسير.",
    pdf_url: "#",
  },
  {
    id: "book-tafsir-jalalayn",
    title: "تفسير الجلالين",
    author: "جلال الدين المحلي والسيوطي",
    category: "التفسير",
    cover_url: "/logo-icon.png",
    description: "تفسير مختصر واضح لمعاني القرآن الكريم.",
    pdf_url: "#",
  },
];

export const SEED_SERIES: LessonSeries[] = [
  {
    id: "series-wasitiyah",
    title: "شرح العقيدة الواسطية",
    description: "سلسلة تأصيلية في العقيدة على متن الواسطية.",
    category: "العقيدة",
    sheikh_name: "عثمان بن محمد الخميس",
    total_lessons: 40,
    completed_lessons: 30,
  },
  {
    id: "series-tafsir-nahl",
    title: "تفسير سورة النحل",
    description: "دروس تفسيرية أسبوعية في سورة النحل.",
    category: "التفسير",
    sheikh_name: "عثمان بن محمد الخميس",
    total_lessons: 24,
    completed_lessons: 12,
  },
  {
    id: "series-muqni",
    title: "شرح تلخيص مختصر المقنع",
    description: "شرح كتاب الفقه على منهج أهل السنة.",
    category: "الفقه",
    sheikh_name: "عثمان بن محمد الخميس",
    total_lessons: 50,
    completed_lessons: 18,
  },
  {
    id: "series-taaseel",
    title: "الدورة العلمية التأصيلية",
    description: "دورة تأصيلية للمبتدئين في طلب العلم.",
    category: "الحديث",
    sheikh_name: "راشد طليم فهد الطليم",
    total_lessons: 36,
    completed_lessons: 20,
  },
  {
    id: "series-seerah",
    title: "السيرة النبوية — مختصر",
    description: "سلسلة في سيرة النبي صلى الله عليه وسلم.",
    category: "السيرة",
    sheikh_name: "راشد طليم فهد الطليم",
    total_lessons: 28,
    completed_lessons: 10,
  },
];

export const SEED_DAILY: DailyContent[] = [
  {
    id: "daily-hadith-1",
    type: "hadith",
    title: "حديث اليوم",
    content: "من كان يؤمن بالله واليوم الآخر فليقل خيرًا أو ليصمت.",
    source: "متفق عليه — أبو هريرة",
    explanation: "حث على كف اللسان عن الشر والغيبة والكذب.",
  },
  {
    id: "daily-ayah-1",
    type: "ayah",
    title: "آية ومعنى",
    content: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    source: "سورة الشرح — الآية 6",
    explanation: "بعد الشدة يسر، ومع كل ضيق مخرج من الله.",
  },
];

export function seedLessonsFromKuwait(): PlatformLesson[] {
  const mosqueMap: Record<string, Mosque> = {
    "مسجد موضي": SEED_MOSQUES[0],
    "مسجد الياقوت": SEED_MOSQUES[1],
    "مسجد أبي واقد الليثي": SEED_MOSQUES[2],
  };

  return KUWAIT_LESSONS.map((l) => {
    const mosque = mosqueMap[l.mosque];
    return {
      id: l.id,
      title: l.title,
      description: l.note,
      category: "تفسير",
      sheikh_name: l.sheikhName,
      sheikh_image: l.sheikhImage,
      mosque_id: mosque?.id,
      mosque_name: l.mosque,
      governorate: "العاصمة",
      area: l.region,
      day: l.day,
      start_time: l.time,
      is_recurring: true,
      has_women_place: Boolean(l.note?.includes("نساء")),
      google_maps_url: mosque?.google_maps_url,
      status: "approved",
    };
  });
}

export const QURAN_SURAHS = [
  { number: 1, name: "الفاتحة", ayahs: 7 },
  { number: 2, name: "البقرة", ayahs: 286 },
  { number: 3, name: "آل عمران", ayahs: 200 },
  { number: 36, name: "يس", ayahs: 83 },
  { number: 67, name: "الملك", ayahs: 30 },
  { number: 112, name: "الإخلاص", ayahs: 4 },
  { number: 113, name: "الفلق", ayahs: 5 },
  { number: 114, name: "الناس", ayahs: 6 },
];

export const ADHKAR_SECTIONS = [
  {
    id: "morning",
    title: "أذكار الصباح",
    items: [
      { text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ", count: 1 },
      { text: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا", count: 1 },
      { text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", count: 100 },
    ],
  },
  {
    id: "evening",
    title: "أذكار المساء",
    items: [
      { text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ", count: 1 },
      { text: "اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا", count: 1 },
      { text: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ", count: 3 },
    ],
  },
  {
    id: "sleep",
    title: "أذكار النوم",
    items: [
      { text: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", count: 1 },
      { text: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ", count: 1 },
    ],
  },
  {
    id: "mosque",
    title: "أذكار المسجد",
    items: [
      { text: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", count: 1 },
      { text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ", count: 1 },
    ],
  },
  {
    id: "travel",
    title: "أذكار السفر",
    items: [
      { text: "اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ", count: 1 },
      { text: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا", count: 1 },
    ],
  },
];
