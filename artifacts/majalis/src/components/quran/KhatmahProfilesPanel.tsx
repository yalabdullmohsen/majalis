/**
 * لوحة ملفات الختمة المتعددة + حالة المزامنة.
 */
import { useEffect, useState } from "react";
import { Cloud, CloudOff, Plus } from "lucide-react";
import { toArabicDigits } from "@/lib/utils";
import {
  ensureDefaultKhatmahProfiles,
  listKhatmahWithMeta,
  setActiveKhatmahPlanId,
  getActiveKhatmahPlanId,
  createNamedKhatmah,
  syncProgressAcrossDevices,
  type KhatmahProfileKind,
} from "@/lib/khatmah-sync";

const PRESETS: { name: string; days: number; kind: KhatmahProfileKind }[] = [
  { name: "ختمة رمضان السريعة", days: 30, kind: "ramadan" },
  { name: "دراسة وتدبّر", days: 120, kind: "study" },
  { name: "مراجعة الحفظ", days: 90, kind: "memorization" },
];

export function KhatmahProfilesPanel() {
  const [plans, setPlans] = useState(() => listKhatmahWithMeta());
  const [active, setActive] = useState(() => getActiveKhatmahPlanId());
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "synced" | "local-only" | "offline">("idle");

  const refresh = () => {
    setPlans(listKhatmahWithMeta());
    setActive(getActiveKhatmahPlanId());
  };

  useEffect(() => {
    ensureDefaultKhatmahProfiles();
    refresh();
    void syncProgressAcrossDevices().then(setSyncState);
  }, []);

  return (
    <div className="khp-panel">
      <div className="khp-panel__head">
        <strong>ملفات الختمة</strong>
        <span className="khp-sync" title="مزامنة التقدّم">
          {syncState === "synced" ? <Cloud size={14} aria-hidden="true" /> : <CloudOff size={14} aria-hidden="true" />}
          {syncState === "syncing" ? "جارٍ…" : syncState === "synced" ? "متزامن" : syncState === "offline" ? "دون اتصال" : "محلي"}
        </span>
      </div>
      <ul className="khp-list">
        {plans.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              className={`khp-card${active === p.id ? " is-active" : ""}`}
              style={{ ["--khp-color" as string]: p.meta?.color ?? "#0E6E52" }}
              onClick={() => {
                setActiveKhatmahPlanId(p.id);
                setActive(p.id);
                void syncProgressAcrossDevices().then(setSyncState);
              }}
            >
              <span className="khp-card__name">{p.name}</span>
              <span className="khp-card__meta">
                {toArabicDigits(p.totalPagesRead)} / ٦٠٤ · {toArabicDigits(p.targetDays)} يومًا
              </span>
              <span className="khp-card__bar" style={{ width: `${Math.min(100, (p.totalPagesRead / 604) * 100)}%` }} />
            </button>
          </li>
        ))}
      </ul>
      <div className="khp-presets">
        {PRESETS.map((pr) => (
          <button
            key={pr.kind}
            type="button"
            className="khp-add"
            onClick={() => {
              createNamedKhatmah(pr.name, pr.days, pr.kind);
              refresh();
            }}
          >
            <Plus size={12} aria-hidden="true" /> {pr.name}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="khp-add"
        onClick={() => {
          void syncProgressAcrossDevices().then(setSyncState);
        }}
      >
        مزامنة الآن
      </button>
    </div>
  );
}

export default KhatmahProfilesPanel;
