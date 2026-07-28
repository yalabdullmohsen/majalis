/**
 * مقارنة تفاسير جنبًا إلى جنب أو مكدّسة لآية واحدة.
 */
import { useEffect, useState } from "react";
import { Columns2, Rows2 } from "lucide-react";
import { fetchTafsirAyahs } from "@/lib/quran-api";
import { MUSHAF_TAFSIR_EDITIONS } from "@/lib/tafsir-seed";
import { yieldToMain } from "@/lib/yield-to-main";

const COMPARE_IDS = ["ar.muyassar", "ar.sadi", "en.ibnukathir", "ar.baghawi"] as const;

type Props = {
  surahNum: number;
  ayahNum: number;
  open: boolean;
};

export function TafsirComparePanel({ surahNum, ayahNum, open }: Props) {
  const [layout, setLayout] = useState<"stack" | "side">("stack");
  const [selected, setSelected] = useState<string[]>(["ar.muyassar", "ar.sadi"]);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || selected.length === 0) return;
    let alive = true;
    setLoading(true);
    void (async () => {
      const next: Record<string, string> = {};
      for (const id of selected) {
        try {
          const ayahs = await fetchTafsirAyahs(surahNum, id);
          await yieldToMain();
          next[id] = ayahs.find((a) => a.numberInSurah === ayahNum)?.text ?? "—";
        } catch {
          next[id] = "تعذّر التحميل";
        }
      }
      if (alive) {
        setTexts(next);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [open, selected, surahNum, ayahNum]);

  if (!open) return null;

  const editions = MUSHAF_TAFSIR_EDITIONS.filter((e) => (COMPARE_IDS as readonly string[]).includes(e.id));

  return (
    <div className="tcp-panel">
      <div className="tcp-panel__head">
        <strong>مقارنة التفاسير</strong>
        <div className="tcp-layout">
          <button type="button" className={layout === "stack" ? "is-active" : ""} onClick={() => setLayout("stack")} aria-label="عرض مكدّس">
            <Rows2 size={14} aria-hidden="true" />
          </button>
          <button type="button" className={layout === "side" ? "is-active" : ""} onClick={() => setLayout("side")} aria-label="عرض جنبي">
            <Columns2 size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="tcp-editions">
        {editions.map((ed) => {
          const on = selected.includes(ed.id);
          return (
            <button
              key={ed.id}
              type="button"
              className={`tcp-ed${on ? " is-active" : ""}`}
              onClick={() => {
                setSelected((prev) => {
                  if (on) return prev.filter((x) => x !== ed.id);
                  if (prev.length >= 3) return [...prev.slice(1), ed.id];
                  return [...prev, ed.id];
                });
              }}
            >
              {ed.label}
            </button>
          );
        })}
      </div>
      {loading && <p className="tcp-status">جارٍ التحميل…</p>}
      <div className={`tcp-grid tcp-grid--${layout}`}>
        {selected.map((id) => {
          const meta = MUSHAF_TAFSIR_EDITIONS.find((e) => e.id === id);
          return (
            <article key={id} className="tcp-col">
              <h4>{meta?.label}</h4>
              <p dir="auto">{texts[id] ?? "…"}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default TafsirComparePanel;
