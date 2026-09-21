/**
 * عقد أحداث التدقيق — Admin v3.
 * لا يغيّر صلاحيات/RLS؛ يسجّل نوايا واجهة فقط محليًا حتى تُربط بخلفية لاحقًا.
 */
export const ADMIN_V3_AUDIT_EVENT_TYPES = [
  "admin.shell.open",
  "admin.nav.select",
  "admin.search.submit",
  "admin.account.menu",
  "admin.notifications.open",
  "admin.center.view",
  "admin.legacy.open",
] as const;

export type AdminV3AuditEventType = (typeof ADMIN_V3_AUDIT_EVENT_TYPES)[number];

export type AdminV3AuditEvent = {
  type: AdminV3AuditEventType;
  at: string;
  path: string;
  meta?: Record<string, string | number | boolean | null>;
};

const MAX_BUFFER = 100;
const buffer: AdminV3AuditEvent[] = [];

export function emitAdminV3AuditEvent(
  type: AdminV3AuditEventType,
  path: string,
  meta?: AdminV3AuditEvent["meta"],
): AdminV3AuditEvent {
  const event: AdminV3AuditEvent = {
    type,
    at: new Date().toISOString(),
    path,
    meta,
  };
  buffer.push(event);
  if (buffer.length > MAX_BUFFER) buffer.shift();
  return event;
}

export function listAdminV3AuditEvents(): readonly AdminV3AuditEvent[] {
  return buffer;
}

export function clearAdminV3AuditEvents(): void {
  buffer.length = 0;
}
