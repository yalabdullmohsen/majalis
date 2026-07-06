// تاريخ الإشعارات — تخزين محلي مع قراءة/أرشفة/حذف

const HISTORY_KEY = "majalis_notif_history_v1";
const MAX_RECORDS = 200;

export type NotifRecord = {
  id: string;
  title: string;
  body?: string;
  createdAt: string;   // ISO
  isRead: boolean;
  isArchived: boolean;
  tag?: string;
};

function now(): string {
  return new Date().toISOString();
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadHistory(): NotifRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as NotifRecord[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(records: NotifRecord[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)));
  } catch { /* quota exceeded */ }
}

export function addNotifRecord(title: string, body?: string, tag?: string): NotifRecord {
  const record: NotifRecord = { id: makeId(), title, body, createdAt: now(), isRead: false, isArchived: false, tag };
  const history = loadHistory();
  // منع التكرار بنفس العنوان خلال 5 ثوانٍ
  const recent = history[0];
  if (recent && recent.title === title && Date.now() - new Date(recent.createdAt).getTime() < 5000) {
    return recent;
  }
  saveHistory([record, ...history]);
  return record;
}

export function markRead(id: string): void {
  saveHistory(loadHistory().map(r => r.id === id ? { ...r, isRead: true } : r));
}

export function markAllRead(): void {
  saveHistory(loadHistory().map(r => ({ ...r, isRead: true })));
}

export function archiveRecord(id: string): void {
  saveHistory(loadHistory().map(r => r.id === id ? { ...r, isArchived: true } : r));
}

export function deleteRecord(id: string): void {
  saveHistory(loadHistory().filter(r => r.id !== id));
}

export function clearAll(): void {
  saveHistory([]);
}

export function unreadCount(): number {
  return loadHistory().filter(r => !r.isRead && !r.isArchived).length;
}

export function searchHistory(query: string, includeArchived = false): NotifRecord[] {
  const q = query.trim().toLowerCase();
  return loadHistory().filter(r => {
    if (!includeArchived && r.isArchived) return false;
    if (!q) return !r.isArchived || includeArchived;
    return r.title.toLowerCase().includes(q) || (r.body ?? "").toLowerCase().includes(q);
  });
}
