import { useEffect, useState } from "react";
import { VolumeX } from "lucide-react";
import { ADHAN_EVENT_NAME, type AdhanEvent } from "@/lib/adhan-events";
import { isAdhanPlaying, stopAdhan } from "@/lib/adhan-playback";
import "@/styles/components/adhan-active-overlay.css";

const POST_ADHAN_DUA =
  "اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ.";

type Active = AdhanEvent & { open: boolean };

/**
 * طبقة كاملة أثناء الأذان: اسم الصلاة، المدينة، دعاء ما بعد الأذان، وإيقاف الصوت.
 */
export function AdhanActiveOverlay() {
  const [active, setActive] = useState<Active | null>(null);

  useEffect(() => {
    const onAdhan = (e: Event) => {
      const detail = (e as CustomEvent<AdhanEvent>).detail;
      if (detail?.type !== "adhan") return;
      setActive({ ...detail, open: true });
    };
    const onStopped = () => {
      setActive((prev) => (prev ? { ...prev, open: false } : null));
    };
    const onSwMessage = (event: MessageEvent) => {
      if (event.data?.type === "STOP_ADHAN") {
        stopAdhan();
        onStopped();
      }
    };

    window.addEventListener(ADHAN_EVENT_NAME, onAdhan);
    window.addEventListener("majalis:adhan-stopped", onStopped);
    navigator.serviceWorker?.addEventListener?.("message", onSwMessage);
    return () => {
      window.removeEventListener(ADHAN_EVENT_NAME, onAdhan);
      window.removeEventListener("majalis:adhan-stopped", onStopped);
      navigator.serviceWorker?.removeEventListener?.("message", onSwMessage);
    };
  }, []);

  if (!active?.open) return null;

  return (
    <div
      className="aao-root"
      role="dialog"
      aria-modal="true"
      aria-label={`أذان ${active.prayerName}`}
      dir="rtl"
    >
      <div className="aao-panel">
        <p className="aao-eyebrow">حان وقت الصلاة</p>
        <h2 className="aao-title">{active.prayerName}</h2>
        {active.cityName ? <p className="aao-city">{active.cityName}</p> : null}

        <div className="aao-dua">
          <p className="aao-dua__label">دعاء ما بعد الأذان</p>
          <p className="aao-dua__text">{POST_ADHAN_DUA}</p>
        </div>

        {isAdhanPlaying() || active.open ? (
          <button
            type="button"
            className="aao-stop"
            onClick={() => {
              stopAdhan();
              setActive((prev) => (prev ? { ...prev, open: false } : null));
            }}
          >
            <VolumeX size={18} strokeWidth={2} aria-hidden="true" />
            إيقاف الأذان
          </button>
        ) : null}

        <button
          type="button"
          className="aao-dismiss"
          onClick={() => setActive((prev) => (prev ? { ...prev, open: false } : null))}
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}
