import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import {
  ADMIN_V3_MOBILE_MORE,
  ADMIN_V3_MOBILE_PRIMARY,
  ADMIN_V3_NAV,
  resolveAdminV3Center,
  type AdminV3NavItem,
} from "./nav";
import { emitAdminV3AuditEvent } from "./audit-events";
import { AdminV3Offline } from "./states";
import "@/styles/pages/admin-v3-shell.css";

type Props = {
  children: ReactNode;
};

export function AdminV3Shell({ children }: Props) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const center = useMemo(() => resolveAdminV3Center(location), [location]);
  const [search, setSearch] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    emitAdminV3AuditEvent("admin.shell.open", location, { center: center.id });
  }, [location, center.id]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const displayName =
    user?.profile?.full_name || user?.email?.split("@")[0] || "مشرف";

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    emitAdminV3AuditEvent("admin.search.submit", location, { q: q || null });
  };

  const go = (item: AdminV3NavItem) => {
    emitAdminV3AuditEvent("admin.nav.select", item.path, { center: item.id });
    setMoreOpen(false);
    navigate(item.path);
  };

  return (
    <div className="av3-root" dir="rtl" data-admin-v3="shell">
      <a href="#av3-main" className="av3-skip">
        تخطّي إلى المحتوى
      </a>

      <aside className="av3-sidebar" aria-label="تنقّل لوحة التحكم">
        <div className="av3-brand">
          <span className="av3-brand__mark">سُنّة</span>
          <span className="av3-brand__sub">Admin v3</span>
        </div>
        <nav className="av3-sidebar__nav">
          {ADMIN_V3_NAV.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`av3-nav-item${center.id === item.id ? " is-active" : ""}`}
              aria-current={center.id === item.id ? "page" : undefined}
              onClick={() => go(item)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <Link
          href="/admin"
          className="av3-legacy-link"
          onClick={() =>
            emitAdminV3AuditEvent("admin.legacy.open", "/admin", { from: center.id })
          }
        >
          اللوحة السابقة (Legacy)
        </Link>
      </aside>

      <div className="av3-main-col">
        <header className="av3-topbar">
          <form className="av3-search" onSubmit={onSearch} role="search">
            <label className="av3-sr-only" htmlFor="av3-search-input">
              بحث في لوحة التحكم
            </label>
            <input
              id="av3-search-input"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث…"
              autoComplete="off"
            />
          </form>

          <div className="av3-topbar__actions">
            <div className="av3-menu">
              <button
                type="button"
                className="av3-icon-btn"
                aria-expanded={notifOpen}
                aria-haspopup="true"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setAccountOpen(false);
                  emitAdminV3AuditEvent("admin.notifications.open", location);
                }}
              >
                إشعارات
              </button>
              {notifOpen ? (
                <div className="av3-menu__panel" role="dialog" aria-label="الإشعارات">
                  <p className="av3-menu__empty">لا إشعارات جديدة.</p>
                </div>
              ) : null}
            </div>

            <div className="av3-menu">
              <button
                type="button"
                className="av3-icon-btn"
                aria-expanded={accountOpen}
                aria-haspopup="true"
                onClick={() => {
                  setAccountOpen((v) => !v);
                  setNotifOpen(false);
                  emitAdminV3AuditEvent("admin.account.menu", location);
                }}
              >
                {displayName}
              </button>
              {accountOpen ? (
                <div className="av3-menu__panel" role="menu">
                  <Link href="/" className="av3-menu__item" role="menuitem">
                    التطبيق العام
                  </Link>
                  <Link href="/admin" className="av3-menu__item" role="menuitem">
                    اللوحة السابقة
                  </Link>
                  <button
                    type="button"
                    className="av3-menu__item"
                    role="menuitem"
                    onClick={() => void logout()}
                  >
                    خروج
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <nav className="av3-breadcrumbs" aria-label="مسار التنقّل">
          <ol>
            <li>
              <Link href="/admin/v3">لوحة التحكم</Link>
            </li>
            {center.id !== "home" ? (
              <li aria-current="page">{center.label}</li>
            ) : (
              <li aria-current="page">الرئيسية</li>
            )}
          </ol>
        </nav>

        <main id="av3-main" className="av3-content" tabIndex={-1}>
          {!online ? <AdminV3Offline /> : children}
        </main>
      </div>

      <nav className="av3-bottom" aria-label="تنقّل سريع">
        {ADMIN_V3_MOBILE_PRIMARY.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`av3-bottom__item${center.id === item.id ? " is-active" : ""}`}
            aria-current={center.id === item.id ? "page" : undefined}
            onClick={() => go(item)}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          className={`av3-bottom__item${moreOpen || ADMIN_V3_MOBILE_MORE.some((m) => m.id === center.id) ? " is-active" : ""}`}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((v) => !v)}
        >
          المزيد
        </button>
      </nav>

      {moreOpen ? (
        <div className="av3-more-sheet" role="dialog" aria-label="المزيد">
          <ul>
            {ADMIN_V3_MOBILE_MORE.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => go(item)}>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="av3-btn" onClick={() => setMoreOpen(false)}>
            إغلاق
          </button>
        </div>
      ) : null}
    </div>
  );
}
