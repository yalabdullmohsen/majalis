import type { SmartReminder } from "@/hooks/useSmartPrayerReminders";

type Props = {
  reminder: SmartReminder | null;
  onEnableNotifications?: () => void;
};

export function SmartReminderBanner({ reminder, onEnableNotifications }: Props) {
  if (!reminder) return null;

  return (
    <div className={`prayer-smart-reminder is-${reminder.type}`} role="status">
      <p>{reminder.message}</p>
      {onEnableNotifications && typeof Notification !== "undefined" && Notification.permission === "default" && (
        <button type="button" onClick={onEnableNotifications}>
          تفعيل الإشعارات
        </button>
      )}
    </div>
  );
}
