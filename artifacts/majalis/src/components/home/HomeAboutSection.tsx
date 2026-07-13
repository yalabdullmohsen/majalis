import { Link } from "wouter";
import { BookMarked, GraduationCap, Scale, Users } from "lucide-react";

const PILLARS = [
  {
    Icon: GraduationCap,
    title: "العلم الشرعي الموثّق",
    desc: "محتوى مُراجَع من مصادر معتمدة في القرآن والسنة والفقه والعقيدة",
  },
  {
    Icon: Users,
    title: "علماء متخصصون",
    desc: "أرشيف يضم 115+ عالم من مختلف العصور والتخصصات",
  },
  {
    Icon: Scale,
    title: "الدقة والأمانة",
    desc: "كل مسألة تُرجع إلى مصدرها، وكل حكم يُذكر دليله",
  },
  {
    Icon: BookMarked,
    title: "متاح للجميع",
    desc: "من المبتدئ إلى المتخصص، بلغة عربية واضحة وأدوات تفاعلية",
  },
];

export function HomeAboutSection() {
  return (
    <section className="home-about home-section" aria-labelledby="about-home-heading" dir="rtl">
      <div className="home-section-head">
        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20">
            <polygon points="10,1 13,7 20,7 15,12 17,19 10,15 3,19 5,12 0,7 7,7" fill="#176B57"/>
            <polygon points="10,4 12.5,8.5 17.5,8.5 13.5,12 15,17 10,14 5,17 6.5,12 2.5,8.5 7.5,8.5" fill="#176B57" opacity="0.5"/>
          </svg>
          <div>
            <p className="home-about__eyebrow home-eyebrow">من نحن</p>
            <h2 id="about-home-heading" className="home-about__title">عن المجلس العلمي</h2>
          </div>
        </div>
      </div>

      <div className="home-about__body">
        <p>
          المجلس العلمي منصة إسلامية رقمية متخصصة تجمع طلاب العلم الشرعي وعموم المسلمين في مكان واحد،
          تُقدّم دروساً علمية من مشايخ متخصصين، وفتاوى شرعية معتمدة، ومحتوى يومياً في
          القرآن الكريم والسنة النبوية والأذكار والفقه، كل ذلك بلغة عربية واضحة مع حرص تام
          على الدقة والأمانة في نقل العلم الشرعي.
        </p>
        <p>
          انطلقت المنصة لتكون مرجعاً أميناً يُسهم في نشر العلم الشرعي النافع وتيسير الوصول إليه
          لكل مسلم حيثما كان، مع توفير أدوات عملية كمواقيت الصلاة والمسبحة الرقمية وإذاعات القرآن
          الكريم، وذلك كله خدمةً لدين الله وابتغاءً لمرضاته.
        </p>
      </div>

      {/* أعمدة المنصة */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px,1fr))",
        gap: "0.65rem", marginTop: "1.25rem",
      }}>
        {PILLARS.map(({ Icon, title, desc }) => (
          <div key={title} style={{
            background: "linear-gradient(145deg,#f5fbf8,#edf7f2)",
            border: "1px solid #cce8d8",
            borderRadius: "0.85rem", padding: "0.95rem 0.9rem",
            display: "flex", flexDirection: "column", gap: "0.5rem",
            position: "relative", overflow: "hidden",
          }}>
            <svg aria-hidden="true" style={{
              position: "absolute", bottom: "-12px", left: "-12px", opacity: 0.06, pointerEvents: "none",
            }} width="60" height="60" viewBox="0 0 60 60">
              <polygon points="30,3 40,20 57,20 45,33 50,50 30,41 10,50 15,33 3,20 20,20" fill="#176B57"/>
            </svg>
            <span style={{
              background: "linear-gradient(135deg,#176B57,#176B57)", color: "#FAF8F2",
              padding: "0.4rem", borderRadius: "0.45rem",
              display: "inline-flex", width: "fit-content",
              boxShadow: "0 2px 6px rgba(15,50,30,0.2)",
            }}>
              <Icon size={15} strokeWidth={2} />
            </span>
            <strong style={{ fontSize: "0.83rem", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.35 }}>{title}</strong>
            <span style={{ fontSize: "0.72rem", color: "#5a6b63", lineHeight: 1.5 }}>{desc}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.65rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
        <Link href="/learning-path" style={{
          background: "linear-gradient(135deg,#176B57,#176B57)", color: "#FAF8F2",
          padding: "0.55rem 1.2rem", borderRadius: "0.55rem",
          fontWeight: 700, fontSize: "0.83rem", textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: "0.3rem",
          boxShadow: "0 2px 8px rgba(15,50,30,0.22)",
        }}>
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 3 1 7l8 4 8-4-8-4z"/><path d="M5 9.5v3.5a4 4 0 0 0 8 0V9.5"/></svg>
          ابدأ من هنا ←
        </Link>
        <Link href="/sitemap" style={{
          background: "#edf6f1", color: "#176B57",
          padding: "0.55rem 1.1rem", borderRadius: "0.55rem",
          fontWeight: 700, fontSize: "0.83rem", textDecoration: "none",
          border: "1px solid #c8e6d5",
        }}>
          كل الأقسام
        </Link>
      </div>
    </section>
  );
}
