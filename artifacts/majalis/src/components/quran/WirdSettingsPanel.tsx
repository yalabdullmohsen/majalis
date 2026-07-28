/**
 * إعدادات الورد والتذكيرات داخل لوحة إعدادات المصحف.
 */
import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  getWirdGoal,
  saveWirdGoal,
  enableWirdNotifications,
  disableWirdNotifications,
  type WirdGoalType,
  type WirdGoalConfig,
} from "@/lib/wird-engine";

export function WirdSettingsPanel() {
  const [goal, setGoal] = useState<WirdGoalConfig>(() => getWirdGoal());
  const [notifMsg, setNotifMsg] = useState<string | null>(null);

  useEffect(() => {
    setGoal(getWirdGoal());
  }, []);

  const patch = (p: Partial<WirdGoalConfig>) => {
    const next = saveWirdGoal(p);
    setGoal(next);
  };

  const setType = (type: WirdGoalType) => {
    const defaults: Record<WirdGoalType, number> = { pages: 2, hizb: 1, minutes: 15 };
    patch({ type, target: defaults[type] });
  };

  const toggleNotif = async () => {
    if (goal.reminderEnabled) {
      disableWirdNotifications();
      setGoal(getWirdGoal());
      setNotifMsg("أُوقف التذكير");
      return;
    }
    const ok = await enableWirdNotifications();
    setGoal(getWirdGoal());
    setNotifMsg(ok ? "سيصلك تذكير لطيف في الوقت المحدد" : "يلزم السماح بالإشعارات من المتصفح");
  };

  return (
    <div className="wsp-panel">
      <div className="wsp-panel__head">
        <strong>هدف الورد اليومي</strong>
      </div>
      <div className="wsp-row" role="tablist" aria-label="نوع الهدف">
        {(
          [
            { id: "pages" as const, label: "صفحات" },
            { id: "hizb" as const, label: "أحزاب" },
            { id: "minutes" as const, label: "دقائق" },
          ]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className={`wsp-chip${goal.type === t.id ? " is-active" : ""}`}
            onClick={() => setType(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <label className="wsp-label">
        الكمية اليومية
        <input
          type="number"
          min={1}
          max={goal.type === "minutes" ? 180 : 60}
          value={goal.target}
          onChange={(e) => patch({ target: Math.max(1, Number(e.target.value) || 1) })}
        />
      </label>

      <div className="wsp-time">
        <label className="wsp-label">
          ساعة التذكير
          <input
            type="number"
            min={0}
            max={23}
            value={goal.reminderHour}
            onChange={(e) => patch({ reminderHour: Math.min(23, Math.max(0, Number(e.target.value) || 0)) })}
          />
        </label>
        <label className="wsp-label">
          الدقيقة
          <input
            type="number"
            min={0}
            max={59}
            value={goal.reminderMinute}
            onChange={(e) => patch({ reminderMinute: Math.min(59, Math.max(0, Number(e.target.value) || 0)) })}
          />
        </label>
      </div>

      <button type="button" className={`wsp-notif${goal.reminderEnabled ? " is-active" : ""}`} onClick={() => void toggleNotif()}>
        {goal.reminderEnabled ? <BellOff size={14} aria-hidden="true" /> : <Bell size={14} aria-hidden="true" />}
        {goal.reminderEnabled ? "إيقاف تذكير الورد" : "تفعيل تذكير المتصفح"}
      </button>
      {notifMsg && <p className="wsp-hint" role="status">{notifMsg}</p>}
    </div>
  );
}

export default WirdSettingsPanel;
