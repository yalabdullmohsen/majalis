import "@/styles/quran-hifz-loop.css";
import { useEffect, useMemo, useState } from "react";
import { useSearch } from "wouter";
import { Repeat } from "lucide-react";
import { HifzAudioLoopPlayer } from "@/components/quran/HifzAudioLoopPlayer";
import { applyPageSeo } from "@/lib/seo";
import { fetchSurahList, getSurahMeta, type SurahSummary } from "@/lib/quran-api";
import { navigateTo } from "@/lib/navigation-intent";
import { toArabicDigits } from "@/lib/utils";

function parseSurahParam(raw: string): number {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 114) return 1;
  return n;
}

function SurahSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number;
  onChange: (n: number) => void;
}) {
  const [list, setList] = useState<SurahSummary[]>([]);

  useEffect(() => {
    void fetchSurahList().then(setList);
  }, []);

  return (
    <select
      id={id}
      className="qhl-surah-pick__select"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 1)}
      aria-label="اختر السورة"
    >
      {(list.length ? list : [{ number: value, name: getSurahMeta(value).name } as SurahSummary]).map(
        (s) => (
          <option key={s.number} value={s.number}>
            {toArabicDigits(s.number)} — {s.name.replace(/^سُورَةُ\s*/u, "")}
          </option>
        ),
      )}
    </select>
  );
}

export default function QuranHifzLoopView() {
  const search = useSearch();
  const surah = useMemo(() => {
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    return parseSurahParam(params.get("surah") ?? "1");
  }, [search]);

  useEffect(() => {
    const meta = getSurahMeta(surah);
    applyPageSeo({
      title: `تحفيظ ${meta.name.replace(/^سُورَةُ\s*/u, "")}`,
      description: "مشغّل تحفيظ قرآني بتكرار A-B وتظليل الآية الجارية.",
      path: `/quran/hifz-loop?surah=${surah}`,
    });
  }, [surah]);

  const onSurahChange = (next: number) => {
    navigateTo(`/quran/hifz-loop?surah=${next}`, { mode: "state" });
  };

  return (
    <div className="page-shell qhl-page">
      <header className="qhl-hero surface-brand">
        <Repeat size={32} className="qhl-hero__icon" aria-hidden="true" />
        <h1 className="qhl-hero__title">مشغّل التحفيظ</h1>
        <p className="qhl-hero__sub">
          تكرار نطاق آيات (A-B) مع فترة صمت للترديد — متصل بمحرك التلاوة في التطبيق.
        </p>
        <div className="qhl-surah-pick">
          <label htmlFor="qhl-surah-select">السورة</label>
          <SurahSelect id="qhl-surah-select" value={surah} onChange={onSurahChange} />
        </div>
      </header>

      <section className="qhl-player-wrap">
        <HifzAudioLoopPlayer key={surah} surah={surah} />
      </section>
    </div>
  );
}
