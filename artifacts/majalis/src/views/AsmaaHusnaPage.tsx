import "@/styles/pages/asmaa-husna.css";
import { useEffect, useMemo, useState } from "react";
import { Search, Star, BookOpen, Heart } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

import { ASMAA, ASMA_CATEGORIES, type AsmaEntry, type AsmaStatus } from "@/lib/asma-husna-data";
import { UnsourcedBadge } from "@/components/UnsourcedBadge";
import { ExploreAlsoNav } from "@/components/ExploreAlsoNav";
import { PageShell } from "@/components/layout/PageShell";
import { PAGE_EXPLORE_LINKS } from "@/lib/explore-links";

const CATEGORIES = [...ASMA_CATEGORIES];
const STATUS_FILTERS: Array<"الكل" | AsmaStatus> = ["الكل", "ثابت", "مشهور"];

/* ─── الصفحة ─── */
export default function AsmaaHusnaPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("الكل");
  /** العرض الافتراضي على «ثابت»؛ الأسماء المشهورة من سرد الترمذي تُطلب صراحةً. */
  const [statusFilter, setStatusFilter] = useState<"الكل" | AsmaStatus>("ثابت");
  const [selected, setSelected] = useState<AsmaEntry | null>(null);
  const [favs, setFavs] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("ah-favs") || "[]")); }
    catch { return new Set(); }
  });

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [selected]);

  useEffect(() => {
    applyPageSeo({
      path: "/asma-husna",
      title: "الأسماء الحسنى، أسماء الله التسعة والتسعون | المجلس العلمي",
      description: "أسماء الله الحسنى: أصل حديث الإحصاء في الصحيحين، مع بيان أن السرد التفصيلي في الترمذي ضعيف عند المحققين، وعرض الأسماء بمعانيها. رواية ضعيفة",
      keywords: ["أسماء الله الحسنى", "الله", "الرحمن", "الرحيم", "الأسماء الحسنى"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "أسماء الله الحسنى",
          description: "أسماء الله الحسنى مع المعنى والمصدر والتنبيه على ضعف السرد التفصيلي؛ محتوى معتمد في منهج المجلس العلمي",
          numberOfItems: ASMAA.length,
          itemListElement: ASMAA.map((a, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${a.arabic} — ${a.meaning}`,
            url: `https://www.majlisilm.com/asma-husna#name-${a.num}`,
          })),
        },
      ],
    });
  }, []);

  const toggleFav = (num: number) => {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num); else next.add(num);
      localStorage.setItem("ah-favs", JSON.stringify([...next]));
      return next;
    });
  };

  const filtered = useMemo(() => {
    return ASMAA.filter((a) => {
      const matchCat = category === "الكل" || a.category === category;
      const matchStatus = statusFilter === "الكل" || a.status === statusFilter;
      const matchQ = arabicMatchAny([a.arabic, a.meaning, a.status], search);
      return matchCat && matchStatus && matchQ;
    });
  }, [search, category, statusFilter]);

  const statusCounts = useMemo(() => ({
    ثابت: ASMAA.filter((a) => a.status === "ثابت").length,
    مشهور: ASMAA.filter((a) => a.status === "مشهور").length,
  }), []);

  return (
    <PageShell className="ah-page">
      {/* ═══ Hero ═══ */}
      <div className="ah-hero">
        <div className="ah-hero__bismillah">بسم الله الرحمن الرحيم</div>
        <h1 className="ah-hero__title">الأسماء الحسنى</h1>
        <p className="ah-hero__sub">
          قال ﷺ: «إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا مِائَةً إِلَّا وَاحِدًا مَنْ أَحْصَاهَا دَخَلَ الْجَنَّةَ»
          <span className="ah-hero__source">متفق عليه — بلا سرد للأسماء</span>
        </p>
        <div className="ah-hero__stats">
          <span>قائمة تعليمية</span>
          <span className="ah-hero__dot">·</span>
          <span aria-live="polite" aria-atomic="true">{filtered.length} ظاهر</span>
          <span className="ah-hero__dot">·</span>
          <span>{favs.size} محفوظ</span>
        </div>
      </div>

      <aside className="ah-method-note" role="note" aria-label="تنبيه منهجي">
        <strong>تنبيه منهجي:</strong>{""}
        أصل حديث «لله تسعة وتسعون اسمًا… من أحصاها دخل الجنة» ثابت في الصحيحين بغير تعداد للأسماء.
        أما السرد التفصيلي الوارد في بعض روايات الترمذي فضعيف عند المحققين.
        لذلك وُسِم كل اسم هنا بـ«ثابت» إن وُجد له شاهد من القرآن أو السنة الصحيحة، أو بـ«مشهور» إن اقتصر على سرد الترمذي بلا شاهد مستقل ({statusCounts.ثابت} ثابتًا · {statusCounts.مشهور} مشهورًا).
        والإحصاء المطلوب: العلم بمعاني الأسماء الثابتة والتعبّد بمقتضاها، لا مجرّد عدّ ألفاظ.
      </aside>

      {/* ═══ شريط تقدم المحفوظات ═══ */}
      {favs.size > 0 && (
        <div className="ah-progress-bar-wrap" aria-label={`حفظت ${favs.size} من 99 اسماً`}>
          <div className="ah-progress-bar-labels">
            <span>تقدمك في حفظ الأسماء</span>
            <span>{favs.size} / 99</span>
          </div>
          <div className="ah-progress-bar-track" role="progressbar" aria-valuenow={favs.size} aria-valuemin={0} aria-valuemax={99}>
            <div className="ah-progress-bar-fill" style={{ width: `${(favs.size / 99) * 100}%` }} />
          </div>
        </div>
      )}

      {/* ═══ فلاتر ═══ */}
      <div className="ah-controls">
        <div className="ah-search-wrap">
          <Search size={16} className="ah-search-icon" aria-hidden="true" />
          <input
            className="ah-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن اسم..."
            aria-label="بحث في الأسماء الحسنى"
          />
        </div>
        <div className="ah-cat-chips" role="tablist" aria-label="تصفية حسب ثبوت الاسم">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              role="tab"
              type="button"
              className={`ah-cat-chip ah-cat-chip--status${statusFilter === s ? "ah-cat-chip--active" : ""}`}
              onClick={() => setStatusFilter(s)}
              aria-selected={statusFilter === s}
            >
              {s === "الكل" ? "كل الدرجات" : s}
            </button>
          ))}
        </div>
        <div className="ah-cat-chips" role="tablist" aria-label="تصفية الأسماء الحسنى">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              role="tab"
              type="button"
              className={`ah-cat-chip${category === c ? "ah-cat-chip--active" : ""}`}
              onClick={() => setCategory(c)}
              aria-selected={category === c}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ شبكة الأسماء ═══ */}
      {filtered.length === 0 ? (
        <p className="ah-empty">لا يوجد اسم مطابق للبحث.</p>
      ) : (
        <div className="ah-grid">
          {filtered.map((a) => (
            <div
              key={a.num}
              role="button"
              tabIndex={0}
              className="ah-card"
              onClick={() => setSelected(a)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === "") && setSelected(a)}
              aria-label={`${a.arabic}، ${a.meaning}`}
            >
              <span className="ah-card__num">{a.num}</span>
              <span className={`ah-card__status ah-card__status--${a.status === "ثابت" ? "thabit" : "mashhur"}`}>{a.status}</span>
              <span className="ah-card__name">{a.arabic}</span>
              <span className="ah-card__meaning">{a.meaning.slice(0, 35)}{a.meaning.length > 35 ? "…" : ""}</span>
              <button
                type="button"
                className={`ah-card__fav${favs.has(a.num) ? "ah-card__fav--active" : ""}`}
                onClick={(e) => { e.stopPropagation(); toggleFav(a.num); }}
                aria-label={favs.has(a.num) ? "إزالة من المحفوظات" : "إضافة للمحفوظات"}
              >
                <Heart size={13} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      <SectionQuiz
        categoryId="aqeeda"
        title="اختبر معلوماتك في العقيدة والأسماء الحسنى"
        count={4}
      />

      <div className="twh-share">
        <ShareButtons title="الأسماء الحسنى — المجلس العلمي" url="https://www.majlisilm.com/asma-husna" />
      </div>

      {/* ═══ نافذة التفاصيل ═══ */}
      {selected && (
        /* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */
        <div
          className="ah-modal-backdrop"
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <div
            className="ah-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ah-modal-name"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ah-modal__head">
              <span className="ah-modal__num">{selected.num}</span>
              <h2 id="ah-modal-name" className="ah-modal__name">{selected.arabic}</h2>
              <button
                type="button"
                className={`ah-modal__fav${favs.has(selected.num) ? "ah-modal__fav--active" : ""}`}
                onClick={() => toggleFav(selected.num)}
                aria-label="تفضيل"
              >
                <Heart size={18} />
              </button>
            </div>

            <div className="ah-modal__section">
              <span className="ah-modal__label"><BookOpen size={13} /> المعنى</span>
              <p className="ah-modal__text">{selected.meaning}</p>
            </div>

            <div className="ah-modal__section">
              <span className="ah-modal__label"><Star size={13} /> الدليل والدرجة</span>
              <p className={`ah-modal__status ah-modal__status--${selected.status === "ثابت" ? "thabit" : "mashhur"}`}>
                {selected.status === "ثابت"
                  ? "ثابت — له شاهد من القرآن أو السنة الصحيحة"
                  : "مشهور — من سرد الترمذي الضعيف؛ لا يُجزم بتوقيفيته حتى يثبت بدليل مستقل"}
              </p>
              <p className="ah-modal__text ah-modal__text--quran">{selected.reference}</p>
              <UnsourcedBadge status={selected.documentation_status} />
            </div>

            <div className="ah-modal__section">
              <span className="ah-modal__label">الفائدة والعمل</span>
              <p className="ah-modal__text">{selected.benefit}</p>
              {selected.status === "مشهور" && (
                <p className="ah-modal__caution">لا يُبنى على هذا الاسم وحده حكمٌ أو فضلٌ خاص حتى يثبت في نص صحيح.</p>
              )}
            </div>

            <div className="ah-modal__cat-badge">{selected.category}</div>

            <button
              type="button"
              className="ah-modal__close"
              onClick={() => setSelected(null)}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      <ExploreAlsoNav
        title="مواضيع عقدية مرتبطة"
        links={[...PAGE_EXPLORE_LINKS.asmaHusna]}
      />
    </PageShell>
  );
}
