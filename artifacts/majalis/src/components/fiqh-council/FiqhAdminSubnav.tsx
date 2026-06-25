import { Link } from "wouter";
import { C } from "@/lib/theme";

const LINKS = [
  { href: "/admin", label: "المجمع الفقهي" },
  { href: "/admin/fiqh-review", label: "المراجعة العلمية" },
  { href: "/admin/fiqh-quality", label: "جودة البيانات" },
] as const;

export function FiqhAdminSubnav({ active }: { active: string }) {
  return (
    <nav className="fiqh-admin-subnav" aria-label="إدارة المجمع الفقهي">
      {LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={active === href ? "fiqh-admin-subnav-link fiqh-admin-subnav-link--active" : "fiqh-admin-subnav-link"}
          style={{
            color: active === href ? C.emeraldDeep : C.inkSoft,
            fontWeight: active === href ? 700 : 400,
          }}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
