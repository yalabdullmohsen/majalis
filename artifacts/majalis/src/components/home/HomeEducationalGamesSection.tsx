import { Link } from "wouter";

const GAMES = [
  { href: "/quiz", title: "اختبار علمي", desc: "أسئلة متنوعة في العلوم الشرعية" },
  { href: "/learning/quiz", title: "اختبار التعلم", desc: "قيّم معلوماتك بعد الدروس" },
  { href: "/learning/paths", title: "مسارات التعلم", desc: "مسارات منظّمة لطالب العلم" },
];

export function HomeEducationalGamesSection() {
  return (
    <section className="home-v4-games" aria-labelledby="home-games-heading">
      <div className="home-container">
        <div className="home-section-head">
          <div>
            <p className="home-eyebrow">تعلّم تفاعلي</p>
            <h2 id="home-games-heading">الألعاب التعليمية</h2>
          </div>
        </div>
        <div className="home-v4-games__inline">
          {GAMES.map((g) => (
            <Link key={g.href} href={g.href} className="home-v4-games__link">
              <strong>{g.title}</strong>
              <span>{g.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
