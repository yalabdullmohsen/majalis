/**
 * Word-by-word glossary chips inside the ayah action sheet.
 * Plays CDN word audio and shows transliteration + EN gloss when present.
 */
import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import {
  resolveWordAudioUrl,
  type QpcWord,
} from "@/lib/mushaf-v2-data";
import { triggerHaptic } from "@/lib/haptics";

type Props = {
  words: QpcWord[];
};

export function AyahWordGlossary({ words }: Props) {
  const contentWords = words.filter((w) => w.charType === "word" || w.charType === "Word");
  const [activeId, setActiveId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      try {
        audioRef.current?.pause();
      } catch {
        /* ignore */
      }
      audioRef.current = null;
    };
  }, []);

  if (!contentWords.length) return null;

  function playWord(w: QpcWord) {
    const url = resolveWordAudioUrl(w.audioUrl);
    setActiveId(w.id);
    triggerHaptic("selection");
    if (!url) return;
    try {
      audioRef.current?.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      void audio.play().catch(() => {
        /* autoplay / network */
      });
    } catch {
      /* ignore */
    }
  }

  const active = contentWords.find((w) => w.id === activeId) ?? null;

  return (
    <section className="aas-v3__glossary" aria-label="القاموس القرآني الفوري">
      <div className="aas-v3__glossary-head">
        <strong>كلمات الآية</strong>
        <span>انقر للنطق والمعنى</span>
      </div>
      <div className="aas-v3__glossary-chips" role="list">
        {contentWords.map((w) => (
          <button
            key={w.id}
            type="button"
            role="listitem"
            className={`aas-v3__glossary-chip${activeId === w.id ? " is-on" : ""}`}
            onClick={() => playWord(w)}
            aria-pressed={activeId === w.id}
          >
            <span className="aas-v3__glossary-ar" dir="rtl">
              {w.textUthmani || w.textQpcHafs}
            </span>
            {w.audioUrl ? <Volume2 size={12} aria-hidden="true" /> : null}
          </button>
        ))}
      </div>
      {active ? (
        <div className="aas-v3__glossary-detail" dir="rtl">
          <p className="aas-v3__glossary-word">{active.textUthmani || active.textQpcHafs}</p>
          {active.transliteration ? (
            <p className="aas-v3__glossary-tr" dir="ltr">
              {active.transliteration}
            </p>
          ) : null}
          {active.translationEn ? (
            <p className="aas-v3__glossary-en" dir="ltr">
              {active.translationEn}
            </p>
          ) : (
            <p className="aas-v3__glossary-hint">افتح التفسير أعلاه لمعنى الآية الكامل.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
