/**
 * تنقّل Admin v3 — مراكز Wave 5/6.
 * Legacy يبقى على /admin حتى Wave 7.
 */
export type AdminV3CenterId =
  | "home"
  | "content"
  | "review"
  | "users"
  | "notifications"
  | "analytics"
  | "automation"
  | "system"
  | "settings"
  | "audit";

export type AdminV3NavItem = {
  id: AdminV3CenterId;
  label: string;
  path: string;
  /** عنصر Bottom Nav للهاتف (5 فقط) */
  mobilePrimary?: boolean;
  /** يظهر تحت «المزيد» على الهاتف */
  mobileMore?: boolean;
  description: string;
  /** مسار Legacy مؤقت إلى اكتمال الترحيل */
  legacyHref?: string;
};

export const ADMIN_V3_BASE = "/admin/v3";

export const ADMIN_V3_NAV: readonly AdminV3NavItem[] = [
  {
    id: "home",
    label: "الرئيسية",
    path: ADMIN_V3_BASE,
    mobilePrimary: true,
    description: "نظرة اليوم والمهام السريعة",
  },
  {
    id: "content",
    label: "المحتوى",
    path: `${ADMIN_V3_BASE}/content`,
    mobilePrimary: true,
    description: "إدارة المحتوى الموحّدة",
    legacyHref: "/admin?section=lessons",
  },
  {
    id: "review",
    label: "المراجعة",
    path: `${ADMIN_V3_BASE}/review`,
    mobilePrimary: true,
    description: "طابور المراجعة الموحّد",
    legacyHref: "/admin/review-hub",
  },
  {
    id: "analytics",
    label: "التحليلات",
    path: `${ADMIN_V3_BASE}/analytics`,
    mobilePrimary: true,
    description: "مساحة التحليلات",
    legacyHref: "/admin?section=search-analytics",
  },
  {
    id: "users",
    label: "المستخدمون",
    path: `${ADMIN_V3_BASE}/users`,
    mobileMore: true,
    description: "المستخدمون والأدوار",
    legacyHref: "/admin?section=users",
  },
  {
    id: "notifications",
    label: "الإشعارات",
    path: `${ADMIN_V3_BASE}/notifications`,
    mobileMore: true,
    description: "قنوات الإشعار والسياسات",
    legacyHref: "/admin?section=telegram",
  },
  {
    id: "automation",
    label: "الأتمتة",
    path: `${ADMIN_V3_BASE}/automation`,
    mobileMore: true,
    description: "الأتمتة والطوابير",
    legacyHref: "/admin/automation/center",
  },
  {
    id: "system",
    label: "النظام",
    path: `${ADMIN_V3_BASE}/system`,
    mobileMore: true,
    description: "المراقبة والوظائف",
    legacyHref: "/admin/feature-status",
  },
  {
    id: "settings",
    label: "الإعدادات",
    path: `${ADMIN_V3_BASE}/settings`,
    mobileMore: true,
    description: "إعدادات لوحة التحكم",
    legacyHref: "/admin?section=settings",
  },
  {
    id: "audit",
    label: "سجل التدقيق",
    path: `${ADMIN_V3_BASE}/audit`,
    mobileMore: true,
    description: "أحداث التدقيق المحلية",
  },
] as const;

export const ADMIN_V3_MOBILE_PRIMARY = ADMIN_V3_NAV.filter((n) => n.mobilePrimary);
export const ADMIN_V3_MOBILE_MORE = ADMIN_V3_NAV.filter((n) => n.mobileMore);

export function resolveAdminV3Center(pathname: string): AdminV3NavItem {
  const clean = pathname.split("?")[0] || ADMIN_V3_BASE;
  if (clean === ADMIN_V3_BASE || clean === `${ADMIN_V3_BASE}/`) {
    return ADMIN_V3_NAV[0]!;
  }
  const hit = ADMIN_V3_NAV.find(
    (n) => n.id !== "home" && (clean === n.path || clean.startsWith(`${n.path}/`)),
  );
  return hit ?? ADMIN_V3_NAV[0]!;
}
