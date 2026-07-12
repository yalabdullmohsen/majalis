import { useEffect, useMemo, useState } from "react";
import { Search, Copy, Check, BookOpen, Star } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

/* ─── بيانات الأدعية ─── */
type DuaEntry = {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  source: string;
  category: string;
  occasion: string;
  virtue?: string;
};

const CATEGORIES = [
  "الكل", "الصباح والمساء", "الصلاة", "الأكل والشرب", "السفر",
  "النوم واليقظة", "الكرب والهم", "الدعاء العام", "المناسبات",
];

const DUAS: DuaEntry[] = [
  {
    id: "sabah-1",
    title: "دعاء الصباح الأول",
    arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
    transliteration: "Asbahna wa-asbahal-mulku lillah, wal-hamdu lillah, la ilaha illallahu wahdahu la sharika lah",
    meaning: "أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له",
    source: "صحيح مسلم",
    category: "الصباح والمساء",
    occasion: "عند الصباح",
    virtue: "من قالها في الصباح فكأنما أعتق رقبة",
  },
  {
    id: "sabah-2",
    title: "سيد الاستغفار في الصباح",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    transliteration: "Allahumma anta rabbi la ilaha illa anta, khalaqtani wa ana abduka...",
    meaning: "اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت",
    source: "صحيح البخاري",
    category: "الصباح والمساء",
    occasion: "سيد الاستغفار، صباحاً ومساءً",
    virtue: "من قالها إيماناً وهو موقن بها صباحاً فمات في يومه دخل الجنة",
  },
  {
    id: "masa-1",
    title: "أذكار المساء، الآية الكريمة",
    arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ",
    transliteration: "Allahu la ilaha illa huwal-hayyul-qayyum, la ta'khudhuhu sinatun wa la nawm",
    meaning: "آية الكرسي، سيدة آي القرآن",
    source: "البقرة: 255، السنة النبوية",
    category: "الصباح والمساء",
    occasion: "مساءً بعد كل صلاة فريضة",
    virtue: "من قرأها في ليلة لم يزل عليه من الله حافظ ولا يقربه شيطان حتى يصبح",
  },
  {
    id: "salah-1",
    title: "دعاء الاستفتاح",
    arabic: "سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَى جَدُّكَ، وَلَا إِلَهَ غَيْرُكَ",
    transliteration: "Subhanakallahumma wa bihamdika, wa tabarakasmuka, wa ta'ala jadduka, wa la ilaha ghayruk",
    meaning: "سبحانك اللهم وبحمدك، وتبارك اسمك، وتعالى جدك، ولا إله غيرك",
    source: "سنن أبي داود، صحيح",
    category: "الصلاة",
    occasion: "في بداية الصلاة بعد تكبيرة الإحرام",
  },
  {
    id: "salah-2",
    title: "دعاء الركوع",
    arabic: "سُبْحَانَ رَبِّيَ الْعَظِيمِ",
    transliteration: "Subhana rabbiyal-azim",
    meaning: "سبحان ربي العظيم، تسبيح في الركوع",
    source: "متفق عليه",
    category: "الصلاة",
    occasion: "يقال في الركوع ثلاث مرات على الأقل",
  },
  {
    id: "salah-3",
    title: "دعاء السجود",
    arabic: "سُبْحَانَ رَبِّيَ الْأَعْلَى",
    transliteration: "Subhana rabbiyal-a'la",
    meaning: "سبحان ربي الأعلى، تسبيح في السجود",
    source: "متفق عليه",
    category: "الصلاة",
    occasion: "يقال في السجود ثلاث مرات على الأقل",
  },
  {
    id: "salah-4",
    title: "دعاء بعد التشهد",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ جَهَنَّمَ، وَمِنْ عَذَابِ الْقَبْرِ، وَمِنْ فِتْنَةِ الْمَحْيَا وَالْمَمَاتِ، وَمِنْ شَرِّ فِتْنَةِ الْمَسِيحِ الدَّجَّالِ",
    transliteration: "Allahumma inni a'udhu bika min 'adhabi jahannam...",
    meaning: "اللهم إني أعوذ بك من عذاب جهنم ومن عذاب القبر",
    source: "متفق عليه",
    category: "الصلاة",
    occasion: "بعد التشهد قبل السلام",
    virtue: "أوصى به النبي ﷺ أصحابه",
  },
  {
    id: "akl-1",
    title: "دعاء الطعام قبل الأكل",
    arabic: "بِسْمِ اللَّهِ",
    transliteration: "Bismillah",
    meaning: "بسم الله، تسمية عند بدء الطعام",
    source: "صحيح مسلم",
    category: "الأكل والشرب",
    occasion: "عند البدء بالأكل",
    virtue: "إذا أكل أحدكم فليذكر اسم الله تعالى",
  },
  {
    id: "akl-2",
    title: "دعاء بعد الطعام",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ",
    transliteration: "Al-hamdu lillahil-ladhi at'amana wa saqana wa ja'alana muslimin",
    meaning: "الحمد لله الذي أطعمنا وسقانا وجعلنا مسلمين",
    source: "سنن الترمذي، صحيح",
    category: "الأكل والشرب",
    occasion: "عند الفراغ من الطعام",
  },
  {
    id: "akl-3",
    title: "دعاء الشرب بعد الانتهاء",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي سَقَانَا عَذْبًا فُرَاتًا بِرَحْمَتِهِ وَلَمْ يَجْعَلْهُ مِلْحًا أُجَاجًا بِذُنُوبِنَا",
    transliteration: "Al-hamdu lillahil-ladhi saqana 'adhban furatan birahmatih...",
    meaning: "الحمد لله الذي سقانا عذباً فراتاً برحمته",
    source: "حسنه الألباني",
    category: "الأكل والشرب",
    occasion: "بعد شرب الماء",
  },
  {
    id: "safar-1",
    title: "دعاء السفر، تكبير المسافر",
    arabic: "اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنقَلِبُونَ",
    transliteration: "Allahu Akbar (×3), Subhana-lladhi sakhkhara lana hadha wa ma kunna lahu muqrinin...",
    meaning: "سبحان الذي سخّر لنا هذا وما كنا له مقرنين وإنا إلى ربنا لمنقلبون",
    source: "صحيح مسلم",
    category: "السفر",
    occasion: "عند ركوب السيارة أو الطائرة",
    virtue: "ثبت عن النبي ﷺ",
  },
  {
    id: "safar-2",
    title: "دعاء الخروج من البيت",
    arabic: "بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    transliteration: "Bismillah, tawakkaltu 'alallah, wa la hawla wa la quwwata illa billah",
    meaning: "بسم الله توكلت على الله ولا حول ولا قوة إلا بالله",
    source: "سنن أبي داود والترمذي",
    category: "السفر",
    occasion: "عند الخروج من المنزل",
    virtue: "من قالها قيل له: كُفيتَ ووُقيتَ وتنحّى عنه الشيطان",
  },
  {
    id: "nawm-1",
    title: "دعاء النوم",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allahumma amutu wa ahya",
    meaning: "باسمك اللهم أموت وأحيا",
    source: "صحيح البخاري",
    category: "النوم واليقظة",
    occasion: "عند الاستلقاء للنوم",
  },
  {
    id: "nawm-2",
    title: "دعاء الاستيقاظ",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    transliteration: "Al-hamdu lillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur",
    meaning: "الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور",
    source: "صحيح البخاري",
    category: "النوم واليقظة",
    occasion: "عند الاستيقاظ من النوم",
  },
  {
    id: "karb-1",
    title: "دعاء الكرب الأعظم",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ",
    transliteration: "La ilaha illallahul-azimul-halim, la ilaha illallahu rabbul-arshil-azim...",
    meaning: "لا إله إلا الله العظيم الحليم، لا إله إلا الله رب العرش العظيم",
    source: "متفق عليه",
    category: "الكرب والهم",
    occasion: "عند الكرب الشديد والضيق",
    virtue: "كان النبي ﷺ يقولها عند الكرب",
  },
  {
    id: "karb-2",
    title: "دعاء يونس عليه السلام",
    arabic: "لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ",
    transliteration: "La ilaha illa anta subhanaka inni kuntu minaz-zalimin",
    meaning: "لا إله إلا أنت سبحانك إني كنت من الظالمين",
    source: "الأنبياء: 87",
    category: "الكرب والهم",
    occasion: "في أوقات الضيق والكرب",
    virtue: "ما دعا بها مكروب إلا فرّج الله عنه",
  },
  {
    id: "karb-3",
    title: "دعاء الهم والحزن",
    arabic: "اللَّهُمَّ إِنِّي عَبْدُكَ وَابْنُ عَبْدِكَ وَابْنُ أَمَتِكَ، نَاصِيَتِي بِيَدِكَ، مَاضٍ فِيَّ حُكْمُكَ، عَدْلٌ فِيَّ قَضَاؤُكَ",
    transliteration: "Allahumma inni 'abduka, wabnu 'abdika, wabnu amatika, nasiyati biyadika...",
    meaning: "اللهم إني عبدك وابن عبدك، ناصيتي بيدك، ماضٍ في حكمك، عدل في قضاؤك",
    source: "رواه أحمد، صحيح الجامع",
    category: "الكرب والهم",
    occasion: "عند الهم والحزن",
    virtue: "ما أصاب عبداً قط هم ولا حزن فقالها إلا أذهب الله همه وأبدله فرحاً",
  },
  {
    id: "am-1",
    title: "أفضل دعاء، جوامع الكلم",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
    meaning: "ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار",
    source: "البقرة: 201، متفق عليه",
    category: "الدعاء العام",
    occasion: "في أي وقت",
    virtue: "كان النبي ﷺ يكثر منه",
  },
  {
    id: "am-2",
    title: "دعاء طلب الثبات",
    arabic: "يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ",
    transliteration: "Ya muqallibal-qulub thabbit qalbi 'ala dinik",
    meaning: "يا مقلب القلوب ثبت قلبي على دينك",
    source: "رواه الترمذي، صحيح",
    category: "الدعاء العام",
    occasion: "في أي وقت خاصةً في أوقات الفتن",
    virtue: "كان النبي ﷺ يكثر من هذا الدعاء",
  },
  {
    id: "am-3",
    title: "دعاء الاستخارة",
    arabic: "اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ",
    transliteration: "Allahumma inni astakhiruka bi'ilmika wa astaqdiruka biqudratika wa as'aluka min fadlikal-azim",
    meaning: "اللهم إني أستخيرك بعلمك وأستقدرك بقدرتك وأسألك من فضلك العظيم",
    source: "صحيح البخاري",
    category: "الدعاء العام",
    occasion: "عند التردد في أمر",
    virtue: "كان النبي ﷺ يعلّمه الصحابة كالسورة من القرآن",
  },
  {
    id: "jumuah-1",
    title: "الإكثار من الصلاة يوم الجمعة",
    arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ",
    transliteration: "Allahumma salli 'ala Muhammad wa 'ala ali Muhammad kama sallayta 'ala Ibrahim...",
    meaning: "اللهم صلّ على محمد وعلى آل محمد كما صليت على إبراهيم",
    source: "متفق عليه",
    category: "المناسبات",
    occasion: "يوم الجمعة والإكثار من الصلاة على النبي ﷺ",
    virtue: "من صلى عليّ واحدة صلى الله عليه عشراً",
  },
  {
    id: "ramadan-1",
    title: "دعاء رمضان، ليلة القدر",
    arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
    transliteration: "Allahumma innaka 'afuwwun tuhibbul-'afwa fa'fu 'anni",
    meaning: "اللهم إنك عفو تحب العفو فاعف عني",
    source: "صحيح الترمذي",
    category: "المناسبات",
    occasion: "في ليالي رمضان خاصةً ليلة القدر",
    virtue: "علّمه النبي ﷺ لعائشة رضي الله عنها",
  },
  {
    id: "masjid-1",
    title: "دعاء دخول المسجد",
    arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    transliteration: "Allahumma iftah li abwaba rahmatik",
    meaning: "اللهم افتح لي أبواب رحمتك",
    source: "صحيح مسلم",
    category: "المناسبات",
    occasion: "عند دخول المسجد مع تقديم القدم اليمنى",
  },
  {
    id: "masjid-2",
    title: "دعاء الخروج من المسجد",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
    transliteration: "Allahumma inni as'aluka min fadlik",
    meaning: "اللهم إني أسألك من فضلك",
    source: "صحيح مسلم",
    category: "المناسبات",
    occasion: "عند الخروج من المسجد مع تقديم القدم اليسرى",
  },
  /* ── أدعية إضافية، الصلاة ── */
  {
    id: "salah-5",
    title: "التشهد الأوسط والأخير",
    arabic: "التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
    transliteration: "At-tahiyyatu lillahi was-salawatu wat-tayyibat...",
    meaning: "التشهد في الصلاة، أفضل ما يُقال في الجلوس",
    source: "متفق عليه",
    category: "الصلاة",
    occasion: "في الجلسة الوسطى والأخيرة في الصلاة",
    virtue: "علّمه النبي ﷺ ابن مسعود رضي الله عنه كالسورة من القرآن",
  },
  {
    id: "salah-6",
    title: "دعاء بين السجدتين",
    arabic: "رَبِّ اغْفِرْ لِي، رَبِّ اغْفِرْ لِي",
    transliteration: "Rabbighfir li, Rabbighfir li",
    meaning: "رب اغفر لي، دعاء الجلسة بين السجدتين",
    source: "سنن ابن ماجه، صحيح",
    category: "الصلاة",
    occasion: "في الجلسة بين السجدتين",
  },
  /* ── أدعية الكرب والهم، إضافية ── */
  {
    id: "karb-4",
    title: "دعاء النبي ﷺ في الشدة",
    arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
    transliteration: "Hasbunallahu wa ni'mal-wakil",
    meaning: "حسبنا الله ونعم الوكيل",
    source: "صحيح البخاري، آل عمران: 173",
    category: "الكرب والهم",
    occasion: "عند الخوف والشدة",
    virtue: "قالها إبراهيم ﷺ حين أُلقي في النار، وقالها النبي ﷺ في غزوة أحد",
  },
  {
    id: "karb-5",
    title: "دعاء التوكل والصبر",
    arabic: "رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا",
    transliteration: "Rabbana la tu'akhidhna in nasina aw akhta'na...",
    meaning: "ربنا لا تؤاخذنا إن نسينا أو أخطأنا",
    source: "البقرة: 286",
    category: "الكرب والهم",
    occasion: "عند الخطأ والنسيان وطلب العفو",
    virtue: "من آخر آيات سورة البقرة التي تُقرأ لدرء الكوارث",
  },
  {
    id: "karb-6",
    title: "دعاء رفع البلاء",
    arabic: "لَا إِلَهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ",
    transliteration: "La ilaha illa anta subhanaka inni kuntu minaz-zalimin",
    meaning: "لا إله إلا أنت سبحانك إني كنت من الظالمين، دعاء ذي النون",
    source: "الأنبياء: 87، صحيح الترمذي",
    category: "الكرب والهم",
    occasion: "عند الضيق وطلب رفع البلاء",
    virtue: "ما دعا بها مكروب قط إلا استجاب الله له",
  },
  /* ── دعاء عام، إضافية ── */
  {
    id: "am-4",
    title: "دعاء طلب العلم النافع",
    arabic: "اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي، وَعَلِّمْنِي مَا يَنْفَعُنِي، وَزِدْنِي عِلْمًا",
    transliteration: "Allahumma infa'ni bima 'allamtani, wa 'allimni ma yanfa'uni, wa zidni 'ilma",
    meaning: "اللهم انفعني بما علمتني وعلمني ما ينفعني وزدني علماً",
    source: "سنن ابن ماجه، صحيح",
    category: "الدعاء العام",
    occasion: "بعد الانتهاء من الدراسة أو القراءة",
    virtue: "من أجمع الأدعية في طلب العلم النافع",
  },
  {
    id: "am-5",
    title: "دعاء الشفاء",
    arabic: "اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَأْسَ، اشْفِهِ وَأَنتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا",
    transliteration: "Allahumma rabban-nas adhhibil-ba's, ishfihi wa antash-shafi, la shifa'a illa shifa'uk...",
    meaning: "اللهم رب الناس أذهب البأس اشفه وأنت الشافي لا شفاء إلا شفاؤك",
    source: "متفق عليه",
    category: "الدعاء العام",
    occasion: "عند زيارة المريض أو رقيته",
    virtue: "ثبت في صحيح البخاري عن النبي ﷺ",
  },
  {
    id: "am-6",
    title: "دعاء طلب الرزق الحلال",
    arabic: "اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ",
    transliteration: "Allahumma akfini bihalala 'an haramik, wa aghnini bifadlika 'amman siwak",
    meaning: "اللهم اكفني بحلالك عن حرامك وأغنني بفضلك عمن سواك",
    source: "سنن الترمذي، حسن",
    category: "الدعاء العام",
    occasion: "عند الضيق المادي وطلب الرزق",
    virtue: "من الأدعية الجامعة في طلب سعة الرزق الحلال",
  },
  {
    id: "am-7",
    title: "دعاء حسن الخاتمة",
    arabic: "اللَّهُمَّ اجْعَلْ خَيْرَ عُمُرِي آخِرَهُ، وَخَيْرَ عَمَلِي خَوَاتِيمَهُ، وَخَيْرَ أَيَّامِي يَوْمَ أَلْقَاكَ",
    transliteration: "Allahumma aj'al khayra 'umuri akhirahu, wa khayra 'amali khawatimahu...",
    meaning: "اللهم اجعل خير عمري آخره وخير عملي خواتيمه وخير أيامي يوم ألقاك",
    source: "صحيح الجامع",
    category: "الدعاء العام",
    occasion: "في أي وقت خاصةً عند المساء",
    virtue: "من أجمع الأدعية في طلب حسن الخاتمة",
  },
  /* ── أدعية النوم، إضافية ── */
  {
    id: "nawm-3",
    title: "الآيات الثلاث قبل النوم",
    arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ (×3)، قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ (×3)، قُلْ أَعُوذُ بِرَبِّ النَّاسِ (×3)",
    transliteration: "Qul Huwallahu ahad (×3)، Qul a'udhu birabbil-falaq (×3)، Qul a'udhu birabbin-nas (×3)",
    meaning: "المعوذتان والإخلاص ثلاثاً، ثم ينفث في الكفين ويمسح الجسد",
    source: "صحيح البخاري",
    category: "النوم واليقظة",
    occasion: "قبل النوم: اقرأها في كفيك وانفث ثم امسح ما استطعت من جسدك",
    virtue: "كان النبي ﷺ يفعل ذلك كل ليلة",
  },
  {
    id: "nawm-4",
    title: "دعاء الاستيقاظ والحمد",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    transliteration: "Al-hamdu lillahi-lladhi ahyana ba'da ma amatana wa ilayhin-nushur",
    meaning: "الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور",
    source: "صحيح البخاري",
    category: "النوم واليقظة",
    occasion: "أول ما يقوله فور الاستيقاظ",
  },
  /* ── السفر، إضافية ── */
  {
    id: "safar-3",
    title: "دعاء العودة من السفر",
    arabic: "آيِبُونَ تَائِبُونَ عَابِدُونَ لِرَبِّنَا حَامِدُونَ",
    transliteration: "Ayibuna ta'ibuna 'abiduna lirrabbina hamidun",
    meaning: "آيبون تائبون عابدون لربنا حامدون",
    source: "متفق عليه",
    category: "السفر",
    occasion: "عند العودة من السفر",
    virtue: "كان النبي ﷺ يقوله عند القدوم من كل سفر",
  },
  {
    id: "safar-4",
    title: "دعاء دخول البيت",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلِجِ وَخَيْرَ الْمَخْرَجِ، بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا",
    transliteration: "Allahumma inni as'aluka khayral-mawliji wa khayral-makhraj...",
    meaning: "اللهم إني أسألك خير المولج وخير المخرج، دعاء دخول البيت",
    source: "سنن أبي داود، صحيح",
    category: "السفر",
    occasion: "عند دخول البيت، التسمية واجبة",
    virtue: "يطرد الشيطان من المبيت والطعام",
  },
  /* ── كرب، إضافية ── */
  {
    id: "karb-7",
    title: "دعاء الهم والحزن الشامل",
    arabic: "اللَّهُمَّ إِنِّي عَبْدُكَ ابْنُ عَبْدِكَ ابْنُ أَمَتِكَ، نَاصِيَتِي بِيَدِكَ، مَاضٍ فِيَّ حُكْمُكَ، عَدْلٌ فِيَّ قَضَاؤُكَ، أَسْأَلُكَ بِكُلِّ اسْمٍ هُوَ لَكَ سَمَّيْتَ بِهِ نَفْسَكَ أَوْ أَنْزَلْتَهُ فِي كِتَابِكَ أَوْ عَلَّمْتَهُ أَحَداً مِنْ خَلْقِكَ أَوِ اسْتَأْثَرْتَ بِهِ فِي عِلْمِ الْغَيْبِ عِنْدَكَ أَنْ تَجْعَلَ الْقُرْآنَ رَبِيعَ قَلْبِي وَنُورَ صَدْرِي وَجَلَاءَ حُزْنِي وَذَهَابَ هَمِّي",
    transliteration: "Allahumma inni 'abduka ibnu 'abdika ibnu amatika...",
    meaning: "دعاء جامع لإزالة الهم والحزن بالتوسل بأسماء الله الحسنى",
    source: "مسند أحمد، صحيح ابن حبان",
    category: "الكرب والهم",
    occasion: "عند الحزن الشديد والهموم المتراكمة",
    virtue: "ما أصاب أحداً قط همٌّ ولا حزن فقالها إلا أذهب الله همه وحزنه",
  },
  /* ── مناسبات، إضافية ── */
  {
    id: "hilal-1",
    title: "دعاء رؤية الهلال",
    arabic: "اللَّهُ أَكْبَرُ، اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالأَمْنِ وَالإِيمَانِ وَالسَّلَامَةِ وَالإِسْلَامِ، رَبِّي وَرَبُّكَ اللَّهُ",
    transliteration: "Allahu Akbar, Allahumma ahillahu 'alayna bil-amni wal-imani was-salamati wal-Islam...",
    meaning: "اللهم أهل علينا هذا الهلال بالأمن والإيمان والسلامة والإسلام",
    source: "سنن الترمذي، حسن",
    category: "المناسبات",
    occasion: "عند رؤية هلال كل شهر",
    virtue: "إحياء سنة النبي ﷺ في استقبال الشهر الجديد بالدعاء",
  },
  {
    id: "safar-5",
    title: "دعاء الرجوع من السفر",
    arabic: "آيِبُونَ تَائِبُونَ عَابِدُونَ لِرَبِّنَا حَامِدُونَ",
    transliteration: "Ayibuna ta'ibuna 'abiduna li-Rabbina hamidun",
    meaning: "نرجع تائبين عابدين لربنا حامدين",
    source: "متفق عليه",
    category: "السفر",
    occasion: "عند العودة من السفر في كل تل ومرتفع",
    virtue: "سنة مؤكدة كان النبي ﷺ يقولها عند العودة من كل سفر",
  },
  {
    id: "masjid-3",
    title: "دعاء تشميت العاطس",
    arabic: "يَرْحَمُكَ اللَّهُ",
    transliteration: "Yarhamukallah",
    meaning: "يرحمك الله، الرد على العاطس بعد حمد الله",
    source: "صحيح البخاري",
    category: "المناسبات",
    occasion: "يقوله المستمع إذا حمد العاطس الله، ثم يرد العاطس: يهديكم الله ويصلح بالكم",
  },
  {
    id: "masjid-4",
    title: "دعاء الوضوء، بعد الانتهاء",
    arabic: "أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
    transliteration: "Ash-hadu an la ilaha illallahu wahdahu la sharika lahu wa ash-hadu anna Muhammadan 'abduhu wa rasuluh",
    meaning: "أشهد أن لا إله إلا الله وحده لا شريك له وأشهد أن محمداً عبده ورسوله",
    source: "صحيح مسلم",
    category: "المناسبات",
    occasion: "بعد الانتهاء من الوضوء",
    virtue: "من قالها فتحت له أبواب الجنة الثمانية يدخل من أيها شاء",
  },
  /* ── الصباح والمساء، إضافية ── */
  {
    id: "sabah-3",
    title: "التعوذ بكلمات الله التامات مساءً",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    transliteration: "A'udhu bikalimatillahit-tammati min sharri ma khalaq",
    meaning: "أعوذ بكلمات الله الكاملة التامة من شر كل ما خلق",
    source: "صحيح مسلم",
    category: "الصباح والمساء",
    occasion: "يقولها ثلاثاً حين يمسي",
    virtue: "لم يضره شيء حتى يصبح",
  },
  {
    id: "masa-2",
    title: "أمسينا وأمسى الملك لله",
    arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ لَا شَرِيكَ لَهُ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا",
    transliteration: "Amsayna wa amsal-mulku lillahi wal-hamdu lillahi la sharika lah, la ilaha illallahu wahdahu la sharika lahu lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir...",
    meaning: "أمسينا وأمسى الملك لله، والحمد لله لا شريك له، دعاء جامع لمساء المسلم",
    source: "صحيح مسلم",
    category: "الصباح والمساء",
    occasion: "يقوله مساءً — وفي الصباح يقول: أصبحنا وأصبح الملك لله",
  },
  /* ── النوم واليقظة، إضافية ── */
  {
    id: "nawm-5",
    title: "دعاء الفزع في النوم",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ غَضَبِهِ وَعِقَابِهِ وَشَرِّ عِبَادِهِ وَمِنْ هَمَزَاتِ الشَّيَاطِينِ وَأَنْ يَحْضُرُونِ",
    transliteration: "A'udhu bikalimatillahit-tammati min ghadabihi wa 'iqabihi wa sharri 'ibadihi wa min hamazatish-shayatini wa an yahdurun",
    meaning: "أعوذ بكلمات الله التامات من غضبه وعقابه وشر عباده ومن همزات الشياطين وأن يحضرون",
    source: "سنن أبي داود، سنن الترمذي",
    category: "النوم واليقظة",
    occasion: "عند الفزع من النوم",
    virtue: "كان عبد الله بن عمرو يعلمها من بلغ من أبنائه",
  },
  {
    id: "nawm-6",
    title: "ذكر التوحيد عند تعذّر النوم",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ الْوَاحِدُ الْقَهَّارُ، رَبُّ السَّمَاوَاتِ وَالأَرْضِ وَمَا بَيْنَهُمَا الْعَزِيزُ الْغَفَّارُ",
    transliteration: "La ilaha illallahul-wahidul-qahhar, rabbus-samawati wal-ardi wa ma baynahuma al-'azizul-ghaffar",
    meaning: "لا إله إلا الله الواحد القهار رب السماوات والأرض وما بينهما العزيز الغفار",
    source: "مستدرك الحاكم، صحيح",
    category: "النوم واليقظة",
    occasion: "عند التقلب في الفراش وتعذّر النوم",
  },
  /* ── الأكل والشرب، إضافية ── */
  {
    id: "akl-4",
    title: "التسمية عند نسيانها في أول الطعام",
    arabic: "بِسْمِ اللَّهِ أَوَّلَهُ وَآخِرَهُ",
    transliteration: "Bismillahi awwalahu wa akhirah",
    meaning: "بسم الله في أوله وآخره، يقولها من نسي التسمية في بداية طعامه",
    source: "سنن أبي داود، سنن الترمذي، حسن صحيح",
    category: "الأكل والشرب",
    occasion: "إذا نسي التسمية في أول الطعام قالها في أثنائه",
    virtue: "تُحرم الشيطان من مشاركة الطعام حتى آخره",
  },
  /* ── الأكل والشرب، إضافية ── */
  {
    id: "akl-5",
    title: "دعاء شرب اللبن",
    arabic: "اللَّهُمَّ بَارِكْ لَنَا فِيهِ وَزِدْنَا مِنْهُ",
    transliteration: "Allahumma barik lana fihi wa zidna minhu",
    meaning: "اللهم بارك لنا فيه وزدنا منه",
    source: "سنن أبي داود والترمذي، صحيح",
    category: "الأكل والشرب",
    occasion: "يقوله بعد شرب اللبن خاصةً",
    virtue: "اللبن يُقال له هذا الدعاء لأنه كان طعام النبي ﷺ المفضل وطعام أهل الجنة",
  },
  {
    id: "akl-6",
    title: "دعاء الإفطار",
    arabic: "اللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ",
    transliteration: "Allahumma laka sumtu wa 'ala rizqika aftartu",
    meaning: "اللهم لك صمت وعلى رزقك أفطرت",
    source: "سنن أبي داود، حسن",
    category: "الأكل والشرب",
    occasion: "عند الإفطار من صوم رمضان أو غيره",
    virtue: "يجمع الإخلاص وشكر النعمة وتمجيد المنعم في جملة واحدة",
  },
  {
    id: "akl-7",
    title: "الدعاء لمن أطعمك",
    arabic: "أَفْطَرَ عِنْدَكُمُ الصَّائِمُونَ، وَأَكَلَ طَعَامَكُمُ الأَبْرَارُ، وَصَلَّتْ عَلَيْكُمُ الْمَلَائِكَةُ",
    transliteration: "Aftara 'indakumus-sa'imun, wa akala ta'amakumul-abrar, wa sallat 'alaykumul-mala'ikah",
    meaning: "أفطر عندكم الصائمون وأكل طعامكم الأبرار وصلت عليكم الملائكة",
    source: "سنن أبي داود وابن ماجه، صحيح",
    category: "الأكل والشرب",
    occasion: "يقوله من أُكرم بالطعام لمن أطعمه",
    virtue: "دعاء ثلاثي النعمة: الصائمون أفطروا عندك، والأبرار أكلوا طعامك، والملائكة صلّت عليك",
  },
  /* ── مناسبات، إضافية ── */
  {
    id: "nikah-1",
    title: "دعاء تهنئة الزواج",
    arabic: "بَارَكَ اللَّهُ لَكَ وَبَارَكَ عَلَيْكَ وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ",
    transliteration: "Barakallahu laka wa baraka 'alayka wa jama'a baynakuma fi khayr",
    meaning: "بارك الله لك وبارك عليك وجمع بينكما في خير",
    source: "سنن أبي داود، سنن الترمذي، صحيح",
    category: "المناسبات",
    occasion: "يقوله المهنئ للمتزوج عند تهنئته",
    virtue: "هذا الدعاء النبوي المأثور أفضل من أسلوب الجاهلية: بالرفاء والبنين",
  },
  {
    id: "marid-1",
    title: "دعاء عيادة المريض",
    arabic: "اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَأْسَ وَاشْفِهِ وَأَنْتَ الشَّافِي لَا شِفَاءَ إِلَّا شِفَاؤُكَ شِفَاءً لَا يُغَادِرُ سَقَمًا",
    transliteration: "Allahumma rabban-nasi adh-hibil-ba'sa washfihi wa antash-shafi la shifa'a illa shifa'uka shifa'an la yughadiru saqama",
    meaning: "اللهم رب الناس أذهب البأس واشفه أنت الشافي لا شفاء إلا شفاؤك شفاءً لا يترك سقماً",
    source: "متفق عليه",
    category: "المناسبات",
    occasion: "يضع يده على المريض ويقولها سبع مرات",
    virtue: "كان النبي ﷺ يرقي بها المرضى",
  },
  {
    id: "suq-1",
    title: "دعاء دخول السوق",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ حَيٌّ لَا يَمُوتُ، بِيَدِهِ الْخَيْرُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu yuhyi wa yumitu wa huwa hayyun la yamut, biyadihil-khayru wa huwa 'ala kulli shay'in qadir",
    meaning: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد يحيي ويميت وهو حي لا يموت، بيده الخير وهو على كل شيء قدير",
    source: "سنن الترمذي وابن ماجه، صحيح",
    category: "المناسبات",
    occasion: "عند دخول الأسواق والمراكز التجارية",
    virtue: "كتب الله له ألف ألف حسنة ومحا عنه ألف ألف سيئة ورفع له ألف ألف درجة",
  },
  {
    id: "rukub-1",
    title: "دعاء ركوب المركبة",
    arabic: "بِسْمِ اللَّهِ، الْحَمْدُ لِلَّهِ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنقَلِبُونَ",
    transliteration: "Bismillah, al-hamdu lillah, subhana-lladhi sakhkhara lana hadha wa ma kunna lahu muqrinin wa inna ila rabbina lamunqalibun",
    meaning: "سبحان الذي سخر لنا هذا وما كنا له مقرنين وإنا إلى ربنا لمنقلبون",
    source: "سنن الترمذي، صحيح",
    category: "المناسبات",
    occasion: "عند ركوب السيارة أو الطائرة أو أي مركبة",
    virtue: "من قرأها حين يركب ثم حمد الله ثم هلل وكبّر ثم دعا كان في أمان الله",
  },
  /* ─── إضافات الصباح والمساء ─── */
  {
    id: "sabah-6",
    title: "طلب العلم النافع والرزق الطيب",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْماً نَافِعاً، وَرِزْقاً طَيِّباً، وَعَمَلاً مُتَقَبَّلاً",
    transliteration: "Allahumma inni as'aluka 'ilman nafi'an wa rizqan tayyiban wa 'amalan mutaqabbalan",
    meaning: "اللهم إني أسألك علماً نافعاً ورزقاً طيباً وعملاً متقبلاً",
    source: "ابن ماجه: ٩٢٥، صحيح",
    category: "الصباح والمساء",
    occasion: "بعد صلاة الفجر",
    virtue: "جامعة لخيري الدنيا والآخرة في كلمات موجزة",
  },
  {
    id: "sabah-7",
    title: "سؤال العفو والعافية",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ",
    transliteration: "Allahumma inni as'alukal-'afwa wal-'afiyata fid-dunya wal-akhirah",
    meaning: "اللهم إني أسألك العفو والعافية في الدنيا والآخرة",
    source: "أبو داود: ٥٠٧٤، ابن ماجه: ٣٨٧١، صحيح",
    category: "الصباح والمساء",
    occasion: "صباحاً ومساءً",
    virtue: "كان النبي ﷺ لا يدع هذا الدعاء صباحاً ومساءً",
  },
  {
    id: "sabah-8",
    title: "الاستعاذة بكلمات الله التامات",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    transliteration: "A'udhu bikalimati-llahi at-tammati min sharri ma khalaq",
    meaning: "أعوذ بكلمات الله التامات من شر ما خلق",
    source: "صحيح مسلم: ٢٧٠٩",
    category: "الصباح والمساء",
    occasion: "ثلاث مرات عند المساء",
    virtue: "من قالها ثلاث مرات حين يمسي لم يضره لدغة تلك الليلة",
  },
  /* ─── إضافات السفر ─── */
  {
    id: "safar-6",
    title: "إيداع المسافر عند الله",
    arabic: "أَسْتَوْدِعُكَ اللَّهَ الَّذِي لَا تَضِيعُ وَدَائِعُهُ",
    transliteration: "Astawdi'uka-llaha-lladhi la tadi'u wada'i'uh",
    meaning: "أستودعك الله الذي لا تضيع ودائعه",
    source: "ابن ماجه: ٢٨٢٦، صحيح",
    category: "السفر",
    occasion: "يقوله المُقيم لمن يُودِّعه للسفر",
    virtue: "من أودع أخاه المسافر بهذا الدعاء حفظه الله",
  },
  {
    id: "safar-7",
    title: "وداع المسافر بالتزوِّد بالتقوى",
    arabic: "زَوَّدَكَ اللَّهُ التَّقْوَى، وَغَفَرَ ذَنْبَكَ، وَيَسَّرَ لَكَ الْخَيْرَ حَيْثُمَا كُنْتَ",
    transliteration: "Zawwadaka-llahu at-taqwa, wa ghafara dhanbak, wa yassara lakal-khayra haythuma kunt",
    meaning: "زودك الله التقوى وغفر ذنبك ويسر لك الخير حيثما كنت",
    source: "الترمذي: ٣٤٤٤، صحيح",
    category: "السفر",
    occasion: "يقوله المُودِّع للمسافر",
    virtue: "من أفضل ما يُقال للمسافر وداعاً",
  },
  {
    id: "safar-8",
    title: "دعاء القدوم من السفر",
    arabic: "آيِبُونَ تَائِبُونَ عَابِدُونَ لِرَبِّنَا حَامِدُونَ",
    transliteration: "Ayibuna ta'ibuna 'abiduna li-rabbina hamidun",
    meaning: "آيبون تائبون عابدون لربنا حامدون",
    source: "متفق عليه",
    category: "السفر",
    occasion: "عند العودة من السفر",
    virtue: "كان النبي ﷺ يقولها عند رجوعه من كل سفر وغزوة",
  },
  /* ─── إضافات الصلاة ─── */
  {
    id: "salah-7",
    title: "دعاء افتتاح الصلاة (الاستفتاح)",
    arabic: "اللَّهُمَّ بَاعِدْ بَيْنِي وَبَيْنَ خَطَايَايَ كَمَا بَاعَدْتَ بَيْنَ الْمَشْرِقِ وَالْمَغْرِبِ، اللَّهُمَّ نَقِّنِي مِنَ الْخَطَايَا كَمَا يُنَقَّى الثَّوْبُ الْأَبْيَضُ مِنَ الدَّنَسِ، اللَّهُمَّ اغْسِلْ خَطَايَايَ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ",
    transliteration: "Allahumma ba'id bayni wa bayna khatayaya kama ba'adta bayna al-mashriqi wa al-maghrib...",
    meaning: "اللهم باعد بيني وبين خطاياي كما باعدت بين المشرق والمغرب، اللهم نقني من الخطايا كما يُنقى الثوب الأبيض من الدنس",
    source: "متفق عليه: البخاري ٧٤٤، مسلم ٥٩٨",
    category: "الصلاة",
    occasion: "دعاء الاستفتاح في أول ركعة بعد تكبيرة الإحرام",
    virtue: "من أثبت أدعية الاستفتاح وأكثرها وروداً في الصحيحين",
  },
  {
    id: "salah-8",
    title: "دعاء القنوت في الوتر",
    arabic: "اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ، وَعَافِنِي فِيمَنْ عَافَيْتَ، وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ، وَبَارِكْ لِي فِيمَا أَعْطَيْتَ، وَقِنِي شَرَّ مَا قَضَيْتَ، فَإِنَّكَ تَقْضِي وَلَا يُقْضَى عَلَيْكَ، وَإِنَّهُ لَا يَذِلُّ مَنْ وَالَيْتَ، تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ",
    transliteration: "Allahumma-hdini fiman hadayt, wa 'afini fiman 'afayt...",
    meaning: "اللهم اهدني فيمن هديت، وعافني فيمن عافيت، وتولني فيمن توليت، وبارك لي فيما أعطيت",
    source: "أبو داود: ١٤٢٥، الترمذي: ٤٦٤، حسن صحيح",
    category: "الصلاة",
    occasion: "يُقال في قنوت الوتر قبل الركوع أو بعده",
    virtue: "علَّمه النبي ﷺ الحسنَ بن علي رضي الله عنهما",
  },
  {
    id: "salah-9",
    title: "دعاء ما بين السجدتين",
    arabic: "رَبِّ اغْفِرْ لِي، رَبِّ اغْفِرْ لِي",
    transliteration: "Rabb-ighfir li, Rabb-ighfir li",
    meaning: "رب اغفر لي، رب اغفر لي",
    source: "أبو داود: ٨٧٤، صحيح",
    category: "الصلاة",
    occasion: "بين السجدتين في كل ركعة",
    virtue: "كان النبي ﷺ يُطيل الجلوس بين السجدتين ويكرر هذا الدعاء",
  },
  {
    id: "salah-10",
    title: "دعاء بعد الصلاة (التسبيح الجامع)",
    arabic: "سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَاللَّهُ أَكْبَرُ — ثَلَاثًا وَثَلَاثِينَ لِكُلٍّ، ثُمَّ: لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "Subhana-llah (33x), Alhamdu-lillah (33x), Allahu Akbar (33x), La ilaha illa-llah wahdahu la sharika lah...",
    meaning: "سبحان الله والحمد لله والله أكبر، ثلاثاً وثلاثين لكل، ثم ختماً: لا إله إلا الله وحده لا شريك له له الملك وله الحمد وهو على كل شيء قدير",
    source: "صحيح مسلم: ٥٩٧",
    category: "الصلاة",
    occasion: "عقب كل صلاة مفروضة",
    virtue: "من قالها حُطَّت خطاياه وإن كانت مثل زبد البحر",
  },
  /* ─── إضافات النوم ─── */
  {
    id: "nawm-7",
    title: "دعاء الاستخارة",
    arabic: "اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ، وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ، فَإِنَّكَ تَقْدِرُ وَلَا أَقْدِرُ، وَتَعْلَمُ وَلَا أَعْلَمُ، وَأَنْتَ عَلَّامُ الْغُيُوبِ",
    transliteration: "Allahumma inni astakhiruka bi-'ilmika wa astaqdiruka bi-qudratika wa as'aluka min fadlika al-'azim...",
    meaning: "اللهم إني أستخيرك بعلمك وأستقدرك بقدرتك وأسألك من فضلك العظيم، فإنك تقدر ولا أقدر وتعلم ولا أعلم وأنت علام الغيوب",
    source: "صحيح البخاري: ١١٦٦",
    category: "النوم واليقظة",
    occasion: "يُصلى ركعتان ثم يُدعى بهذا الدعاء قبل أي أمر مهم",
    virtue: "علَّمه النبي ﷺ أصحابه كما يُعلِّمهم السورة من القرآن",
  },
  {
    id: "nawm-8",
    title: "دعاء من رأى رؤيا حسنة",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ",
    transliteration: "Alhamdu-lillahi-lladhi bi-ni'matihi tatimmu as-salihat",
    meaning: "الحمد لله الذي بنعمته تتم الصالحات",
    source: "ابن ماجه: ٣٨٠٣، حسن",
    category: "النوم واليقظة",
    occasion: "عند الاستيقاظ من رؤيا حسنة",
    virtue: "الرؤيا الصالحة جزء من ستة وأربعين جزءاً من النبوة",
  },
  {
    id: "nawm-9",
    title: "دعاء من رأى رؤيا مزعجة",
    arabic: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ وَمِنْ شَرِّ هَذِهِ الرُّؤْيَا",
    transliteration: "A'udhu-billahi mina ash-shaytani ar-rajim wa min sharri hadhihi ar-ru'ya",
    meaning: "أعوذ بالله من الشيطان الرجيم ومن شر هذه الرؤيا",
    source: "صحيح مسلم: ٢٢٦١",
    category: "النوم واليقظة",
    occasion: "عند الاستيقاظ من حلم مزعج أو مخيف",
    virtue: "من فعل ذلك لم يضره ذلك الحلم ولا يُحدِّث به أحداً",
  },
  /* ─── إضافات الكرب والهم ─── */
  {
    id: "karb-8",
    title: "دعاء الهم والغضب",
    arabic: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
    transliteration: "A'udhu-billahi mina ash-shaytani ar-rajim",
    meaning: "أعوذ بالله من الشيطان الرجيم",
    source: "متفق عليه: البخاري ٣٢٨٢، مسلم ٢٦١٠",
    category: "الكرب والهم",
    occasion: "عند الغضب الشديد",
    virtue: "قال ﷺ: إن رجلاً يقول الله لو قال هذا لذهب عنه ما يجد",
  },
  {
    id: "karb-9",
    title: "دعاء قضاء الدين وكشف الهم",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ",
    transliteration: "Allahumma inni a'udhu bika mina al-hammi wa al-hazan, wa a'udhu bika mina al-'ajzi wa al-kasal...",
    meaning: "اللهم إني أعوذ بك من الهم والحزن والعجز والكسل والجبن والبخل وغلبة الدين وقهر الرجال",
    source: "صحيح البخاري: ٢٨٩٣",
    category: "الكرب والهم",
    occasion: "يُقال صباحاً ومساءً وعند الهم والحزن",
    virtue: "جامع لكل أسباب الضعف الداخلي والضغوط الخارجية",
  },
  {
    id: "karb-10",
    title: "دعاء فرج الكرب بالتوحيد",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ",
    transliteration: "La ilaha illa-llahu al-'azim al-halim, la ilaha illa-llahu rabbu al-'arshi al-'azim, la ilaha illa-llahu rabbu as-samawati wa rabbu al-ard wa rabbu al-'arshi al-karim",
    meaning: "لا إله إلا الله العظيم الحليم، لا إله إلا الله رب العرش العظيم، لا إله إلا الله رب السماوات ورب الأرض ورب العرش الكريم",
    source: "متفق عليه: البخاري ٦٣٤٦، مسلم ٢٧٣٠",
    category: "الكرب والهم",
    occasion: "عند الكرب والضيق الشديد",
    virtue: "دعاء الكرب الذي يُفرِّج الكروب ببركة التوحيد الخالص",
  },
  /* ─── إضافات الدعاء العام ─── */
  {
    id: "du-8",
    title: "دعاء طلب الثبات على الهداية",
    arabic: "يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ",
    transliteration: "Ya Muqallibal-qulub, thabbit qalbi 'ala dinik",
    meaning: "يا مقلِّب القلوب ثبِّت قلبي على دينك",
    source: "الترمذي: ٣٥٢٢، صحيح",
    category: "الدعاء العام",
    occasion: "يُكثر منه في كل وقت لا سيما عند الفتن وضعف الإيمان",
    virtue: "كان النبي ﷺ يُكثر من هذا الدعاء",
  },
  {
    id: "du-9",
    title: "دعاء التوكل والكفاية",
    arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
    transliteration: "Hasbunallah wa ni'mal-Wakil",
    meaning: "حسبنا الله ونعم الوكيل",
    source: "رواه البخاري عن ابن عباس، وهو من القرآن: آل عمران ١٧٣",
    category: "الدعاء العام",
    occasion: "عند مواجهة أمر صعب أو تهديد أو ضيق",
    virtue: "قالها إبراهيم ﷺ حين أُلقي في النار، وقالها النبي ﷺ حين قيل له: إن الناس قد جمعوا لكم",
  },
  {
    id: "du-10",
    title: "دعاء الاستعاذة الجامعة",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِرِضَاكَ مِنْ سَخَطِكَ، وَبِمُعَافَاتِكَ مِنْ عُقُوبَتِكَ، وَأَعُوذُ بِكَ مِنْكَ، لَا أُحْصِي ثَنَاءً عَلَيْكَ أَنْتَ كَمَا أَثْنَيْتَ عَلَى نَفْسِكَ",
    transliteration: "Allahumma inni a'udhu bi-ridaka min sakhatik, wa bi-mu'afatika min 'uqubatik, wa a'udhu bika mink, la uhsi thana'an 'alayka anta kama athnayta 'ala nafsik",
    meaning: "اللهم إني أعوذ برضاك من سخطك وبمعافاتك من عقوبتك وأعوذ بك منك، لا أحصي ثناءً عليك أنت كما أثنيت على نفسك",
    source: "صحيح مسلم: ٤٨٦",
    category: "الدعاء العام",
    occasion: "دعاء جامع يُقال في أي وقت لا سيما في السجود",
    virtue: "كان ﷺ يقوله في السجود وهو من أجلِّ الأدعية المأثورة",
  },
  /* ── الأكل والشرب ── */
  {
    id: "akl-6",
    title: "دعاء الشرب",
    arabic: "بِسْمِ اللَّهِ",
    transliteration: "Bismillah",
    meaning: "التسمية عند الشرب سنة مؤكدة كالتسمية عند الأكل",
    source: "مسلم: ٢٠٢٢",
    category: "الأكل والشرب",
    occasion: "قبل الشرب",
    virtue: "من سنن النبي ﷺ التسمية عند الشرب والحمد بعده",
  },
  {
    id: "akl-7",
    title: "دعاء الحمد بعد الشرب",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ",
    transliteration: "Alhamdu lillahillathi at'amana wa saqana wa ja'alana muslimin",
    meaning: "الحمد لله الذي أطعمنا وسقانا وجعلنا مسلمين",
    source: "أبو داود: ٣٨٥٠، صحيح",
    category: "الأكل والشرب",
    occasion: "بعد الفراغ من الطعام والشراب",
    virtue: "دعاء جامع يشمل الشكر على نعمة الطعام والإسلام معاً",
  },
  {
    id: "akl-8",
    title: "دعاء صاحب الطعام للضيف",
    arabic: "أَكَلَ طَعَامَكُمُ الْأَبْرَارُ، وَصَلَّتْ عَلَيْكُمُ الْمَلَائِكَةُ، وَأَفْطَرَ عِنْدَكُمُ الصَّائِمُونَ",
    transliteration: "Akala ta'amakum al-abrar, wa sallat 'alaykum al-mala'ikah, wa aftara 'indakum as-sa'imun",
    meaning: "أكل طعامكم الأبرار وصلّت عليكم الملائكة وأفطر عندكم الصائمون",
    source: "أبو داود: ٣٨٥٤، حسن صحيح",
    category: "الأكل والشرب",
    occasion: "يقوله صاحب الطعام للضيف الذي أكل عنده أو أفطر",
    virtue: "دعاء يُبرك على صاحب الطعام ويجمع الثناء والدعاء",
  },
  /* ── السفر ── */
  {
    id: "safar-7",
    title: "دعاء الرجوع من السفر",
    arabic: "آيِبُونَ تَائِبُونَ عَابِدُونَ، لِرَبِّنَا حَامِدُونَ",
    transliteration: "Ayibuna ta'ibuna 'abiduna, li-rabbina hamidun",
    meaning: "راجعون تائبون عابدون لربنا حامدون",
    source: "البخاري: ١٧٩٧",
    category: "السفر",
    occasion: "عند العودة من السفر",
    virtue: "كان النبي ﷺ يقوله كلما رجع من سفر",
  },
  {
    id: "safar-8",
    title: "دعاء المسافر لأهله",
    arabic: "أَسْتَوْدِعُكُمُ اللَّهَ الَّذِي لَا تَضِيعُ وَدَائِعُهُ",
    transliteration: "Astawdi'ukum Allaha alladhi la tadi'u wada'i'uh",
    meaning: "أودعكم الله الذي لا تضيع ودائعه",
    source: "ابن ماجه: ٢٨٢٥، صحيح",
    category: "السفر",
    occasion: "يقوله المسافر لأهله عند وداعهم",
    virtue: "دعاء الوداع للأهل قبل السفر استحفاظ بهم عند الله",
  },
  /* ─── الصباح والمساء — إضافي ─── */
  {
    id: "sabah-9",
    title: "دعاء حفظ العقل والدين",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الهَمِّ وَالحَزَنِ، وَأَعُوذُ بِكَ مِنَ العَجْزِ وَالكَسَلِ، وَأَعُوذُ بِكَ مِنَ الجُبْنِ وَالبُخْلِ، وَأَعُوذُ بِكَ مِنَ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ",
    transliteration: "Allahumma inni a'udhu bika min al-hamm wal-hazan, wa a'udhu bika min al-'ajz wal-kasal, wa a'udhu bika min al-jubn wal-bukhl, wa a'udhu bika min ghalabat al-dayn wa qahr al-rijal",
    meaning: "اللهم أعوذ بك من الهم والحزن، والعجز والكسل، والجبن والبخل، وغلبة الدين وقهر الرجال",
    source: "البخاري: ٦٣٦٩",
    category: "الصباح والمساء",
    occasion: "من أذكار الصباح والمساء",
    virtue: "يُقال في الصباح والمساء للحفظ من آفات الدنيا",
  },
  {
    id: "sabah-10",
    title: "دعاء العافية في الدنيا والآخرة",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ العَفْوَ وَالعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ",
    transliteration: "Allahumma inni as'aluka al-'afwa wal-'afiyah fi al-dunya wal-akhirah",
    meaning: "اللهم إني أسألك العفو والعافية في الدنيا والآخرة",
    source: "أبو داود: ٥٠٧٤، ابن ماجه: ٣٨٧١، صحيح",
    category: "الصباح والمساء",
    occasion: "دعاء الصباح والمساء",
    virtue: "قال ﷺ: لم يُسأل الله شيء أحبّ إليه من العافية",
  },
  {
    id: "sabah-11",
    title: "حديث ذكر الصباح الجامع",
    arabic: "أَصْبَحْنَا وَأَصْبَحَ المُلْكُ لِلَّهِ، وَالحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ وَهُوَ عَلَى كُلِّ شَيءٍ قَدِيرٌ",
    transliteration: "Asbahna wa asbahal-mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah, lahul-mulku walahul-hamd wahuwa 'ala kulli shay'in qadir",
    meaning: "أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير",
    source: "مسلم: ٢٧٢٣",
    category: "الصباح والمساء",
    occasion: "أوّل الصباح",
    virtue: "ذكر جامع يُفتتح به اليوم بتوحيد الله وحمده",
  },
  /* ─── النوم واليقظة — إضافي ─── */
  {
    id: "nawm-10",
    title: "دعاء استيقظ من الليل مُفزَّعاً",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ غَضَبِهِ وَعِقَابِهِ وَشَرِّ عِبَادِهِ وَمِنْ هَمَزَاتِ الشَّيَاطِينِ وَأَنْ يَحْضُرُونِ",
    transliteration: "A'udhu bi kalimatillahi al-tammati min ghadabihi wa 'iqabihi wa sharri 'ibadihi wa min hamazat al-shayatin wa an yahdhurun",
    meaning: "أعوذ بكلمات الله التامات من غضبه وعقابه وشر عباده ومن همزات الشياطين وأن يحضرون",
    source: "أبو داود: ٣٨٩٣، الترمذي: ٣٥٢٨، صحيح",
    category: "النوم واليقظة",
    occasion: "عند الاستيقاظ من المنام خائفاً أو مفزوعاً",
    virtue: "يقيه من الشيطان ويرد عنه الفزع عند اليقظة",
  },
  {
    id: "nawm-11",
    title: "دعاء الهداية في المنام",
    arabic: "اللَّهُمَّ رَبَّ جِبْرَائِيلَ وَمِيكَائِيلَ وَإِسْرَافِيلَ، فَاطِرَ السَّمَاوَاتِ وَالأَرْضِ، عَالِمَ الغَيْبِ وَالشَّهَادَةِ، أَنْتَ تَحْكُمُ بَيْنَ عِبَادِكَ فِيمَا كَانُوا فِيهِ يَخْتَلِفُونَ، اهْدِنِي لِمَا اخْتُلِفَ فِيهِ مِنَ الحَقِّ بِإِذْنِكَ",
    transliteration: "Allahumma Rabba Jibra'il wa Mika'il wa Israfil, fatira al-samawati wal-ard, 'alima al-ghaybi wal-shahadah, anta tahkumu bayna 'ibadika fima kanu fihi yakhtalifun, ihdini lima ukhtulifa fihi min al-haqq bi-idhnk",
    meaning: "اللهم رب جبريل وميكائيل وإسرافيل، فاطر السماوات والأرض، عالم الغيب والشهادة، أنت تحكم بين عبادك فيما كانوا فيه يختلفون، اهدني لما اختلف فيه من الحق بإذنك",
    source: "مسلم: ٧٧٠",
    category: "النوم واليقظة",
    occasion: "عند القيام من الليل للتهجد أو الاستيقاظ",
    virtue: "من دعاء النبي ﷺ عند قيام الليل",
  },
  /* ─── الكرب والهم — إضافي ─── */
  {
    id: "karb-11",
    title: "دعاء الفرج عند اشتداد الكرب",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ",
    transliteration: "La ilaha illallahu al-'Adhim al-Halim, la ilaha illallahu Rabbu al-'Arsh al-'Adhim, la ilaha illallahu Rabbu al-samawati wa Rabbu al-ard wa Rabbu al-'Arsh al-Karim",
    meaning: "لا إله إلا الله العظيم الحليم، لا إله إلا الله رب العرش العظيم، لا إله إلا الله رب السماوات ورب الأرض ورب العرش الكريم",
    source: "البخاري: ٦٣٤٦، مسلم: ٢٧٣٠",
    category: "الكرب والهم",
    occasion: "عند اشتداد الكرب والضيق",
    virtue: "كان النبي ﷺ يدعو بهذا الدعاء عند الكرب — ذكر لعظمة الله يُذهب الهم",
  },
  /* ─── الصلاة — إضافي ─── */
  {
    id: "salah-11",
    title: "دعاء الاستفتاح في التهجد",
    arabic: "اللَّهُمَّ لَكَ الْحَمْدُ أَنْتَ نُورُ السَّمَاوَاتِ وَالأَرْضِ وَمَنْ فِيهِنَّ، وَلَكَ الْحَمْدُ أَنْتَ قَيِّمُ السَّمَاوَاتِ وَالأَرْضِ وَمَنْ فِيهِنَّ، وَلَكَ الْحَمْدُ أَنْتَ الْحَقُّ وَوَعْدُكَ الْحَقُّ",
    transliteration: "Allahumma laka al-hamd, anta nuru al-samawati wal-ard wa man fihinna, wa laka al-hamd anta qayyimu al-samawati wal-ard wa man fihinna, wa laka al-hamd anta al-haqq wa wa'duka al-haqq",
    meaning: "اللهم لك الحمد أنت نور السماوات والأرض ومن فيهن، ولك الحمد أنت قيوم السماوات والأرض ومن فيهن، ولك الحمد أنت الحق ووعدك الحق",
    source: "البخاري: ١١٢٠، مسلم: ٧٦٩",
    category: "الصلاة",
    occasion: "افتتاح صلاة الليل والتهجد",
    virtue: "من دعاء النبي ﷺ حين يقوم إلى صلاة الليل — يجمع حمد الله وتوحيده",
  },
  /* ─── السفر — إضافي ─── */
  {
    id: "safar-9",
    title: "دعاء ركوب الدابة أو المركبة",
    arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ",
    transliteration: "Subhana alladhi sakhkhara lana hadha wa ma kunna lahu muqrinin, wa inna ila rabbina lamunqalibun",
    meaning: "سبحان الذي سخّر لنا هذا وما كنا له مقرنين، وإنا إلى ربنا لمنقلبون",
    source: "أبو داود: ٢٦٠٢، الترمذي: ٣٤٤٦، صحيح",
    category: "السفر",
    occasion: "عند ركوب الدابة أو السيارة أو أي مركبة",
    virtue: "دعاء قرآني (الزخرف: ١٣-١٤) يُذكّر بنعمة التسخير ويستحضر الآخرة",
  },
  /* ─── الدعاء العام — إضافي ─── */
  {
    id: "du-11",
    title: "دعاء جامع للخير كله",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى",
    transliteration: "Allahumma inni as'aluka al-huda wat-tuqa wal-'afafa wal-ghina",
    meaning: "اللهم إني أسألك الهدى والتقى والعفاف والغنى",
    source: "مسلم: ٢٧٢١",
    category: "الدعاء العام",
    occasion: "في أي وقت — دعاء جامع لخيري الدنيا والدين",
    virtue: "قال ﷺ هذا الدعاء يجمع أربعة أصول: هداية القلب، وتقوى الله، وعفة النفس، والاستغناء عن الناس",
  },
  /* ─── الأكل والشرب — إضافي ─── */
  {
    id: "akl-9",
    title: "دعاء الحمد على الطعام بعد الأكل",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ",
    transliteration: "Alhamdu lillahi alladhi at'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah",
    meaning: "الحمد لله الذي أطعمني هذا ورزقنيه من غير حول مني ولا قوة",
    source: "أبو داود: ٤٠٢٣، الترمذي: ٣٤٥٨، صحيح",
    category: "الأكل والشرب",
    occasion: "بعد الفراغ من الطعام",
    virtue: "من قاله بعد طعامه غُفر له ما تقدم من ذنبه — يقرّ بأن الرزق من الله لا بحول العبد",
  },
];

/* ─── الصفحة ─── */
export default function DuasPage() {
  const [category, setCategory] = useState("الكل");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/duas",
      title: "الأدعية الشرعية، أدعية من القرآن والسنة | مجالس",
      description: "مكتبة الأدعية الشرعية الموثقة: أدعية الصباح والمساء والصلاة والسفر والكرب مع المعنى والمصدر.",
      keywords: ["أدعية", "دعاء", "أذكار", "دعاء الكرب", "دعاء الصباح", "دعاء المساء"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "الأدعية الشرعية الموثقة",
          description: "مكتبة الأدعية الشرعية من القرآن والسنة مع المعنى والمصدر",
          numberOfItems: DUAS.length,
          itemListElement: DUAS.slice(0, 20).map((d, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: d.title,
            url: `https://majlisilm.com/duas#${d.id}`,
          })),
        },
      ],
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim();
    return DUAS.filter((d) => {
      const matchCat = category === "الكل" || d.category === category;
      const matchQ = arabicMatchAny([d.title, d.arabic, d.occasion], q);
      return matchCat && matchQ;
    });
  }, [category, search]);

  const copyDua = async (dua: DuaEntry) => {
    try {
      await navigator.clipboard.writeText(dua.arabic);
      setCopied(dua.id);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="page-shell duas-page">
      {/* ═══ Hero ═══ */}
      <div className="duas-hero">
        <div className="duas-hero__bismillah">وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ</div>
        <h1 className="duas-hero__title">الأدعية الشرعية</h1>
        <p className="duas-hero__sub">
          أدعية موثقة من القرآن الكريم والسنة النبوية الصحيحة
        </p>
        <div className="duas-hero__stats">
          <span>{DUAS.length} دعاء</span>
          <span className="duas-dot">·</span>
          <span>{CATEGORIES.length - 1} تصنيفاً</span>
          <span className="duas-dot">·</span>
          <span>مصادر موثقة</span>
        </div>
      </div>

      {/* ═══ فلاتر ═══ */}
      <div className="duas-controls">
        <div className="duas-search-wrap">
          <Search size={15} className="duas-search-icon" aria-hidden="true" />
          <input
            className="duas-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في الأدعية..."
            aria-label="بحث"
          />
        </div>
        <div className="duas-cats">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`duas-cat${category === c ? " duas-cat--active" : ""}`}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ شبكة الأدعية ═══ */}
      {filtered.length === 0 ? (
        <p className="duas-empty">لا توجد أدعية مطابقة.</p>
      ) : (
        <div className="duas-list">
          {filtered.map((dua) => {
            const open = expanded === dua.id;
            return (
              <article key={dua.id} className={`dua-card${open ? " dua-card--open" : ""}`}>
                <div className="dua-card__head">
                  <button
                    type="button"
                    className="dua-card__title-btn"
                    onClick={() => setExpanded(open ? null : dua.id)}
                    aria-expanded={open}
                  >
                    <BookOpen size={14} className="dua-card__icon" aria-hidden="true" />
                    <span className="dua-card__title">{dua.title}</span>
                    <span className="dua-card__cat">{dua.category}</span>
                  </button>
                  <button
                    type="button"
                    className="dua-card__copy"
                    onClick={() => copyDua(dua)}
                    aria-label="نسخ الدعاء"
                    title="نسخ"
                  >
                    {copied === dua.id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                <p className="dua-card__arabic">{dua.arabic}</p>

                {open && (
                  <div className="dua-card__body">
                    <div className="dua-detail dua-detail--trans">
                      <span className="dua-detail__label">النطق</span>
                      <p className="dua-detail__text dua-detail__text--trans">{dua.transliteration}</p>
                    </div>
                    <div className="dua-detail">
                      <span className="dua-detail__label">المعنى</span>
                      <p className="dua-detail__text">{dua.meaning}</p>
                    </div>
                    <div className="dua-detail dua-detail--meta">
                      <div>
                        <span className="dua-detail__label">المصدر</span>
                        <p className="dua-detail__text">{dua.source}</p>
                      </div>
                      <div>
                        <span className="dua-detail__label">متى يُقال</span>
                        <p className="dua-detail__text">{dua.occasion}</p>
                      </div>
                    </div>
                    {dua.virtue && (
                      <div className="dua-virtue">
                        <Star size={12} aria-hidden="true" />
                        <p>{dua.virtue}</p>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <SectionQuiz
        categoryId="hadith"
        title="اختبر معلوماتك في الحديث الشريف"
        count={4}
      />

      <div className="twh-share">
        <ShareButtons title="الأدعية الشرعية — المجلس العلمي" url="https://majlisilm.com/duas" />
      </div>
    </div>
  );
}
