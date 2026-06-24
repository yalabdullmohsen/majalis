export type KuwaitLesson = {
  id: string;
  sheikhName: string;
  sheikhImage?: string;
  title: string;
  day: string;
  time: string;
  mosque: string;
  region: string;
  note?: string;
};

export type DailyHadith = {
  text: string;
  narrator: string;
  source: string;
  meaning: string;
};

export type DailyAyah = {
  text: string;
  surah: string;
  ayahNumber: number;
  meaning: string;
};

export const KUWAIT_LESSONS: KuwaitLesson[] = [
  {
    id: "kw-1",
    sheikhName: "عثمان بن محمد الخميس",
    sheikhImage: "/images/teachers/othman-alkhamees.svg",
    title: "تفسير سورة النحل",
    day: "الجمعة",
    time: "بعد صلاة المغرب",
    mosque: "مسجد موضي",
    region: "الصديق",
    note: "يوجد مكان مخصص للنساء",
  },
  {
    id: "kw-2",
    sheikhName: "عثمان بن محمد الخميس",
    sheikhImage: "/images/teachers/othman-alkhamees.svg",
    title: "شرح كتاب تلخيص مختصر المقنع",
    day: "الأربعاء",
    time: "بعد صلاة المغرب",
    mosque: "مسجد الياقوت",
    region: "الصديق",
    note: "يوجد مكان مخصص للنساء",
  },
  {
    id: "kw-3",
    sheikhName: "راشد طليم فهد الطليم",
    sheikhImage: "/images/teachers/rashed-alsulayyim.svg",
    title: "الدورة العلمية التأصيلية",
    day: "الاثنين",
    time: "قبل المغرب بساعة، بعد المغرب، بعد العشاء",
    mosque: "مسجد أبي واقد الليثي",
    region: "القيروان",
  },
];

export const DAILY_HADITH: DailyHadith = {
  text: "من كان يؤمن بالله واليوم الآخر فليقل خيرًا أو ليصمت.",
  narrator: "أبو هريرة رضي الله عنه",
  source: "متفق عليه",
  meaning: "حث على كف اللسان عن الشر والغيبة والكذب، والاقتصار على الكلام النافع.",
};

export const DAILY_AYAH: DailyAyah = {
  text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
  surah: "سورة الشرح",
  ayahNumber: 6,
  meaning: "بعد الشدة يسر، ومع كل ضيق مخرج وفرج من الله تعالى.",
};

export const HOME_MAINTENANCE_MESSAGE =
  "جارٍ التعديل على الموقع وتعبئة البيانات من قبل منار... انتظرونا.";
