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
    desc: "أرشيف يضم 90+ عالماً من مختلف العصور والتخصصات",
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
        <div>
          <p className="home-about__eyebrow home-eyebrow">من نحن</p>
          <h2 id="about-home-heading" className="home-about__title">عن المجلس العلمي</h2>
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
            background: "#f7fbf9", border: "1px solid #ddeee5",
            borderRadius: "0.85rem", padding: "0.9rem 0.85rem",
            display: "flex", flexDirection: "column", gap: "0.45rem",
          }}>
            <span style={{
              background: "#1F4D3A", color: "#FAF8F2",
              padding: "0.38rem", borderRadius: "0.4rem",
              display: "inline-flex", width: "fit-content",
            }}>
              <Icon size={15} strokeWidth={2} />
            </span>
            <strong style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.35 }}>{title}</strong>
            <span style={{ fontSize: "0.72rem", color: "#6b7280", lineHeight: 1.5 }}>{desc}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.65rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
        <Link href="/start-here" style={{
          background: "#1F4D3A", color: "#FAF8F2",
          padding: "0.55rem 1.2rem", borderRadius: "0.55rem",
          fontWeight: 700, fontSize: "0.83rem", textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: "0.3rem",
        }}>
          🎓 ابدأ من هنا ←
        </Link>
        <Link href="/sitemap" style={{
          background: "#f0f7f4", color: "#1F4D3A",
          padding: "0.55rem 1.1rem", borderRadius: "0.55rem",
          fontWeight: 700, fontSize: "0.83rem", textDecoration: "none",
          border: "1px solid #d1e9dc",
        }}>
          كل الأقسام
        </Link>
      </div>
    </section>
  );
}
