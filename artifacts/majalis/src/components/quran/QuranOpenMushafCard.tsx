/**
 * بطاقة فتح المصحف في مركز القرآن فقط — خفيفة، مع زر دائري واضح.
 * لا تلمس محرك المصحف؛ تقرأ موضع الاستئناف المحلي فقط.
 */
import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronLeft } from "lucide-react";
import { DirectionalIcon } from "@/components/DirectionalIcon";
import { getSurahMeta, loadPagePosition, loadReadingAyahKey } from "@/lib/quran-api";
import { navigateTo } from "@/lib/navigation-intent";
import { prefetchRoute } from "@/lib/prefetch-route";
import { toArabicDigits } from "@/lib/utils";
import "@/styles/pages/quran-hub.css";

export type MushafResumeInfo = {
  href: string;
  hasResume: boolean;
  /** سطر العرض: آخر توقف أو دعوة للبدء */
  resumeLine: string;
  ctaLabel: string;
};

function stripSurahPrefix(name: string): string {
  return name.replace(/^سُورَةُ\s*/u, "").replace(/^سورة\s*/u, "").trim();
}

/** قراءة آمنة لموضع الاستئناف — لا ترمي أبدًا */
export function resolveMushafResumeInfo(): MushafResumeInfo {
  const fallback: MushafResumeInfo = {
    href: "/mushaf",
    hasResume: false,
    resumeLine: "ابدأ القراءة من الفاتحة",
    ctaLabel: "فتح المصحف",
  };

  try {
    const page = loadPagePosition();
    const ayahKey = loadReadingAyahKey();

    if (page == null || page < 1) {
      return fallback;
    }

    // صفحة 1 بدون آية محفوظة ≠ «آخر توقف» ذي معنى — نعرض بداية الفاتحة
    const hasMeaningfulResume = page > 1 || Boolean(ayahKey && ayahKey !== "1:1");

    let surahName = "";
    let ayahNum: number | null = null;
    if (ayahKey && /^\d{1,3}:\d{1,3}$/.test(ayahKey)) {
      const [s, a] = ayahKey.split(":").map(Number);
      if (s >= 1 && s <= 114) {
        surahName = stripSurahPrefix(getSurahMeta(s).name);
      }
      if (Number.isFinite(a) && a >= 1) ayahNum = a;
    }

    const href = ayahKey
      ? `/mushaf/page/${page}?ayah=${encodeURIComponent(ayahKey)}`
      : `/mushaf/page/${page}`;

    if (!hasMeaningfulResume) {
      return {
        href: "/mushaf",
        hasResume: false,
        resumeLine: "ابدأ القراءة من الفاتحة",
        ctaLabel: "فتح المصحف",
      };
    }

    const parts: string[] = [];
    if (surahName) parts.push(surahName);
    if (ayahNum != null) parts.push(`آية ${toArabicDigits(ayahNum)}`);
    parts.push(`صفحة ${toArabicDigits(page)}`);

    return {
      href,
      hasResume: true,
      resumeLine: `آخر توقف: ${parts.join("، ")}`,
      ctaLabel: "متابعة القراءة",
    };
  } catch {
    return fallback;
  }
}

export function QuranOpenMushafCard() {
  const [info, setInfo] = useState<MushafResumeInfo>(() => resolveMushafResumeInfo());

  useEffect(() => {
    setInfo(resolveMushafResumeInfo());
  }, []);

  const description = useMemo(
    () => (info.hasResume ? "تابع القراءة من آخر موضع" : "افتح المصحف وابدأ التلاوة"),
    [info.hasResume],
  );

  const openMushaf = () => {
    prefetchRoute(info.href);
    navigateTo(info.href, { mode: "state" });
    window.scrollTo(0, 0);
  };

  return (
    <article
      className="quran-open-mushaf"
      dir="rtl"
      data-quran-open-mushaf="1"
      aria-label={`المصحف — ${info.resumeLine}`}
    >
      <div className="quran-open-mushaf__accent" aria-hidden="true" />

      <div className="quran-open-mushaf__body">
        <div className="quran-open-mushaf__icon" aria-hidden="true">
          <BookOpen size={18} strokeWidth={1.9} />
        </div>
        <div className="quran-open-mushaf__text">
          <h2 className="quran-open-mushaf__title">المصحف</h2>
          <p className="quran-open-mushaf__desc">{description}</p>
          <p className="quran-open-mushaf__resume" data-has-resume={info.hasResume ? "1" : "0"}>
            {info.resumeLine}
          </p>
        </div>
      </div>

      <button
        type="button"
        className="quran-open-mushaf__cta"
        data-section-card="open-mushaf"
        data-hero-action="1"
        title="فتح المصحف"
        aria-label={info.hasResume ? `متابعة القراءة — ${info.resumeLine}` : "فتح المصحف"}
        onPointerDown={() => prefetchRoute(info.href)}
        onClick={openMushaf}
      >
        <span className="quran-open-mushaf__cta-label">{info.ctaLabel}</span>
        <span className="quran-open-mushaf__cta-btn" aria-hidden="true">
          <DirectionalIcon icon={ChevronLeft} size={18} strokeWidth={2.4} />
        </span>
      </button>
    </article>
  );
}
