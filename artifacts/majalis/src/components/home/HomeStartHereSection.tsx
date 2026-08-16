import { Link } from "wouter";

const START_STEPS = [
  {
    num: "٢",
    title: "ابدأ بالأذكار اليومية",
    desc: "أذكار الصباح والمساء وما بينهما، عبادة يومية مستدامة",
    href: "/adhkar",
    cta: "أذكار اليوم",
  },
  {
    num: "٣",
    title: "تابع درساً قريباً",
    desc: "دروس علمية أسبوعية من علماء الكويت، مجانية ومفتوحة",
    href: "/lessons",
    cta: "الدروس القادمة",
  },
  {
    num: "٤",
    title: "دليل طالب العلم المبتدئ",
    desc: "٩ محطات علمية مرتبة من العقيدة إلى التوسع، بروابط مباشرة لكل محطة",
    href: "/adab-talab-ilm",
    cta: "دليل طالب العلم",
  },
];

export function HomeStartHereSection() {
  return (
    <section aria-label="ابدأ من هنا" className="home-start-here">
      <div className="hsh-header">
        <span className="hsh-eyebrow">للزائر الجديد</span>
        <h2 className="hsh-title">ابدأ من هنا</h2>
        <p className="hsh-lead">مسار واضح للمبتدئ، ثم الدروس والدورات حسب مستواك.</p>
        <div className="hsh-actions">
          <Link href="/start-here" className="hsh-actions__primary">
            دليل ابدأ من هنا
          </Link>
          <Link href="/lessons" className="hsh-actions__secondary">
            الدروس والدورات
          </Link>
        </div>
      </div>
      <ol className="hsh-steps">
        {START_STEPS.map((s) => (
          <li key={s.num} className="hsh-step">
            <span className="hsh-step__num" aria-hidden="true">{s.num}</span>
            <div className="hsh-step__body">
              <strong className="hsh-step__title">{s.title}</strong>
              <p className="hsh-step__desc">{s.desc}</p>
              <Link href={s.href} className="hsh-step__cta">{s.cta} ←</Link>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
