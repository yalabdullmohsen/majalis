/**
 * القراءات العشر — تعريف وقرّاء وأمثلة وصفية (لا تعديل لنص مصحف حفص).
 */
import { useEffect } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import {
  MUSHAF_TEXT_IS_HAFS_ONLY,
  QIRAAT_ASHARA,
  QIRAAT_AUDIO_CATALOG,
  QIRAAT_DIFF_EXAMPLES,
  QIRAAT_SECTIONS,
} from "@/lib/quran-qiraat/catalog";
import { formatArabicNumber } from "@/lib/numerals";
import { findMushafPageForAyah } from "@/features/mushaf-madinah/mushaf-page-for-ayah";
import "@/styles/pages/qiraat.css";

function mushafHref(surah: number, ayah: number): string {
  const page = findMushafPageForAyah(surah, ayah);
  return `/mushaf?page=${page}&ayah=${surah}:${ayah}`;
}

const KIND_LABEL = {
  lahji: "اختلاف لهجي في الأداء",
  harakah: "اختلاف في الحركة",
  harf: "اختلاف في الحرف",
} as const;

export default function QuranQiraatView() {
  useEffect(() => {
    applyPageSeo({
      path: "/quran-hub/qiraat",
      title: "القراءات العشر — المجلس العلمي",
      description: "تأصيل القراءات العشر ورواتها وأمثلة وصفية موثّقة دون تغيير نص مصحف حفص.",
      keywords: ["قراءات", "رواية", "حفص", "ورش", "شاطبية", "النشر"],
    });
  }, []);

  return (
    <SectionTemplatePage
      route="/quran-hub/qiraat"
      title="القراءات العشر"
      subtitle={`نص المصحف في التطبيق رواية حفص عن عاصم فقط${MUSHAF_TEXT_IS_HAFS_ONLY ? " — لا يُستبدل بنص قراءة أخرى داخل المصحف." : "."}`}
      groupTitle="أبواب القراءات"
    >
    <div className="qr-page" dir="rtl" data-quran-qiraat="1">
      <p className="qr-note" role="note">
        أوجه القراءات تُعرض وصفًا («قرأ فلان كذا») مع المصدر، ولا تُحقن في صفحة المصحف.
      </p>

      {QIRAAT_SECTIONS.map((sec) => (
        <section key={sec.id} className="qr-section" id={sec.id}>
          <h2>{sec.title}</h2>
          {sec.body.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
          <p className="qr-source">
            <strong>المصدر:</strong> {sec.source}
          </p>
        </section>
      ))}

      <section className="qr-section" aria-label="القرّاء العشرة">
        <h2>القرّاء العشرة ورواتهم</h2>
        <div className="qr-qari-grid">
          {QIRAAT_ASHARA.map((q, i) => (
            <article key={q.id} className="qr-qari-card" data-qari={q.id}>
              <p className="qr-qari-card__n">{formatArabicNumber(i + 1)}</p>
              <h3>{q.name}</h3>
              <p className="qr-qari-card__nisba">{q.nisba}</p>
              {q.deathYearHijri ? (
                <p className="qr-qari-card__meta">وفاة نحو {q.deathYearHijri} هـ</p>
              ) : null}
              <p>{q.bio}</p>
              <ul className="qr-rawis">
                {q.rawis.map((r) => (
                  <li key={r.id}>{r.name}</li>
                ))}
              </ul>
              <p className="qr-source">
                <strong>المصدر:</strong> {q.source}
              </p>
              <p>
                <Link href="/scholars">أعلام وتراجم</Link>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="qr-section" aria-label="أمثلة اختلاف">
        <h2>أمثلة على أوجه الاختلاف</h2>
        <ul className="qr-diff-list">
          {QIRAAT_DIFF_EXAMPLES.map((ex) => (
            <li key={ex.id}>
              <span className="qr-diff-list__kind">{KIND_LABEL[ex.kind]}</span>
              <p>{ex.description}</p>
              <p className="qr-source">
                <strong>المصدر:</strong> {ex.source}
              </p>
              <Link href={mushafHref(ex.ayahRef.surah, ex.ayahRef.ayah)}>
                موضع المصحف (حفص) {formatArabicNumber(ex.ayahRef.surah)}:
                {formatArabicNumber(ex.ayahRef.ayah)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="qr-section">
        <h2>التلاوات الصوتية بقراءات أخرى</h2>
        <p>
          الكتالوج الصوتي فارغ عمدًا ({formatArabicNumber(QIRAAT_AUDIO_CATALOG.length)} تسجيل) حتى
          يُوثَّق الترخيص في سجل مخاطر التراخيص.
        </p>
      </section>
    </div>
    </SectionTemplatePage>
  );
}
