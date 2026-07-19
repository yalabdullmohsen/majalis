import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { BookOpen, Info } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { fetchSurahIndexLocal, fetchRevelationTypes, type SurahIndexEntry } from "@/lib/surah-index";

type RevelationFilter = "all" | "meccan" | "medinan";

const REVELATION_LABEL: Record<"Meccan" | "Medinan", string> = {
  Meccan: "مكية",
  Medinan: "مدنية",
};

/**
 * خريطة ترتيب نزول السور — عرض بصري (خط زمني RTL) للسور الـ114 مرتَّبة
 * حسب نزولها التاريخي الفعلي على النبي ﷺ، لا حسب ترقيم المصحف الحالي.
 *
 * البيانات: حقل revelationOrder الثابت المُوثَّق مصدره بالتفصيل عند
 * REVELATION_ORDER في src/lib/quran-api.ts (راجعه لتفاصيل المصدر
 * والتحفظات العلمية). هذه الصفحة عرض/تنقّل فقط — لا تُعدِّل أي بيانات
 * قرآنية ولا ترتيب المصحف نفسه في أي مكان آخر بالموقع.
 */
export default function RevelationOrderPage() {
  const [surahs, setSurahs] = useState<SurahIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<RevelationFilter>("all");

  useEffect(() => {
    applyPageSeo({
      path: "/quran/revelation-order",
      title: "ترتيب نزول القرآن الكريم | المجلس العلمي",
      description: "خريطة ترتيب نزول سور القرآن الكريم الـ114 كاملة حسب تسلسل نزولها التاريخي على النبي ﷺ، مع تمييز السور المكية والمدنية.",
      keywords: ["ترتيب النزول", "أسباب النزول", "سور القرآن", "مكية ومدنية", "ترتيب نزول القرآن"],
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchSurahIndexLocal()
      .then((list) => { if (!cancelled) setSurahs(list); })
      .catch(() => { if (!cancelled) setLoadError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    fetchRevelationTypes().then((map) => {
      if (cancelled || map.size === 0) return;
      setSurahs((prev) => prev.map((s) => ({ ...s, revelationType: map.get(s.number) ?? s.revelationType })));
    });
    return () => { cancelled = true; };
  }, []);

  const ordered = useMemo(() => {
    let list = [...surahs].sort((a, b) => a.revelationOrder - b.revelationOrder);
    if (filter === "meccan") list = list.filter((s) => s.revelationType === "Meccan");
    else if (filter === "medinan") list = list.filter((s) => s.revelationType === "Medinan");
    return list;
  }, [surahs, filter]);

  return (
    <div className="revord-page" dir="rtl">
      <header className="revord-hero">
        <h1>ترتيب نزول القرآن الكريم</h1>
        <p>خريطة زمنية للسور الـ١١٤ حسب تسلسل نزولها الفعلي على النبي ﷺ — يبدأ بسورة العلق وينتهي بسورة النصر، لا حسب ترقيمها في المصحف.</p>
        <div className="revord-note">
          <Info size={15} strokeWidth={1.8} aria-hidden="true" />
          <span>
            ترتيب توقيفي للمصحف يبقى كما هو دومًا في كل صفحات الموقع؛ هذا عرض تاريخي إضافي فقط.
            راجع <Link href="/quran/surahs">فهرس السور</Link> للترتيب المعتاد، أو{" "}
            <a href="#revord-source">مصدر هذه البيانات أدناه</a>.
          </span>
        </div>
      </header>

      <div className="revord-filters" role="tablist" aria-label="فلترة حسب مكان النزول">
        <button type="button" role="tab" aria-selected={filter === "all"} className={`revord-chip${filter === "all" ? " is-active" : ""}`} onClick={() => setFilter("all")}>
          الكل
        </button>
        <button type="button" role="tab" aria-selected={filter === "meccan"} className={`revord-chip revord-chip--meccan${filter === "meccan" ? " is-active" : ""}`} onClick={() => setFilter("meccan")}>
          <span className="revord-dot revord-dot--meccan" aria-hidden="true" /> مكية
        </button>
        <button type="button" role="tab" aria-selected={filter === "medinan"} className={`revord-chip revord-chip--medinan${filter === "medinan" ? " is-active" : ""}`} onClick={() => setFilter("medinan")}>
          <span className="revord-dot revord-dot--medinan" aria-hidden="true" /> مدنية
        </button>
      </div>

      {loading ? (
        <div className="revord-skeletons" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="revord-skel" />)}
        </div>
      ) : loadError ? (
        <div className="revord-empty">
          <BookOpen size={32} strokeWidth={1} aria-hidden="true" />
          <p>تعذّر تحميل بيانات السور. تحقّق من اتصالك وأعد المحاولة.</p>
        </div>
      ) : (
        <ol className="revord-timeline" aria-label="السور مرتبة حسب ترتيب النزول">
          {ordered.map((s) => (
            <li key={s.number} className="revord-event">
              <span
                className={`revord-marker${s.revelationType === "Medinan" ? " revord-marker--medinan" : ""}`}
                aria-hidden="true"
              />
              <Link href={`/mushaf/${s.number}`} className="revord-card">
                <span className="revord-card__order" aria-hidden="true">{s.revelationOrder}</span>
                <span className="revord-card__body">
                  <span className="revord-card__name" style={{ fontFamily: "var(--font-quran)" }}>{s.name}</span>
                  <span className="revord-card__meta">
                    سورة رقم {s.number} في المصحف · {s.numberOfAyahs} آية
                    {s.revelationType && <> · {REVELATION_LABEL[s.revelationType]}</>}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <footer id="revord-source" className="revord-source">
        <h2>مصدر ترتيب النزول</h2>
        <p>
          يعتمد هذا الترتيب القائمة الزمنية الأشهر تداولًا في المراجع والمواقع الإسلامية الحديثة لترتيب نزول
          السور، المطابقة لِما يُنسَب لرواية ابن عباس كما أوردها السيوطي في «الإتقان في علوم القرآن» وابن
          النديم في «الفهرست». ينبَّه إلى أن السيوطي نفسه ذكر أكثر من رواية لهذا الترتيب (منسوبة لجابر بن زيد
          والحسين وعكرمة وابن عباس، وترتيب رابع مجهول قائله)، وأن ترتيب النزول الدقيق بين بعض السور المتقاربة
          زمنيًا مسألة اجتهادية لم يُجمَع عليها العلماء إجماعًا قطعيًا — بخلاف ترقيم المصحف نفسه وهو توقيفي لا
          يتغيّر.
        </p>
      </footer>
    </div>
  );
}
