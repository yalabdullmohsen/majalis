import { Link } from "wouter";

const CATEGORIES = [
  { href: "/lessons", label: "الدروس", desc: "دروس علمية موثقة" },
  { href: "/kuwait-lessons", label: "دروس الكويت", desc: "مساجد الكويت" },
  { href: "/adhkar", label: "الأذكار", desc: "أذكار يومية موثقة" },
  { href: "/fawaid", label: "الفوائد", desc: "مختارات نافعة" },
  { href: "/qa", label: "الأسئلة", desc: "أجوبة علمية" },
  { href: "/miracles", label: "الإعجاز العلمي", desc: "قرآن وسنة" },
  { href: "/quiz", label: "المسابقات", desc: "اختبر معلوماتك" },
  { href: "/calendar", label: "التقويم", desc: "جدول الدروس" },
];

export function HomeCategories() {
  return (
    <section className="home-section" aria-labelledby="home-categories-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">تصفح</p>
          <h2 id="home-categories-heading">التصنيفات</h2>
        </div>
      </div>
      <div className="home-feature-grid home-feature-grid--compact">
        {CATEGORIES.map((cat) => (
          <Link key={cat.href} href={cat.href} className="ui-card home-feature-card">
            <h3>{cat.label}</h3>
            <p>{cat.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
