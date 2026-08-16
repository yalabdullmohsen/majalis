/**
 * صفحة /quran-hub/numbers — القرآن في أرقام (قسم مرجعي موثّق).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import {
  assertQuranStatsCatalog,
  buildQuranStatsCatalog,
} from "@/lib/quran-stats/catalog";
import type {
  QuranComputedStats,
  QuranStat,
  QuranStatGroup,
  SurahStatRow,
  WordFreqRow,
} from "@/lib/quran-stats/types";
import {
  QURAN_STAT_BASIS_LABEL,
  QURAN_STAT_GROUP_LABEL,
  QURAN_STAT_KIND_LABEL,
} from "@/lib/quran-stats/types";
import { formatArabicNumber } from "@/lib/numerals";
import { findMushafPageForAyah } from "@/features/mushaf-madinah/mushaf-page-for-ayah";
import { AppBottomSheet } from "@/components/ui/AppBottomSheet";
import { normalizeArabic } from "@/shared/arabic-normalize";
import { scoreTolerantMatch } from "@/features/search/tolerant-match";
import "@/components/sections/section-cards.css";
import "@/styles/pages/quran-numbers.css";

const GROUPS: QuranStatGroup[] = ["bunya", "alfaz", "mawdoo", "suwar", "ajaib"];

function displayValue(value: number | string): string {
  return formatArabicNumber(value);
}

/** بحث القسم بمحرك التسامح نفسه المستخدم في runAppSearch */
function matchesSectionQuery(blob: string, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  const normBlob = normalizeArabic(blob);
  const normQ = normalizeArabic(q);
  if (normBlob.includes(normQ) || blob.includes(q)) return true;
  return Boolean(scoreTolerantMatch(blob.slice(0, 180), q, normBlob));
}

function mushafHref(surah: number, ayah: number): string {
  const page = findMushafPageForAyah(surah, ayah);
  return `/mushaf?page=${page}&ayah=${surah}:${ayah}`;
}

export default function QuranNumbersPage() {
  const [stats, setStats] = useState<QuranStat[]>([]);
  const [computed, setComputed] = useState<QuranComputedStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<QuranStat | null>(null);
  const [group, setGroup] = useState<QuranStatGroup | "all">("bunya");
  const [query, setQuery] = useState("");
  const [freqMode, setFreqMode] = useState<"content" | "all">("content");
  const [freqQ, setFreqQ] = useState("");
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [surahSort, setSurahSort] = useState<"number" | "ayahs" | "words">("number");
  const [surahQ, setSurahQ] = useState("");

  useEffect(() => {
    applyPageSeo({
      path: "/quran-hub/numbers",
      title: "القرآن في أرقام — المجلس العلمي",
      description:
        "إحصاءات قرآنية موثّقة: بنية المصحف، معجم الألفاظ، الموضوعات، السور، ولطائف ب مصادر معتمدة.",
      keywords: ["إحصاءات", "عدد الآيات", "المعجم المفهرس", "عدّ الآي"],
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/data/quran/stats.json", { cache: "force-cache" });
        if (!res.ok) throw new Error("تعذّر تحميل الإحصاءات المحسوبة");
        const data = (await res.json()) as QuranComputedStats;
        const catalog = buildQuranStatsCatalog(data);
        assertQuranStatsCatalog(catalog);
        if (!cancelled) {
          setComputed(data);
          setStats(catalog);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "خطأ");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return stats.filter((s) => {
      if (group !== "all" && s.group !== group) return false;
      const blob = `${s.label} ${s.note ?? ""} ${s.detail ?? ""} ${s.source} ${displayValue(s.value)}`;
      return matchesSectionQuery(blob, query);
    });
  }, [stats, group, query]);

  const freqRows: WordFreqRow[] = useMemo(() => {
    if (!computed?.wordFreq) return [];
    const rows =
      freqMode === "content" ? computed.wordFreq.contentTop : computed.wordFreq.allTop;
    return rows.filter((r) => matchesSectionQuery(`${r.form} ${r.count}`, freqQ)).slice(0, 200);
  }, [computed, freqMode, freqQ]);

  const longestWords = useMemo(
    () => computed?.wordFreq?.longestWords ?? [],
    [computed],
  );

  const surahRows: SurahStatRow[] = useMemo(() => {
    const rows = [...(computed?.perSurah ?? [])];
    const filteredRows = rows.filter((r) =>
      matchesSectionQuery(`${r.name} ${r.number} ${r.ayahs} ${r.words}`, surahQ),
    );
    filteredRows.sort((a, b) => {
      if (surahSort === "ayahs") return b.ayahs - a.ayahs;
      if (surahSort === "words") return b.words - a.words;
      return a.number - b.number;
    });
    return filteredRows;
  }, [computed, surahSort, surahQ]);

  const onShare = useCallback(async (stat: QuranStat) => {
    const text = [
      `${stat.label}: ${displayValue(stat.value)}`,
      QURAN_STAT_KIND_LABEL[stat.kind],
      `المصدر: ${stat.source}`,
      stat.note ? `بيان: ${stat.note}` : "",
      "— المجلس العلمي",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: stat.label, text });
        setShareStatus("تمت المشاركة");
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareStatus("تم النسخ");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setShareStatus(null);
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        setShareStatus("تم النسخ");
      } catch {
        setShareStatus("تم النسخ");
      }
    }
  }, []);

  return (
    <div className="quran-numbers-page sections-hub" dir="rtl" data-quran-numbers="1">
      <header className="quran-hub-page__head quran-hub-page__head--title-only">
        <h1 className="quran-hub-page__title">القرآن في أرقام</h1>
      </header>

      <section className="quran-numbers-intro" aria-label="مقدمة">
        <p>
          اعتنى علماء القرآن بعدّ الآي والكلمات والحروف منذ القرون الأولى، لا لتوهّم إعجاز عددي، بل
          لضبط الفواصل والمدارس ومعرفة مقادير الرسم. ومن أشهر ما أُلّف في ذلك{" "}
          <strong>البيان</strong> للداني و<strong>ناظمة الزهر</strong> وشروحها، ومباحث{" "}
          <strong>الإتقان</strong> للسيوطي.
        </p>
        <p>
          ومدارس عدّ الآي (الكوفي والمدنيان والمكي والبصري والشامي) تختلف في مواضع الفواصل لا في ثبوت
          النص. مصحف المدينة برواية حفص يعتمد <strong>العدّ الكوفي</strong> (٦٢٣٦ آية).
        </p>
        <p>
          أما عدّ الألفاظ فالمرجع الأصل <strong>المعجم المفهرس</strong> لعبد الباقي؛ والحساب الآلي في
          هذا القسم يُعرض للمقارنة مع بيان منهجيته، دون إخفاء الخلاف أو إيهام القطع.
        </p>
      </section>

      <p className="quran-numbers-page__method-link">
        <Link href="/methodology">منهجية التوثيق</Link>
        {" — "}
        لا تُعرض أرقام من مواقع الإعجاز العددي.
      </p>

      <div className="quran-numbers-toolbar">
        <label className="quran-numbers-search">
          <span className="sr-only">بحث في القسم</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في الأرقام والألفاظ…"
            aria-label="بحث في القرآن في أرقام"
          />
        </label>
        <div className="quran-numbers-tabs" role="tablist" aria-label="مجموعات الإحصاءات">
          <button
            type="button"
            role="tab"
            aria-selected={group === "all"}
            data-active={group === "all" ? "1" : "0"}
            onClick={() => setGroup("all")}
          >
            الكل
          </button>
          {GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={group === g}
              data-active={group === g ? "1" : "0"}
              onClick={() => setGroup(g)}
            >
              {QURAN_STAT_GROUP_LABEL[g]}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="sections-hub__empty">{error}</p> : null}

      <div className="quran-numbers-grid" data-sections-grid="quran-numbers">
        {filtered.map((s) => (
          <button
            key={s.id}
            type="button"
            className="quran-stat-card"
            data-section-card="stat"
            data-stat-kind={s.kind}
            data-stat-group={s.group}
            data-stat-id={s.id}
            aria-label={`${s.label}: ${displayValue(s.value)}`}
            onClick={() => {
              setShareStatus(null);
              setActive(s);
            }}
          >
            <span className="quran-stat-card__kind">{QURAN_STAT_KIND_LABEL[s.kind]}</span>
            <span className="quran-stat-card__value">{displayValue(s.value)}</span>
            <span className="quran-stat-card__label">{s.label}</span>
            {s.note ? <span className="quran-stat-card__note">{s.note}</span> : null}
            <span className="quran-stat-card__source">{s.source}</span>
          </button>
        ))}
      </div>

      {(group === "alfaz" || group === "all") && (freqRows.length > 0 || longestWords.length > 0) ? (
        <>
          <section className="quran-numbers-table-wrap" aria-label="معجم التكرار">
            <h2>أكثر الألفاظ تكرارًا</h2>
            <div className="quran-numbers-freq-modes">
              <button
                type="button"
                data-active={freqMode === "content" ? "1" : "0"}
                onClick={() => setFreqMode("content")}
              >
                ألفاظ معجمية
              </button>
              <button
                type="button"
                data-active={freqMode === "all" ? "1" : "0"}
                onClick={() => setFreqMode("all")}
              >
                كل الألفاظ
              </button>
            </div>
            <label className="quran-numbers-search">
              <span className="sr-only">بحث في معجم التكرار</span>
              <input
                type="search"
                value={freqQ}
                onChange={(e) => setFreqQ(e.target.value)}
                placeholder="ابحث عن لفظ…"
                aria-label="بحث في معجم التكرار"
              />
            </label>
            <p className="quran-numbers-table-note">
              حساب آلي بعد التجريد (صيغة حرفية أو استبعاد أدوات للوضع المعجمي). المرجع الأصل
              للمواضع: المعجم المفهرس لعبد الباقي. تبديل الجذر الكامل يحتاج معجم جذور مستقل.
            </p>
            <div className="quran-numbers-table-scroll">
              <table className="quran-numbers-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>اللفظ</th>
                    <th>التكرار</th>
                    <th>حروف</th>
                  </tr>
                </thead>
                <tbody>
                  {freqRows.map((row, i) => (
                    <tr key={`${row.form}-${i}`}>
                      <td>{displayValue(i + 1)}</td>
                      <td>{row.form}</td>
                      <td>{displayValue(row.count)}</td>
                      <td>{displayValue(row.letters)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {longestWords.length > 0 ? (
            <section className="quran-numbers-table-wrap" aria-label="أطول الكلمات">
              <h2>أطول الكلمات بالرسم العثماني</h2>
              <p className="quran-numbers-table-note">
                أعلى ٢٠ كلمة بعدد الحروف بعد التجريد (بلا تشكيل ولا علامات وقف) — نتيجة محسوبة لا
                منقولة.
              </p>
              <div className="quran-numbers-table-scroll">
                <table className="quran-numbers-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>الكلمة</th>
                      <th>حروف</th>
                      <th>الموضع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {longestWords.map((row, i) => (
                      <tr key={`${row.form}-${row.surah}-${row.ayah}`}>
                        <td>{displayValue(i + 1)}</td>
                        <td>{row.form}</td>
                        <td>{displayValue(row.letters)}</td>
                        <td>
                          <Link href={mushafHref(row.surah, row.ayah)}>
                            {displayValue(row.surah)}:{displayValue(row.ayah)}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      {(group === "suwar" || group === "all") && surahRows.length > 0 ? (
        <section className="quran-numbers-table-wrap" aria-label="جدول السور">
          <h2>جدول السور</h2>
          <div className="quran-numbers-surah-controls">
            <input
              type="search"
              value={surahQ}
              onChange={(e) => setSurahQ(e.target.value)}
              placeholder="ابحث عن سورة…"
              aria-label="بحث في السور"
            />
            <select
              value={surahSort}
              onChange={(e) => setSurahSort(e.target.value as typeof surahSort)}
              aria-label="ترتيب السور"
            >
              <option value="number">الترتيب</option>
              <option value="ayahs">عدد الآيات</option>
              <option value="words">عدد الكلمات</option>
            </select>
          </div>
          <div className="quran-numbers-table-scroll">
            <table className="quran-numbers-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>السورة</th>
                  <th>مكية/مدنية</th>
                  <th>آيات</th>
                  <th>كلمات</th>
                  <th>صفحة</th>
                </tr>
              </thead>
              <tbody>
                {surahRows.map((r) => (
                  <tr key={r.number}>
                    <td>{displayValue(r.number)}</td>
                    <td>
                      <Link href={`/mushaf?page=${r.pageStart ?? 1}`}>{r.name.replace(/^سُورَةُ\s*/u, "")}</Link>
                    </td>
                    <td>{r.revelationType === "Meccan" ? "مكية" : "مدنية"}</td>
                    <td>{displayValue(r.ayahs)}</td>
                    <td>{displayValue(r.words)}</td>
                    <td>{r.pageStart != null ? displayValue(r.pageStart) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <AppBottomSheet
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={active?.label ?? ""}
      >
        {active ? (
          <div className="quran-stat-sheet" dir="rtl">
            <p className="quran-stat-sheet__value">{displayValue(active.value)}</p>
            <p className="quran-stat-sheet__kind">
              {QURAN_STAT_KIND_LABEL[active.kind]}
              {active.basis ? ` · ${QURAN_STAT_BASIS_LABEL[active.basis]}` : ""}
            </p>
            <h3>المصدر</h3>
            <p>{active.source}</p>
            {active.method ? (
              <>
                <h3>منهجية العدّ</h3>
                <p>{active.method}</p>
              </>
            ) : null}
            {active.note ? (
              <>
                <h3>بيان</h3>
                <p>{active.note}</p>
              </>
            ) : null}
            {active.detail ? (
              <>
                <h3>تفصيل</h3>
                <p>{active.detail}</p>
              </>
            ) : null}
            {active.variants && active.variants.length > 0 ? (
              <>
                <h3>الأقوال</h3>
                <ul>
                  {active.variants.map((v) => (
                    <li key={`${v.value}-${v.attribution}`}>
                      <strong>{displayValue(v.value)}</strong> — {v.attribution}
                      <br />
                      <span className="quran-stat-sheet__src">{v.source}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            {active.evidence && active.evidence.length > 0 ? (
              <>
                <h3>آيات شاهدة</h3>
                <ul className="quran-stat-sheet__evidence">
                  {active.evidence.map((ev) => (
                    <li key={`${ev.surah}:${ev.ayah}`}>
                      <Link
                        href={mushafHref(ev.surah, ev.ayah)}
                        onClick={() => setActive(null)}
                      >
                        {displayValue(ev.surah)}:{displayValue(ev.ayah)}
                        {ev.excerpt ? ` — ${ev.excerpt}` : ""}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <div className="quran-stat-sheet__actions">
              <button type="button" onClick={() => void onShare(active)}>
                مشاركة
              </button>
              {shareStatus ? <span aria-live="polite">{shareStatus}</span> : null}
            </div>
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
