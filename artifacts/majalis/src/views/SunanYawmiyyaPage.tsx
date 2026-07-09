import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Check, CheckCircle2, Search, X } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";

/* ─── أنواع البيانات ─── */
type Sunnah = {
  id: string;
  title: string;
  category: string;
  time: string;
  text: string;
  source: string;
  reward?: string;
  howTo?: string;
};

const CATEGORIES = ["الكل", "الاستيقاظ والنوم", "الصلاة", "الطعام والشراب", "الذكر والدعاء", "التعامل مع الناس", "العبادات", "الطهارة"] as const;

const SUNAN: Sunnah[] = [
  /* ─── الاستيقاظ والنوم ─── */
  {
    id: "nak-s1",
    title: "قول دعاء الاستيقاظ",
    category: "الاستيقاظ والنوم",
    time: "عند الصحو من النوم",
    text: "كان ﷺ إذا استيقظ من النوم قال: «الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور».",
    source: "رواه البخاري",
    howTo: "قلها فور فتح عينيك قبل النهوض من الفراش.",
  },
  {
    id: "nak-s2",
    title: "مسح النوم عن الوجه",
    category: "الاستيقاظ والنوم",
    time: "بعد الاستيقاظ",
    text: "كان ﷺ إذا قام من النوم شنَّ الماء على وجهه.",
    source: "متفق عليه",
    howTo: "اغسل وجهك فور الاستيقاظ بالماء البارد لتنشيط الذهن والتطهير.",
  },
  {
    id: "nak-s3",
    title: "استنشاق الماء عند الوضوء",
    category: "الاستيقاظ والنوم",
    time: "عند الوضوء",
    text: "قال ﷺ: «من توضأ فليستنشق ومن استجمر فليوتر».",
    source: "رواه مسلم",
    howTo: "اسحب الماء بقوة للأنف ثم استنثر، فعل ذلك ثلاثاً.",
  },
  {
    id: "nak-s4",
    title: "النوم على الشق الأيمن",
    category: "الاستيقاظ والنوم",
    time: "عند النوم",
    text: "كان ﷺ ينام على شقه الأيمن ويضع يده اليمنى تحت خده الأيمن، ويقول: «بسمك اللهم أموت وأحيا».",
    source: "رواه البخاري",
    reward: "أثبتت الدراسات الطبية فوائد النوم على الجانب الأيمن للقلب والهضم.",
  },
  {
    id: "nak-s5",
    title: "دعاء النوم ونفض الفراش",
    category: "الاستيقاظ والنوم",
    time: "قبل النوم",
    text: "قال ﷺ: «إذا أوى أحدكم إلى فراشه فلينفضه بداخلة إزاره ثلاثاً ويقل: بسمك ربي وضعت جنبي وبك أرفعه».",
    source: "متفق عليه",
    howTo: "انفض فراشك ثلاثاً قبل النوم ثم قل الدعاء.",
  },

  /* ─── الصلاة ─── */
  {
    id: "sal-s1",
    title: "السنن الراتبة اليومية",
    category: "الصلاة",
    time: "مع كل صلاة",
    text: "قال ﷺ: «ما من عبد مسلم يصلي لله كل يوم اثنتي عشرة ركعة تطوعاً غير فريضة إلا بنى الله له بيتاً في الجنة».",
    source: "رواه مسلم",
    reward: "بيت في الجنة لمن داوم على 12 ركعة سنة راتبة يومياً.",
    howTo: "ركعتان قبل الفجر، 4 قبل الظهر وركعتان بعدها، ركعتان بعد المغرب، ركعتان بعد العشاء.",
  },
  {
    id: "sal-s2",
    title: "تحية المسجد",
    category: "الصلاة",
    time: "عند دخول المسجد",
    text: "قال ﷺ: «إذا دخل أحدكم المسجد فلا يجلس حتى يصلي ركعتين».",
    source: "متفق عليه",
    howTo: "عند دخول المسجد صلِّ ركعتين قبل الجلوس إلا في أوقات النهي.",
  },
  {
    id: "sal-s3",
    title: "الإتيان بالصلاة بسكينة",
    category: "الصلاة",
    time: "عند الذهاب للصلاة",
    text: "قال ﷺ: «إذا سمعتم الإقامة فامشوا إلى الصلاة وعليكم السكينة والوقار ولا تسرعوا».",
    source: "متفق عليه",
    howTo: "تنبه: لا تسرع ولو فاتتك ركعة، ما أدركت فصلِّ وما فاتك فأتمِّ.",
  },
  {
    id: "sal-s4",
    title: "الذكر بعد الصلاة",
    category: "الصلاة",
    time: "بعد كل صلاة مكتوبة",
    text: "كان ﷺ يقول دبر كل صلاة: «أستغفر الله» ثلاثاً ثم: «اللهم أنت السلام ومنك السلام تباركت يا ذا الجلال والإكرام».",
    source: "رواه مسلم",
    reward: "المداومة على الأذكار بعد الصلاة من أسباب محبة الله ومغفرة الذنوب.",
  },

  /* ─── الطعام والشراب ─── */
  {
    id: "eat-s1",
    title: "التسمية قبل الأكل",
    category: "الطعام والشراب",
    time: "قبل الأكل والشرب",
    text: "قال ﷺ: «إذا أكل أحدكم فليذكر اسم الله تعالى، فإن نسي أن يذكر اسم الله تعالى في أوله فليقل: بسم الله في أوله وآخره».",
    source: "رواه أبو داود والترمذي — صحيح",
    howTo: "قل «بسم الله» قبل كل أكل وشرب، وإن نسيت قل «بسم الله أوله وآخره».",
  },
  {
    id: "eat-s2",
    title: "الأكل باليمين",
    category: "الطعام والشراب",
    time: "عند الأكل والشرب",
    text: "قال ﷺ: «لا يأكل أحدكم بشماله ولا يشرب بها فإن الشيطان يأكل بشماله ويشرب بها».",
    source: "رواه مسلم",
  },
  {
    id: "eat-s3",
    title: "الشرب قاعداً على ثلاث جرعات",
    category: "الطعام والشراب",
    time: "عند الشرب",
    text: "كان ﷺ يشرب بثلاث جرعات ويتنفس خارج الإناء بين الجرعات، ونهى عن النفخ في الإناء.",
    source: "متفق عليه",
    reward: "أثبت الطب أن الشرب ببطء أفضل للجسم من الشرب السريع.",
  },
  {
    id: "eat-s4",
    title: "الأكل مما يلي",
    category: "الطعام والشراب",
    time: "عند الأكل",
    text: "قال ﷺ لعمر بن أبي سلمة: «يا غلام سمِّ الله، وكُل بيمينك، وكُل مما يليك».",
    source: "متفق عليه",
    howTo: "لا تمتد يدك للأطعمة البعيدة عنك في الطبق المشترك.",
  },
  {
    id: "eat-s5",
    title: "الحمد بعد الأكل",
    category: "الطعام والشراب",
    time: "بعد الانتهاء من الأكل",
    text: "قال ﷺ: «من أكل طعاماً فقال: الحمد لله الذي أطعمني هذا ورزقنيه من غير حول مني ولا قوة، غُفر له ما تقدم من ذنبه».",
    source: "رواه أبو داود والترمذي — حسن",
    reward: "مغفرة الذنوب المتقدمة بهذا الدعاء البسيط.",
  },

  /* ─── الذكر والدعاء ─── */
  {
    id: "dhk-s1",
    title: "أذكار الصباح والمساء",
    category: "الذكر والدعاء",
    time: "بعد الفجر وبعد العصر",
    text: "قال ﷺ: «من قال: سبحان الله وبحمده مائة مرة حُطَّت خطاياه وإن كانت مثل زبد البحر».",
    source: "متفق عليه",
    reward: "حفظ من الشيطان وتكفير الذنوب ورفع الدرجات.",
    howTo: "استمع لأذكار الصباح والمساء المسجلة أو اقرأها من المصحف كل يوم.",
  },
  {
    id: "dhk-s2",
    title: "الإكثار من الاستغفار",
    category: "الذكر والدعاء",
    time: "في أي وقت",
    text: "قال ﷺ: «من أكثر من الاستغفار جعل الله له من كل هم فرجاً، ومن كل ضيق مخرجاً، ورزقه من حيث لا يحتسب».",
    source: "رواه أبو داود — صحيح",
    reward: "فرج من الهموم، مخرج من الضيق، رزق من غير احتساب.",
  },
  {
    id: "dhk-s3",
    title: "سيد الاستغفار",
    category: "الذكر والدعاء",
    time: "صباحاً ومساءً",
    text: "قال ﷺ: «من قال حين يصبح وحين يمسي: اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك... فإن مات من يومه أو ليلته دخل الجنة».",
    source: "رواه البخاري",
    reward: "الجنة لمن قاله صادقاً في الصباح ومات ذلك اليوم.",
  },
  {
    id: "dhk-s4",
    title: "الصلاة على النبي ﷺ",
    category: "الذكر والدعاء",
    time: "في أي وقت",
    text: "قال ﷺ: «من صلى عليَّ صلاةً واحدة صلى الله عليه بها عشراً».",
    source: "رواه مسلم",
    reward: "عشر صلوات من الله مقابل صلاة واحدة على النبي ﷺ.",
    howTo: "أكثر من قول «اللهم صل وسلم على نبينا محمد» في يومك.",
  },

  /* ─── التعامل مع الناس ─── */
  {
    id: "nas-s1",
    title: "إفشاء السلام",
    category: "التعامل مع الناس",
    time: "عند لقاء المسلم",
    text: "قال ﷺ: «والذي نفسي بيده لا تدخلون الجنة حتى تؤمنوا، ولا تؤمنوا حتى تحابوا، أولا أدلكم على شيء إذا فعلتموه تحاببتم؟ أفشوا السلام بينكم».",
    source: "رواه مسلم",
    reward: "التحابب ودخول الجنة.",
    howTo: "ابدأ من اليوم بإلقاء السلام على كل من تقابله من المسلمين.",
  },
  {
    id: "nas-s2",
    title: "المصافحة عند اللقاء",
    category: "التعامل مع الناس",
    time: "عند لقاء المسلم",
    text: "قال ﷺ: «ما من مسلمين يلتقيان فيتصافحان إلا غُفر لهما قبل أن يتفرقا».",
    source: "رواه أبو داود والترمذي — صحيح",
    reward: "مغفرة الذنوب للمتصافحَين قبل أن يفترقا.",
  },
  {
    id: "nas-s3",
    title: "تشميت العاطس",
    category: "التعامل مع الناس",
    time: "عند سماع العطسة",
    text: "قال ﷺ: «إذا عطس أحدكم فحمد الله فشمِّتوه، وإذا لم يحمد الله فلا تشمِّتوه».",
    source: "رواه مسلم",
    howTo: "حين يعطس شخص ويقول «الحمد لله» قل له «يرحمك الله».",
  },
  {
    id: "nas-s4",
    title: "زيارة المريض",
    category: "التعامل مع الناس",
    time: "عند مرض الأخ المسلم",
    text: "قال ﷺ: «من عاد مريضاً لم يزل في خرفة الجنة حتى يرجع».",
    source: "رواه مسلم",
    reward: "الملائكة تدعو لعائد المريض طول طريق العودة.",
  },

  /* ─── العبادات ─── */
  {
    id: "ibd-s1",
    title: "صيام ثلاثة أيام كل شهر",
    category: "العبادات",
    time: "البيض: 13، 14، 15 من الشهر الهجري",
    text: "قال ﷺ: «صوم ثلاثة أيام من كل شهر صوم الدهر كله».",
    source: "متفق عليه",
    reward: "يعادل صيام السنة كاملة.",
  },
  {
    id: "ibd-s2",
    title: "صلاة الضحى",
    category: "العبادات",
    time: "من ربع ساعة بعد الشروق إلى قبيل الزوال",
    text: "قال ﷺ: «يصبح على كل سلامى من أحدكم صدقة، فكل تسبيحة صدقة، وكل تحميدة صدقة... ويجزئ عن ذلك ركعتان يركعهما من الضحى».",
    source: "رواه مسلم",
    reward: "تجزئ عن 360 صدقة عن كل مفصل في الجسم.",
    howTo: "أقلها ركعتان، وأكثرها 8 ركعات، أفضل وقتها حين تشتد الشمس.",
  },
  {
    id: "ibd-s3",
    title: "قيام الليل ولو ركعتين",
    category: "العبادات",
    time: "الثلث الأخير من الليل",
    text: "قال ﷺ: «أفضل الصلاة بعد الفريضة صلاة الليل».",
    source: "رواه مسلم",
    reward: "أفضل النوافل على الإطلاق، ودعاء الثلث الأخير مستجاب.",
  },
  {
    id: "ibd-s4",
    title: "الصدقة ولو بالقليل",
    category: "العبادات",
    time: "يومياً أو أسبوعياً",
    text: "قال ﷺ: «اتقوا النار ولو بشق تمرة».",
    source: "متفق عليه",
    reward: "الصدقة تُطفئ الخطيئة كما يُطفئ الماء النار، وتدفع البلاء.",
    howTo: "داوم على صدقة يومية ولو كانت صغيرة. الابتسامة والكلمة الطيبة أيضاً صدقة.",
  },

  /* ─── الطهارة ─── */
  {
    id: "tah-s1",
    title: "السواك",
    category: "الطهارة",
    time: "عند كل صلاة وعند الاستيقاظ",
    text: "قال ﷺ: «السواك مطهرة للفم مرضاة للرب».",
    source: "رواه النسائي وابن خزيمة — صحيح",
    reward: "مضاعفة الصلاة سبعين ضعفاً بالسواك قبلها عند بعض العلماء.",
    howTo: "استخدم السواك أو فرشاة الأسنان قبل كل صلاة وعند الاستيقاظ.",
  },
  {
    id: "tah-s2",
    title: "الاستنجاء والاستجمار",
    category: "الطهارة",
    time: "بعد قضاء الحاجة",
    text: "من سنن النبي ﷺ الاستنجاء باليد اليسرى، والنهي عن الاستنجاء باليمين، وإسباغ الوضوء.",
    source: "متفق عليه",
    howTo: "الاستنجاء بالماء أفضل، ويجزئ الاستجمار بثلاثة أحجار على الأقل.",
  },
  {
    id: "tah-s3",
    title: "قص الشارب وتوفير اللحية",
    category: "الطهارة",
    time: "أسبوعياً أو عند الحاجة",
    text: "قال ﷺ: «قصوا الشوارب وأعفوا اللحى، خالفوا المشركين».",
    source: "متفق عليه",
    howTo: "قصر الشارب حتى يبين الشفة، وإعفاء اللحية بلا حلق.",
  },
];

export default function SunanYawmiyyaPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("الكل");
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("sunan_checked");
      return new Set(saved ? JSON.parse(saved) : []);
    } catch { return new Set(); }
  });

  useEffect(() => {
    applyPageSeo({
      path: "/sunan-yawmiyya",
      title: "السنن النبوية اليومية | المجلس العلمي",
      description: "دليلك لتطبيق السنن النبوية اليومية: سنن النوم والأكل والصلاة والذكر والتعامل مع الناس — مع المصادر والأجر.",
      keywords: ["سنن نبوية", "سنة نبوية", "سنن يومية", "اقتداء بالنبي", "هدي نبوي"],
    });
  }, []);

  function toggleCheck(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try { localStorage.setItem("sunan_checked", JSON.stringify([...next])); } catch { /* storage unavailable */ }
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SUNAN.filter((s) => {
      const matchCat = category === "الكل" || s.category === category;
      const matchQ = !q || s.title.includes(q) || s.text.includes(q) || s.category.includes(q);
      return matchCat && matchQ;
    });
  }, [query, category]);

  const doneCount = filtered.filter((s) => checked.has(s.id)).length;

  return (
    <main className="sy-page" dir="rtl">
      {/* هيرو */}
      <section className="sy-hero">
        <div className="sy-hero__badge">الاقتداء بالنبي ﷺ</div>
        <h1 className="sy-hero__title">السنن النبوية اليومية</h1>
        <p className="sy-hero__sub">
          «من أحب أن يحبه الله فليتبع سنة النبي ﷺ» — دليل عملي لتطبيق السنن في حياتك اليومية
        </p>
        {/* مؤشر التقدم */}
        <div className="sy-progress">
          <div className="sy-progress__text">
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>{doneCount} من {filtered.length} سنة مطبَّقة اليوم</span>
          </div>
          <div className="sy-progress__bar-wrap">
            <div
              className="sy-progress__bar"
              style={{ width: filtered.length ? `${(doneCount / filtered.length) * 100}%` : "0%" }}
            />
          </div>
        </div>
      </section>

      {/* تحكم */}
      <div className="sy-controls">
        <div className="sy-search-wrap">
          <Search size={15} className="sy-search-icon" aria-hidden="true" />
          <input
            className="sy-search"
            type="search"
            placeholder="ابحث في السنن..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="بحث في السنن"
          />
          {query && (
            <button type="button" className="sy-search-clear" onClick={() => setQuery("")} aria-label="مسح البحث">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="sy-cats" role="list">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              role="listitem"
              className={`sy-cat-chip${category === cat ? " sy-cat-chip--active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* قائمة السنن */}
      <div className="sy-list">
        {filtered.map((s) => {
          const done = checked.has(s.id);
          return (
            <article key={s.id} className={`sy-card${done ? " sy-card--done" : ""}`}>
              <button
                type="button"
                className="sy-card__check"
                onClick={() => toggleCheck(s.id)}
                aria-label={done ? "إلغاء تحديد السنة" : "تحديد السنة كمطبَّقة"}
                aria-pressed={done}
              >
                {done ? <Check size={16} strokeWidth={2.5} /> : <span />}
              </button>
              <div className="sy-card__body">
                <div className="sy-card__head">
                  <div className="sy-card__title">{s.title}</div>
                  <div className="sy-card__time">{s.time}</div>
                </div>
                <p className="sy-card__text">{s.text}</p>
                <div className="sy-card__source">{s.source}</div>
                {s.reward && (
                  <div className="sy-card__reward">
                    ✨ {s.reward}
                  </div>
                )}
                {s.howTo && (
                  <div className="sy-card__howto">
                    <span className="sy-card__howto-label">كيف؟</span>
                    {s.howTo}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="sy-empty">
          <p>لا توجد نتائج — جرِّب بحثاً آخر</p>
        </div>
      )}

      {/* صفحات ذات صلة */}
      <section className="sy-related">
        <h2 className="sy-related__title">استكشف أيضاً</h2>
        <div className="sy-related__grid">
          {[
            { href: "/adhkar",       label: "الأذكار" },
            { href: "/duas",         label: "الأدعية الشرعية" },
            { href: "/arkan",        label: "أركان الإسلام" },
            { href: "/prayer-ranks", label: "فضائل الصلاة" },
            { href: "/hadith",       label: "الأحاديث النبوية" },
            { href: "/daily-wird",   label: "الورد اليومي" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="sy-related__link">{label}</Link>
          ))}
        </div>
      </section>
    </main>
  );
}
