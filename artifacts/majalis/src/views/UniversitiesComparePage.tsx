import { useEffect } from "react";
import { AlertTriangle, Globe } from "lucide-react";
import { Link } from "wouter";
import { CompareProvider, useCompare } from "@/components/universities/CompareContext";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { applyPageSeo } from "@/lib/seo";
import { ACCREDITATION_LABELS, ACCREDITATION_COLOR } from "@/lib/universities-service";
import type { University, UniversityProgram } from "@/lib/universities-service";

function lowestFee(programs: UniversityProgram[]): string {
  const fees = programs
    .filter((p) => p.tuition_fees)
    .map((p) => ({ fee: p.tuition_fees!, currency: p.currency }));
  if (!fees.length) return "—";
  const min = fees.reduce((a, b) => a.fee < b.fee ? a : b);
  return `${min.fee.toLocaleString("ar-SA")} ${min.currency}`;
}

function hasFreeOrScholarship(programs: UniversityProgram[]): string {
  const scholarships = programs.filter((p) => p.has_scholarship);
  if (!scholarships.length) return "لا";
  return `نعم (${scholarships.length} برنامج)`;
}

function languages(programs: UniversityProgram[]): string {
  return [...new Set(programs.map((p) => p.study_language))].join("، ") || "—";
}

function modes(programs: UniversityProgram[]): string {
  return [...new Set(programs.map((p) => p.study_mode))].join("، ") || "—";
}

function degrees(programs: UniversityProgram[]): string {
  const order = ["دبلوم","بكالوريوس","ماجستير","دكتوراه","دبلوم_عالي"];
  const set = [...new Set(programs.map((p) => p.degree_level))]
    .sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return set.join(" / ") || "—";
}

function nearestDeadline(programs: UniversityProgram[]): string {
  const deadlines: string[] = [];
  for (const p of programs) {
    const d = p.admission_requirements?.[0]?.application_deadline;
    if (d) deadlines.push(d);
  }
  return deadlines.length ? deadlines.join(", ") : "—";
}

const COMPARE_ROWS: { label: string; fn: (u: University) => string }[] = [
  { label: "الدولة والمدينة",   fn: (u) => `${u.country}${u.city ? `، ${u.city}` : ""}` },
  { label: "حالة الاعتماد",     fn: (u) => ACCREDITATION_LABELS[u.accreditation_status] },
  { label: "الدرجات العلمية",   fn: (u) => degrees(u.university_programs ?? []) },
  { label: "لغة الدراسة",       fn: (u) => languages(u.university_programs ?? []) },
  { label: "نظام الدراسة",      fn: (u) => modes(u.university_programs ?? []) },
  { label: "الرسوم (أدنى)",     fn: (u) => lowestFee(u.university_programs ?? []) },
  { label: "منح دراسية",        fn: (u) => hasFreeOrScholarship(u.university_programs ?? []) },
  { label: "مواعيد التقديم",    fn: (u) => nearestDeadline(u.university_programs ?? []) },
  { label: "آخر تحديث",        fn: (u) => new Date(u.last_updated_at).toLocaleDateString("ar-SA") },
];

function CompareContent() {
  const { compareList, removeFromCompare } = useCompare();

  if (compareList.length < 2) {
    return (
      <div dir="rtl" className="flex items-center justify-center min-h-[60vh] text-center px-4">
        <div>
          <p className="text-5xl mb-4">⇔</p>
          <p className="ucp-empty-title">لا توجد جامعات للمقارنة</p>
          <p className="ucp-empty-desc">اختر جامعتين على الأقل من الدليل لتبدأ المقارنة.</p>
          <Link href="/universities"
            className="px-5 py-2 citation-btn citation-btn--primary rounded-xl text-sm font-medium transition-colors">
            → الدليل
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="ucp-root">
      {/* Header */}
      <div className="text-white px-4 py-6 ldb-hero">
        <div className="max-w-5xl mx-auto">
          <Link href="/universities" className="text-white/70 text-sm hover:text-white mb-3 block w-fit">
            → دليل الجامعات
          </Link>
          <h1 className="text-xl font-bold">⇔ مقارنة الجامعات ({compareList.length})</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-2 py-6 overflow-x-auto">
        {/* تنبيه */}
        <div className="ucp-alert">
          <AlertTriangle size={13} className="inline ml-1" />البيانات تجريبية، تحقق من الموقع الرسمي لكل جامعة قبل التقديم.
        </div>

        {/* جدول المقارنة */}
        <div className="ucp-table-wrap">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="ucp-table-header-row">
                <th className="ucp-th-label">المعيار</th>
                {compareList.map((u) => (
                  <th key={u.slug} className="px-4 py-3 text-center min-w-[180px]">
                    <div className="space-y-1">
                      <p className="ucp-uni-name">{u.name_ar}</p>
                      <div className="flex justify-center gap-1">
                        <a href={`/universities/${u.slug}`} className="ucp-detail-link">
                          التفاصيل
                        </a>
                        <span className="ucp-sep">|</span>
                        <button type="button" onClick={() => removeFromCompare(u.slug)}
                          className="ucp-danger-btn">إزالة</button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row, i) => (
                <tr key={row.label}
                  className={`ucp-table-row${i % 2 === 0 ? " ucp-table-row--even" : ""}`}>
                  <td className="ucp-td-label">{row.label}</td>
                  {compareList.map((u) => (
                    <td key={u.slug} className="ucp-td-val">
                      {row.label === "حالة الاعتماد" ? (
                        <span className="px-2 py-0.5 rounded-full text-white text-xs font-medium ucp-acc-badge"
                          style={{ "--acc-color": ACCREDITATION_COLOR[u.accreditation_status] } as React.CSSProperties}>
                          {row.fn(u)}
                        </span>
                      ) : row.fn(u)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* روابط التقديم */}
        <div className="mt-4 ucp-apply-grid" style={{ "--col-count": compareList.length } as React.CSSProperties}>
          {compareList.map((u) => (
            u.website_url ? (
              <a key={u.slug} href={u.website_url} target="_blank" rel="noopener noreferrer"
                className="text-center py-2.5 citation-btn citation-btn--primary rounded-xl text-sm font-medium transition-colors">
                <Globe size={13} className="inline ml-1" />موقع {u.name_ar.split(" ")[1] || u.name_ar} ↗
              </a>
            ) : <div key={u.slug} />
          ))}
        </div>
      </div>

      <div className="twh-share">
        <ShareButtons title="مقارنة الجامعات الإسلامية — المجلس العلمي" url="https://www.majlisilm.com/universities/compare" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["tarikh", "fiqh"]} title="اختبر معلوماتك في الفقه والتاريخ" count={4} />
      </div>
    </div>
  );
}

export default function UniversitiesComparePage() {
  useEffect(() => {
    applyPageSeo({
      path: "/universities/compare",
      title: "مقارنة الجامعات الإسلامية | المجلس العلمي",
      description: "قارن بين الجامعات الإسلامية، التخصصات والاعتمادات والبرامج الأكاديمية جنباً إلى جنب.",
      keywords: ["مقارنة جامعات", "جامعات إسلامية", "دراسة شرعية", "اعتماد أكاديمي", "مقارنة برامج"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "مقارنة الجامعات الإسلامية",
          url: "https://www.majlisilm.com/universities/compare",
          description: "مقارنة تفصيلية بين الجامعات الإسلامية في التخصصات والبرامج الأكاديمية",
          about: { "@type": "Thing", name: "الجامعات الإسلامية والدراسة الشرعية" },
        },
      ],
    });
  }, []);

  return (
    <CompareProvider>
      <CompareContent />
    </CompareProvider>
  );
}
