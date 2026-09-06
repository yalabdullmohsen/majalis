/**
 * نقطة استيراد موحّدة لإعدادات الأذان/الإشعارات.
 * يعيد تصدير الجدولة والتفضيلات دون سحب تفاصيل التنفيذ.
 */
export {
  rescheduleAllReminders,
  cancelAllReminders,
  getLastRescheduleAt,
  testReminderNotification,
  previewReminderSound,
  refreshReligiousRemindersSchedule,
  onPrayerLocationOrCalcChanged,
  installRemindersRescheduleListeners,
  REMINDER_NOTIF_ID_BASE,
  REMINDER_NOTIF_ID_END,
} from "./notification-reminders-schedule";

export {
  loadNotifRemindersPrefs,
  saveNotifRemindersPrefs,
  patchNotifRemindersPrefs,
  NOTIF_REMINDERS_CHANGED_EVENT,
  type NotifRemindersPreferences,
} from "./notification-reminders-preferences";
