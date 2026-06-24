import { Link } from "wouter";
import { C } from "@/lib/theme";

const LINKS = [
  { href: "/privacy", label: "سياسة الخصوصية" },
  { href: "/terms", label: "شروط الاستخدام" },
  { href: "/contact", label: "تواصل معنا" },
  { href: "/about", label: "عن المنصة" },
];

export default function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${C.line}`, background: C.emeraldDeep, color: C.parchment }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "2rem 1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", alignItems: "start" }}>
        <div>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.55rem", color: C.parchment, fontFamily: "Amiri, serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            <img src="/brand/majlis-logo.svg" alt="" style={{ width: 42, height: 42 }} />
            المجلس العلمي
          </Link>
          <p style={{ maxWidth: "34rem", margin: 0, color: "#E8E0CE", fontSize: "0.875rem", lineHeight: 1.9 }}>
            منصة علمية شرعية تجمع الدروس والمشايخ والمكتبة العلمية والإعجاز والفوائد المختارة، مع عناية بالتوثيق والمراجعة.
          </p>
        </div>

        <nav aria-label="روابط تذييل الموقع" style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} style={{ color: "#E8E0CE", fontSize: "0.875rem" }}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div style={{ borderTop: "1px solid rgba(250,245,234,0.15)", padding: "0.875rem 1rem", textAlign: "center", color: "#D7CDAF", fontSize: "0.8125rem" }}>
        جميع الحقوق محفوظة لمنصة مجالس © {new Date().getFullYear()}
      </div>
    </footer>
  );
}
