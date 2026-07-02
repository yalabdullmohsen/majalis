import { Link } from "wouter";
import { CompareProvider, useCompare } from "@/components/universities/CompareContext";
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
  { label: "الدولة والمدينة",   fn: (u) => `${u.country}${u.city ? ` — ${u.city}` : ""}` },
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
          <p className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">لا توجد جامعات للمقارنة</p>
          <p className="text-sm text-gray-400 mb-4">اختر جامعتين على الأقل من الدليل لتبدأ المقارنة.</p>
          <Link href="/universities"
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors">
            → الدليل
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-l from-emerald-800 to-emerald-600 text-white px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/universities" className="text-emerald-200 text-sm hover:text-white mb-3 block w-fit">
            → دليل الجامعات
          </Link>
          <h1 className="text-xl font-bold">⇔ مقارنة الجامعات ({compareList.length})</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-2 py-6 overflow-x-auto">
        {/* تنبيه */}
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800
          rounded-xl px-4 py-2 text-xs text-amber-700 dark:text-amber-300 mb-4">
          ⚠️ البيانات تجريبية — تحقق من الموقع الرسمي لكل جامعة قبل التقديم.
        </div>

        {/* جدول المقارنة */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700
          overflow-hidden shadow-sm">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400
                  w-32 sticky right-0 bg-white dark:bg-gray-800">المعيار</th>
                {compareList.map((u) => (
                  <th key={u.slug} className="px-4 py-3 text-center min-w-[180px]">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-snug">
                        {u.name_ar}
                      </p>
                      <div className="flex justify-center gap-1">
                        <a href={`/universities/${u.slug}`}
                          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                          التفاصيل
                        </a>
                        <span className="text-gray-300">|</span>
                        <button type="button" onClick={() => removeFromCompare(u.slug)}
                          className="text-xs text-red-400 hover:text-red-600">إزالة</button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row, i) => (
                <tr key={row.label}
                  className={`border-b border-gray-100 dark:border-gray-700/50 ${
                    i % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-800/50" : ""
                  }`}>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400
                    sticky right-0 bg-inherit">
                    {row.label}
                  </td>
                  {compareList.map((u) => (
                    <td key={u.slug} className="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">
                      {row.label === "حالة الاعتماد" ? (
                        <span className="px-2 py-0.5 rounded-full text-white text-xs font-medium"
                          style={{ background: ACCREDITATION_COLOR[u.accreditation_status] }}>
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
        <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${compareList.length}, minmax(0,1fr))` }}>
          {compareList.map((u) => (
            u.website_url ? (
              <a key={u.slug} href={u.website_url} target="_blank" rel="noopener noreferrer"
                className="text-center py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white
                  rounded-xl text-sm font-medium transition-colors">
                🌐 موقع {u.name_ar.split(" ")[1] || u.name_ar} ↗
              </a>
            ) : <div key={u.slug} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UniversitiesComparePage() {
  return (
    <CompareProvider>
      <CompareContent />
    </CompareProvider>
  );
}
