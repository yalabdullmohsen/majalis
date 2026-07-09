import { useEffect, useState } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";

type Madhhab = {
  id: string;
  color: string;
  icon: string;
  name: string;
  fullName: string;
  founder: string;
  born: string;
  died: string;
  origin: string;
  spread: string;
  summary: string;
  methodology: string;
  sources: string[];
  features: string[];
  books: { title: string; author: string }[];
  scholars: string[];
  quote: { text: string; source: string };
};

const MADHAHIB: Madhhab[] = [
  {
    id: "hanafi",
    color: "#1F4D3A",
    icon: "🕌",
    name: "الحنفي",
    fullName: "المذهب الحنفي",
    founder: "أبو حنيفة النعمان بن ثابت",
    born: "80ه",
    died: "150ه",
    origin: "الكوفة — العراق",
    spread: "تركيا، الهند، باكستان، آسيا الوسطى، البلقان، مصر (جزء)",
    summary: "أوسع المذاهب الأربعة انتشاراً في العالم، ويُعدّ أقدمها تدويناً منهجياً. يتميز بالاهتمام بالرأي والقياس والاستحسان، وقد نشأ في البيئة العراقية الزاخرة بالمسائل الفقهية الاجتهادية.",
    methodology: "يعتمد على: القرآن، السنة، الإجماع، ثم القياس، ثم الاستحسان، ثم عرف الناس. أكثر اعتماداً على الرأي والقياس مقارنةً بغيره.",
    sources: ["القرآن الكريم", "السنة النبوية", "الإجماع", "القياس", "الاستحسان", "العرف"],
    features: [
      "أوسع مجالاً للرأي والاجتهاد القياسي",
      "يُراعي أعراف الناس وتعاملاتهم",
      "له نظام فقهي دقيق في المعاملات والقضاء",
      "أكثر مرونة في بعض مسائل البيوع والعقود",
    ],
    books: [
      { title: "الهداية", author: "المرغيناني" },
      { title: "بدائع الصنائع", author: "الكاساني" },
      { title: "رد المحتار (حاشية ابن عابدين)", author: "ابن عابدين" },
      { title: "الاختيار لتعليل المختار", author: "ابن مودود الموصلي" },
    ],
    scholars: ["أبو يوسف", "محمد الشيباني", "زفر", "الحسن بن زياد", "ابن عابدين", "الكاساني"],
    quote: { text: "أصل ما نقول به كتاب الله، فما لم نجده فسنة رسول الله، فما لم نجده فيهما فبما قاله الصحابة.", source: "أبو حنيفة" },
  },
  {
    id: "maliki",
    color: "#0A5040",
    icon: "🌿",
    name: "المالكي",
    fullName: "المذهب المالكي",
    founder: "مالك بن أنس",
    born: "93ه",
    died: "179ه",
    origin: "المدينة المنورة",
    spread: "المغرب العربي، غرب أفريقيا، الأندلس (تاريخياً)، السودان، الكويت وجزء من الخليج",
    summary: "المذهب الذي نشأ في مدينة رسول الله ﷺ، ويتميز باعتبار عمل أهل المدينة حجةً شرعية. يُراعي المصلحة المرسلة وسد الذرائع، وله حضور قوي في شمال أفريقيا.",
    methodology: "يعتمد على: القرآن، السنة، إجماع الصحابة، عمل أهل المدينة، القياس، المصلحة المرسلة، سد الذرائع، الاستحسان.",
    sources: ["القرآن الكريم", "السنة النبوية", "عمل أهل المدينة", "إجماع الصحابة", "القياس", "المصلحة المرسلة", "سد الذرائع"],
    features: [
      "يعتبر عمل أهل المدينة حجة شرعية متقدمة على القياس",
      "يُعنى بسد الذرائع المفضية إلى المحرمات",
      "له اهتمام بالغ بالمقاصد الشرعية",
      "يُراعي المصالح المرسلة في تشريع الأحكام",
    ],
    books: [
      { title: "الموطأ", author: "الإمام مالك" },
      { title: "المدونة الكبرى", author: "الإمام سحنون" },
      { title: "المختصر خليل", author: "خليل بن إسحاق" },
      { title: "الذخيرة", author: "القرافي" },
    ],
    scholars: ["ابن القاسم", "أشهب", "ابن وهب", "سحنون", "القرافي", "ابن رشد الحفيد"],
    quote: { text: "كل أحد يؤخذ من كلامه ويُرد إلا صاحب هذا القبر — ويُشير إلى قبر النبي ﷺ.", source: "الإمام مالك" },
  },
  {
    id: "shafii",
    color: "#176649",
    icon: "📜",
    name: "الشافعي",
    fullName: "المذهب الشافعي",
    founder: "محمد بن إدريس الشافعي",
    born: "150ه",
    died: "204ه",
    origin: "مكة المكرمة — قضى حياته بين الحجاز والعراق ومصر",
    spread: "مصر، اليمن، إندونيسيا، ماليزيا، بروناي، الفلبين، شرق أفريقيا، الشام",
    summary: "أول من دوَّن منهجية الأصول في كتابه «الرسالة»، وهو المؤسس لعلم أصول الفقه. توسط بين أهل الرأي وأهل الحديث، مع تمسك دقيق بالنصوص مع القياس المنضبط.",
    methodology: "يعتمد على: القرآن، السنة (حتى الآحاد في الأحكام)، الإجماع، ثم القياس. أول من أصّل علم مصطلح الحديث في سياق الاستدلال الفقهي.",
    sources: ["القرآن الكريم", "السنة النبوية (الآحاد حجة)", "الإجماع", "القياس"],
    features: [
      "مؤسس علم أصول الفقه (كتاب الرسالة)",
      "حديث الآحاد حجة في الأحكام بلا شرط إضافي",
      "القياس منضبط بضوابط صارمة",
      "اهتمام بالغ بالنص ودقة الاستدلال",
    ],
    books: [
      { title: "الأم", author: "الإمام الشافعي" },
      { title: "الرسالة", author: "الإمام الشافعي" },
      { title: "المجموع", author: "النووي" },
      { title: "روضة الطالبين", author: "النووي" },
      { title: "مغني المحتاج", author: "الخطيب الشربيني" },
    ],
    scholars: ["المزني", "البويطي", "النووي", "الرافعي", "ابن حجر الهيتمي"],
    quote: { text: "إذا صح الحديث فهو مذهبي، واضرب بقولي الحائط.", source: "الإمام الشافعي" },
  },
  {
    id: "hanbali",
    color: "#0C5E47",
    icon: "📿",
    name: "الحنبلي",
    fullName: "المذهب الحنبلي",
    founder: "أحمد بن محمد بن حنبل",
    born: "164ه",
    died: "241ه",
    origin: "بغداد",
    spread: "السعودية، قطر، الإمارات، الكويت، الأردن، سوريا (جزء)",
    summary: "أكثر المذاهب تمسكاً بالنص ونتائجه، يُقدم النص الضعيف على القياس في كثير من الحالات، ويكثر من ذكر الروايات المتعددة في المسألة الواحدة. يتميز بالاهتمام البالغ بالسنة.",
    methodology: "يعتمد على: القرآن، السنة (حتى الضعيفة المنجبرة أحياناً)، أقوال الصحابة، الإجماع، ثم القياس. يُقدم الحديث الضعيف على القياس.",
    sources: ["القرآن الكريم", "السنة النبوية (توسع فيها)", "أقوال الصحابة", "الإجماع", "القياس الضيق"],
    features: [
      "التمسك الشديد بالنص ورفض الرأي المجرد",
      "تقديم الحديث الضعيف على القياس",
      "الأخذ بأقوال الصحابة ولو دون إجماع",
      "التحفظ على القياس وتضييق نطاقه",
    ],
    books: [
      { title: "مسند الإمام أحمد", author: "الإمام أحمد" },
      { title: "المغني", author: "ابن قدامة" },
      { title: "الإنصاف", author: "المرداوي" },
      { title: "كشاف القناع", author: "البهوتي" },
      { title: "الفروع", author: "ابن مفلح" },
    ],
    scholars: ["ابن قدامة", "ابن تيمية", "ابن القيم", "المرداوي", "البهوتي", "ابن رجب"],
    quote: { text: "لا تقلدني ولا تقلد مالكاً ولا الشافعي ولا الثوري، وخذ من حيث أخذوا.", source: "الإمام أحمد" },
  },
];

export default function MadhahibPage() {
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/madhahib",
      title: "المذاهب الفقهية الأربعة | المجلس العلمي",
      description: "تعرَّف على المذاهب الفقهية الأربعة: الحنفي والمالكي والشافعي والحنبلي — مؤسسوها ومناهجها ومصادرها وانتشارها.",
      keywords: ["مذاهب فقهية", "فقه إسلامي", "حنفي مالكي شافعي حنبلي", "أصول الفقه"],
    });
  }, []);

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <main className="mdb-page" dir="rtl">
      {/* هيرو */}
      <section className="mdb-hero">
        <div className="mdb-hero__badge">الفقه الإسلامي</div>
        <h1 className="mdb-hero__title">المذاهب الفقهية الأربعة</h1>
        <p className="mdb-hero__sub">
          المذاهب الأربعة من ثمار الاجتهاد الفقهي في الإسلام، كلها قائمة على الكتاب والسنة والإجماع،
          تختلف في بعض الأصول والتفريعات، ويجمعها الولاء لمنهج أهل السنة والجماعة.
        </p>
        {/* أزرار تنقل */}
        <div className="mdb-hero__nav">
          {MADHAHIB.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`mdb-hero__nav-btn${openId === m.id ? " mdb-hero__nav-btn--active" : ""}`}
              onClick={() => toggle(m.id)}
              aria-pressed={openId === m.id}
            >
              <span className="mdb-hero__nav-icon">{m.icon}</span>
              <span className="mdb-hero__nav-name">{m.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* بطاقات المذاهب */}
      <div className="mdb-list">
        {MADHAHIB.map((m) => {
          const isOpen = openId === m.id;
          return (
            <article key={m.id} className={`mdb-card${isOpen ? " mdb-card--open" : ""}`}>
              {/* رأس البطاقة */}
              <button
                type="button"
                className="mdb-card__header"
                onClick={() => toggle(m.id)}
                aria-expanded={isOpen}
              >
                <div className="mdb-card__header-left">
                  <span className="mdb-card__icon">{m.icon}</span>
                  <div>
                    <div className="mdb-card__name">{m.fullName}</div>
                    <div className="mdb-card__founder">الإمام {m.founder} ({m.born}–{m.died})</div>
                    <div className="mdb-card__origin">{m.origin}</div>
                  </div>
                </div>
                <span className="mdb-card__spread">{m.spread.split("،")[0]}…</span>
              </button>

              {/* تفاصيل */}
              {isOpen && (
                <div className="mdb-card__body">
                  <p className="mdb-card__summary">{m.summary}</p>

                  {/* الانتشار */}
                  <div className="mdb-section">
                    <div className="mdb-section__title">🌍 الانتشار الجغرافي</div>
                    <p className="mdb-section__body">{m.spread}</p>
                  </div>

                  {/* المنهج */}
                  <div className="mdb-section">
                    <div className="mdb-section__title">🔎 المنهج الأصولي</div>
                    <p className="mdb-section__body">{m.methodology}</p>
                  </div>

                  {/* المصادر */}
                  <div className="mdb-section">
                    <div className="mdb-section__title">📌 مصادر التشريع</div>
                    <div className="mdb-sources">
                      {m.sources.map((s, i) => (
                        <span key={i} className="mdb-source-chip">{s}</span>
                      ))}
                    </div>
                  </div>

                  {/* مميزات */}
                  <div className="mdb-section">
                    <div className="mdb-section__title">✨ أبرز المميزات</div>
                    <ul className="mdb-features">
                      {m.features.map((f, i) => (
                        <li key={i} className="mdb-feature">{f}</li>
                      ))}
                    </ul>
                  </div>

                  {/* أهم الكتب */}
                  <div className="mdb-section">
                    <div className="mdb-section__title">📚 أهم المصنَّفات</div>
                    <div className="mdb-books">
                      {m.books.map((b, i) => (
                        <div key={i} className="mdb-book">
                          <span className="mdb-book__title">{b.title}</span>
                          <span className="mdb-book__author">{b.author}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* العلماء */}
                  <div className="mdb-section">
                    <div className="mdb-section__title">🎓 كبار علماء المذهب</div>
                    <div className="mdb-scholars">
                      {m.scholars.map((s, i) => (
                        <span key={i} className="mdb-scholar-chip">{s}</span>
                      ))}
                    </div>
                  </div>

                  {/* قول الإمام */}
                  <div className="mdb-quote">
                    <blockquote>
                      <p>«{m.quote.text}»</p>
                      <footer>— {m.quote.source}</footer>
                    </blockquote>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* تنبيه */}
      <div className="mdb-notice">
        <p>
          جميع المذاهب الأربعة مذاهب معتبرة في الإسلام، والاختلاف بينها رحمة ووسعة في الشريعة.
          المسلم يتبع مذهبه بعلم أو يسأل أهل العلم في بلده.
        </p>
      </div>

      {/* صفحات ذات صلة */}
      <section className="mdb-related">
        <h2 className="mdb-related__title">استكشف أيضاً</h2>
        <div className="mdb-related__grid">
          {[
            { href: "/fiqh",           label: "الفقه الإسلامي" },
            { href: "/rulings",        label: "الأحكام الشرعية" },
            { href: "/hadith-science", label: "مصطلح الحديث" },
            { href: "/tawhid",         label: "التوحيد والعقيدة" },
            { href: "/arkan",          label: "أركان الإسلام" },
            { href: "/scholars",       label: "أعلام الإسلام" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="mdb-related__link">{label}</Link>
          ))}
        </div>
      </section>
    </main>
  );
}
