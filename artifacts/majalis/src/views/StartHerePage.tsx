import { useEffect } from "react";
import { Link } from "wouter";
import { BookOpen, GraduationCap, Route } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { PageShell } from "@/components/layout/PageShell";
import "@/styles/pages/methodology.css";

const LEVELS = [
  {
    href: "/tawhid",
    title: "مبتدئ",
    desc: "عقيدة مختصرة، أركان الإسلام، أذكار يومية، ودليل الصلاة — أساس ثابت قبل التوسّع.",
    Icon: Route,
  },
  {
    href: "/lessons",
    title: "متوسط",
    desc: "دروس ودورات في الفقه والحديث والسيرة، مع كتب مصاحبة وجدول أسبوعي.",
    Icon: BookOpen,
  },
  {
    href: "/adab-talab-ilm",
    title: "متقدم",
    desc: "دليل طالب العلم وأصول أعمق لمن أتمّ التأسيس ويريد ترتيب الطلب.",
    Icon: GraduationCap,
  },
] as const;

const STEPS = [
  { href: "/tawhid", label: "التوحيد والعقيدة" },
  { href: "/arkan", label: "أركان الإسلام" },
  { href: "/salah-guide", label: "دليل الصلاة" },
  { href: "/adhkar", label: "الأذكار اليومية" },
  { href: "/seerah", label: "السيرة النبوية" },
  { href: "/adab-talab-ilm", label: "دليل طالب العلم" },
] as const;

export default function StartHerePage() {
  useEffect(() => {
    applyPageSeo({
      path: "/start-here",
      title: "ابدأ من هنا — دليل المبتدئ",
      description:
        "مسار تعريفي للمبتدئ في المجلس العلمي: عقيدة، صلاة، أذكار، سيرة، ثم الدروس والدورات حسب مستواك.",
    });
  }, []);

  return (
    <PageShell density="airy" className="start-here-page">
      <header className="meth-hero" style={{ marginBlockStart: "1rem" }}>
        <p className="meth-eyebrow">للزائر الجديد</p>
        <h1>ابدأ من هنا</h1>
        <p>
          ثلاثة مستويات واضحة، ثم خطوات عملية تصل بك إلى أول درس دون ضياع في القوائم.
        </p>
      </header>

      <section aria-labelledby="levels-heading" className="meth-section">
        <h2 id="levels-heading">اختر مستواك</h2>
        <div className="meth-grid" style={{ display: "grid", gap: "0.75rem" }}>
          {LEVELS.map(({ href, title, desc, Icon }) => (
            <Link key={title} href={href} className="meth-card" style={{ textDecoration: "none", color: "inherit" }}>
              <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
              <strong style={{ display: "block", marginBlock: "0.35rem" }}>{title}</strong>
              <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.85 }}>{desc}</p>
              <span style={{ display: "inline-block", marginBlockStart: "0.5rem", fontWeight: 700 }}>
                ابدأ من هنا ←
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="steps-heading" className="meth-section">
        <h2 id="steps-heading">خطوات مقترحة</h2>
        <ol style={{ paddingInlineStart: "1.25rem", lineHeight: 1.9 }}>
          {STEPS.map((s) => (
            <li key={s.href}>
              <Link href={s.href}>{s.label}</Link>
            </li>
          ))}
        </ol>
      </section>

      <p style={{ marginBlock: "1.5rem" }}>
        <Link href="/lessons" className="btn-primary">
          استعرض الدروس والدورات
        </Link>
      </p>
    </PageShell>
  );
}
