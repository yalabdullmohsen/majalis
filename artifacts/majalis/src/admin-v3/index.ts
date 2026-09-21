export { ADMIN_V3_BASE, ADMIN_V3_NAV, resolveAdminV3Center } from "./nav";
export {
  ADMIN_V3_AUDIT_EVENT_TYPES,
  emitAdminV3AuditEvent,
  listAdminV3AuditEvents,
} from "./audit-events";
/** لا تصدّر Shell/App من البرميل — يمنع سحب CSS في بوابات Node */
