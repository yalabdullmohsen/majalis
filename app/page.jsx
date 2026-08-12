"use client";
// =====================================================================
//  app/page.jsx — الصفحة الرئيسية
// =====================================================================

import Link from "next/link";
import { C } from "@/lib/theme";

const SECTIONS = [
  { href: "/lessons", title: "الدروس والدورات", desc: "محاضرات ودورات شرعية منظّمة حسب التخصص والمحافظة" },
  { href: "/sheikhs", title: "المشايخ والدعاة", desc: "نخبة من المشايخ والدعاة المعتمدين بسيرهم العلمية" },
  { href: "/library", title: "المكتبة العلمية", desc: "كتب ومتون وتفريغات وملخصات وتسجيلات" },
  { href: "/miracles", title: "الإعجاز العلمي", desc: "مقالات موثّقة في الإعجاز العلمي بضوابط شرعية وعلمية" },
  { href: "/fawaid", title: "الفوائد الدينية", desc: "فوائد موجزة للتذكر، ومساهمات الزوار بعد المراجعة" },
];

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-5 pb-16 pt-10">
      {/* القسم الترحيبي */}
      <section
        className="rounded-lg p-5 mb-6 text-center"
        style={{ background: `linear-gradient(180deg, ${C.parchmentDeep}, ${C.parchment})`, border: `2px solid ${C.emerald}` }}
      >
        <h1 className="text-3xl font-bold mb-3" style={{ color: C.emeraldDeep, fontFamily: "Amiri, serif" }}>
          منصة مجالس
        </h1>
        <p className="text-base leading-relaxed mb-5" style={{ color: C.ink, maxWidth: "42rem", marginInline: "auto" }}>
          المرجع الرقمي للمحتوى العلمي الشرعي: الدروس والدورات، المشايخ المعتمدون،
          المكتبة العلمية، والإعجاز العلمي في القرآن والسنة — في مكان واحد موثوق.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/lessons" className="text-sm font-bold px-5 py-2.5 rounded-md" style={{ background: C.emerald, color: C.parchment }}>
            تصفّح الدروس
          </Link>
          <Link href="/login" className="text-sm font-bold px-5 py-2.5 rounded-md border" style={{ borderColor: C.emerald, color: C.emeraldDeep }}>
            أنشئ حسابك
          </Link>
        </div>
      </section>

      {/* بطاقات الأقسام */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href}>
            <div className="rounded-md border p-5" style={{ borderColor: C.line, background: C.panel, height: "100%" }}>
              <h2 className="text-lg font-bold mb-2" style={{ color: C.emeraldDeep }}>{s.title}</h2>
              <p className="text-sm leading-relaxed" style={{ color: C.inkSoft }}>{s.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <footer className="text-center text-xs mt-10" style={{ color: C.inkSoft }}>
        مجالس — منصة علمية شرعية · جميع المحتوى يُراجع قبل النشر
      </footer>
    </div>
  );
}
