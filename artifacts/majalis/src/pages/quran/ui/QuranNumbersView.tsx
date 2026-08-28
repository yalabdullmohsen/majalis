/**
 * صفحة /quran-hub/numbers — القرآن في أرقام (محتوى محرَّر من مصادر مطبوعة فقط).
 */
import { useCallback, useMemo, useState } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { useEffect } from "react";
import {
  buildQuranStatsCatalog,
  formatStatSourceFull,
  formatStatSourceLine,
} from "@/lib/quran-stats/catalog";
import type { QuranStat, QuranStatGroup } from "@/lib/quran-stats/types";
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

const CATALOG = buildQuranStatsCatalog();

function displayValue(value: number | string): string {
  return formatArabicNumber(value);
}

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
  const [active, setActive] = useState<QuranStat | null>(null);
  const [group, setGroup] = useState<QuranStatGroup | "all">("bunya");
  const [query, setQuery] = useState("");
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/quran-hub/numbers",
      title: "القرآن في أرقام — سُنّة",
      description:
        "إحصاءات قرآنية موثّقة من مصادر مطبوعة: بنية المصحف، المعجم المفهرس، وعدّ الآي، بلا اشتقاق رقمي من نص المصحف.",
      keywords: ["إحصاءات", "عدد الآيات", "المعجم المفهرس", "عدّ الآي"],
    });
  }, []);

  const filtered = useMemo(() => {
    return CATALOG.filter((s) => {
      if (group !== "all" && s.group !== group) return false;
      const blob = `${s.label} ${s.note ?? ""} ${s.detail ?? ""} ${formatStatSourceLine(s.source)} ${displayValue(s.value)}`;
      return matchesSectionQuery(blob, query);
    });
  }, [group, query]);

  const onShare = useCallback(async (stat: QuranStat) => {
    const text = [
      `${stat.label}: ${displayValue(stat.value)}`,
      QURAN_STAT_KIND_LABEL[stat.kind],
      `المصدر: ${formatStatSourceFull(stat.source)}`,
      stat.note ? `بيان: ${stat.note}` : "",
      "— سُنّة",
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
          أما عدّ الألفاظ فالمرجع الأصل <strong>المعجم المفهرس لألفاظ القرآن الكريم</strong> لمحمد
          فؤاد عبد الباقي، مع التفريق بين اللفظ والمادة والموضوع. لا يُعرض في هذا القسم أي رقم مشتق
          آليًا من نص المصحف.
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
            <span className="quran-stat-card__source">{formatStatSourceLine(s.source)}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="sections-hub__empty">لا نتائج مطابقة في البطاقات المعتمدة.</p>
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
            <p>{formatStatSourceFull(active.source)}</p>
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
                منهجية التوثيق في سُنّة
              </Link>
            </p>
          </div>
        ) : null}
      </AppBottomSheet>
    </div>
  );
}
