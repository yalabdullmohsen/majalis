import { Link } from "wouter";

const MAIN_HUBS = [
  { href: "/lessons", label: "الدروس", desc: "دروس علمية من مشايخ الكويت", icon: "📚" },
  { href: "/quran-circles", label: "حلقات القرآن", desc: "حفظ ومراجعة وتجويد", icon: "🕌" },
  { href: "/mutoon", label: "المتون العلمية", desc: "موسوعة المتون مع شرح واختبار", icon: "📜" },
  { href: "/annual-courses", label: "الدورات", desc: "دورات علمية منظّمة", icon: "🎓" },
  { href: "/qa", label: "الأسئلة", desc: "أسئلة وأجوبة شرعية", icon: "❓" },
  { href: "/library", label: "المكتبة", desc: "كتب ومراجع إسلامية", icon: "📖" },
  { href: "/quran", label: "القرآن", desc: "قراءة وتلاوة وبحث", icon: "📿" },
  { href: "/miracles", label: "الإعجاز", desc: "إعجاز علمي في القرآن", icon: "✨" },
];

export function HomeAboutSection() {
  return (
    <section className="home-v4-about" aria-labelledby="about-majlis-heading">
      <div className="home-container">
        <p className="home-eyebrow">تعرف علينا</p>
        <h2 id="about-majlis-heading">نبذة عن المجلس العلمي</h2>
        <p className="home-v4-about__text">
          المجلس العلمي منصة إسلامية معرفية تهدف إلى جمع العلم الشرعي الموثوق في مكان واحد بطريقة حديثة
          وسهلة الوصول. تضم المنصة الدروس العلمية، وحلقات القرآن، والمتون، والمكتبة، والأسئلة والأجوبة،
          والفوائد، والأذكار، والإعجاز العلمي.
        </p>
      </div>
    </section>
  );
}

export function HomeMainHubsSection() {
  return (
    <section className="home-v4-hubs" aria-labelledby="main-hubs-heading">
      <div className="home-container">
        <h2 id="main-hubs-heading" className="home-v4-section-title">الأقسام الرئيسية</h2>
        <ul className="home-v4-hubs__list">
          {MAIN_HUBS.map((hub) => (
            <li key={hub.href}>
              <Link href={hub.href} className="home-v4-hubs__item">
                <span className="home-v4-hubs__icon" aria-hidden>{hub.icon}</span>
                <span className="home-v4-hubs__label">{hub.label}</span>
                <span className="home-v4-hubs__desc">{hub.desc}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
