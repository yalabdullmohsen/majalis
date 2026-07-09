import { useState } from "react";
import { applyPageSeo } from "../lib/seo";

applyPageSeo({
  path: "/fadail-aamal",
  title: "فضائل الأعمال — المجلس العلمي",
  description: "فضائل العبادات والأعمال الصالحة من الأحاديث النبوية الصحيحة",
  keywords: ["فضائل الأعمال", "فضل الصلاة", "فضل الصيام", "الأجر والثواب", "الأحاديث النبوية"],
});

interface Fadila {
  id: string;
  icon: string;
  title: string;
  text: string;
  source: string;
  grade: "sahih" | "hasan";
  category: string;
}

const CATEGORIES = ["الكل", "الصلاة", "الصيام", "القرآن", "الذكر والدعاء", "الصدقة", "الأخلاق", "متنوعة"];

const FADAIL: Fadila[] = [
  /* ── الصلاة ── */
  {
    id: "f1",
    icon: "🕌",
    category: "الصلاة",
    title: "فضل الصلوات الخمس",
    text: "أَرَأَيْتُمْ لَوْ أَنَّ نَهْرًا بِبَابِ أَحَدِكُمْ يَغْتَسِلُ مِنْهُ كُلَّ يَوْمٍ خَمْسًا مَا تَقُولُ ذَلِكَ يُبْقِي مِنْ دَرَنِهِ؟ قَالُوا: لَا يُبْقِي مِنْ دَرَنِهِ شَيْئًا. قَالَ: فَذَلِكَ مِثْلُ الصَّلَوَاتِ الْخَمْسِ يَمْحُو اللَّهُ بِهِنَّ الْخَطَايَا",
    source: "متفق عليه",
    grade: "sahih",
  },
  {
    id: "f2",
    icon: "🌄",
    category: "الصلاة",
    title: "فضل صلاة الفجر والعصر",
    text: "مَنْ صَلَّى الْبَرْدَيْنِ دَخَلَ الْجَنَّةَ",
    source: "متفق عليه",
    grade: "sahih",
  },
  {
    id: "f3",
    icon: "✨",
    category: "الصلاة",
    title: "فضل صلاة الجماعة",
    text: "صَلَاةُ الْجَمَاعَةِ تَفْضُلُ صَلَاةَ الْفَذِّ بِسَبْعٍ وَعِشْرِينَ دَرَجَةً",
    source: "متفق عليه",
    grade: "sahih",
  },
  {
    id: "f4",
    icon: "🌙",
    category: "الصلاة",
    title: "فضل قيام الليل",
    text: "أَفْضَلُ الصَّلَاةِ بَعْدَ الْفَرِيضَةِ صَلَاةُ اللَّيْلِ",
    source: "صحيح مسلم",
    grade: "sahih",
  },
  {
    id: "f5",
    icon: "🌅",
    category: "الصلاة",
    title: "فضل ركعتَي الفجر",
    text: "رَكْعَتَا الْفَجْرِ خَيْرٌ مِنَ الدُّنْيَا وَمَا فِيهَا",
    source: "صحيح مسلم",
    grade: "sahih",
  },
  {
    id: "f6",
    icon: "🏆",
    category: "الصلاة",
    title: "فضل انتظار الصلاة",
    text: "لَا يَزَالُ أَحَدُكُمْ فِي صَلَاةٍ مَا كَانَتِ الصَّلَاةُ تَحْبِسُهُ، وَلَا يَمْنَعُهُ أَنْ يَنْقَلِبَ إِلَى أَهْلِهِ إِلَّا الصَّلَاةُ",
    source: "متفق عليه",
    grade: "sahih",
  },
  /* ── الصيام ── */
  {
    id: "f7",
    icon: "🌙",
    category: "الصيام",
    title: "الصيام جُنّة",
    text: "الصِّيَامُ جُنَّةٌ، وَإِذَا كَانَ يَوْمُ صَوْمِ أَحَدِكُمْ فَلَا يَرْفُثْ وَلَا يَصْخَبْ، فَإِنْ سَابَّهُ أَحَدٌ أَوْ قَاتَلَهُ فَلْيَقُلْ: إِنِّي امْرُؤٌ صَائِمٌ",
    source: "متفق عليه",
    grade: "sahih",
  },
  {
    id: "f8",
    icon: "🚪",
    category: "الصيام",
    title: "باب الريّان",
    text: "إِنَّ فِي الْجَنَّةِ بَابًا يُقَالُ لَهُ الرَّيَّانُ، يَدْخُلُ مِنْهُ الصَّائِمُونَ يَوْمَ الْقِيَامَةِ، لَا يَدْخُلُ مِنْهُ أَحَدٌ غَيْرُهُمْ",
    source: "متفق عليه",
    grade: "sahih",
  },
  {
    id: "f9",
    icon: "🛡️",
    category: "الصيام",
    title: "الصيام يبعد النار",
    text: "مَنْ صَامَ يَوْمًا فِي سَبِيلِ اللَّهِ، بَعَّدَ اللَّهُ وَجْهَهُ عَنِ النَّارِ سَبْعِينَ خَرِيفًا",
    source: "متفق عليه",
    grade: "sahih",
  },
  /* ── القرآن ── */
  {
    id: "f10",
    icon: "📖",
    category: "القرآن",
    title: "فضل قراءة القرآن",
    text: "اقْرَأُوا الْقُرْآنَ فَإِنَّهُ يَأْتِي يَوْمَ الْقِيَامَةِ شَفِيعًا لِأَصْحَابِهِ",
    source: "صحيح مسلم",
    grade: "sahih",
  },
  {
    id: "f11",
    icon: "💎",
    category: "القرآن",
    title: "الحرف بعشر حسنات",
    text: "مَنْ قَرَأَ حَرْفًا مِنْ كِتَابِ اللَّهِ فَلَهُ بِهِ حَسَنَةٌ، وَالْحَسَنَةُ بِعَشْرِ أَمْثَالِهَا، لَا أَقُولُ (الم) حَرْفٌ، وَلَكِنْ أَلِفٌ حَرْفٌ وَلَامٌ حَرْفٌ وَمِيمٌ حَرْفٌ",
    source: "سنن الترمذي — صحيح",
    grade: "sahih",
  },
  {
    id: "f12",
    icon: "👑",
    category: "القرآن",
    title: "خير من تعلم القرآن وعلمه",
    text: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
    source: "صحيح البخاري",
    grade: "sahih",
  },
  {
    id: "f13",
    icon: "⭐",
    category: "القرآن",
    title: "فضل الماهر بالقرآن",
    text: "الْمَاهِرُ بِالْقُرْآنِ مَعَ السَّفَرَةِ الْكِرَامِ الْبَرَرَةِ، وَالَّذِي يَقْرَأُ الْقُرْآنَ وَيَتَتَعْتَعُ فِيهِ وَهُوَ عَلَيْهِ شَاقٌّ لَهُ أَجْرَانِ",
    source: "متفق عليه",
    grade: "sahih",
  },
  /* ── الذكر والدعاء ── */
  {
    id: "f14",
    icon: "💬",
    category: "الذكر والدعاء",
    title: "أثقل الكلمات في الميزان",
    text: "كَلِمَتَانِ خَفِيفَتَانِ عَلَى اللِّسَانِ، ثَقِيلَتَانِ فِي الْمِيزَانِ، حَبِيبَتَانِ إِلَى الرَّحْمَنِ: سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ",
    source: "متفق عليه",
    grade: "sahih",
  },
  {
    id: "f15",
    icon: "🌱",
    category: "الذكر والدعاء",
    title: "غراس الجنة",
    text: "مَنْ قَالَ: سُبْحَانَ اللَّهِ وَبِحَمْدِهِ غُرِسَتْ لَهُ نَخْلَةٌ فِي الْجَنَّةِ",
    source: "سنن الترمذي — صحيح",
    grade: "sahih",
  },
  {
    id: "f16",
    icon: "🙏",
    category: "الذكر والدعاء",
    title: "الاستغفار يفتح الأبواب",
    text: "مَنْ لَزِمَ الِاسْتِغْفَارَ جَعَلَ اللَّهُ لَهُ مِنْ كُلِّ ضِيقٍ مَخْرَجًا، وَمِنْ كُلِّ هَمٍّ فَرَجًا، وَرَزَقَهُ مِنْ حَيْثُ لَا يَحْتَسِبُ",
    source: "سنن أبي داود — صحيح",
    grade: "sahih",
  },
  {
    id: "f17",
    icon: "🌟",
    category: "الذكر والدعاء",
    title: "حصن الذاكرين",
    text: "مَثَلُ الَّذِي يَذْكُرُ رَبَّهُ وَالَّذِي لَا يَذْكُرُ رَبَّهُ مَثَلُ الْحَيِّ وَالْمَيِّتِ",
    source: "صحيح البخاري",
    grade: "sahih",
  },
  /* ── الصدقة ── */
  {
    id: "f18",
    icon: "💰",
    category: "الصدقة",
    title: "الصدقة تطفئ الغضب",
    text: "الصَّدَقَةُ تُطْفِئُ غَضَبَ الرَّبِّ، وَتَدْفَعُ مِيتَةَ السَّوْءِ",
    source: "سنن الترمذي — حسن",
    grade: "hasan",
  },
  {
    id: "f19",
    icon: "🌊",
    category: "الصدقة",
    title: "الصدقة الجارية",
    text: "إِذَا مَاتَ الإِنْسَانُ انْقَطَعَ عَمَلُهُ إِلَّا مِنْ ثَلَاثَةٍ: إِلَّا مِنْ صَدَقَةٍ جَارِيَةٍ، أَوْ عِلْمٍ يُنْتَفَعُ بِهِ، أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ",
    source: "صحيح مسلم",
    grade: "sahih",
  },
  {
    id: "f20",
    icon: "📈",
    category: "الصدقة",
    title: "الصدقة لا تنقص المال",
    text: "مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ، وَمَا زَادَ اللَّهُ عَبْدًا بِعَفْوٍ إِلَّا عِزًّا، وَمَا تَوَاضَعَ أَحَدٌ لِلَّهِ إِلَّا رَفَعَهُ اللَّهُ",
    source: "صحيح مسلم",
    grade: "sahih",
  },
  {
    id: "f21",
    icon: "😊",
    category: "الصدقة",
    title: "الابتسامة صدقة",
    text: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ",
    source: "سنن الترمذي — صحيح",
    grade: "sahih",
  },
  /* ── الأخلاق ── */
  {
    id: "f22",
    icon: "🤝",
    category: "الأخلاق",
    title: "أثقل شيء في الميزان",
    text: "مَا مِنْ شَيْءٍ أَثْقَلُ فِي مِيزَانِ الْمُؤْمِنِ يَوْمَ الْقِيَامَةِ مِنْ حُسْنِ الْخُلُقِ",
    source: "سنن الترمذي — صحيح",
    grade: "sahih",
  },
  {
    id: "f23",
    icon: "❤️",
    category: "الأخلاق",
    title: "أحب الناس إلى الله",
    text: "أَحَبُّ النَّاسِ إِلَى اللَّهِ أَنْفَعُهُمْ لِلنَّاسِ",
    source: "المعجم الأوسط — حسن",
    grade: "hasan",
  },
  {
    id: "f24",
    icon: "🕊️",
    category: "الأخلاق",
    title: "فضل العفو",
    text: "مَا زَادَ اللَّهُ عَبْدًا بِعَفْوٍ إِلَّا عِزًّا",
    source: "صحيح مسلم",
    grade: "sahih",
  },
  {
    id: "f25",
    icon: "🔗",
    category: "الأخلاق",
    title: "صلة الرحم تطيل العمر",
    text: "مَنْ أَحَبَّ أَنْ يُبْسَطَ لَهُ فِي رِزْقِهِ وَأَنْ يُنْسَأَ لَهُ فِي أَثَرِهِ فَلْيَصِلْ رَحِمَهُ",
    source: "متفق عليه",
    grade: "sahih",
  },
  /* ── متنوعة ── */
  {
    id: "f26",
    icon: "👩‍👧",
    category: "متنوعة",
    title: "فضل تربية البنات",
    text: "مَنْ عَالَ جَارِيَتَيْنِ حَتَّى تَبْلُغَا جَاءَ يَوْمَ الْقِيَامَةِ أَنَا وَهُوَ كَهَاتَيْنِ (وَضَمَّ أَصَابِعَهُ)",
    source: "صحيح مسلم",
    grade: "sahih",
  },
  {
    id: "f27",
    icon: "📚",
    category: "متنوعة",
    title: "فضل طلب العلم",
    text: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
    source: "صحيح مسلم",
    grade: "sahih",
  },
  {
    id: "f28",
    icon: "🤲",
    category: "متنوعة",
    title: "فضل عيادة المريض",
    text: "مَنْ عَادَ مَرِيضًا أَوْ زَارَ أَخًا لَهُ فِي اللَّهِ نَادَاهُ مُنَادٍ: أَنْ طِبْتَ وَطَابَ مَمْشَاكَ وَتَبَوَّأْتَ مِنَ الْجَنَّةِ مَنْزِلًا",
    source: "سنن الترمذي — صحيح",
    grade: "sahih",
  },
  {
    id: "f29",
    icon: "🌿",
    category: "متنوعة",
    title: "فضل غرس الشجر",
    text: "مَا مِنْ مُسْلِمٍ يَغْرِسُ غَرْسًا أَوْ يَزْرَعُ زَرْعًا فَيَأْكُلُ مِنْهُ طَيْرٌ أَوْ إِنْسَانٌ أَوْ بَهِيمَةٌ إِلَّا كَانَ لَهُ بِهِ صَدَقَةٌ",
    source: "متفق عليه",
    grade: "sahih",
  },
  {
    id: "f30",
    icon: "🏠",
    category: "متنوعة",
    title: "فضل التسبيح في البيت",
    text: "أَلَا أَدُلُّكَ عَلَى غِرَاسٍ هُوَ خَيْرٌ مِنْ هَذَا؟ قُلْتُ: بَلَى. قَالَ: تَقُولُ سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ",
    source: "سنن الترمذي — صحيح",
    grade: "sahih",
  },
];

export default function FadailAamalPage() {
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [search, setSearch] = useState("");

  const filtered = FADAIL.filter((f) => {
    const matchCat = activeCategory === "الكل" || f.category === activeCategory;
    const matchSearch = !search.trim() ||
      f.title.includes(search) ||
      f.text.includes(search) ||
      f.source.includes(search);
    return matchCat && matchSearch;
  });

  return (
    <main className="fa-page" dir="rtl">
      {/* hero */}
      <section className="fa-hero">
        <div className="fa-hero__badge">فضائل وأجر</div>
        <h1 className="fa-hero__title">فضائل الأعمال</h1>
        <p className="fa-hero__sub">
          30+ حديث صحيح وحسن في فضائل العبادات والأخلاق من الصحيحين وكتب السنة
        </p>

        {/* stats */}
        <div className="fa-stats">
          <div className="fa-stat">
            <span className="fa-stat__num">{FADAIL.length}</span>
            <span className="fa-stat__label">حديث</span>
          </div>
          <div className="fa-stat">
            <span className="fa-stat__num">{CATEGORIES.length - 1}</span>
            <span className="fa-stat__label">قسم</span>
          </div>
          <div className="fa-stat">
            <span className="fa-stat__num">{FADAIL.filter((f) => f.grade === "sahih").length}</span>
            <span className="fa-stat__label">صحيح</span>
          </div>
        </div>
      </section>

      <div className="fa-body">
        {/* search */}
        <div className="fa-search-row">
          <input
            type="search"
            className="fa-search"
            placeholder="ابحث في الأحاديث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* categories */}
        <div className="fa-cats" role="tablist" aria-label="تصفية حسب الموضوع">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat}
              className={`fa-cat-btn${activeCategory === cat ? " fa-cat-btn--active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* results count */}
        <p className="fa-count">{filtered.length} حديث</p>

        {/* cards */}
        <div className="fa-grid">
          {filtered.map((f) => (
            <article key={f.id} className={`fa-card fa-card--${f.grade}`}>
              <div className="fa-card__head">
                <span className="fa-card__icon">{f.icon}</span>
                <div className="fa-card__meta">
                  <span className="fa-card__cat">{f.category}</span>
                  <span className={`fa-card__grade fa-card__grade--${f.grade}`}>
                    {f.grade === "sahih" ? "صحيح" : "حسن"}
                  </span>
                </div>
              </div>
              <h2 className="fa-card__title">{f.title}</h2>
              <blockquote className="fa-card__text">{f.text}</blockquote>
              <cite className="fa-card__source">{f.source}</cite>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="fa-empty">
            <span className="fa-empty__icon">🔍</span>
            <p>لا توجد نتائج مطابقة</p>
          </div>
        )}

        {/* related */}
        <nav className="fa-related" aria-label="صفحات ذات صلة">
          <h2 className="fa-related__title">استكشف أيضاً</h2>
          <div className="fa-related__grid">
            {[
              { href: "/adhkar", label: "الأذكار" },
              { href: "/sunan-yawmiyya", label: "السنن اليومية" },
              { href: "/hikam-salaf", label: "حكم السلف" },
              { href: "/duas", label: "الأدعية الشرعية" },
              { href: "/fawaid", label: "الفوائد العلمية" },
              { href: "/arbaeen-nawawi", label: "الأربعون النووية" },
            ].map((r) => (
              <a key={r.href} href={r.href} className="fa-related__link">{r.label}</a>
            ))}
          </div>
        </nav>
      </div>
    </main>
  );
}
