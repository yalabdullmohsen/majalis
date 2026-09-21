import { Link } from "wouter";
import { ADMIN_V3_NAV } from "./nav";
import { emitAdminV3AuditEvent, listAdminV3AuditEvents } from "./audit-events";
import { ADMIN_V3_CENTERS } from "./centers/catalog";

export function AdminV3Dashboard() {
  const recent = listAdminV3AuditEvents().slice(-5).reverse();

  return (
    <div className="av3-dash">
      <header className="av3-dash__hero">
        <h1 className="av3-dash__title">لوحة التحكم</h1>
        <p className="av3-dash__sub">
          Admin v3 — المراكز جاهزة كواجهات تشغيلية فوق المسارات السابقة. لا حذف لـ Legacy حتى Wave 7،
          ولا تغيير صلاحيات/CRUD في هذه الموجة.
        </p>
      </header>

      <section className="av3-dash__grid" aria-label="مراكز سريعة">
        {ADMIN_V3_NAV.filter((n) => n.id !== "home").map((item) => {
          const tools =
            item.id === "audit"
              ? 0
              : (ADMIN_V3_CENTERS[item.id as keyof typeof ADMIN_V3_CENTERS]?.tools.length ?? 0);
          return (
            <article key={item.id} className="av3-dash__card">
              <h2>{item.label}</h2>
              <p>{item.description}</p>
              <p className="av3-dash__meta">
                {item.id === "audit" ? "سجل أحداث محلي" : `${tools} أداة موثّقة`}
              </p>
              <div className="av3-dash__card-actions">
                <Link
                  href={item.path}
                  className="av3-btn av3-btn--primary"
                  onClick={() =>
                    emitAdminV3AuditEvent("admin.center.view", item.path, { center: item.id })
                  }
                >
                  فتح المركز
                </Link>
                {item.legacyHref ? (
                  <Link
                    href={item.legacyHref}
                    className="av3-btn"
                    onClick={() =>
                      emitAdminV3AuditEvent("admin.legacy.open", item.legacyHref!, {
                        center: item.id,
                      })
                    }
                  >
                    Legacy
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>

      <section className="av3-dash__audit" aria-label="آخر أحداث التدقيق">
        <h2>آخر أحداث التدقيق (محلي)</h2>
        {recent.length === 0 ? (
          <p className="av3-state__body">لا أحداث بعد في هذه الجلسة.</p>
        ) : (
          <ul>
            {recent.map((e) => (
              <li key={`${e.at}-${e.type}`}>
                <code>{e.type}</code> · {e.path}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
