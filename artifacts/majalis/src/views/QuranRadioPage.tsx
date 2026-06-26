"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui-common";
import { QURAN_RADIO_STATIONS } from "@/lib/quran-content";
import { useUserPreferences } from "@/components/UserPreferencesProvider";

const LAST_RADIO_KEY = "majalis-last-radio-v1";

function getLastRadio(): string {
  try {
    return localStorage.getItem(LAST_RADIO_KEY) || QURAN_RADIO_STATIONS[0]?.id || "";
  } catch {
    return QURAN_RADIO_STATIONS[0]?.id || "";
  }
}

export default function QuranRadioPage() {
  const [active, setActive] = useState(getLastRadio);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { preferences, updatePreferences } = useUserPreferences();
  const station = QURAN_RADIO_STATIONS.find((s) => s.id === active);

  useEffect(() => {
    try {
      localStorage.setItem(LAST_RADIO_KEY, active);
    } catch {
      /* ignore */
    }
  }, [active]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = Number(preferences.radioVolume) / 100;
  }, [preferences.radioVolume, station]);

  const togglePlay = (id: string) => {
    setActive(id);
    setTimeout(() => {
      const audio = audioRef.current;
      if (!audio) return;
      if (playing && active === id) {
        audio.pause();
        setPlaying(false);
      } else {
        audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      }
    }, 50);
  };

  return (
    <div className="page-shell">
      <PageHeader eyebrow="القرآن" title="إذاعات القرآن الكريم" subtitle="بث مباشر لإذاعات قرآنية موثوقة — الكويت والسعودية وغيرها." />

      <nav className="quran-subnav" aria-label="أقسام القرآن">
        <Link href="/quran" className="quran-subnav__link">المصحف</Link>
        <Link href="/quran/tajweed" className="quran-subnav__link">التجويد</Link>
        <Link href="/quran/surah-stories" className="quran-subnav__link">قصص السور</Link>
        <Link href="/quran-live" className="quran-subnav__link">البث المباشر</Link>
        <Link href="/quran-radio" className="quran-subnav__link is-active">الإذاعات</Link>
      </nav>

      <div className="radio-grid">
        {QURAN_RADIO_STATIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`radio-card ui-card${active === item.id ? " is-active" : ""}`}
            onClick={() => togglePlay(item.id)}
          >
            <strong>{item.name}</strong>
            <span>{item.quality}</span>
            {item.reciter && <span>{item.reciter}</span>}
            <span className="radio-card__status">
              {active === item.id && playing ? "● يعمل" : "تشغيل"}
            </span>
          </button>
        ))}
      </div>

      {station && (
        <div className="radio-player ui-card">
          <p><strong>{station.name}</strong></p>
          <p className="settings-note">جودة البث: {station.quality}</p>
          <label className="settings-field">
            <span>مستوى الصوت</span>
            <input
              type="range"
              min={0}
              max={100}
              value={preferences.radioVolume}
              onChange={(e) => updatePreferences({ radioVolume: e.target.value })}
            />
          </label>
          <audio
            ref={audioRef}
            controls
            src={station.streamUrl}
            className="radio-audio"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        </div>
      )}
    </div>
  );
}
