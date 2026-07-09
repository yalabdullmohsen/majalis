import { useEffect, useState } from "react";
import { AlertTriangle, Calendar, ExternalLink, FileText, Globe, GraduationCap, Info, Landmark, MapPin } from "lucide-react";
import { useRoute, Link } from "wouter";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchUniversity,
  groupProgramsByDegree,
  ACCREDITATION_LABELS,
  type University,
  type UniversityProgram,
} from "@/lib/universities-service";
import { CompareProvider } from "@/components/universities/CompareContext";
import { useCompare } from "@/components/universities/CompareContext";
import { CompareBar } from "@/components/universities/CompareBar";
import { applyPageSeo } from "@/lib/seo";

function ProgramCard({ program: p }: { program: UniversityProgram }) {
  const [open, setOpen] = useState(false);
  const req = p.admission_requirements?.[0];

  return (
    <div className="udp-prog-card">
      <button type="button" onClick={() => setOpen(!open)} className="udp-prog-header-btn">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="udp-badge--emerald">{p.degree_level}</span>
            <span className="udp-badge--neutral">{p.study_mode}</span>
            {p.has_scholarship && (
              <span className="udp-badge--emerald"><GraduationCap size={11} aria-hidden="true" /> منحة</span>
            )}
          </div>
          <p className="udp-prog-name">{p.program_name}</p>
          {p.faculty_department && (
            <p className="udp-prog-dept">{p.faculty_department}</p>
          )}
        </div>
        <span className="udp-chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="udp-prog-body space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="udp-meta-label">لغة الدراسة</p><p className="font-medium">{p.study_language}</p></div>
            <div><p className="udp-meta-label">مدة البرنامج</p><p className="font-medium">{p.duration || "—"}</p></div>
            {p.specialization && <div className="col-span-2"><p className="udp-meta-label">التخصص</p><p className="font-medium">{p.specialization}</p></div>}
            {p.tuition_fees && (
              <div><p className="udp-meta-label">الرسوم الدراسية</p>
                <p className="font-medium">{p.tuition_fees.toLocaleString("ar-SA")} {p.currency}</p></div>
            )}
            {p.has_scholarship && p.scholarship_details && (
              <div className="col-span-2">
                <p className="udp-meta-label">تفاصيل المنحة</p>
                <p className="udp-scholarship-text">{p.scholarship_details}</p>
              </div>
            )}
          </div>

          {req && (
            <div className="space-y-3">
              {req.requirements?.length > 0 && (
                <div>
                  <p className="udp-section-subtitle">شروط القبول</p>
                  <ul className="space-y-1">
                    {req.requirements.map((r, i) => (
                      <li key={i} className="udp-req-item">
                        <span className="udp-req-check">✓</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {req.required_documents?.length > 0 && (
                <div>
                  <p className="udp-section-subtitle">المستندات المطلوبة</p>
                  <ul className="space-y-1">
                    {req.required_documents.map((d, i) => (
                      <li key={i} className="udp-req-item">
                        <FileText size={12} strokeWidth={1.8} className="udp-req-file" aria-hidden="true" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {req.application_steps?.length > 0 && (
                <div>
                  <p className="udp-section-subtitle">خطوات التقديم</p>
                  <ol className="space-y-2">
                    {req.application_steps.map((s) => (
                      <li key={s.step} className="udp-req-item">
                        <span className="udp-step-num">{s.step}</span>
                        <span className="pt-0.5">{s.text}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="flex items-center gap-4 flex-wrap text-sm">
                {req.application_deadline && (
                  <div>
                    <span className="udp-deadline-label">موعد التقديم</span>
                    <span className="udp-deadline-val">
                      <Calendar size={13} aria-hidden="true" /> {req.application_deadline}
                    </span>
                  </div>
                )}
                {req.application_url && (
                  <a href={req.application_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 citation-btn citation-btn--primary rounded-xl text-sm font-medium transition-colors">
                    <ExternalLink size={13} aria-hidden="true" /> رابط التقديم الرسمي ↗
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailContent({ university: u }: { university: University }) {
  const { addToCompare, removeFromCompare, isInCompare, canAdd } = useCompare();
  const inCompare = isInCompare(u.slug);
  const programsByDegree = groupProgramsByDegree(
    (u.university_programs || []).filter((p) => p.is_active)
  );

  return (
    <div dir="rtl" className="udp-root">
      {/* شريط التحديث */}
      <div className="udp-update-bar">
        <AlertTriangle size={12} aria-hidden="true" className="inline ml-1" />
        آخر تحديث: {new Date(u.last_updated_at).toLocaleDateString("ar-SA")} — تحقق من الموقع الرسمي للجامعة قبل اتخاذ أي قرار.
      </div>

      {/* Header */}
      <div className="text-white px-4 py-8 ldb-hero">
        <div className="max-w-3xl mx-auto">
          <Link href="/universities" className="text-white/70 text-sm hover:text-white mb-4 block w-fit">
            → دليل الجامعات
          </Link>
          <div className="flex items-start gap-4">
            {u.logo_url ? (
              <img src={u.logo_url} alt={u.name_ar}
                className="w-16 h-16 rounded-2xl bg-white object-contain flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold flex-shrink-0">
                {u.name_ar[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold mb-1 leading-snug">{u.name_ar}</h1>
              {u.name_en && <p className="text-white/75 text-sm mb-2">{u.name_en}</p>}
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <MapPin size={12} aria-hidden="true" /> {u.city ? `${u.city}، ` : ""}{u.country}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-white text-xs font-medium udp-acc-badge univ-acc--${u.accreditation_status}`}>
                  {ACCREDITATION_LABELS[u.accreditation_status]}
                </span>
                {u.is_verified && (
                  <span className="bg-white/20 px-2.5 py-0.5 rounded-full">✓ موثقة</span>
                )}
              </div>
            </div>
          </div>

          {/* أزرار */}
          <div className="flex gap-2 mt-5 flex-wrap">
            {u.website_url && (
              <a href={u.website_url} target="_blank" rel="noopener noreferrer" className="udp-website-btn">
                <Globe size={14} aria-hidden="true" /> الموقع الرسمي ↗
              </a>
            )}
            <button type="button"
              onClick={() => inCompare ? removeFromCompare(u.slug) : addToCompare(u)}
              disabled={!inCompare && !canAdd}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                inCompare ? "bg-white udp-compare-active-btn" :
                canAdd ? "bg-white/20 text-white hover:bg-white/30" :
                "bg-white/10 text-white/50 cursor-not-allowed"
              }`}>
              {inCompare ? "✓ في المقارنة" : "⇔ أضف للمقارنة"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* نبذة */}
        {u.about && (
          <section>
            <h2 className="udp-section-title">عن الجامعة</h2>
            <p className="udp-about-text">{u.about}</p>
          </section>
        )}

        {/* البرامج */}
        {Object.keys(programsByDegree).length > 0 && (
          <section>
            <h2 className="udp-section-title">البرامج الدراسية</h2>
            {Object.entries(programsByDegree).map(([degree, progs]) => (
              <div key={degree} className="mb-5">
                <h3 className="udp-degree-label">{degree} ({progs.length} برنامج)</h3>
                <div className="space-y-2">
                  {progs.map((p) => <ProgramCard key={p.id} program={p} />)}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* الأسئلة الشائعة */}
        {u.university_faqs && u.university_faqs.length > 0 && (
          <section>
            <h2 className="udp-section-title">أسئلة شائعة</h2>
            <div className="space-y-3">
              {u.university_faqs.map((faq) => (
                <details key={faq.id} className="udp-faq-item">
                  <summary className="udp-faq-summary">{faq.question}</summary>
                  <div className="udp-faq-answer">{faq.answer}</div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* وسائل التواصل */}
        {Object.keys(u.social_links || {}).length > 0 && (
          <section>
            <h2 className="udp-section-title">وسائل التواصل</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(u.social_links).map(([platform, url]) => (
                url && (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="udp-social-link">
                    {platform} ↗
                  </a>
                )
              ))}
            </div>
          </section>
        )}

        {/* إخلاء مسؤولية */}
        <div className="udp-disclaimer">
          <Info size={12} aria-hidden="true" className="inline ml-1" /> المعلومات أعلاه مُدخَلة يدوياً لأغراض توجيهية فقط. الرسوم والشروط وتواريخ القبول
          قد تتغير. تحقق دائماً من الموقع الرسمي للجامعة أو تواصل معها مباشرة قبل اتخاذ قرار.
        </div>
      </div>

      <CompareBar />
    </div>
  );
}

export default function UniversityDetailPage() {
  const [, params] = useRoute("/universities/:slug");
  const slug = params?.slug || "";
  const [university, setUniversity] = useState<University | null>(null);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);

  useEffect(() => {
    if (university) {
      applyPageSeo({
        path: `/universities/${slug}`,
        title: `${university.name_ar} | المجلس العلمي`,
        description: university.about || `تفاصيل ${university.name_ar} — البرامج الأكاديمية والتخصصات والاعتمادات.`,
        keywords: ["جامعة إسلامية", university.name_ar, "دراسة شرعية", "تعليم ديني"],
      });
    }
  }, [university, slug]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchUniversity(slug)
      .then((u) => { setUniversity(u); if (!u) setNotFound(true); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div dir="rtl" className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <Spinner className="size-10 icon-emerald" aria-label="جارٍ التحميل" />
          <p className="udp-loading-text">جارٍ التحميل…</p>
        </div>
      </div>
    );
  }

  if (notFound || !university) {
    return (
      <div dir="rtl" className="flex items-center justify-center min-h-screen text-center">
        <div>
          <Landmark size={48} strokeWidth={1.3} className="mx-auto mb-4" aria-hidden="true" />
          <p className="udp-not-found-title">الجامعة غير موجودة</p>
          <Link href="/universities" className="udp-back-link">→ العودة للدليل</Link>
        </div>
      </div>
    );
  }

  return (
    <CompareProvider>
      <DetailContent university={university} />
    </CompareProvider>
  );
}
