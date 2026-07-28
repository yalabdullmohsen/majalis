/**
 * TafseerDrawer — sliding panel for ayah interpretation.
 * Reads active ayah from props (ActionBar) / context; switches sources via TafseerService.
 */
import { useCallback, useEffect, useState, startTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BookOpen, X } from "lucide-react";
import { getSurahMeta } from "@/lib/quran-api";
import {
  getTafseerService,
  type TafseerAyahResult,
  type TafseerSourceId,
} from "@/core/tafseer";
import { useQuranEngineSelector } from "@/lib/quran-engine-store";
import "@/styles/tafseer-drawer.css";

export type TafseerDrawerProps = {
  open: boolean;
  onClose: () => void;
  /** Preferred ayah; falls back to engine active verse when omitted. */
  surah?: number | null;
  ayah?: number | null;
  ayahText?: string;
};

export function TafseerDrawer({
  open,
  onClose,
  surah: surahProp,
  ayah: ayahProp,
  ayahText,
}: TafseerDrawerProps) {
  const reduceMotion = useReducedMotion();
  const engineSurah = useQuranEngineSelector((s) => s.surah);
  const engineAyah = useQuranEngineSelector((s) => s.ayah);
  const service = getTafseerService();

  const surah = surahProp ?? engineSurah ?? 1;
  const ayah = ayahProp ?? engineAyah ?? 1;
  const surahName = getSurahMeta(surah).name;

  const [edition, setEdition] = useState<TafseerSourceId>(service.getDefaultEdition());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TafseerAyahResult | null>(null);
  const sources = service.listSources();

  useEffect(() => {
    void service.hydrateDefaultEdition().then((ed) => setEdition(ed));
  }, [service]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    // Prefetch next sources quietly
    service.prefetchSurah(surah, edition);

    void (async () => {
      try {
        const hit = await service.getAyahTafseer(surah, ayah, edition);
        if (cancelled) return;
        if (!hit) {
          setResult(null);
          setError("لا نص تفسير متاح لهذه الآية في المصدر المختار.");
        } else {
          setResult(hit);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setResult(null);
          setError("تعذّر جلب التفسير. تحقق من الاتصال وحاول مجددًا.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, surah, ayah, edition, service]);

  const onSelectEdition = useCallback(
    (id: TafseerSourceId) => {
      startTransition(() => {
        setEdition(id);
      });
      void service.setDefaultEdition(id);
    },
    [service],
  );

  const slide = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { y: "100%", opacity: 0.85 },
        animate: { y: 0, opacity: 1 },
        exit: { y: "100%", opacity: 0.85 },
      };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            key="tafseer-scrim"
            type="button"
            className="tafseer-drawer__scrim"
            aria-label="إغلاق التفسير"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.aside
            key="tafseer-panel"
            className="tafseer-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`تفسير ${surahName} آية ${ayah}`}
            initial={slide.initial}
            animate={slide.animate}
            exit={slide.exit}
            transition={{ type: "spring", stiffness: 380, damping: 34, mass: 0.75 }}
          >
            <div className="tafseer-drawer__handle" aria-hidden />
            <header className="tafseer-drawer__head">
              <div className="tafseer-drawer__title-row">
                <BookOpen size={18} aria-hidden />
                <div>
                  <h2 className="tafseer-drawer__title">التفسير</h2>
                  <p className="tafseer-drawer__meta">
                    {surahName} · آية {ayah}
                    {result?.fromCache ? " · محفوظ محليًا" : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="tafseer-drawer__close"
                onClick={onClose}
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </header>

            {ayahText ? (
              <p className="tafseer-drawer__ayah" dir="rtl">
                {ayahText.length > 220 ? `${ayahText.slice(0, 220)}…` : ayahText}
              </p>
            ) : null}

            <div
              className="tafseer-drawer__sources"
              role="tablist"
              aria-label="مصادر التفسير"
            >
              {sources.map((src) => (
                <button
                  key={src.id}
                  type="button"
                  role="tab"
                  aria-selected={edition === src.id}
                  className={`tafseer-drawer__chip${edition === src.id ? " is-active" : ""}`}
                  onClick={() => onSelectEdition(src.id)}
                >
                  {src.label}
                </button>
              ))}
            </div>

            <div className="tafseer-drawer__body" dir="rtl">
              {loading && <p className="tafseer-drawer__status">جاري التحميل…</p>}
              {!loading && error && (
                <p className="tafseer-drawer__status tafseer-drawer__status--err">{error}</p>
              )}
              {!loading && result && (
                <>
                  <p className="tafseer-drawer__source-line">
                    {result.sourceLabel}
                    {sources.find((s) => s.id === edition)?.author
                      ? ` — ${sources.find((s) => s.id === edition)!.author}`
                      : ""}
                  </p>
                  {sources.find((s) => s.id === edition)?.caution && (
                    <p className="tafseer-drawer__caution">
                      {sources.find((s) => s.id === edition)!.caution}
                    </p>
                  )}
                  <div className="tafseer-drawer__text">{result.text}</div>
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default TafseerDrawer;
