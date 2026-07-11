import { Link } from "wouter";

const TOPICS = [
  { href: "/miracles",         emoji: "🔬", label: "الإعجاز العلمي",        desc: "آيات كونية مذهلة في القرآن والسنة",       color: "#0F766E" },
  { href: "/fawaid",           emoji: "💡", label: "الفوائد العلمية",        desc: "لآلئ ودرر من كلام العلماء",              color: "#1F4D3A" },
  { href: "/raqaiq",           emoji: "🌿", label: "الرقائق والزهد",         desc: "مواعظ تُليِّن القلوب وتصفي النفوس",       color: "#065F46" },
  { href: "/stories",          emoji: "📖", label: "القصص الإسلامية",        desc: "وقائع وعِبَر من التاريخ الإسلامي",       color: "#1F4D3A" },
  { href: "/hikam-salaf",      emoji: "⭐", label: "حكم السلف الصالح",       desc: "أقوال الأئمة والصحابة الكرام",           color: "#0F5132" },
  { href: "/wasaya-nabawiyya", emoji: "📜", label: "الوصايا النبوية",         desc: "كلمات جامعة ومعانٍ عظيمة",               color: "#0F766E" },
  { href: "/prophets",         emoji: "🌙", label: "قصص الأنبياء",           desc: "٢٥ نبياً بالمعجزة والدرس",               color: "#065F46" },
  { href: "/akhlaq",           emoji: "💎", label: "الأخلاق الإسلامية",      desc: "مكارم الأخلاق من الوحي",                color: "#1F4D3A" },
  { href: "/shamael",          emoji: "☀️", label: "الشمائل المحمدية",       desc: "صفاته ﷺ خَلقاً وخُلقاً وهَديه",         color: "#145C46" },
  { href: "/janna-naar",       emoji: "🌟", label: "الجنة والنار",            desc: "صفة الجنة وأسباب دخولها وأدعية الآخرة", color: "#0A5040" },
  { href: "/fadail-aamal",     emoji: "🏆", label: "فضائل الأعمال",          desc: "أحاديث صحيحة في ثواب الأعمال",          color: "#0F5132" },
  { href: "/adab-talab-ilm",   emoji: "📚", label: "آداب طالب العلم",        desc: "فضل العلم وآداب الطالب مع شيخه",         color: "#1F4D3A" },
];

export function HomeInterestingTopics() {
  return (
    <section className="home-section hit-section" aria-labelledby="hit-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">استكشف</p>
          <h2 id="hit-heading">مواضيع مشوّقة</h2>
        </div>
        <Link href="/fawaid" className="home-section-link">الكل</Link>
      </div>

      <div className="hit-grid">
        {TOPICS.map(({ href, emoji, label, desc, color }) => (
          <Link
            key={href}
            href={href}
            className="hit-card"
            style={{ "--hit-clr": color } as React.CSSProperties}
          >
            <span className="hit-card__emoji" aria-hidden="true">{emoji}</span>
            <strong className="hit-card__label">{label}</strong>
            <span className="hit-card__desc">{desc}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
