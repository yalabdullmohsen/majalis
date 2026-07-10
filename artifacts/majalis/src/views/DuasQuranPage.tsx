import { useEffect, useState } from "react";
import { applyPageSeo } from "../lib/seo";
import { ShareButtons } from "@/components/ContentActions";


type DuaCategory = "الكل" | "الأنبياء" | "الرزق والهداية" | "المغفرة" | "الأسرة" | "الدنيا والآخرة" | "الصبر والنصر";

interface QuranDua {
  id: string;
  arabic: string;
  ref: string;
  name: string;
  category: DuaCategory[];
  context: string;
  benefitTags: string[];
  prophet?: string;
}

const DUAS: QuranDua[] = [
  {
    id: "fatiha",
    arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
    ref: "الفاتحة: 6-7",
    name: "دعاء الهداية",
    category: ["الكل", "الرزق والهداية"],
    context: "آخر دعاء في أم الكتاب، يُقرأ في كل ركعة، الله يقول لعبده: هذا لعبدي ولعبدي ما سأل",
    benefitTags: ["الهداية", "طريق النجاة", "يومياً"],
  },
  {
    id: "baqara-rabana",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    ref: "البقرة: 201",
    name: "سيد الأدعية",
    category: ["الكل", "الدنيا والآخرة"],
    context: "كان النبي ﷺ يُكثر من هذا الدعاء، قال أنس: كانت أكثر دعاء النبي ﷺ هذه الآية",
    benefitTags: ["جامع", "دنيا وآخرة", "يومياً"],
  },
  {
    id: "baqara-tawba",
    arabic: "رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
    ref: "الأعراف: 23",
    name: "دعاء آدم وحواء",
    category: ["الكل", "المغفرة", "الأنبياء"],
    context: "دعاء آدم وحواء بعد نزولهما من الجنة، دعاء الاعتراف بالذنب والتوسل بالمغفرة",
    benefitTags: ["مغفرة", "توبة", "اعتراف"],
    prophet: "آدم ﵇",
  },
  {
    id: "ibrahim-dhurriyya",
    arabic: "رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي ۚ رَبَّنَا وَتَقَبَّلْ دُعَاءِ",
    ref: "إبراهيم: 40",
    name: "دعاء إبراهيم للذرية",
    category: ["الكل", "الأسرة", "الأنبياء"],
    context: "دعاء إبراهيم ﵇ لنفسه ولذريته بإقامة الصلاة، درس في الاهتمام بأبناء وأحفاد المؤمن",
    benefitTags: ["الأسرة", "الصلاة", "الذرية"],
    prophet: "إبراهيم ﵇",
  },
  {
    id: "musa-nur",
    arabic: "رَبِّ اشْرَحْ لِي صَدْرِي ۝ وَيَسِّرْ لِي أَمْرِي ۝ وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي ۝ يَفْقَهُوا قَوْلِي",
    ref: "طه: 25-28",
    name: "دعاء موسى قبل الرسالة",
    category: ["الكل", "الرزق والهداية", "الأنبياء"],
    context: "دعاء موسى ﵇ حين بعثه الله لفرعون، دعاء العلماء وأهل الدعوة والمتحدثين",
    benefitTags: ["علم", "فصاحة", "تيسير"],
    prophet: "موسى ﵇",
  },
  {
    id: "ayyub-daaf",
    arabic: "رَبِّ إِنِّي مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ",
    ref: "الأنبياء: 83",
    name: "دعاء أيوب في البلاء",
    category: ["الكل", "الصبر والنصر", "الأنبياء"],
    context: "دعاء أيوب ﵇ في شدة مرضه، دعاء يُستحب في المرض والضيق. قال الله: فاستجبنا له فكشفنا ما به من ضر",
    benefitTags: ["مرض", "بلاء", "فرج"],
    prophet: "أيوب ﵇",
  },
  {
    id: "yunus-hoot",
    arabic: "لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ",
    ref: "الأنبياء: 87",
    name: "دعاء يونس في بطن الحوت",
    category: ["الكل", "المغفرة", "الصبر والنصر", "الأنبياء"],
    context: "قاله يونس ﵇ في ظلمات ثلاث، روى النبي ﷺ أنه ما دعا به مكروب إلا فرّج الله عنه",
    benefitTags: ["كرب", "ضيق", "مستجاب"],
    prophet: "يونس ﵇",
  },
  {
    id: "zakariyya-walad",
    arabic: "رَبِّ لَا تَذَرْنِي فَرْدًا وَأَنتَ خَيْرُ الْوَارِثِينَ",
    ref: "الأنبياء: 89",
    name: "دعاء زكريا للنسل",
    category: ["الكل", "الأسرة", "الأنبياء"],
    context: "دعاء زكريا ﵇ بعد أن شاخ، فاستجاب الله له ووهب له يحيى ﵇ وهو شيخ عقيم الامرأة",
    benefitTags: ["ذرية", "أسرة", "نسل"],
    prophet: "زكريا ﵇",
  },
  {
    id: "suleiman-shukr",
    arabic: "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَىٰ وَالِدَيَّ وَأَنْ أَعْمَلَ صَالِحًا تَرْضَاهُ وَأَدْخِلْنِي بِرَحْمَتِكَ فِي عِبَادِكَ الصَّالِحِينَ",
    ref: "النمل: 19",
    name: "دعاء سليمان عند النعمة",
    category: ["الكل", "الرزق والهداية", "الأنبياء"],
    context: "قاله سليمان ﵇ حين سمع كلام النملة، دعاء الشكر على النعم وطلب الصلاح والدخول في الصالحين",
    benefitTags: ["شكر", "صلاح", "والدان"],
    prophet: "سليمان ﵇",
  },
  {
    id: "muminun-ghufran",
    arabic: "رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ وَلَا تَجْعَلْ فِي قُلُوبِنَا غِلًّا لِّلَّذِينَ آمَنُوا رَبَّنَا إِنَّكَ رَءُوفٌ رَّحِيمٌ",
    ref: "الحشر: 10",
    name: "دعاء المؤمنين للسابقين",
    category: ["الكل", "المغفرة"],
    context: "دعاء الإخوة في الإيمان، من قاله غُفر له ولإخوانه المؤمنين وطهُر قلبه من الغلّ والحسد",
    benefitTags: ["مغفرة", "إخوة", "طهارة القلب"],
  },
  {
    id: "baqara-amantu",
    arabic: "رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا",
    ref: "البقرة: 286",
    name: "خاتمة البقرة",
    category: ["الكل", "المغفرة", "الدنيا والآخرة"],
    context: "قال النبي ﷺ: من قرأ الآيتين من آخر سورة البقرة في ليلة كفتاه، دعاء العفو والرفع والنصر",
    benefitTags: ["ليلاً", "حماية", "كفاية"],
  },
  {
    id: "kahf-rahmatan",
    arabic: "رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا",
    ref: "الكهف: 10",
    name: "دعاء أصحاب الكهف",
    category: ["الكل", "الرزق والهداية", "الصبر والنصر"],
    context: "دعاء الفتية المؤمنين حين لجأوا إلى الكهف، دعاء طلب الهداية والتوفيق للأمر الرشيد",
    benefitTags: ["حماية", "توفيق", "هداية"],
  },
  {
    id: "al-imran-thabaat",
    arabic: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً إِنَّكَ أَنتَ الْوَهَّابُ",
    ref: "آل عمران: 8",
    name: "دعاء الثبات على الهداية",
    category: ["الكل", "الرزق والهداية"],
    context: "دعاء الراسخين في العلم من المؤمنين، يُقرأ كثيراً في أوقات الفتن طلباً للثبات",
    benefitTags: ["ثبات", "هداية", "فتنة"],
  },
  {
    id: "al-imran-nasr",
    arabic: "رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَإِسْرَافَنَا فِي أَمْرِنَا وَثَبِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ",
    ref: "آل عمران: 147",
    name: "دعاء المؤمنين طلب النصر",
    category: ["الكل", "المغفرة", "الصبر والنصر"],
    context: "قاله المؤمنون في المعارك، دعاء يجمع المغفرة والثبات والنصر على الصعوبات",
    benefitTags: ["نصر", "مغفرة", "ثبات"],
  },
  {
    id: "ibrahim-walid",
    arabic: "رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ",
    ref: "إبراهيم: 41",
    name: "دعاء إبراهيم للوالدين والمؤمنين",
    category: ["الكل", "المغفرة", "الأسرة", "الأنبياء"],
    context: "دعاء إبراهيم ﵇ للوالدين وعموم المؤمنين، أفضل دعاء لتكريم الوالدين بعد مماتهما",
    benefitTags: ["والدان", "مغفرة", "يوم القيامة"],
    prophet: "إبراهيم ﵇",
  },
  {
    id: "musa-faqir",
    arabic: "رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ",
    ref: "القصص: 24",
    name: "دعاء موسى في حاجته",
    category: ["الكل", "الرزق والهداية", "الأنبياء"],
    context: "قاله موسى ﵇ في مدين حين لم يكن له طعام وهو يحتاج، دعاء المضطر المتوكل على الله",
    benefitTags: ["رزق", "حاجة", "فقر"],
    prophet: "موسى ﵇",
  },
  {
    id: "yusuf-tawaffa",
    arabic: "رَبِّ قَدْ آتَيْتَنِي مِنَ الْمُلْكِ وَعَلَّمْتَنِي مِن تَأْوِيلِ الْأَحَادِيثِ ۚ فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ أَنتَ وَلِيِّي فِي الدُّنْيَا وَالْآخِرَةِ تَوَفَّنِي مُسْلِمًا وَأَلْحِقْنِي بِالصَّالِحِينَ",
    ref: "يوسف: 101",
    name: "دعاء يوسف الشامل",
    category: ["الكل", "المغفرة", "الدنيا والآخرة", "الأنبياء"],
    context: "قاله يوسف ﵇ بعد أن لمَّ الله شمله وجمعه بأهله، دعاء حسن الخاتمة على الإسلام",
    benefitTags: ["خاتمة", "إسلام", "صالحين"],
    prophet: "يوسف ﵇",
  },
  {
    id: "nuh-safina",
    arabic: "بِسْمِ اللَّهِ مَجْرَاهَا وَمُرْسَاهَا إِنَّ رَبِّي لَغَفُورٌ رَّحِيمٌ",
    ref: "هود: 41",
    name: "دعاء نوح عند الانطلاق",
    category: ["الكل", "الصبر والنصر", "الأنبياء"],
    context: "قاله نوح ﵇ حين ركب السفينة، يُقرأ عند الركوب في السيارة أو السفينة أو الطائرة",
    benefitTags: ["سفر", "حماية", "توكل"],
    prophet: "نوح ﵇",
  },
  {
    id: "furqan-dhurriyya",
    arabic: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
    ref: "الفرقان: 74",
    name: "دعاء عباد الرحمن للأسرة",
    category: ["الكل", "الأسرة"],
    context: "دعاء عباد الرحمن في القرآن، يُعدّ من أجمع الأدعية للأسرة: الزوجة والأولاد وطلب القيادة الصالحة",
    benefitTags: ["أسرة", "ذرية", "قيادة"],
  },
  {
    id: "naml-sulayman",
    arabic: "رَبِّ اغْفِرْ لِي وَهَبْ لِي مُلْكًا لَّا يَنبَغِي لِأَحَدٍ مِّن بَعْدِي إِنَّكَ أَنتَ الْوَهَّابُ",
    ref: "ص: 35",
    name: "دعاء سليمان طلب الملك",
    category: ["الكل", "الرزق والهداية", "الأنبياء"],
    context: "دعاء سليمان ﵇، قاله بعد ابتلائه، يُستشهد به في طلب ما لا يملكه أحد سواك",
    benefitTags: ["رزق", "مكانة", "هبة"],
    prophet: "سليمان ﵇",
  },
  {
    id: "baqara-naseer",
    arabic: "رَبَّنَا لَا تَجْعَلْنَا فِتْنَةً لِّلْقَوْمِ الظَّالِمِينَ وَنَجِّنَا بِرَحْمَتِكَ مِنَ الْقَوْمِ الْكَافِرِينَ",
    ref: "يونس: 85-86",
    name: "دعاء المؤمنين طلب النجاة من الظالمين",
    category: ["الكل", "الصبر والنصر"],
    context: "دعاء موسى وقومه حين آمنوا في أشد ظروف الاستضعاف، يُقرأ عند المظلمة وطلب الفرج",
    benefitTags: ["ظلم", "نجاة", "فرج"],
  },
];

const CATEGORIES: DuaCategory[] = ["الكل", "الأنبياء", "الرزق والهداية", "المغفرة", "الأسرة", "الدنيا والآخرة", "الصبر والنصر"];

export default function DuasQuranPage() {
  useEffect(() => {
      applyPageSeo({
      path: "/duas-quran",
      title: "أدعية القرآن الكريم، المجلس العلمي",
      description: "أجمل الأدعية المأثورة من كتاب الله: دعاء الأنبياء والمؤمنين في القرآن الكريم",
      keywords: ["أدعية القرآن", "دعاء في القرآن", "دعاء الأنبياء", "أفضل الأدعية", "دعاء قرآني"],
    });
  }, []);

  const [activeCat, setActiveCat] = useState<DuaCategory>("الكل");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = DUAS.filter((d) => {
    const matchCat = activeCat === "الكل" || d.category.includes(activeCat);
    const matchSearch = !search.trim() || d.name.includes(search) || d.arabic.includes(search) || d.ref.includes(search);
    return matchCat && matchSearch;
  });

  return (
    <main className="dq-page" dir="rtl">
      {/* hero */}
      <section className="dq-hero">
        <div className="dq-hero__badge">الأدعية القرآنية</div>
        <h1 className="dq-hero__title">أدعية القرآن الكريم</h1>
        <p className="dq-hero__sub">
          أجمل الأدعية المأثورة من كلام الله، دعاء الأنبياء والمؤمنين في كتاب الله المبين
        </p>

        <div className="dq-hero-ayah">
          <p className="dq-hero-ayah__text">
            وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ
          </p>
          <cite className="dq-hero-ayah__ref">البقرة: 186</cite>
        </div>
      </section>

      <div className="dq-body">
        {/* search */}
        <input
          type="search"
          className="dq-search"
          placeholder="ابحث بالاسم أو الآية..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* categories */}
        <div className="dq-cats">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`dq-cat-btn${activeCat === cat ? " dq-cat-btn--active" : ""}`}
              onClick={() => setActiveCat(cat)}
              aria-pressed={activeCat === cat}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="dq-count">{filtered.length} دعاء</p>

        {/* duas list */}
        <div className="dq-list">
          {filtered.map((d) => {
            const isOpen = openId === d.id;
            return (
              <article key={d.id} className={`dq-card${isOpen ? " dq-card--open" : ""}`}>
                <button
                  type="button"
                  className="dq-card__head"
                  onClick={() => setOpenId(isOpen ? null : d.id)}
                  aria-expanded={isOpen}
                >
                  <div className="dq-card__title-wrap">
                    <span className="dq-card__name">{d.name}</span>
                    <cite className="dq-card__ref">{d.ref}</cite>
                    {d.prophet && <span className="dq-card__prophet">{d.prophet}</span>}
                  </div>
                  <div className="dq-card__tags">
                    {d.benefitTags.slice(0, 2).map((t) => (
                      <span key={t} className="dq-tag">{t}</span>
                    ))}
                  </div>
                  <span className={`dq-chevron${isOpen ? " dq-chevron--open" : ""}`}>▾</span>
                </button>

                {/* الدعاء دائماً ظاهر */}
                <div className="dq-arabic-wrap">
                  <p className="dq-arabic">{d.arabic}</p>
                </div>

                {isOpen && (
                  <div className="dq-card__body">
                    <div className="dq-context-box">
                      <span className="dq-context-box__label">السياق والفائدة</span>
                      <p className="dq-context-box__text">{d.context}</p>
                    </div>
                    <div className="dq-all-tags">
                      {d.benefitTags.map((t) => (
                        <span key={t} className="dq-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="dq-empty">
            <span>🔍</span>
            <p>لا توجد نتائج مطابقة</p>
          </div>
        )}

        {/* adab dua */}
        <div className="dq-adab-box">
          <h2 className="dq-adab-box__title">آداب الدعاء</h2>
          <div className="dq-adab-grid">
            {[
              { icon: "🕌", text: "استقبال القبلة ورفع اليدين" },
              { icon: "🤲", text: "البدء بالحمد والثناء والصلاة على النبي ﷺ" },
              { icon: "💧", text: "الدعاء بقلب حاضر ويقين الإجابة" },
              { icon: "⏰", text: "اغتنام أوقات الإجابة (السحر، بين الأذان والإقامة، يوم الجمعة)" },
              { icon: "🚫", text: "اجتناب الحرام في المطعم والملبس والمشرب" },
              { icon: "🔄", text: "الإلحاح والتكرار دون استعجال الإجابة" },
            ].map((a) => (
              <div key={a.text} className="dq-adab-item">
                <span className="dq-adab-item__icon">{a.icon}</span>
                <span className="dq-adab-item__text">{a.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="twh-share">
          <ShareButtons title="أدعية القرآن الكريم — المجلس العلمي" url="https://majlisilm.com/duas-quran" />
        </div>

        {/* related */}
        <nav className="dq-related" aria-label="صفحات ذات صلة">
          <h2 className="dq-related__title">استكشف أيضاً</h2>
          <div className="dq-related__grid">
            {[
              { href: "/duas", label: "الأدعية الشرعية" },
              { href: "/adhkar", label: "الأذكار اليومية" },
              { href: "/daily-wird", label: "الورد اليومي" },
              { href: "/tawba", label: "التوبة والاستغفار" },
              { href: "/arbaeen-nawawi", label: "الأربعون النووية" },
              { href: "/fadail-aamal", label: "فضائل الأعمال" },
            ].map((r) => (
              <a key={r.href} href={r.href} className="dq-related__link">{r.label}</a>
            ))}
          </div>
        </nav>
      </div>
    </main>
  );
}
