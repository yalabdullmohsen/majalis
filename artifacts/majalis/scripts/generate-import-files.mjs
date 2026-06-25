/**
 * Generates JSON bulk-import files for /admin from lesson-ads and curated seed content.
 * Run: node scripts/generate-import-files.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "data", "import");

const SITE = "https://www.majlisilm.com";

const CATEGORY_FROM_TAGS = {
  تفسير: "تفسير",
  فقه: "فقه",
  حديث: "حديث",
  عقيدة: "عقيدة",
  سنة: "حديث",
  "دورة علمية": "تأصيل",
  "برنامج تعليمي": "فقه",
};

function categoryForAd(ad) {
  for (const tag of ad.tags) {
    if (CATEGORY_FROM_TAGS[tag]) return CATEGORY_FROM_TAGS[tag];
  }
  return "أخرى";
}

function regionFromDistrict(district) {
  const part = district.split("–")[0]?.split("-")[0]?.trim();
  return part || district.trim();
}

function governorateFromDistrict(district) {
  if (district.includes("القيروان") || district.includes("الفردوس")) return "العاصمة";
  if (district.includes("الجهراء")) return "الجهراء";
  if (district.includes("حولي")) return "حولي";
  return "العاصمة";
}

function deliveryForAd(ad) {
  if (ad.tags.some((t) => t.includes("بث"))) return "كلاهما";
  return "حضور فقط";
}

// lesson-ads source (mirrors src/lib/lesson-ads.ts)
const lessonAds = [
  {
    id: "othman-tafsir-nahl",
    teacher: "د. عثمان بن محمد الخميس",
    teacherImage: "/sheikhs/othman-alkhamees.jpg",
    title: "تفسير سورة النحل",
    shortDescription: "درس أسبوعي ثابت، والمتابعة الحالية تبدأ من الآية 40.",
    tags: ["تفسير", "أسبوعي", "حضوري", "بث مباشر"],
    hasWomenSection: true,
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الجمعة",
        time: "بعد صلاة المغرب",
        venue: "مسجد موضي",
        district: "منطقة الصديق – قطعة 4 – شارع 407",
        note: "المتابعة الحالية: البداية من الآية رقم 40.",
      },
    ],
  },
  {
    id: "othman-sahih-muslim",
    teacher: "د. عثمان بن محمد الخميس",
    teacherImage: "/sheikhs/othman-alkhamees.jpg",
    title: "قراءة كتاب صحيح مسلم",
    shortDescription: "درس أسبوعي ثابت، والمتابعة الحالية تبدأ من الحديث 989 عند الصفحة 400.",
    tags: ["حديث", "أسبوعي", "حضوري", "بث مباشر"],
    hasWomenSection: true,
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "السبت",
        time: "10:00 صباحًا",
        venue: "مسجد الياقوت",
        district: "منطقة الصديق – قطعة 7 – شارع 706",
        note: "المتابعة الحالية: الحديث 989 – الصفحة 400.",
      },
    ],
  },
  {
    id: "othman-talkhis-mukhtasar-almuqni",
    teacher: "د. عثمان بن محمد الخميس",
    teacherImage: "/sheikhs/othman-alkhamees.jpg",
    title: "شرح كتاب تلخيص مختصر المقنع",
    shortDescription: "درس أسبوعي ثابت في الفقه.",
    tags: ["فقه", "أسبوعي", "حضوري", "بث مباشر"],
    hasWomenSection: true,
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الأربعاء",
        time: "بعد صلاة المغرب",
        venue: "مسجد الياقوت",
        district: "منطقة الصديق – قطعة 7 – شارع 706",
        note: "آخر التحديثات: «المحرمات إلى أمد» ثم «باب الشروط في النكاح – القسم الثاني».",
      },
    ],
  },
  {
    id: "rashed-fundamental-course",
    teacher: "د. راشد صليهم فهد الصليهم",
    teacherImage: "/images/teachers/rashed-alsulayyim.svg",
    title: "الدورة العلمية التأصيلية",
    shortDescription: "برنامج علمي أسبوعي بثلاث جلسات متتابعة في اليوم نفسه.",
    tags: ["دورة علمية", "عقيدة", "حديث", "سنة", "حضوري"],
    sessions: [
      {
        label: "بلوغ المرام من أدلة الأحكام",
        day: "الاثنين",
        time: "6:00 م",
        venue: "مسجد أبي واقد الليثي",
        district: "القيروان – قطعة 2",
        note: "الجلسة الأولى — قبل المغرب بساعة.",
      },
      {
        label: "القواعد المثلى في صفات الله وأسمائه الحسنى",
        day: "الاثنين",
        time: "7:20 م",
        venue: "مسجد أبي واقد الليثي",
        district: "القيروان – قطعة 2",
        note: "الجلسة الثانية — وقت المغرب.",
      },
      {
        label: "قراءة في كتاب دعوى تعارض السنة النبوية مع العلم التجريبي",
        day: "الاثنين",
        time: "8:50 م",
        venue: "مسجد أبي واقد الليثي",
        district: "القيروان – قطعة 2",
        note: "الجلسة الثالثة — بعد العشاء.",
      },
    ],
  },
  {
    id: "mansour-altafsir-alwadih",
    teacher: "د. منصور بن ناصر الخالدي",
    teacherImage: "/images/teachers/mansour-alkhalidi.svg",
    title: "قراءة كتب متنوعة والتفسير الواضح",
    shortDescription: "مجلس أسبوعي بعد الفجر بصيغة قراءة وتعليق، مع مكان مخصص للنساء.",
    tags: ["تفسير", "قراءة", "جمعة", "حضوري"],
    hasWomenSection: true,
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الجمعة",
        time: "بعد صلاة الفجر",
        venue: "مسجد العلاء بن عقبة",
        district: "منطقة الفردوس – قطعة 3 – بجانب الجمعية الرئيسية",
        note: "يوجد مكان مخصص للنساء.",
      },
    ],
  },
  {
    id: "osama-shatti-prayer-book",
    teacher: "الشيخ أسامة الشطي",
    teacherImage: "/images/teachers/osama-alshatti.svg",
    title: "شرح كتاب الصلاة من إعانة الطالب",
    shortDescription: "برنامج حضوري في المسجد، مع نقل مباشر عبر معهد الأندلس.",
    tags: ["فقه", "برنامج تعليمي", "حضوري", "بث مباشر"],
    sessions: [
      {
        label: "البرنامج الأسبوعي",
        day: "الثلاثاء",
        time: "6:00 مساءً إلى صلاة العشاء",
        venue: "مسجد أحمد العميري",
        district: "الكويت",
        note: "ابتداءً من يوم الثلاثاء 2026/06/09، مع نقل مباشر عبر قناة معهد الأندلس الشرعي.",
      },
    ],
  },
];

// Fix typo in rashed session
lessonAds[3].sessions[1].venue = "مسجد أبي واقد الليثي";

const sheikhMeta = {
  "د. عثمان بن محمد الخميس": {
    city: "العاصمة",
    bio: "عالم أصولي ومفسر، له مجالس علمية أسبوعية ثابتة في مساجد منطقة الصديق.",
    specialties: ["تفسير", "فقه", "حديث"],
    photo: "/sheikhs/othman-alkhamees.jpg",
  },
  "د. راشد صليهم فهد الصليهم": {
    city: "العاصمة",
    bio: "أستاذ مشارك في جامعة الكويت، يقدّم دورة علمية تأصيلية أسبوعية في القيروان.",
    specialties: ["عقيدة", "حديث", "أصول"],
    photo: "/images/teachers/rashed-alsulayyim.svg",
  },
  "د. منصور بن ناصر الخالدي": {
    city: "العاصمة",
    bio: "داعية ومحاضر، مجلس أسبوعي في التفسير والقراءة بعد صلاة الفجر.",
    specialties: ["تفسير", "قراءة"],
    photo: "/images/teachers/mansour-alkhalidi.svg",
  },
  "الشيخ أسامة الشطي": {
    city: "العاصمة",
    bio: "إمام وخطيب، يقدّم برنامجًا علميًا في الفقه عبر منصة الأندلس.",
    specialties: ["فقه", "تربية"],
    photo: "/images/teachers/osama-alshatti.svg",
  },
};

const sheikhs = Object.entries(sheikhMeta).map(([name, meta]) => ({
  name,
  city: meta.city,
  bio: meta.bio,
  specialties: meta.specialties,
  is_verified: true,
  photo_url: `${SITE}${meta.photo}`,
}));

const lessons = [];
for (const ad of lessonAds) {
  for (const session of ad.sessions) {
    const genericLabel =
      session.label === "المجلس الأسبوعي" || session.label === "البرنامج الأسبوعي";
    const title = genericLabel ? ad.title : `${ad.title} — ${session.label}`;
    lessons.push({
      title,
      sheikh_name: ad.teacher,
      speaker_name: ad.teacher,
      category: categoryForAd(ad),
      city: governorateFromDistrict(session.district),
      region: regionFromDistrict(session.district),
      mosque: session.venue,
      day_of_week: session.day,
      lesson_time: session.time,
      schedule: `${session.day} — ${session.time}`,
      description: [session.note, ad.shortDescription].filter(Boolean).join(" · "),
      audience: "الكل",
      delivery: deliveryForAd(ad),
      status: "approved",
    });
  }
}

const fawaid = [
  {
    text: "قال تعالى: ﴿إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ وَاخْتِلَافِ اللَّيْلِ وَالنَّهَارِ لَآيَاتٍ لِّأُولِي الْأَلْبَابِ﴾ — دلالة على عظمة الخالق في نظام الكون.",
    author_name: "القرآن الكريم",
    status: "approved",
  },
  {
    text: "قال رسول الله ﷺ: «مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ» — فضل طلب العلم وثمرته.",
    author_name: "مسلم",
    status: "approved",
  },
  {
    text: "قال رسول الله ﷺ: «إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى» — أصل صحة العمل وقبوله عند الله.",
    author_name: "البخاري ومسلم",
    status: "approved",
  },
  {
    text: "قال تعالى: ﴿وَقُل رَّبِّ زِدْنِي عِلْمًا﴾ — من أعظم الأدعية أن يسأل العبد ربه زيادة العلم النافع.",
    author_name: "القرآن الكريم",
    status: "approved",
  },
  {
    text: "العلم ميراث النبوة، ومن أخذ بيده إلى العلم فقد أخذ بحبل من نور.",
    author_name: "أبو داود",
    status: "approved",
  },
  {
    text: "من ثمرات طلب العلم: تواضع أكثر وخوف من الجهل ومحبة لأهل العلم.",
    author_name: "ابن القيم",
    status: "approved",
  },
  {
    text: "قال رسول الله ﷺ: «الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ» — حقوق المسلم على أخيه.",
    author_name: "البخاري ومسلم",
    status: "approved",
  },
  {
    text: "قال رسول الله ﷺ: «لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ» — كمال الإيمان في محبة الخير للغير.",
    author_name: "البخاري ومسلم",
    status: "approved",
  },
  {
    text: "قال تعالى: ﴿وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ﴾ — الصلاة والزكاة من أعظم أركان الإسلام بعد الشهادتين.",
    author_name: "القرآن الكريم",
    status: "approved",
  },
  {
    text: "صلاح القلب يبدأ بسؤال صادق واتباع للدليل من كتاب الله وسنة رسوله.",
    author_name: "ابن تيمية",
    status: "approved",
  },
];

const qa = [
  {
    question: "ما حكم صيام يوم عرفة لغير الحاج؟",
    answer: "صيام يوم عرفة سنة مؤكدة لغير الحاج، ويُكفّر ذنوب سنتين: ماضية ومستقبلة.",
    category_name: "أحكام شرعية",
    ruling_type: "سنة",
    evidence: "قال رسول الله ﷺ: «صيام يوم عرفة أحتسب على الله أن يكفّر السنة التي قبله والسنة التي بعده»",
    reference: "مسلم",
    status: "published",
  },
  {
    question: "ما حكم صلاة الجمعة؟",
    answer: "صلاة الجمعة فرض عين على كل مسلم بالغ عاقل ذكر مقيم، إلا من له عذر شرعي.",
    category_name: "أحكام شرعية",
    ruling_type: "فرض",
    evidence: "قال تعالى: ﴿يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا نُودِيَ لِلصَّلَاةِ مِن يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَىٰ ذِكْرِ اللَّهِ﴾",
    reference: "الجمعة: 9",
    status: "published",
  },
  {
    question: "من أول الأنبياء المرسلين إلى قومه؟",
    answer: "نوح عليه السلام، بعث إلى قومه يدعوهم إلى عبادة الله وحده.",
    category_name: "قصص الأنبياء",
    status: "published",
  },
  {
    question: "من النبي الذي اتخذه الله خليلاً؟",
    answer: "إبراهيم عليه السلام، وفيه قال تعالى: ﴿وَاتَّخَذَ اللَّهُ إِبْرَاهِيمَ خَلِيلًا﴾",
    category_name: "قصص الأنبياء",
    status: "published",
  },
  {
    question: "من أول من آمن برسول الله ﷺ من الرجال؟",
    answer: "أبو بكر الصديق رضي الله عنه، كان أول من صدّق وآمن برسول الله ﷺ من الرجال.",
    category_name: "الصحابة",
    status: "published",
  },
  {
    question: "من أول من آمن برسول الله ﷺ من النساء؟",
    answer: "خديجة بنت خويلد رضي الله عنها، كانت أول من آمنت ونصرت رسول الله ﷺ.",
    category_name: "الصحابة",
    status: "published",
  },
  {
    question: "متى هاجر النبي ﷺ إلى المدينة؟",
    answer: "هاجر النبي ﷺ إلى المدينة في عام 622م الموافق للسنة الأولى للهجرة، مع أبي بكر الصديق.",
    category_name: "السيرة النبوية",
    status: "published",
  },
  {
    question: "ما أول مسجد بُني في الإسلام؟",
    answer: "مسجد قباء، بُني عند وصول النبي ﷺ إلى المدينة قبل دخولها.",
    category_name: "السيرة النبوية",
    status: "published",
  },
  {
    question: "ما حكم إخراج الزكاة؟",
    answer: "إخراج الزكاة فرض على من ملك نصابًا من المال وحال عليه الحول.",
    category_name: "أحكام شرعية",
    ruling_type: "فرض",
    status: "published",
  },
  {
    question: "ما حكم صيام رمضان؟",
    answer: "صيام رمضان ركن من أركان الإسلام، فرض على كل مسلم بالغ عاقل قادر.",
    category_name: "أحكام شرعية",
    ruling_type: "فرض",
    status: "published",
  },
];

mkdirSync(outDir, { recursive: true });

const files = [
  ["01-sheikhs.json", sheikhs],
  ["02-kuwait-lessons.json", lessons],
  ["03-fawaid.json", fawaid],
  ["04-qa.json", qa],
];

for (const [name, data] of files) {
  const path = join(outDir, name);
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`Wrote ${path} (${data.length} items)`);
}

console.log("\nImport order: 01 → 02 → 03 → 04 via /admin bulk import");
