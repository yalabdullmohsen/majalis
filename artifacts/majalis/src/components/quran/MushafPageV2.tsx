import { Fragment, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMushafPageFont, mushafPageFontFamily } from "@/hooks/useMushafPageFont";
import { quranFontStack } from "@/lib/quran-font-options";
import { toArabicDigits } from "@/lib/utils";
import type { MushafPageLayout, QpcWord } from "@/lib/mushaf-v2-data";

/** يُجمِّع كلمات سطر متتالية بنفس verseKey في عنقود واحد — الوحدة
 * التفاعلية الحقيقية هي "الآية" لا الكلمة المفردة (مطابقًا لـMushafPage.tsx
 * القائم: role="button" واحد لكل آية، لا لكل حرف/كلمة). هذا ليس تجميلًا:
 * وضع role="button" على كل glyph مفرد فعليًا فعّل قاعدة إتاحة عامة موقعية
 * حقيقية (WCAG 2.5.5 — elite-2026.css:30100) تفرض min-width:44px!important
 * على أي [role="button"]، فكسرت تحجيم الأسطر تمامًا على الموبايل (رُصد
 * ودُقِّق فعليًا: تطابق حسابي تام بين عدد الكلمات×44px والفيضان المُقاس). */
export function groupWordsByAyah(words: QpcWord[]): QpcWord[][] {
  const groups: QpcWord[][] = [];
  for (const w of words) {
    const last = groups[groups.length - 1];
    if (last && last[0].verseKey === w.verseKey) last.push(w);
    else groups.push([w]);
  }
  return groups;
}

type Props = {
  layout: MushafPageLayout | null;
  activeAyahKey?: string | null;
  onAyahPress?: (verseKey: string) => void;
  /** خط موحّد بديل (الوضع الخفيف) — يتخطى تحميل خط QPC الخاص بالصفحة
   * كليًا (لا طلب شبكة إضافي)، يفترض أن الخط مُحمَّل أصلًا في التطبيق.
   * افتراضيًا: خط QPC الرقمي الخاص بكل صفحة (وضع الدقة المطبعية). */
  sharedFontFamily?: string;
  /** عرض كلمة مخصَّص — الوضع الخفيف يستبدل شارة رقم الآية الافتراضية
   * (glyph من خط الصفحة) بشارة زخرفية موحّدة ونص Unicode عادي. المُعِدّ
   * مسؤول عن وضع key={w.id} على العقدة المُعادة. افتراضيًا: نفس عرض
   * وضع الدقة المطبعية (glyph الصفحة + شارة سجدة نصية). */
  renderWord?: (w: QpcWord) => ReactNode;
  /** true: يُصدَّر .mf2-lines وحدها بلا .mf2-page/.mf2-frame الخاصين بها
   * (بلا إطار/outline/خلفية/aspect-ratio مستقلة) — لاستخدام هذا المكوّن
   * متداخلاً داخل إطار صفحة قائم أصلًا (مثل .qs-mushaf-frame في
   * MushafPageView) بلا إطارين متداخلين بصريًا. المُستدعي عندها مسؤول
   * عن توفير حاوية بنسبة عرض/ارتفاع صفحة ثابتة (aspect-ratio) لتعمل
   * flex:1 الخاصة بكل سطر بشكل صحيح. */
  bare?: boolean;
  /** إظهار أرقام الآيات في مسار التراجع Unicode (فشل خط QPC أو وضع خفيف). */
  showAyahNumbers?: boolean;
  /**
   * وضع بصري فقط: بلا أزرار/ضغط على مجموعات الآيات —
   * التفاعل ينتقل لطبقة الإحداثيات (MushafHitLayer).
   */
  visualOnly?: boolean;
};

const ROW_COUNT_APPROX = 15;

/** عرض glyph بخط الصفحة فقط — لا يُستخدم أبدًا مع Amiri/Noto.
 * نهاية الآية = محرف الزخرفة من نفس خط الصفحة بلون ذهبي (لا دائرة CSS). */
function defaultRenderWord(w: QpcWord, showAyahNumbers: boolean) {
  if (w.charType === "end") {
    return (
      <Fragment key={w.id}>
        {showAyahNumbers ? (
          <span className="mf2-word mf2-ayah-marker" aria-hidden="true">{w.glyphText}</span>
        ) : null}
        {w.sajdahNumber !== null && <span className="mf2-sajda-badge">سجدة</span>}
      </Fragment>
    );
  }
  return (
    <Fragment key={w.id}>
      <span className="mf2-word">{w.glyphText}</span>
    </Fragment>
  );
}

/**
 * نص Unicode (textQpcHafs) — المسار الآمن مع Amiri Quran.
 * يمنع عرض code_v2/Presentation Forms بخط عام → تكسّر الحروف.
 */
function renderUnicodeWord(w: QpcWord, showAyahNumbers: boolean) {
  if (w.charType === "end") {
    return (
      <Fragment key={w.id}>
        {showAyahNumbers ? (
          <span className="qs-ayah-num">{toArabicDigits(Number(w.textUthmani.replace(/\D/g, "")) || 0)}</span>
        ) : null}
        {w.sajdahNumber !== null && <span className="mf2-sajda-badge">سجدة</span>}
      </Fragment>
    );
  }
  return <span key={w.id} className="mf2-word">{w.textQpcHafs}</span>;
}

export function MushafPageV2({
  layout,
  activeAyahKey,
  onAyahPress,
  sharedFontFamily,
  renderWord,
  bare,
  showAyahNumbers = true,
  visualOnly = false,
}: Props) {
  const wantPrecision = !sharedFontFamily;
  const pageFont = useMushafPageFont(wantPrecision ? (layout?.pageNumber ?? null) : null);

  /**
   * تراجع تلقائي: فشل خط QPC → Unicode + Amiri بدل glyph محرَّف.
   * الوضع الخفيف الصريح (sharedFontFamily) يبقى كما هو.
   */
  const useUnicodeSafe = Boolean(sharedFontFamily) || pageFont.failed;
  const fontReady = useUnicodeSafe ? true : pageFont.ready;

  const fontFamily = useMemo(() => {
    if (sharedFontFamily) return sharedFontFamily;
    if (pageFont.failed) return quranFontStack("amiri");
    if (layout) return mushafPageFontFamily(layout.pageNumber);
    return undefined;
  }, [sharedFontFamily, pageFont.failed, layout]);

  const wordRenderer = useMemo(() => {
    if (renderWord && !pageFont.failed) return renderWord;
    if (useUnicodeSafe) return (w: QpcWord) => renderUnicodeWord(w, showAyahNumbers);
    return (w: QpcWord) => defaultRenderWord(w, showAyahNumbers);
  }, [renderWord, pageFont.failed, useUnicodeSafe, showAyahNumbers]);

  const lineRefs = useRef(new Map<number, HTMLDivElement>());
  const linesContainerRef = useRef<HTMLDivElement | null>(null);
  /** حجم خط موحّد للصفحة كلها (لا fit-to-width لكل سطر). */
  const [pageFontSize, setPageFontSize] = useState<number | null>(null);
  const [fitted, setFitted] = useState(false);

  /**
   * حجم واحد لكل الأسطر كالمطبوع:
   * size = min( العرض ÷ عرض أعرض سطر ، (الارتفاع ÷ 15) ÷ معامل ارتفاع السطر )
   * الخط يملأ العرض — بلا space-between وبلا تحجيم سطر-بسطر.
   * الامتلاء الرأسي ≥85%: عبر 15 خانة flex متساوية تملأ الحاوية (لا بتكبير يفيض عرضًا).
   */
  useLayoutEffect(() => {
    if (!fontReady || !layout) {
      setFitted(false);
      setPageFontSize(null);
      return;
    }

    if (useUnicodeSafe) {
      setPageFontSize(null);
      setFitted(true);
      return;
    }

    const container = linesContainerRef.current;
    if (!container) return;

    /** يجب أن يطابق --mf2-lh / line-height في .mf2-line (1.0–1.15). */
    const LINE_HEIGHT_EM = 1.1;
    const REF_PX = 100;

    const measure = () => {
      const availableWidth = container.clientWidth;
      const availableHeight = container.clientHeight;
      if (availableWidth <= 0 || availableHeight <= 0) return false;

      let widestAtRef = 0;
      for (const el of lineRefs.current.values()) {
        if (!el) continue;
        el.style.fontSize = `${REF_PX}px`;
        widestAtRef = Math.max(widestAtRef, el.scrollWidth);
        // أزل الحجم المؤقت فورًا — وإلا يبقى 100px ويتجاوز الحجم الموحّد
        el.style.fontSize = "";
      }
      if (widestAtRef <= 0) return false;

      const sizeByWidth = (availableWidth * REF_PX) / widestAtRef;
      const sizeByHeight = (availableHeight / ROW_COUNT_APPROX) / LINE_HEIGHT_EM;
      const size = Math.min(sizeByWidth, sizeByHeight);

      setPageFontSize(size);
      setFitted(true);
      return true;
    };

    if (!measure()) {
      const raf = requestAnimationFrame(() => { measure(); });
      return () => cancelAnimationFrame(raf);
    }

    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => { measure(); })
      : null;
    ro?.observe(container);
    return () => ro?.disconnect();
  }, [fontReady, layout, useUnicodeSafe]);

  if (!layout) {
    return bare
      ? <div dir="rtl" style={{ height: "100%" }}><MushafPageSkeleton /></div>
      : <MushafPageSkeleton />;
  }

  const linesClass = useUnicodeSafe ? "mf2-lines mf2-lines--unicode" : "mf2-lines";

  const lines = (
    <>
      <div
        ref={linesContainerRef}
        className={linesClass}
        style={{
          opacity: fitted ? 1 : 0,
          // حجم موحّد يورثه كل سطر — لا تحجيم فردي
          fontSize: !useUnicodeSafe && pageFontSize ? `${pageFontSize}px` : undefined,
          ["--mf2-lh" as string]: !useUnicodeSafe ? "1.1" : undefined,
          fontFamily: useUnicodeSafe
            ? fontFamily
            : fontFamily
              ? `"${fontFamily}"`
              : undefined,
        }}
      >
        {layout.rows.map((row, idx) => {
          if (row.kind === "surah-header") {
            return <SurahHeaderBanner key={`h-${row.surah.id}-${idx}`} chapter={row.surah} spanRows={row.spanRows} />;
          }
          return (
            <div
              key={`l-${row.lineNumber}`}
              ref={(el) => { if (el) lineRefs.current.set(row.lineNumber, el); else lineRefs.current.delete(row.lineNumber); }}
              className={`mf2-line${useUnicodeSafe ? " mf2-line--unicode" : ""}`}
              style={{ unicodeBidi: "isolate" }}
            >
              {groupWordsByAyah(row.words).map((group) => {
                const verseKey = group[0].verseKey;
                const active = verseKey === activeAyahKey;
                if (visualOnly) {
                  return (
                    <span
                      key={verseKey}
                      className={`mf2-ayah-group${active ? " mf2-ayah-group--active" : ""}`}
                      data-verse={verseKey}
                      aria-hidden="true"
                    >
                      {group.map((w) => wordRenderer(w))}
                    </span>
                  );
                }
                return (
                  <span
                    key={verseKey}
                    className={`mf2-ayah-group${active ? " mf2-ayah-group--active" : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`آية ${verseKey}`}
                    onPointerDown={(e) => {
                      if (e.button !== 0 && e.pointerType === "mouse") return;
                      const target = e.currentTarget;
                      const timer = window.setTimeout(() => {
                        onAyahPress?.(verseKey);
                      }, 350);
                      target.dataset.ayahTimer = String(timer);
                    }}
                    onPointerUp={(e) => {
                      const t = e.currentTarget.dataset.ayahTimer;
                      if (t) window.clearTimeout(Number(t));
                      delete e.currentTarget.dataset.ayahTimer;
                    }}
                    onPointerCancel={(e) => {
                      const t = e.currentTarget.dataset.ayahTimer;
                      if (t) window.clearTimeout(Number(t));
                      delete e.currentTarget.dataset.ayahTimer;
                    }}
                    onPointerLeave={(e) => {
                      const t = e.currentTarget.dataset.ayahTimer;
                      if (t) window.clearTimeout(Number(t));
                      delete e.currentTarget.dataset.ayahTimer;
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onAyahPress?.(verseKey); } }}
                  >
                    {group.map((w) => wordRenderer(w))}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
      {!fitted && <MushafPageSkeleton overlay />}
    </>
  );

  if (bare) return <div dir="rtl" style={{ height: "100%" }}>{lines}</div>;

  return (
    <div className="mf2-page" dir="rtl">
      <div className="mf2-frame">{lines}</div>
    </div>
  );
}

export function SurahHeaderBanner({ chapter, spanRows }: { chapter: MushafPageLayout["surahsOnPage"][number]; spanRows: number }) {
  return (
    <div className="mf2-surah-header" style={{ flex: spanRows }}>
      <div className="mf2-surah-header__frame">
        <span className="mf2-surah-header__name">سُورَةُ {chapter.nameArabic}</span>
      </div>
      {chapter.bismillahPre && (
        <div className="mf2-bismillah" lang="ar" dir="rtl">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
      )}
    </div>
  );
}

function MushafPageSkeleton({ overlay }: { overlay?: boolean }) {
  return (
    <div className={`mf2-skeleton${overlay ? " mf2-skeleton--overlay" : ""}`} aria-hidden="true">
      {Array.from({ length: ROW_COUNT_APPROX }, (_, i) => (
        <div key={i} className="mf2-skeleton__line" />
      ))}
    </div>
  );
}
