"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "wouter";
import { PageHeader, Loading } from "@/components/ui-common";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { PrayerRanksContent } from "@/views/PrayerRanksPage";
import {
  KUWAIT_GOVERNORATES,
  getSelectedGovernorate,
  setSelectedGovernorate,
} from "@/lib/prayer-times";

type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
type PrayerTrack = {
  status: "pending" | "done" | "missed";
  congregation: boolean;
  place: "mosque" | "home";
  timing: "early" | "late";
};

const TRACK_STORAGE = "majalis-prayer-tracker-v1";
const PRAYER_KEYS: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const PRAYER_LABELS: Record<PrayerKey, string> = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};
const PRAYER_ICONS: Record<PrayerKey, string> = {
  fajr: "🌙",
  dhuhr: "☀️",
  asr: "🌤️",
  maghrib: "🌅",
  isha: "🌃",
};

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait" }).format(new Date());
}

function emptyDay(): Record<PrayerKey, PrayerTrack> {
  return Object.fromEntries(PRAYER_KEYS.map((key) => [key, {
    status: "pending",
    congregation: false,
    place: "home",
    timing: "early",
  }])) as Record<PrayerKey, PrayerTrack>;
}

function readTracker(): Record<string, Record<PrayerKey, PrayerTrack>> {
  try { return JSON.parse(localStorage.getItem(TRACK_STORAGE) || "{}"); }
  catch { return {}; }
}

function writeTracker(data: Record<string, Record<PrayerKey, PrayerTrack>>) {
  localStorage.setItem(TRACK_STORAGE, JSON.stringify(data));
}

const TABS = [
  { id: "times", label: "مواقيت الصلاة" },
  { id: "ranks", label: "مراتب الناس في الصلاة" },
] as const;
type TabId = (typeof TABS)[number]["id"];

// ─── Floating Prayer Tracker ───────────────────────────────────────────────

function PrayerTrackerSheet({
  today,
  stats,
  onUpdate,
}: {
  today: Record<PrayerKey, PrayerTrack>;
  stats: { todayDone: number; todayMissed: number };
  onUpdate: (key: PrayerKey, patch: Partial<PrayerTrack>) => void;
}) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const donePct = (stats.todayDone / 5) * 100;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      {/* FAB button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="متابعة الصلوات"
        style={{
          position: "fixed",
          bottom: "5rem",
          left: "1rem",
          width: 54,
          height: 54,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--ds-emerald, #1a6b4a), var(--ds-emerald-deep, #0f4730))",
          color: "#fff",
          border: "none",
          boxShadow: "0 4px 16px rgba(22,78,60,0.35)",
          cursor: "pointer",
          fontSize: "1.4rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 900,
          transition: "transform 0.2s",
          transform: open ? "rotate(45deg) scale(0.9)" : "none",
        }}
      >
        {open ? "✕" : "📋"}
      </button>

      {/* Badge showing progress */}
      {!open && (
        <div
          style={{
            position: "fixed",
            bottom: "8.2rem",
            left: "0.85rem",
            background: stats.todayDone === 5 ? "#22c55e" : stats.todayDone === 0 ? "#ef4444" : "#0E6E52",
            color: "#fff",
            fontSize: "0.6rem",
            fontWeight: 700,
            borderRadius: "50%",
            width: 20,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 901,
            border: "2px solid #fff",
          }}
        >
          {stats.todayDone}/5
        </div>
      )}

      {/* Backdrop */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 950,
          }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 960,
          background: "#fff",
          borderRadius: "1.25rem 1.25rem 0 0",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.15)",
          transform: open ? "translateY(0)" : "translateY(110%)",
          transition: "transform 0.32s cubic-bezier(0.34,1.56,0.64,1)",
          maxHeight: "72vh",
          overflowY: "auto",
          direction: "rtl",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "0.75rem" }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, background: "#e5e7eb" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "0.875rem 1.25rem 0.5rem", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--ds-ink-soft, #888)" }}>اليوم</p>
              <h3 style={{ margin: "0.1rem 0 0", fontSize: "1.1rem", fontWeight: 700, color: "var(--ds-ink, #1a1a1a)" }}>
                متابعة الصلوات
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "#888" }}
            >
              ✕
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#888", marginBottom: "0.3rem" }}>
              <span>{stats.todayDone} من 5 مكتملة</span>
              <span style={{ color: donePct === 100 ? "#22c55e" : "inherit" }}>{Math.round(donePct)}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "#f0f0f0" }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 999,
                  background: donePct === 100 ? "#22c55e" : "var(--ds-emerald, #1a6b4a)",
                  width: `${donePct}%`,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        </div>

        {/* Prayer rows */}
        <div style={{ padding: "0.5rem 1.25rem 1.5rem" }}>
          {PRAYER_KEYS.map((key) => {
            const row = today[key];
            const isDone = row.status === "done";
            const isMissed = row.status === "missed";
            return (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 0",
                  borderBottom: "1px solid #f5f5f5",
                }}
              >
                <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{PRAYER_ICONS[key]}</span>
                <div style={{ flex: 1 }}>
                  <p style={{
                    margin: 0,
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: isDone ? "#22c55e" : isMissed ? "#ef4444" : "var(--ds-ink, #1a1a1a)",
                  }}>
                    {PRAYER_LABELS[key]}
                  </p>
                  <p style={{ margin: "0.1rem 0 0", fontSize: "0.72rem", color: "#888" }}>
                    {isDone ? "✓ تمت" : isMissed ? "✗ فاتت" : "بانتظار"}
                    {row.congregation ? " · جماعة" : ""}
                    {row.place === "mosque" ? " · مسجد" : ""}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => onUpdate(key, { status: isDone ? "pending" : "done" })}
                    style={{
                      padding: "0.4rem 0.75rem",
                      borderRadius: "var(--ds-radius, 0.5rem)",
                      border: "none",
                      background: isDone ? "#22c55e" : "#f0fdf4",
                      color: isDone ? "#fff" : "#22c55e",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      minWidth: 48,
                    }}
                  >
                    {isDone ? "✓" : "تمت"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate(key, { status: isMissed ? "pending" : "missed" })}
                    style={{
                      padding: "0.4rem 0.75rem",
                      borderRadius: "var(--ds-radius, 0.5rem)",
                      border: "none",
                      background: isMissed ? "#ef4444" : "#fef2f2",
                      color: isMissed ? "#fff" : "#ef4444",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      minWidth: 48,
                    }}
                  >
                    {isMissed ? "✗" : "فاتت"}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Quick options for congregation/place */}
          <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "#f9fafb", borderRadius: "0.75rem" }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", fontWeight: 700, color: "#888" }}>تفاصيل الصلاة</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {PRAYER_KEYS.map((key) => {
                const row = today[key];
                if (row.status !== "done") return null;
                return (
                  <div key={key} style={{ background: "#fff", borderRadius: "0.5rem", padding: "0.5rem 0.625rem", border: "1px solid #e5e7eb" }}>
                    <p style={{ margin: "0 0 0.3rem", fontSize: "0.7rem", fontWeight: 600, color: "var(--ds-ink, #1a1a1a)" }}>{PRAYER_LABELS[key]}</p>
                    <select
                      value={row.place}
                      onChange={(e) => onUpdate(key, { place: e.target.value as PrayerTrack["place"] })}
                      style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 4, fontSize: "0.7rem", padding: "0.2rem", background: "#fff", fontFamily: "inherit", color: "var(--ds-ink, #1a1a1a)" }}
                    >
                      <option value="mosque">مسجد</option>
                      <option value="home">بيت</option>
                    </select>
                    <label style={{ display: "flex", gap: "0.3rem", alignItems: "center", marginTop: "0.25rem", fontSize: "0.7rem", cursor: "pointer" }}>
                      <input type="checkbox" checked={row.congregation} onChange={(e) => onUpdate(key, { congregation: e.target.checked })} />
                      جماعة
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function PrayerTimesPage() {
  const search = useSearch();
  const initialTab: TabId = new URLSearchParams(search).get("tab") === "ranks" ? "ranks" : "times";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const [selectedGovId, setSelectedGovId] = useState(() => getSelectedGovernorate().id);

  function handleGovChange(id: string) {
    setSelectedGovernorate(id);
    setSelectedGovId(id);
  }

  const { data, countdown, loading } = usePrayerCountdown(selectedGovId);
  const obligatory = data?.prayers.filter((p) => p.obligatory) || [];
  const sunrise = data?.prayers.find((p) => p.key === "Sunrise") || null;

  const [store, setStore] = useState(() => readTracker());
  const dateKey = todayKey();
  const today = store[dateKey] || emptyDay();

  const updatePrayer = useCallback((key: PrayerKey, patch: Partial<PrayerTrack>) => {
    setStore((prev) => {
      const nextDay = { ...(prev[dateKey] || emptyDay()), [key]: { ...(prev[dateKey]?.[key] || emptyDay()[key]), ...patch } };
      const next = { ...prev, [dateKey]: nextDay };
      writeTracker(next);
      return next;
    });
  }, [dateKey]);

  const stats = useMemo(() => {
    const totalToday = Object.values(today);
    return {
      todayDone: totalToday.filter((p) => p.status === "done").length,
      todayMissed: totalToday.filter((p) => p.status === "missed").length,
    };
  }, [today]);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="العبادة"
        title="مواقيت الصلاة"
        subtitle="مواقيت الصلاة في الكويت مع عدّاد تنازلي يتحدّث كل ثانية."
      />

      {/* Tab bar */}
      <div className="prayer-page-tabs" role="tablist" aria-label="أقسام الصلاة">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`prayer-page-tab${activeTab === tab.id ? " prayer-page-tab--active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Governorate selector */}
      {activeTab === "times" && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          margin: "0.75rem 0",
          padding: "0.65rem 1rem",
          background: "#f0fdf4",
          border: "1.5px solid #bbf7d0",
          borderRadius: "0.875rem",
          direction: "rtl",
        }}>
          <span style={{ fontSize: "1rem", flexShrink: 0 }}>📍</span>
          <label
            htmlFor="gov-select"
            style={{ fontSize: "0.82rem", fontWeight: 700, color: "#134a3a", flexShrink: 0 }}
          >
            المحافظة:
          </label>
          <select
            id="gov-select"
            value={selectedGovId}
            onChange={(e) => handleGovChange(e.target.value)}
            style={{
              flex: 1,
              border: "1px solid #bbf7d0",
              borderRadius: "0.5rem",
              padding: "0.35rem 0.6rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#134a3a",
              background: "#fff",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            {KUWAIT_GOVERNORATES.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          {data?.city && (
            <span style={{ fontSize: "0.7rem", color: "#6b7280", flexShrink: 0 }}>
              {data.source}
            </span>
          )}
        </div>
      )}

      {activeTab === "ranks" && <PrayerRanksContent />}

      {activeTab === "times" && (loading ? (
        <Loading />
      ) : data && countdown ? (
        <>
          <div className="prayer-status-card ui-card">
            <p className="prayer-status-card__label">الصلاة القادمة</p>
            <h2>{countdown.next?.name || "غير محدد"}</h2>
            <p className="prayer-status-card__countdown prayer-countdown-hms" aria-live="polite">
              {countdown.remainingHms}
            </p>
            {countdown.current && (
              <p className="prayer-status-card__current">الوقت الحالي: {countdown.current.name}</p>
            )}
            <p className="prayer-status-card__date">{data.date.readable || data.date.gregorian}</p>
          </div>

          {/* Prayer times grid */}
          <div className="prayer-times-grid">
            {obligatory.map((p) => (
              <div
                key={p.key}
                className={`prayer-time-cell ui-card${countdown.next?.key === p.key ? " is-next" : ""}`}
              >
                <span>{p.name}</span>
                <strong>{p.time}</strong>
              </div>
            ))}

            {/* Sunrise row — distinctive orange style */}
            {sunrise && (
              <div
                className="prayer-time-cell ui-card"
                style={{
                  gridColumn: "1 / -1",
                  background: "linear-gradient(135deg, #FEF9C3, #FEF08A)",
                  border: "1.5px solid #CA8A04",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem 1.25rem",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600, color: "#854D0E" }}>
                  ☀️ الشروق
                  <span style={{ fontSize: "0.7rem", fontWeight: 400, color: "#713F12", padding: "0.1rem 0.4rem", background: "#FEF08A", borderRadius: 999 }}>
                    وقت الكراهة
                  </span>
                </span>
                <strong style={{ fontSize: "1.1rem", color: "#854D0E" }}>{sunrise.time}</strong>
              </div>
            )}
          </div>

          {/* Adhan settings shortcut */}
          <a
            href="/adhan-settings"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1rem",
              marginTop: "0.75rem",
              background: "#f0fdf4",
              border: "1.5px solid #bbf7d0",
              borderRadius: "0.875rem",
              textDecoration: "none",
              color: "#134a3a",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>🔔</span>
            <span>إعدادات الأذان والإشعارات</span>
            <span style={{ marginRight: "auto", fontSize: "0.8rem", color: "#6b7280" }}>←</span>
          </a>

          {/* Floating prayer tracker */}
          <PrayerTrackerSheet today={today} stats={stats} onUpdate={updatePrayer} />
        </>
      ) : (
        <p className="lessons-empty-state">تعذر تحميل المواقيت حالياً.</p>
      ))}
    </div>
  );
}
