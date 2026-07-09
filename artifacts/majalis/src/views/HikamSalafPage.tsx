import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Copy, Heart, Search, X } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";

/* ─── أنواع البيانات ─── */
type Hikma = {
  id: string;
  text: string;
  scholar: string;
  died: string;
  category: string;
  source?: string;
};

const CATEGORIES = ["الكل", "الإيمان والتوحيد", "العلم والعمل", "الدنيا والزهد", "التوبة والاستغفار", "الصبر والشكر", "الأخلاق", "الموت والآخرة", "القرآن والذكر"] as const;

const HIKAM: Hikma[] = [
  /* ─── الإيمان والتوحيد ─── */
  {
    id: "i1",
    text: "جُبل الناس على حب من أحسن إليهم، فكيف بمن أحسن إليهم في كل حال؟",
    scholar: "ابن تيمية",
    died: "728ه",
    category: "الإيمان والتوحيد",
    source: "مجموع الفتاوى",
  },
  {
    id: "i2",
    text: "القلب لا يصلح ولا يفلح ولا يلتذ ولا يسر ولا يطمئن إلا بعبادة ربه وحبه والإنابة إليه.",
    scholar: "ابن تيمية",
    died: "728ه",
    category: "الإيمان والتوحيد",
    source: "مجموع الفتاوى",
  },
  {
    id: "i3",
    text: "من عرف الله، ما الذي أعجزه بعد ذلك؟ ومن لم يعرف الله، فماذا أصاب؟",
    scholar: "ابن القيم",
    died: "751ه",
    category: "الإيمان والتوحيد",
    source: "مدارج السالكين",
  },
  {
    id: "i4",
    text: "ما خافَ اللهَ من خافَ غيرَه، وما رجا اللهَ من رجا غيرَه.",
    scholar: "الحسن البصري",
    died: "110ه",
    category: "الإيمان والتوحيد",
  },
  {
    id: "i5",
    text: "أعلى الناس منزلة عند الله، أعرفهم به وأشدهم له خشية.",
    scholar: "الإمام الشافعي",
    died: "204ه",
    category: "الإيمان والتوحيد",
  },

  /* ─── العلم والعمل ─── */
  {
    id: "e1",
    text: "كن عالماً أو متعلماً أو مستمعاً أو محباً، ولا تكن الخامس فتهلك.",
    scholar: "ابن مسعود",
    died: "32ه",
    category: "العلم والعمل",
  },
  {
    id: "e2",
    text: "لا يبلغ الرجل حقيقة العلم حتى يرى الناس من فضل علمه.",
    scholar: "سفيان الثوري",
    died: "161ه",
    category: "العلم والعمل",
  },
  {
    id: "e3",
    text: "من عمل بلا علم، كان ما يُفسده أكثر مما يُصلحه.",
    scholar: "الإمام مالك",
    died: "179ه",
    category: "العلم والعمل",
  },
  {
    id: "e4",
    text: "آفة العلماء ثلاث: الكبر، والحسد، وسوء النية.",
    scholar: "الإمام أحمد",
    died: "241ه",
    category: "العلم والعمل",
  },
  {
    id: "e5",
    text: "العلم يهتف بالعمل، فإن أجابه وإلا ارتحل.",
    scholar: "ابن مسعود",
    died: "32ه",
    category: "العلم والعمل",
  },
  {
    id: "e6",
    text: "إن كنت لا تحتمل تعب التعلم، فاحتمل ذل الجهل.",
    scholar: "الإمام الشافعي",
    died: "204ه",
    category: "العلم والعمل",
  },
  {
    id: "e7",
    text: "ليتعلم أحدكم من أين يُحل ومن أين يُحرم، فإن ذلك من الفقه في الدين.",
    scholar: "عمر بن الخطاب",
    died: "23ه",
    category: "العلم والعمل",
  },

  /* ─── الدنيا والزهد ─── */
  {
    id: "d1",
    text: "إن الدنيا حلوة خضرة، فكم من مفتون بها، فاحذروا الدنيا واحذروا النساء.",
    scholar: "سلمان الفارسي",
    died: "35ه",
    category: "الدنيا والزهد",
  },
  {
    id: "d2",
    text: "مثل الدنيا مثل الظل، إن تبعته لم تدركه، وإن أدبرت عنه تبعك.",
    scholar: "ابن القيم",
    died: "751ه",
    category: "الدنيا والزهد",
    source: "الفوائد",
  },
  {
    id: "d3",
    text: "الزهد في الدنيا ليس تحريم الحلال وإضاعة المال، لكنه أن تكون بما في يد الله أوثق مما في يدك.",
    scholar: "ابن مسعود",
    died: "32ه",
    category: "الدنيا والزهد",
  },
  {
    id: "d4",
    text: "لو كانت الدنيا تعدل عند الله جناح بعوضة، ما سقى الكافر منها شربة ماء.",
    scholar: "الحسن البصري",
    died: "110ه",
    category: "الدنيا والزهد",
  },
  {
    id: "d5",
    text: "من أراد أن ينظر إلى ميت يمشي بين أحياء فلينظر إلى الزاهد في الدنيا.",
    scholar: "سفيان الثوري",
    died: "161ه",
    category: "الدنيا والزهد",
  },
  {
    id: "d6",
    text: "إن الدنيا قد ارتحلت مدبرة، والآخرة ارتحلت مقبلة، ولكل منهما بنون، فكونوا من أبناء الآخرة ولا تكونوا من أبناء الدنيا.",
    scholar: "علي بن أبي طالب",
    died: "40ه",
    category: "الدنيا والزهد",
  },

  /* ─── التوبة والاستغفار ─── */
  {
    id: "t1",
    text: "ما من عبد لا يزال يُذنب ويتوب إلا أحبه الله.",
    scholar: "الحسن البصري",
    died: "110ه",
    category: "التوبة والاستغفار",
  },
  {
    id: "t2",
    text: "ذنبٌ أورثك انكساراً وذلاً خير من طاعة أورثتك عُجباً وكبراً.",
    scholar: "ابن تيمية",
    died: "728ه",
    category: "التوبة والاستغفار",
  },
  {
    id: "t3",
    text: "صاحب ذنوبٍ كثيرة أشد حاجة إلى الاستغفار من صاحب ذنوب قليلة.",
    scholar: "ابن القيم",
    died: "751ه",
    category: "التوبة والاستغفار",
    source: "الوابل الصيب",
  },
  {
    id: "t4",
    text: "من ضرب بيده على فخذه عند مصيبة أحبط عمله.",
    scholar: "عمر بن الخطاب",
    died: "23ه",
    category: "التوبة والاستغفار",
  },

  /* ─── الصبر والشكر ─── */
  {
    id: "s1",
    text: "الصبر نصف الإيمان واليقين الإيمان كله.",
    scholar: "ابن مسعود",
    died: "32ه",
    category: "الصبر والشكر",
  },
  {
    id: "s2",
    text: "ما أُعطي أحد عطاء خيراً وأوسع من الصبر.",
    scholar: "عمر بن الخطاب",
    died: "23ه",
    category: "الصبر والشكر",
  },
  {
    id: "s3",
    text: "الشكر قيد النعم الموجودة وصيد النعم المفقودة.",
    scholar: "ابن القيم",
    died: "751ه",
    category: "الصبر والشكر",
    source: "مدارج السالكين",
  },
  {
    id: "s4",
    text: "البلاء للمؤمن كالدواء يُخرج المرض من الجسد، والعافية للكافر كالداء.",
    scholar: "الإمام أحمد",
    died: "241ه",
    category: "الصبر والشكر",
  },
  {
    id: "s5",
    text: "إذا أردت أن تعلم قدر نعمة الله عليك، فتخيَّل أنها ذهبت.",
    scholar: "ابن القيم",
    died: "751ه",
    category: "الصبر والشكر",
  },

  /* ─── الأخلاق ─── */
  {
    id: "a1",
    text: "الكريم من يُكرم من لا يستحق الإكرام رجاء أن يستحقه.",
    scholar: "الإمام الشافعي",
    died: "204ه",
    category: "الأخلاق",
  },
  {
    id: "a2",
    text: "لا تنظر إلى صغر المعصية، ولكن انظر إلى عظمة من عصيت.",
    scholar: "ابن مسعود",
    died: "32ه",
    category: "الأخلاق",
  },
  {
    id: "a3",
    text: "إذا أحببتَ أن تعلم ما أنت عليه من الله فانظر على ما أمرك الله، أين أنت منه؟",
    scholar: "ابن القيم",
    died: "751ه",
    category: "الأخلاق",
  },
  {
    id: "a4",
    text: "من كساه التواضع ثوبه، أحبه أهل السماء وأهل الأرض.",
    scholar: "الحسن البصري",
    died: "110ه",
    category: "الأخلاق",
  },
  {
    id: "a5",
    text: "ثلاثة من مكارم الأخلاق: أن تعفو عمن ظلمك، وتصل من قطعك، وتُحسن إلى من أساء إليك.",
    scholar: "عبدالله بن عباس",
    died: "68ه",
    category: "الأخلاق",
  },

  /* ─── الموت والآخرة ─── */
  {
    id: "m1",
    text: "أكثروا ذكر هاذم اللذات — يعني الموت — فإنه ما ذكره أحد في ضيق إلا وسَّعه.",
    scholar: "الحسن البصري",
    died: "110ه",
    category: "الموت والآخرة",
  },
  {
    id: "m2",
    text: "الموت محيط بالدنيا من كل جانب، ولا يسلم منه إلا من فوق عنقه الدنيا.",
    scholar: "الحسن البصري",
    died: "110ه",
    category: "الموت والآخرة",
  },
  {
    id: "m3",
    text: "كل ما هو آتٍ قريب. والموت آتٍ.",
    scholar: "ابن القيم",
    died: "751ه",
    category: "الموت والآخرة",
  },
  {
    id: "m4",
    text: "إذا أردت الراحة الدائمة فلا تتخذ الدنيا وطناً، وانتظر الآخرة.",
    scholar: "ابن رجب الحنبلي",
    died: "795ه",
    category: "الموت والآخرة",
  },
  {
    id: "m5",
    text: "لو أن ميتاً رجع إلى الدنيا، ما اشتغل إلا بالصلاة والصيام والصدقة.",
    scholar: "سفيان الثوري",
    died: "161ه",
    category: "الموت والآخرة",
  },

  /* ─── القرآن والذكر ─── */
  {
    id: "q1",
    text: "إذا أردتَ أن يحدثك الله فاقرأ القرآن، وإذا أردت أن تحدث الله فصلِّ.",
    scholar: "الحسن البصري",
    died: "110ه",
    category: "القرآن والذكر",
  },
  {
    id: "q2",
    text: "القلوب تصدأ كما يصدأ الحديد، وجلاؤها تلاوة القرآن.",
    scholar: "ابن القيم",
    died: "751ه",
    category: "القرآن والذكر",
    source: "الفوائد",
  },
  {
    id: "q3",
    text: "من أراد أن يعلم ما يجري على أهل الجنة من النعيم فليقرأ سورة الرحمن.",
    scholar: "الحسن البصري",
    died: "110ه",
    category: "القرآن والذكر",
  },
  {
    id: "q4",
    text: "الذكر للقلب كالماء للسمكة، فكيف يكون حال السمكة إذا فارقت الماء؟",
    scholar: "ابن القيم",
    died: "751ه",
    category: "القرآن والذكر",
    source: "الوابل الصيب",
  },
  {
    id: "q5",
    text: "ليس شيء أنفع للعبد في دنياه وآخرته وأقرب إلى نجاته من تدبر القرآن وإطالة التأمل فيه.",
    scholar: "ابن القيم",
    died: "751ه",
    category: "القرآن والذكر",
    source: "مفتاح دار السعادة",
  },
];

export default function HikamSalafPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("الكل");
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("hikam_fav");
      return new Set(saved ? JSON.parse(saved) : []);
    } catch { return new Set(); }
  });
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/hikam-salaf",
      title: "حكم السلف الصالح | المجلس العلمي",
      description: "مختارات من حكم السلف الصالح وأقوال الأئمة: الحسن البصري وابن تيمية وابن القيم والشافعي وأحمد وغيرهم.",
      keywords: ["حكم السلف", "أقوال العلماء", "حكم إسلامية", "ابن القيم", "الحسن البصري"],
    });
  }, []);

  function toggleFav(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try { localStorage.setItem("hikam_fav", JSON.stringify([...next])); } catch { /* storage unavailable */ }
      return next;
    });
  }

  async function copyHikma(h: Hikma) {
    const text = `«${h.text}»\n— ${h.scholar}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(h.id);
      setTimeout(() => setCopied(null), 1800);
    } catch { /* clipboard unavailable */ }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return HIKAM.filter((h) => {
      const matchCat = category === "الكل" || h.category === category;
      const matchQ = !q || h.text.includes(q) || h.scholar.includes(q);
      return matchCat && matchQ;
    });
  }, [query, category]);

  return (
    <main className="hk-page" dir="rtl">
      {/* هيرو */}
      <section className="hk-hero">
        <div className="hk-hero__badge">حكم وأقوال</div>
        <h1 className="hk-hero__title">حِكَم السلف الصالح</h1>
        <p className="hk-hero__sub">
          مختارات نفيسة من أقوال الصحابة والتابعين والأئمة — تُضيء القلب وتُرشد الطريق
        </p>
        <div className="hk-stats">
          <span>{HIKAM.length} حكمة</span>
          <span>·</span>
          <span>{CATEGORIES.length - 1} أبواب</span>
          <span>·</span>
          <span>{favorites.size} محفوظ</span>
        </div>
      </section>

      {/* تحكم */}
      <div className="hk-controls">
        <div className="hk-search-wrap">
          <Search size={15} className="hk-search-icon" aria-hidden="true" />
          <input
            className="hk-search"
            type="search"
            placeholder="ابحث في الحكم أو العلماء..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="بحث في حكم السلف"
          />
          {query && (
            <button type="button" className="hk-search-clear" onClick={() => setQuery("")} aria-label="مسح">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="hk-cats" role="list">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              role="listitem"
              className={`hk-cat${category === cat ? " hk-cat--active" : ""}`}
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* الحكم */}
      {filtered.length === 0 ? (
        <div className="hk-empty"><p>لا توجد نتائج — جرِّب بحثاً آخر</p></div>
      ) : (
        <div className="hk-grid">
          {filtered.map((h) => {
            const isFav = favorites.has(h.id);
            const wasCopied = copied === h.id;
            return (
              <article key={h.id} className={`hk-card${isFav ? " hk-card--fav" : ""}`}>
                <div className="hk-card__cat">{h.category}</div>
                <blockquote className="hk-card__quote">
                  <p className="hk-card__text">«{h.text}»</p>
                  <footer className="hk-card__footer">
                    <span className="hk-card__scholar">— {h.scholar}</span>
                    {h.died && <span className="hk-card__died">(ت{h.died})</span>}
                    {h.source && <span className="hk-card__source">[{h.source}]</span>}
                  </footer>
                </blockquote>
                <div className="hk-card__actions">
                  <button
                    type="button"
                    className={`hk-btn hk-btn--fav${isFav ? " hk-btn--fav-active" : ""}`}
                    onClick={() => toggleFav(h.id)}
                    aria-label={isFav ? "إزالة من المحفوظات" : "إضافة للمحفوظات"}
                    aria-pressed={isFav}
                  >
                    <Heart size={15} fill={isFav ? "currentColor" : "none"} />
                  </button>
                  <button
                    type="button"
                    className={`hk-btn hk-btn--copy${wasCopied ? " hk-btn--copied" : ""}`}
                    onClick={() => copyHikma(h)}
                    aria-label="نسخ الحكمة"
                  >
                    <Copy size={14} />
                    <span>{wasCopied ? "تم النسخ" : "نسخ"}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ذات صلة */}
      <section className="hk-related">
        <h2 className="hk-related__title">استكشف أيضاً</h2>
        <div className="hk-related__grid">
          {[
            { href: "/scholars",       label: "أعلام الإسلام" },
            { href: "/fawaid",         label: "الفوائد الدينية" },
            { href: "/akhlaq",         label: "الأخلاق الإسلامية" },
            { href: "/arkan-iman",     label: "أركان الإيمان" },
            { href: "/arbaeen-nawawi", label: "الأربعون النووية" },
            { href: "/duas",           label: "الأدعية الشرعية" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="hk-related__link">{label}</Link>
          ))}
        </div>
      </section>
    </main>
  );
}
