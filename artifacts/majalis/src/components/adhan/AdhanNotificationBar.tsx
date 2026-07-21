import { useEffect, useRef, useState } from "react";
import { ADHAN_EVENT_NAME, type AdhanEvent } from "@/lib/adhan-scheduler";
import { stopAdhan } from "@/lib/adhan-audio";

type ActiveEvent = AdhanEvent & { id: number };

export function AdhanNotificationBar() {
  const [events, setEvents] = useState<ActiveEvent[]>([]);
  const counter = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => () => { timersRef.current.forEach(clearTimeout); timersRef.current.clear(); }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AdhanEvent>).detail;
      const id = ++counter.current;
      setEvents((prev) => [...prev, { ...detail, id }]);
      // Auto-dismiss after 60s
      const t = setTimeout(() => { dismiss(id); timersRef.current.delete(id); }, 60_000);
      timersRef.current.set(id, t);
    };
    window.addEventListener(ADHAN_EVENT_NAME, handler);
    return () => window.removeEventListener(ADHAN_EVENT_NAME, handler);
  }, []);

  function dismiss(id: number) {
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id)!);
      timersRef.current.delete(id);
    }
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  if (events.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      top: "4.5rem",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 2000,
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      width: "min(92vw, 420px)",
      direction: "rtl",
    }}>
      {events.map((ev) => (
        <AdhanToast key={ev.id} event={ev} onDismiss={() => dismiss(ev.id)} />
      ))}
    </div>
  );
}

function AdhanToast({ event, onDismiss }: { event: ActiveEvent; onDismiss: () => void }) {
  const isAdhan = event.type === "adhan";
  const [playing, setPlaying] = useState(isAdhan);

  function handleStop() {
    stopAdhan();
    setPlaying(false);
  }

  return (
    <div style={{
      background: isAdhan ? "linear-gradient(135deg, #134a3a, #0c3020)" : "#1d4ed8",
      color: "#fff",
      borderRadius: "0.875rem",
      padding: "0.875rem 1rem",
      boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      animation: "adhan-slide-in 0.35s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>
        {isAdhan ? "🕌" : "⏰"}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.15rem" }}>
          {isAdhan ? `حان وقت ${event.prayerName}` : `تنبيه: ${event.prayerName}`}
        </div>
        <div style={{ fontSize: "0.78rem", opacity: 0.85 }}>
          {isAdhan
            ? "حان وقت الصلاة؛ يرجى ضبط الهاتف على الوضع الصامت وعدم إشغال المصلين."
            : `اقترب وقت الصلاة (${event.minutesBefore} د)، تذكّر ضبط هاتفك على الوضع الصامت احترامًا للمصلين.`}
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
        {isAdhan && playing && (
          <button
            type="button"
            onClick={handleStop}
            style={toastBtnStyle("#ffffff22")}
            title="إيقاف الأذان"
          >
            ⏹
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          style={toastBtnStyle("#ffffff22")}
          title="إغلاق"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function toastBtnStyle(bg: string) {
  return {
    background: bg,
    border: "none",
    color: "#fff",
    borderRadius: "0.4rem",
    width: 30,
    height: 30,
    cursor: "pointer",
    fontSize: "0.85rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as const;
}
