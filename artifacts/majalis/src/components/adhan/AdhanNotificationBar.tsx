import { useEffect, useRef, useState } from "react";
import { X, Volume2, Clock, Landmark } from "lucide-react";
import { ADHAN_EVENT_NAME, type AdhanEvent } from "@/lib/adhan-events";
import { isAdhanPlaying, stopAdhan } from "@/lib/adhan-playback";
import {
  buildScheduledPrayerNotificationCopy,
} from "@/lib/prayer-notification-copy";
import "@/styles/components/adhan-notification.css";

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
    <div className="anb-stack" role="region" aria-label="إشعارات الصلاة" aria-live="polite">
      {events.map((ev) => (
        <AdhanToast key={ev.id} event={ev} onDismiss={() => dismiss(ev.id)} />
      ))}
    </div>
  );
}

function AdhanToast({ event, onDismiss }: { event: ActiveEvent; onDismiss: () => void }) {
  const isAdhan = event.type === "adhan";
  const isIqamah = event.type === "iqamah";
  const [playing, setPlaying] = useState(isAdhan && isAdhanPlaying());
  const copy = isAdhan
    ? buildScheduledPrayerNotificationCopy({
        kind: "enter",
        prayerName: event.prayerName,
        prayerTimeLabel: event.prayerTimeLabel ?? "",
      })
    : isIqamah
      ? buildScheduledPrayerNotificationCopy({
          kind: "iqamah",
          prayerName: event.prayerName,
          prayerTimeLabel: event.prayerTimeLabel ?? "",
        })
      : buildScheduledPrayerNotificationCopy({
          kind: "pre",
          prayerName: event.prayerName,
          prayerTimeLabel: event.prayerTimeLabel ?? "",
          minutesBefore: event.minutesBefore ?? 15,
        });

  const sub = event.cityName
    ? `${copy.body} · ${event.cityName}`
    : copy.body;

  function handleStop() {
    stopAdhan();
    setPlaying(false);
  }

  return (
    <div
      className={`anb-toast${isAdhan || isIqamah ? " anb-toast--adhan" : " anb-toast--reminder"}`}
      role="alert"
    >
      <span className="anb-toast__emoji" aria-hidden="true">
        {isAdhan || isIqamah ? <Landmark size={22} strokeWidth={1.8} /> : <Clock size={22} strokeWidth={1.8} />}
      </span>

      <div className="anb-toast__body">
        <p className="anb-toast__title">{copy.title}</p>
        <p className="anb-toast__sub">{sub}</p>
      </div>

      <div className="anb-toast__actions">
        {isAdhan && playing && (
          <button
            type="button"
            onClick={handleStop}
            className="anb-btn anb-btn--mute"
            aria-label="إيقاف صوت الأذان"
          >
            <Volume2 size={15} strokeWidth={2} />
          </button>
        )}
        {isAdhan && !playing && (
          <span className="anb-muted-tag" aria-label="الأذان صامت">صامت</span>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="anb-btn anb-btn--close"
          aria-label="إغلاق الإشعار"
        >
          <X size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
