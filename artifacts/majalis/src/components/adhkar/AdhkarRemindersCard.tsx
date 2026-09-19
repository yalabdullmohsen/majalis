/**
 * بطاقة تفعيل تذكيرات الأذكار من صفحة الأذكار — بدون تفعيل افتراضي للإذن.
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ensureDhikrPhraseRemindersScheduled,
  cancelNativeDhikrPhraseReminders,
} from "@/lib/dhikr-phrase-reminders";
import {
  loadNotifPrefs,
  saveNotifPrefs,
  type NotifPrefs,
} from "@/lib/local-notifications";
import { syncSmartLocalNotifications } from "@/lib/smart-local-notifications";
import { SettingsToggleRow } from "@/components/design-system/SettingsList";

export function AdhkarRemindersCard() {
  const [prefs, setPrefs] = useState<NotifPrefs>(() => loadNotifPrefs());
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setPrefs(loadNotifPrefs());
  }, []);

  const apply = useCallback(async (next: NotifPrefs) => {
    setBusy(true);
    setStatus(null);
    try {
      saveNotifPrefs(next);
      setPrefs(next);
      await syncSmartLocalNotifications();
      if (next.dhikrPhraseReminder) {
        const r = await ensureDhikrPhraseRemindersScheduled();
        setStatus(
          r.ok
            ? `تم جدولة ${r.scheduled} تذكيرًا للذكر.`
            : r.reason === "permission"
              ? "يلزم إذن الإشعارات لتفعيل التذكيرات."
              : "تعذّر جدولة تذكيرات الذكر.",
        );
      } else {
        await cancelNativeDhikrPhraseReminders();
        setStatus(next.adhkarReminder ? "تم تحديث تذكيرات الأذكار." : "أُوقفَت تذكيرات الأذكار.");
      }
    } catch {
      setStatus("تعذّر حفظ التذكيرات.");
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <section className="soft-card soft-card--on-light" aria-labelledby="adhkar-reminders-title">
      <h2 id="adhkar-reminders-title" className="text-base font-semibold mb-1">
        تذكيرات الأذكار
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        صباح · مساء · نوم · بعد الصلاة، مع عبارات الذكر خلال اليوم. لا يُفعَّل الإذن تلقائيًا.
      </p>
      <SettingsToggleRow
        id="adhkar-page-adhkar"
        title="تذكير أذكار الصباح والمساء والنوم"
        checked={prefs.adhkarReminder}
        disabled={busy}
        onChange={(v) =>
          apply({
            ...prefs,
            adhkarReminder: v,
            sections: {
              ...prefs.sections,
              adhkar: { ...prefs.sections.adhkar, enabled: v },
            },
          })
        }
      />
      <SettingsToggleRow
        id="adhkar-page-dhikr"
        title="تذكير بعبارات الذكر (سبحان الله، الحمد لله…)"
        checked={prefs.dhikrPhraseReminder}
        disabled={busy}
        onChange={(v) => apply({ ...prefs, dhikrPhraseReminder: v })}
      />
      {status ? (
        <p className="text-sm mt-2" role="status">
          {status}
        </p>
      ) : null}
      <p className="text-sm mt-3">
        <Link href="/adhan-settings">إعدادات الأذان والإشعارات</Link>
      </p>
    </section>
  );
}
