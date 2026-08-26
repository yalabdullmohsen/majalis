import "@/styles/quran-player-view.css";
import { useEffect, useMemo } from "react";
import { Link, useSearch } from "wouter";
import { Headphones } from "lucide-react";
import { QuranPlayerView } from "@/components/quran/QuranPlayerView";
import { applyPageSeo } from "@/lib/seo";
import { getSurahMeta } from "@/lib/quran-api";
import { loadReciterId } from "@/lib/quran-audio";

function parseSurah(raw: string | null): number {
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1 || n > 114) return 1;
  return n;
}

function parseReciter(raw: string | null): string | undefined {
  if (!raw?.trim()) return undefined;
  return raw.trim();
}

export default function QuranOfflinePlayerPage() {
  const search = useSearch();
  const params = useMemo(
    () => new URLSearchParams(search.startsWith("?") ? search.slice(1) : search),
    [search],
  );
  const surah = parseSurah(params.get("surah"));
  const reciterId = parseReciter(params.get("reciter")) ?? loadReciterId();
  const meta = getSurahMeta(surah);

  useEffect(() => {
    applyPageSeo({
      title: `مشغّل التلاوة — ${meta.name.replace(/^سُورَةُ\s*/u, "")}`,
      description: "تلاوة تفاعلية مع تظليل الآية — أوفلاين أو بث مباشر.",
      path: `/quran/offline-player?surah=${surah}`,
    });
  }, [surah, meta.name]);

  return (
    <div className="page-shell qpv-page" dir="rtl">
      <header className="qpv-page__head">
        <Headphones size={22} aria-hidden="true" />
        <h1 className="qpv-page__title">مشغّل التلاوة التفاعلي</h1>
        <p className="qpv-page__sub">
          تظليل الآية أثناء الاستماع — يُفضّل الملف المحلي عند التوفّر.
        </p>
        <Link href="/quran/worship-hub" className="qpv-page__back">
          ← مركز العبادة القرآنية
        </Link>
      </header>
      <QuranPlayerView key={`${reciterId}:${surah}`} reciterId={reciterId} surahNumber={surah} />
    </div>
  );
}
