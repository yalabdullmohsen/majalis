import { useMemo, useState } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { SurahInfoCard } from "@/components/quran/SurahInfoCard";
import { getSurahList } from "@/lib/quran-api";

type Filter = "الكل" | "مكية" | "مدنية";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u064B-\u065F\u0670]/g, "").replace(/[أإآ]/g, "ا").trim();
}

export default function MakkiMadaniPage() {
  const [filter, setFilter] = useState<Filter>("الكل");
  const [query, setQuery] = useState("");
  const surahs = useMemo(() => {
    const needle = normalize(query);
    return getSurahList().filter((surah) =>
      (filter === "الكل" || surah.revelation === filter) && (!needle || normalize(surah.name).includes(needle)),
    );
  }, [filter, query]);

  return (
    <div className="ds-page makki-madani-page" dir="rtl">
      <PageHeader eyebrow="علوم القرآن" title="السور المكية والمدنية" subtitle="مدخل لفهم زمن النزول وسياق الخطاب وتدرّج التشريع، مع مراعاة مواضع الخلاف بين أهل العلم." />

      <section className="ds-card revelation-rule" aria-labelledby="revelation-rule-title">
        <h2 id="revelation-rule-title">الضابط العلمي</h2>
        <p><strong>المكي</strong> ما نزل قبل الهجرة ولو نزل خارج مكة، و<strong>المدني</strong> ما نزل بعد الهجرة ولو نزل خارج المدينة. وهذا هو الضابط الأشهر عند علماء علوم القرآن.</p>
        <p>قد يقع الخلاف في بعض السور أو الآيات، وقد توجد آيات مدنية في سورة يغلب عليها الوصف المكي أو العكس؛ لذلك لا يُعامل التصنيف كحكم على كل آية منفردة.</p>
      </section>

      <section className="revelation-comparison" aria-label="مقارنة خصائص المكي والمدني">
        <article className="ds-card"><h2>يغلب على المكي</h2><p>تقرير التوحيد والبعث، قصص الأنبياء، تثبيت المؤمنين، الاستدلال بآيات الكون، وقوة الإيقاع. وهذه سمات أغلبية وليست قواعد بلا استثناء.</p></article>
        <article className="ds-card"><h2>يغلب على المدني</h2><p>بناء المجتمع، العبادات والمعاملات والأسرة والمواريث والعلاقات، وبيان أحوال المنافقين وتفصيل الأحكام. وليست كل سورة مدنية طويلة.</p></article>
      </section>

      <section className="ds-card revelation-why"><h2>لماذا تهمنا هذه المعرفة؟</h2><ul><li>فهم سياق الخطاب والمرحلة التي نزل فيها.</li><li>تبين تدرّج التشريع وبناء المجتمع المسلم.</li><li>الإعانة على التفسير والترجيح عند أهل الاختصاص.</li></ul></section>

      <div className="revelation-toolbar">
        <label><span className="sr-only">البحث باسم السورة</span><input className="ds-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث باسم السورة" /></label>
        <div className="filter-tabs" role="group" aria-label="تصفية السور">
          {(["الكل", "مكية", "مدنية"] as Filter[]).map((value) => <button key={value} type="button" className={filter === value ? "is-active" : ""} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}</button>)}
        </div>
      </div>

      <p className="revelation-review-note">التصنيفات أدناه هي التصنيف المشهور في فهرس المصحف المستخدم داخل التطبيق. تفاصيل مواضع الخلاف وأسباب النزول وترتيب النزول لا تُنشر هنا قبل مراجعة علمية بشرية موثقة.</p>
      {surahs.length ? <div className="surah-info-grid">{surahs.map((surah) => <SurahInfoCard key={surah.number} surah={surah} />)}</div> : <div className="ds-empty"><h2>لا توجد نتائج</h2><p>جرّب اسمًا آخر أو أزل التصفية.</p></div>}

      <section className="ds-card revelation-sources"><h2>مراجع المنهج</h2><ul><li>البرهان في علوم القرآن — بدر الدين الزركشي.</li><li>الإتقان في علوم القرآن — جلال الدين السيوطي.</li><li>مناهل العرفان في علوم القرآن — محمد عبد العظيم الزرقاني.</li></ul><p>تحتاج البيانات التفصيلية لكل سورة إلى اعتماد لجنة المراجعة العلمية قبل إضافتها للعامة.</p><Link href="/quran">العودة إلى المصحف</Link></section>
    </div>
  );
}
