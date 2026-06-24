import { Link } from "wouter";
import { C, QA_DISCLAIMER } from "@/lib/theme";

const SECTIONS = [
  { href: "/lessons", title: "الدروس والدورات", desc: "تصفّح الدروس العلمية الشرعية وابحث فيها حسب التصنيف والمدينة، ويمكن للأعضاء التسجيل فيها." },
  { href: "/sheikhs", title: "المشايخ والدعاة", desc: "دليل المشايخ المعتمدين بإجازاتهم العلمية وتخصصاتهم وصفحات تفصيلية لكل شيخ ودروسه." },
  { href: "/library", title: "المكتبة العلمية", desc: "كتب ومتون وتفريغات وملخصات ومقالات ومواد صوتية ومرئية مصنّفة وقابلة للبحث." },
  { href: "/miracles", title: "الإعجاز العلمي", desc: "مقالات في الإعجاز العلمي موثّقة من الكتاب والسنة، قابلة للتصفية حسب التصنيف والمصدر." },
  { href: "/qa", title: "الأسئلة والأجوبة", desc: "أسئلة وأجوبة دينية مدعّمة بالأدلة والمراجع، مع بيان نوع الحكم في المسائل الشرعية." },
  { href: "/fawaid", title: "الفوائد", desc: "فوائد دينية مختارة ومراجَعة، ويمكن للأعضاء اقتراح فوائد تُعرض بعد اعتمادها." },
];

const PRINCIPLES = [
  { icon: "✓", title: "التوثيق", desc: "كل مادة علمية مدعّمة بالدليل والمرجع، ولا يُنشر شيء قبل المراجعة." },
  { icon: "✦", title: "الاعتماد", desc: "المشايخ والدروس معتمدون، والمحتوى يُراجَع من أهل الاختصاص." },
  { icon: "♡", title: "الإتاحة", desc: "العلم الشرعي متاح للجميع مجانًا وبواجهة عربية واضحة وسهلة." },
];

export default function AboutPage() {
  return (
    <div>
      {/* hero */}
      <div style={{ background: C.emeraldDeep, color: C.parchment }}>
        <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "3.5rem 1.25rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.875rem", color: C.brass, letterSpacing: "0.08em", marginBottom: "0.6rem", fontWeight: 600 }}>عن المنصة</p>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 700, fontFamily: "Amiri, serif", margin: "0 0 0.75rem" }}>مجالس العلم</h1>
          <div style={{ width: "3rem", height: 2, background: C.brass, margin: "0 auto 1.25rem" }} />
          <p style={{ fontSize: "1.0625rem", color: "#E8E0CE", lineHeight: 1.9, margin: 0 }}>
            مجالس العلم منصة علمية شرعية متخصصة تجمع الدروس والمحاضرات والدورات والكتب والفوائد والأسئلة الشرعية في مكان واحد بطريقة احترافية ومنظمة، لتسهيل الوصول إلى المحتوى العلمي الموثوق.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "3rem 1.25rem 4rem" }}>
        {/* mission */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: C.emeraldDeep, fontFamily: "Amiri, serif", margin: "0 0 0.75rem" }}>رسالتنا</h2>
          <p style={{ fontSize: "1rem", color: C.ink, lineHeight: 2, margin: 0 }}>
            نسعى إلى تيسير الوصول إلى العلم الشرعي الموثّق، وجمع شتاته المتفرّق في مصدرٍ واحد منظّم،
            وربط طالب العلم بالمشايخ المعتمدين ومصادرهم. نحرص على أن يكون كل ما يُنشر مدعّمًا بالدليل
            والمرجع، مرتّبًا حسب التصنيف، سهل البحث والوصول.
          </p>
        </div>

        {/* principles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "3rem" }}>
          {PRINCIPLES.map((p) => (
            <div key={p.title} style={{ padding: "1.5rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel, borderTop: `3px solid ${C.brass}` }}>
              <div style={{ fontSize: "1.5rem", color: C.brass, marginBottom: "0.5rem" }}>{p.icon}</div>
              <p style={{ fontWeight: 700, color: C.emeraldDeep, margin: "0 0 0.4rem", fontSize: "1.0625rem", fontFamily: "Amiri, serif" }}>{p.title}</p>
              <p style={{ fontSize: "0.875rem", color: C.inkSoft, margin: 0, lineHeight: 1.7 }}>{p.desc}</p>
            </div>
          ))}
        </div>

        {/* sections */}
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: C.emeraldDeep, fontFamily: "Amiri, serif", margin: "0 0 1.25rem" }}>أقسام المنصة</h2>
        <div style={{ display: "grid", gap: "0.875rem", marginBottom: "3rem" }}>
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", padding: "1.25rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel }}>
                <div style={{ width: "0.5rem", alignSelf: "stretch", borderRadius: "999px", background: C.emerald, flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 700, color: C.emeraldDeep, margin: "0 0 0.35rem", fontSize: "1.0625rem", fontFamily: "Amiri, serif" }}>{s.title}</p>
                  <p style={{ fontSize: "0.875rem", color: C.inkSoft, margin: 0, lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* disclaimer */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "1.25rem", borderRadius: "0.5rem", border: `1px solid ${C.brass}`, background: "#FBF3DE" }}>
          <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>⚠️</span>
          <p style={{ margin: 0, fontSize: "0.9rem", color: C.brassDeep, lineHeight: 1.8, fontWeight: 600 }}>{QA_DISCLAIMER}</p>
        </div>
      </div>
    </div>
  );
}
