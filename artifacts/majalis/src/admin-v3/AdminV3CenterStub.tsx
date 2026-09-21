import { Link } from "wouter";
import { useEffect } from "react";
import { emitAdminV3AuditEvent, listAdminV3AuditEvents } from "./audit-events";
import { resolveAdminV3Center, type AdminV3CenterId } from "./nav";
import { AdminV3Empty } from "./states";
import { useLocation } from "wouter";

const TITLES: Record<Exclude<AdminV3CenterId, "home">, string> = {
  content: "مركز المحتوى",
  review: "مركز المراجعة",
  users: "المستخدمون والأدوار",
  notifications: "الإشعارات",
  analytics: "التحليلات",
  automation: "الأتمتة",
  system: "النظام",
  settings: "الإعدادات",
  audit: "سجل التدقيق",
};

export function AdminV3CenterStub() {
  const [location] = useLocation();
  const center = resolveAdminV3Center(location);

  useEffect(() => {
    emitAdminV3AuditEvent("admin.center.view", location, { center: center.id });
  }, [location, center.id]);

  if (center.id === "home") return null;

  if (center.id === "audit") {
    const events = listAdminV3AuditEvents().slice().reverse();
    return (
      <div className="av3-center">
        <h1>{TITLES.audit}</h1>
        <p className="av3-dash__sub">عقد أحداث الواجهة — لا يغيّر الصلاحيات أو RLS.</p>
        {events.length === 0 ? (
          <AdminV3Empty title="لا أحداث بعد" body="تنقّل داخل اللوحة لتسجيل أحداث محلية." />
        ) : (
          <ul className="av3-audit-list">
            {events.map((e) => (
              <li key={`${e.at}-${e.type}-${e.path}`}>
                <time dateTime={e.at}>{e.at}</time>
                <code>{e.type}</code>
                <span>{e.path}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const title = TITLES[center.id as Exclude<AdminV3CenterId, "home">] ?? center.label;

  return (
    <div className="av3-center">
      <h1>{title}</h1>
      <AdminV3Empty
        title="المركز قيد البناء"
        body={`${center.description}. سيُكمَّل في Wave 6 دون حذف Legacy.`}
        action={
          center.legacyHref ? (
            <Link href={center.legacyHref} className="av3-btn av3-btn--primary">
              فتح المسار السابق
            </Link>
          ) : undefined
        }
      />
    </div>
  );
}
