import { useEffect, useRef, useState } from "react";
import { Clock, Landmark } from "lucide-react";
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
    <div className="anb-stack">
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
    <div className={`anb-toast${isAdhan ? " anb-toast--adhan" : " anb-toast--reminder"}`}>
      <span className="anb-toast__icon">
        {isAdhan ? <Landmark size={20} strokeWidth={1.5} /> : <Clock size={20} strokeWidth={1.5} />}
      </span>
      <div className="anb-toast__body">
        <div className="anb-toast__title">
          {isAdhan ? `حان وقت ${event.prayerName}` : `تنبيه: ${event.prayerName}`}
        </div>
        <div className="anb-toast__sub">
          {isAdhan
            ? "الله أكبر — حي على الصلاة"
            : `${event.prayerName} بعد ${event.minutesBefore} دقيقة`}
        </div>
      </div>
      <div className="anb-toast__actions">
        {isAdhan && playing && (
          <button type="button" onClick={handleStop} className="anb-btn" title="إيقاف الأذان">
            ⏹
          </button>
        )}
        <button type="button" onClick={onDismiss} className="anb-btn" title="إغلاق">
          ✕
        </button>
      </div>
    </div>
  );
}
