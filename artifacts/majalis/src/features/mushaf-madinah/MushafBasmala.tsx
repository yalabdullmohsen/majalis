import { useRef } from "react";
import type { QpcWord } from "@/lib/quran-data/qpc-page-data";
import { BASMALA_QPC_WORDS } from "@/lib/quran-data/basmala-qpc-words";

type Props = {
  /** كلمات QPC من صفحة الفاتحة (آية ١) — تُرسم بخط الصفحة */
  words?: QpcWord[] | null;
  /** هل يُعرض رقم الآية (الفاتحة فقط) — محرف الخط لا زخرفة */
  numbered?: boolean;
  selected?: boolean;
  playing?: boolean;
  onSelect?: () => void;
};

/**
 * مكوّن البسملة الوحيد.
 * - الفاتحة: محارف QPC من كلمات الصفحة + رقم ١.
 * - غيرها: محارف QPC V2 من ١:١ بخط qpc-v2-p1 (نفس شكل بسملة الفاتحة) وبمقاس --mm-qpc-size.
 */
export function MushafBasmala({
  words = null,
  numbered = false,
  selected = false,
  playing = false,
  onSelect,
}: Props) {
  const qpcWords = words && words.length > 0 ? words : BASMALA_QPC_WORDS;
  const body = qpcWords.filter((w) => w.charType !== "end");
  const end = qpcWords.find((w) => w.charType === "end") ?? null;
  const state = [selected ? "is-selected" : "", playing ? "is-playing" : ""].filter(Boolean).join(" ");
  const tapRef = useRef<{ x: number; y: number; timer: number; armed: boolean } | null>(null);
  const SHORT_SELECT_MS = 220;

  return (
    <div
      className={`mm-basmala mm-basmala--qpc ${state}`.trim()}
      data-testid="mushaf-basmala"
      data-basmala="qpc"
      dir="rtl"
      lang="ar"
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onPointerDown={(e) => {
        if (!onSelect) return;
        if (tapRef.current) window.clearTimeout(tapRef.current.timer);
        const timer = window.setTimeout(() => {
          const cur = tapRef.current;
          if (!cur || cur.armed) return;
          cur.armed = true;
          onSelect();
        }, SHORT_SELECT_MS);
        tapRef.current = { x: e.clientX, y: e.clientY, timer, armed: false };
      }}
      onPointerMove={(e) => {
        const cur = tapRef.current;
        if (!cur) return;
        if (Math.abs(e.clientX - cur.x) > 40 || Math.abs(e.clientY - cur.y) > 40) {
          window.clearTimeout(cur.timer);
          tapRef.current = null;
        }
      }}
      onPointerUp={() => {
        const cur = tapRef.current;
        if (!cur) return;
        window.clearTimeout(cur.timer);
        tapRef.current = null;
      }}
      onPointerCancel={() => {
        const cur = tapRef.current;
        if (cur) window.clearTimeout(cur.timer);
        tapRef.current = null;
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
    >
      <span className={`mm-ayah-run__text ${state}`.trim()}>
        {body.map((w) => (
          <span
            key={w.id}
            className="mm-ayah-line__word"
            data-ayah={w.verseKey}
            data-verse={w.verseKey}
          >
            {w.glyphText}
          </span>
        ))}
      </span>
      {numbered && end ? (
        <span
          className="mm-ayah-hit mm-ayah-hit--end mm-ayah-line__word"
          data-type="end"
          data-key={end.verseKey}
          data-ayah={end.verseKey}
        >
          {end.glyphText}
        </span>
      ) : null}
    </div>
  );
}
