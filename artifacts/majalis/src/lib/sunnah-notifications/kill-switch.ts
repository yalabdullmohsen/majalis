/**
 * إيقاف إرسال النظام الجديد دون حذف تفضيلات المستخدم.
 * لا يعيد تشغيل النظام القديم تلقائيًا.
 */

export const SUNNAH_NOTIF_KILL_SWITCH_KEY = "sunnah.notifications.killSwitch.v1";

export function isSunnahNotificationsKillSwitchOn(): boolean {
  try {
    return localStorage.getItem(SUNNAH_NOTIF_KILL_SWITCH_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSunnahNotificationsKillSwitch(on: boolean): void {
  try {
    if (on) localStorage.setItem(SUNNAH_NOTIF_KILL_SWITCH_KEY, "1");
    else localStorage.removeItem(SUNNAH_NOTIF_KILL_SWITCH_KEY);
  } catch {
    /* ignore */
  }
}
