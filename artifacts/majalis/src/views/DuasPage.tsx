import { useEffect, useMemo, useState } from "react";
import { Search, Copy, Check, BookOpen, Star } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";

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
    occasion: "سيد الاستغفار — صباحاً ومساءً",
    virtue: "من قالها إيماناً وهو موقن بها صباحاً فمات في يومه دخل الجنة",
  },
  {
    id: "masa-1",
    title: "أذكار المساء — الآية الكريمة",
    arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ",
    transliteration: "Allahu la ilaha illa huwal-hayyul-qayyum, la ta'khudhuhu sinatun wa la nawm",
    meaning: "آية الكرسي — سيدة آي القرآن",
    source: "البقرة: 255 — السنة النبوية",
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
    source: "سنن أبي داود — صحيح",
    category: "الصلاة",
    occasion: "في بداية الصلاة بعد تكبيرة الإحرام",
  },
  {
    id: "salah-2",
    title: "دعاء الركوع",
    arabic: "سُبْحَانَ رَبِّيَ الْعَظِيمِ",
    transliteration: "Subhana rabbiyal-azim",
    meaning: "سبحان ربي العظيم — تسبيح في الركوع",
    source: "متفق عليه",
    category: "الصلاة",
    occasion: "يقال في الركوع ثلاث مرات على الأقل",
  },
  {
    id: "salah-3",
    title: "دعاء السجود",
    arabic: "سُبْحَانَ رَبِّيَ الْأَعْلَى",
    transliteration: "Subhana rabbiyal-a'la",
    meaning: "سبحان ربي الأعلى — تسبيح في السجود",
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
    meaning: "بسم الله — تسمية عند بدء الطعام",
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
    source: "سنن الترمذي — صحيح",
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
    title: "دعاء السفر — تكبير المسافر",
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
    source: "رواه أحمد — صحيح الجامع",
    category: "الكرب والهم",
    occasion: "عند الهم والحزن",
    virtue: "ما أصاب عبداً قط هم ولا حزن فقالها إلا أذهب الله همه وأبدله فرحاً",
  },
  {
    id: "am-1",
    title: "أفضل دعاء — جوامع الكلم",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
    meaning: "ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار",
    source: "البقرة: 201 — متفق عليه",
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
    source: "رواه الترمذي — صحيح",
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
    title: "دعاء رمضان — ليلة القدر",
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
      title: "الأدعية الشرعية — أدعية من القرآن والسنة | مجالس",
      description: "مكتبة الأدعية الشرعية الموثقة: أدعية الصباح والمساء والصلاة والسفر والكرب مع المعنى والمصدر.",
      keywords: ["أدعية", "دعاء", "أذكار", "دعاء الكرب", "دعاء الصباح", "دعاء المساء"],
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim();
    return DUAS.filter((d) => {
      const matchCat = category === "الكل" || d.category === category;
      const matchQ = !q || d.title.includes(q) || d.arabic.includes(q) || d.occasion.includes(q);
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
    </div>
  );
}
