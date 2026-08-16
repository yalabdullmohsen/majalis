/**
 * صفحة /quran-hub/numbers — القرآن في أرقام (موثّق ومصنّف).
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import {
  assertQuranStatsCatalog,
  buildQuranStatsCatalog,
} from "@/lib/quran-stats/catalog";
import type { QuranComputedStats, QuranStat } from "@/lib/quran-stats/types";
import { QURAN_STAT_KIND_LABEL } from "@/lib/quran-stats/types";
import { AppBottomSheet } from "@/components/ui/AppBottomSheet";
import "@/components/sections/section-cards.css";
import "@/styles/pages/quran-numbers.css";

export default function QuranNumbersPage() {
  const [stats, setStats] = useState<QuranStat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<QuranStat | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/quran-hub/numbers",
      title: "القرآن في أرقام — المجلس العلمي",
      description:
        "إحصاءات قرآنية موثّقة: المتفق عليه، بحسب مدرسة العدّ، والمختلف فيه، والحساب الآلي من نص المصحف.",
      keywords: ["إحصاءات", "عدد الآيات", "عدد السور", "كم آية", "كم كلمة"],
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/data/quran/stats.json", { cache: "force-cache" });
        if (!res.ok) throw new Error("تعذّر تحميل الإحصاءات المحسوبة");
        const computed = (await res.json()) as QuranComputedStats;
        const catalog = buildQuranStatsCatalog(computed);
        assertQuranStatsCatalog(catalog);
        if (!cancelled) setStats(catalog);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "خطأ");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="quran-numbers-page sections-hub" dir="rtl" data-quran-numbers="1">
      <header className="quran-hub-page__head quran-hub-page__head--title-only">
        <h1 className="quran-hub-page__title">القرآن في أرقام</h1>
      </header>

      <p className="quran-numbers-page__method-link">
        <Link href="/methodology">منهجية التوثيق</Link>
        {" — "}
        لا تُعرض أرقام من مواقع الإعجاز العددي.
      </p>

      {error ? <p className="sections-hub__empty">{error}</p> : null}

      <div className="quran-numbers-grid" data-sections-grid="quran-numbers">
        {stats.map((s) => (
          <button
            key={s.id}
            type="button"
            className="quran-stat-card"
            data-section-card="stat"
            data-stat-kind={s.kind}
            data-stat-id={s.id}
            aria-label={`${s.label}: ${s.value}`}
            onClick={() => setActive(s)}
          >
            <span className="quran-stat-card__kind">{QURAN_STAT_KIND_LABEL[s.kind]}</span>
            <span className="quran-stat-card__value">{s.value}</span>
            <span className="quran-stat-card__label">{s.label}</span>
            <span className="quran-stat-card__source">{s.source}</span>
          </button>
        ))}
      </div>

      <AppBottomSheet
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={active?.label ?? ""}
      >
        {active ? (
          <div className="quran-stat-sheet" dir="rtl">
            <p className="quran-stat-sheet__value">{active.value}</p>
            <p className="quran-stat-sheet__kind">{QURAN_STAT_KIND_LABEL[active.kind]}</p>
            <h3>المصدر</h3>
            <p>{active.source}</p>
            {active.method ? (
              <>
                <h3>منهجية العدّ</h3>
                <p>حساب آلي من نص المصحف — منهجية العدّ: {active.method}</p>
              </>
            ) : null}
            {active.note ? (
              <>
                <h3>بيان</h3>
                <p>{active.note}</p>
              </>
            ) : null}
            {active.variants && active.variants.length > 0 ? (
              <>
                <h3>الأقوال</h3>
                <ul>
                  {active.variants.map((v) => (
                    <li key={`${v.value}-${v.attribution}`}>
                      <strong>{v.value}</strong> — {v.attribution}
                      <br />
                      <span className="quran-stat-sheet__src">{v.source}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <p>
              <Link href="/methodology" onClick={() => setActive(null)}>
                منهجية التوثيق في المجلس العلمي
              </Link>
            </p>
          </div>
        ) : null}
      </AppBottomSheet>
    </div>
  );
}
