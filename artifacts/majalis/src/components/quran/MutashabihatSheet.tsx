/**
 * ورقة المتشابهات اللفظية — تطابقات من الفهرس المحسوب مع تمييز خفيف للفروق.
 */
import { useEffect, useState } from "react";
import { X, GitCompareArrows } from "lucide-react";
import { getSimilarAyahsCached, type MutashabihMatch } from "@/lib/mutashabihat-idb";
import { fetchSurahDetail, getSurahMeta } from "@/lib/quran-api";
import { toArabicDigits } from "@/lib/utils";
import { normalizeArabic } from "@/shared/arabic-normalize";
import { yieldToMain } from "@/lib/yield-to-main";

type Props = {
  surah: number;
  ayah: number;
  ayahText: string;
  open: boolean;
  onClose: () => void;
  onGoTo: (surah: number, ayah: number) => void;
};

type Enriched = MutashabihMatch & { surahName: string; text: string };

function diffTokens(base: string, other: string): { text: string; diff: boolean }[] {
  const a = base.trim().split(/\s+/);
  const b = other.trim().split(/\s+/);
  const baseN = new Set(a.map((t) => normalizeArabic(t)));
  return b.map((t) => ({ text: t, diff: !baseN.has(normalizeArabic(t)) }));
}

export function MutashabihatSheet({ surah, ayah, ayahText, open, onClose, onGoTo }: Props) {
  const [rows, setRows] = useState<Enriched[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    void (async () => {
      const matches = await getSimilarAyahsCached(surah, ayah);
      await yieldToMain();
      const enriched: Enriched[] = [];
      for (const m of matches.slice(0, 8)) {
        try {
          const detail = await fetchSurahDetail(m.surah);
          const text = detail.ayahs.find((a) => a.numberInSurah === m.ayah)?.text ?? "";
          enriched.push({
            ...m,
            surahName: getSurahMeta(m.surah).name,
            text,
          });
        } catch {
          enriched.push({ ...m, surahName: getSurahMeta(m.surah).name, text: "" });
        }
      }
      if (alive) {
        setRows(enriched);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [open, surah, ayah]);

  if (!open) return null;

  return (
    <div className="mts-overlay" onClick={onClose} role="presentation">
      <div
        className="mts-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="المتشابهات اللفظية"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mts-sheet__handle" aria-hidden="true" />
        <div className="mts-sheet__head">
          <GitCompareArrows size={16} aria-hidden="true" />
          <strong>متشابهات لفظية</strong>
          <button type="button" className="mts-sheet__close" onClick={onClose} aria-label="إغلاق">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <p className="mts-sheet__base" dir="rtl">{ayahText}</p>
        <p className="mts-sheet__ref">سورة {getSurahMeta(surah).name} · آية {toArabicDigits(ayah)}</p>

        {loading && <p className="mts-sheet__status">جارٍ جلب المتشابهات…</p>}
        {!loading && rows.length === 0 && (
          <p className="mts-sheet__status">لا متشابهات مفهرَسة لهذه الآية فوق عتبة التشابه.</p>
        )}
        <ul className="mts-list">
          {rows.map((r) => {
            const parts = r.text ? diffTokens(ayahText, r.text) : [];
            return (
              <li key={`${r.surah}:${r.ayah}`}>
                <button
                  type="button"
                  className="mts-card"
                  onClick={() => { onGoTo(r.surah, r.ayah); onClose(); }}
                >
                  <span className="mts-card__meta">
                    {r.surahName} · آية {toArabicDigits(r.ayah)}
                    <small>تشابه {Math.round(r.overlapRatio * 100)}٪</small>
                  </span>
                  <span className="mts-card__text" dir="rtl">
                    {parts.length
                      ? parts.map((p, i) => (
                          <span key={i} className={p.diff ? "mts-diff" : undefined}>
                            {p.text}{" "}
                          </span>
                        ))
                      : "—"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default MutashabihatSheet;
