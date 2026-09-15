/**
 * NotificationInbox — واجهة رقيقة فوق سجل الإشعارات المحلي.
 * لا يخزّن موقعًا ولا رموزًا؛ عناوين/نصوص فقط.
 */

import {
  addNotifRecord,
  archiveRecord,
  clearAll,
  deleteRecord,
  loadHistory,
  markAllRead,
  markRead,
  searchHistory,
  unreadCount,
  type NotifRecord,
} from "@/lib/notification-history";
import type { SunnahNotificationChannel } from "./channels";

export type InboxItem = NotifRecord & {
  channel?: SunnahNotificationChannel | "legacy";
};

export function listInbox(opts?: {
  includeArchived?: boolean;
  query?: string;
}): InboxItem[] {
  const q = opts?.query?.trim() ?? "";
  if (q) return searchHistory(q, Boolean(opts?.includeArchived)) as InboxItem[];
  const rows = loadHistory() as InboxItem[];
  if (opts?.includeArchived) return rows;
  return rows.filter((r) => !r.isArchived);
}

export function appendInboxItem(input: {
  title: string;
  body?: string;
  channel?: SunnahNotificationChannel;
}): InboxItem {
  return addNotifRecord(input.title, input.body, input.channel) as InboxItem;
}

export function markInboxRead(id: string): void {
  markRead(id);
}

export function markInboxAllRead(): void {
  markAllRead();
}

export function archiveInboxItem(id: string): void {
  archiveRecord(id);
}

export function deleteInboxItem(id: string): void {
  deleteRecord(id);
}

export function clearInbox(): void {
  clearAll();
}

export function inboxUnreadCount(): number {
  return unreadCount();
}
