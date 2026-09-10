/**
 * ترحيل إعدادات الصلاة/الأذان بإصدار — idempotent.
 * لا يمسح اختيارات المستخدم؛ يصفّر القيم غير الصالحة فقط.
 */
import { loadAdhanPrefs, saveAdhanPrefs } from "./adhan-preferences";
import { loadPrayerAlertPrefs, savePrayerAlertPrefs } from "./prayer-alert-preferences";

export const PRAYER_SETTINGS_MIGRATION_VERSION = 2;
const STORE_KEY = "majalis-prayer-settings-migration-v";

function readMigrationVersion(): number {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function writeMigrationVersion(v: number): void {
  try {
    localStorage.setItem(STORE_KEY, String(v));
  } catch {
    /* ignore */
  }
}

/** يُشغَّل مرة عند الإقلاع. آمن للتكرار. */
export function migratePrayerSettingsIfNeeded(): {
  from: number;
  to: number;
  changed: boolean;
} {
  const from = readMigrationVersion();
  const to = PRAYER_SETTINGS_MIGRATION_VERSION;
  if (from >= to) {
    return { from, to: from, changed: false };
  }

  // v1→v2: تطبيع عبر load/save (full→short، دقائق غير صالحة، مؤذن غير مسموح)
  const adhan = loadAdhanPrefs();
  saveAdhanPrefs(adhan);
  const alerts = loadPrayerAlertPrefs();
  savePrayerAlertPrefs(alerts);

  writeMigrationVersion(to);
  if (import.meta.env.DEV) {
    console.info("[prayer/migration] ok", { from, to });
  }
  return { from, to, changed: true };
}
