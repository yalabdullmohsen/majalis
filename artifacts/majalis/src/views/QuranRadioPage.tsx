import { useRef, useState } from "react";
import { PageHeader } from "@/components/ui-common";
import { QURAN_RADIO_STATIONS } from "@/lib/quran-content";

export default function QuranRadioPage() {
  const [active, setActive] = useState(QURAN_RADIO_STATIONS[0]?.id || "");
  const audioRef = useRef<HTMLAudioElement>(null);
  const station = QURAN_RADIO_STATIONS.find((s) => s.id === active);

  return (
    <div className="page-shell">
      <PageHeader eyebrow="القرآن" title="إذاعة القرآن" subtitle="بث مباشر لإذاعات قرآنية موثوقة." />

      <div className="radio-grid">
        {QURAN_RADIO_STATIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`radio-card ui-card${active === item.id ? " is-active" : ""}`}
            onClick={() => {
              setActive(item.id);
              setTimeout(() => audioRef.current?.play().catch(() => undefined), 50);
            }}
          >
            <strong>{item.name}</strong>
            <span>{item.quality}</span>
            {item.reciter && <span>{item.reciter}</span>}
            <span className="radio-card__status">{active === item.id ? "يعمل" : "تشغيل"}</span>
          </button>
        ))}
      </div>

      {station && (
        <div className="radio-player ui-card">
          <p>{station.name}</p>
          <audio ref={audioRef} controls src={station.streamUrl} className="radio-audio" />
        </div>
      )}
    </div>
  );
}
