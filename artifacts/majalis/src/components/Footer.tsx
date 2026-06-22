import { Link } from "wouter";
import { C } from "@/lib/theme";

const LINKS: { href: string; label: string }[] = [
  { href: "/lessons", label: "الدروس والدورات" },
  { href: "/sheikhs", label: "المشايخ والدعاة" },
  { href: "/library", label: "المكتبة العلمية" },
  { href: "/miracles", label: "الإعجاز العلمي" },
  { href: "/qa", label: "الأسئلة والأجوبة" },
  { href: "/fawaid", label: "الفوائد" },
  { href: "/about", label: "عن المنصة" },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ background: C.emeraldDeep, color: C.parchment, marginTop: "auto" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "2.5rem 1.25rem 1.75rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.75rem", alignItems: "start" }}>
          <div>
            <p style={{ fontFamily: "Amiri, serif", fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem" }}>مجالس</p>
            <p style={{ fontSize: "0.8125rem", color: "#E8E0CE", lineHeight: 1.9, margin: 0, maxWidth: "26rem" }}>
              المنصة العلمية الشرعية — الدروس والمشايخ والمكتبة والإعجاز العلمي والفوائد والأسئلة والأجوبة، مجتمعةً في مكانٍ واحد، موثّقة ومعتمدة.
            </p>
          </div>
          <nav aria-label="روابط سريعة">
            <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", color: C.brass, margin: "0 0 0.875rem" }}>روابط سريعة</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1rem" }}>
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{ fontSize: "0.8125rem", color: "#E8E0CE", textDecoration: "none", lineHeight: 1.6 }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        <div style={{ height: 1, background: C.brass, opacity: 0.3, margin: "1.75rem 0 1.25rem" }} />

        <p style={{ fontSize: "0.75rem", color: "#C9BFA6", textAlign: "center", margin: 0 }}>
          © {year} منصة مجالس — جميع الحقوق محفوظة
        </p>
      </div>
    </footer>
  );
}
