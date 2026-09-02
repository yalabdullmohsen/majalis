import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { getSurahList } from "@/lib/quran-api";
import {
  readMatchingStrictPreference,
  writeMatchingStrictPreference,
} from "@/lib/recitation-ai/matching-strict-preference";
import type { RecitationScope, RecitationSetupConfig } from "@/lib/recitation-ai/recitation-setup-types";

export type { RecitationScope, RecitationSetupConfig };

type Props = {
  onStartRecitation: (config: RecitationSetupConfig) => void;
  initialSurah?: number;
};

const SCOPE_OPTIONS: Array<{ id: RecitationScope; label: string }> = [
  { id: "surah", label: "السورة كاملة" },
  { id: "ayah", label: "من آية إلى آية" },
  { id: "page", label: "بالصفحة" },
  { id: "juz", label: "بالجزء" },
];

export function RecitationSetup({ onStartRecitation, initialSurah = 1 }: Props) {
  const [scope, setScope] = useState<RecitationScope>("surah");
  const [surahNumber, setSurahNumber] = useState(initialSurah);
  const [ayahFrom, setAyahFrom] = useState(1);
  const [ayahTo, setAyahTo] = useState(7);
  const [pageNumber, setPageNumber] = useState(1);
  const [juzNumber, setJuzNumber] = useState(1);
  const [matchingStrict, setMatchingStrict] = useState(() => readMatchingStrictPreference());

  const surahs = useMemo(() => getSurahList(), []);
  const currentSurahAyahCount = surahs.find((s) => s.number === surahNumber)?.ayahs ?? 7;

  useEffect(() => {
    setSurahNumber(initialSurah);
  }, [initialSurah]);

  useEffect(() => {
    setAyahFrom(1);
    setAyahTo(currentSurahAyahCount);
  }, [surahNumber, currentSurahAyahCount]);

  const handleStart = () => {
    onStartRecitation({
      scope,
      surahNumber,
      ayahFrom,
      ayahTo,
      pageNumber,
      juzNumber,
      matchingStrict,
    });
  };

  const toggleStrict = () => {
    const next = !matchingStrict;
    setMatchingStrict(next);
    writeMatchingStrictPreference(next);
  };

  return (
    <div className="rai-module-setup" dir="rtl">
      <header className="rai-module-setup__header">
        <h2 className="rai-module-setup__title">إعدادات التلاوة</h2>
        <p className="rai-module-setup__sub">
          طابق تلاوتك من حفظك؛ يستمع التطبيق لحظياً ويكشف المصحف الآية فور نطقها.
        </p>
      </header>

      <div className="rai-setup">
        <div className="rai-setup__group">
          <span className="rai-setup__label">النطاق</span>
          <div className="rai-choice-grid">
            {SCOPE_OPTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`rai-choice ${scope === item.id ? "rai-choice--active" : ""}`}
                onClick={() => setScope(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {(scope === "surah" || scope === "ayah") && (
            <div style={{ marginTop: ".6rem" }}>
              <label className="rai-setup__label" htmlFor="rai-module-surah">
                السورة
              </label>
              <select
                id="rai-module-surah"
                className="rai-surah-select"
                value={surahNumber}
                onChange={(e) => setSurahNumber(Number(e.target.value))}
              >
                {surahs.map((s) => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {s.name} ({s.ayahs} آية)
                  </option>
                ))}
              </select>
            </div>
          )}

          {scope === "ayah" && (
            <div className="rai-range-inputs" style={{ display: "flex", gap: ".6rem", marginTop: ".6rem" }}>
              <label style={{ flex: 1 }}>
                <span className="rai-choice__hint">من آية</span>
                <input
                  type="number"
                  min={1}
                  max={currentSurahAyahCount}
                  value={ayahFrom}
                  onChange={(e) => setAyahFrom(Math.min(Number(e.target.value) || 1, ayahTo))}
                />
              </label>
              <label style={{ flex: 1 }}>
                <span className="rai-choice__hint">إلى آية</span>
                <input
                  type="number"
                  min={ayahFrom}
                  max={currentSurahAyahCount}
                  value={ayahTo}
                  onChange={(e) => setAyahTo(Math.max(Number(e.target.value) || ayahFrom, ayahFrom))}
                />
              </label>
            </div>
          )}

          {scope === "page" && (
            <label style={{ display: "block", marginTop: ".6rem" }}>
              <span className="rai-choice__hint">رقم الصفحة (ترقيم مصحف المدينة)</span>
              <input
                type="number"
                min={1}
                max={604}
                value={pageNumber}
                onChange={(e) => setPageNumber(Math.min(Math.max(Number(e.target.value) || 1, 1), 604))}
              />
            </label>
          )}

          {scope === "juz" && (
            <label style={{ display: "block", marginTop: ".6rem" }}>
              <span className="rai-choice__hint">رقم الجزء (1-30)</span>
              <input
                type="number"
                min={1}
                max={30}
                value={juzNumber}
                onChange={(e) => setJuzNumber(Math.min(Math.max(Number(e.target.value) || 1, 1), 30))}
              />
            </label>
          )}
        </div>

        <div className="rai-setup__group">
          <div className="rai-strict-toggle">
            <div>
              <span className="rai-setup__label">مستوى دقة التحليل</span>
              <p className="rai-strict-toggle__hint">
                {matchingStrict
                  ? "دقيق: يتطلب مطابقة تامة بعد التطبيع القرآني"
                  : "متساهل: يتجاهل التشكيل وأخطاء النطق البسيطة"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={matchingStrict}
              className={`rai-toggle ${matchingStrict ? "rai-toggle--on" : ""}`}
              onClick={toggleStrict}
            >
              <span className="rai-toggle__knob" aria-hidden="true" />
            </button>
          </div>
        </div>

        <button type="button" className="rai-start-btn" onClick={handleStart}>
          بدء الجلسة
        </button>

        <p className="rai-module-setup__advanced">
          <Link href="/quran/recitation-test-ai?advanced=1">الوضع المتقدم</Link>
          {" "}
          — أوضاع الحفظ، مزوّدو ASR متعددون، وتقرير مفصّل.
        </p>
      </div>
    </div>
  );
}
