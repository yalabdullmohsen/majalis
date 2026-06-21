import { useEffect, useState } from "react";
import { adminGetStats } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";

export function StatsSection() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetStats().then(s => { setStats(s); setLoading(false); });
  }, []);

  if (loading) return <Loading />;

  const cards = [
    { label: "المشايخ", value: stats.sheikhsCount, color: C.emerald, bg: C.sage },
    { label: "إجمالي الدروس", value: stats.lessonsTotal, color: C.emeraldDeep, bg: "#E8F5E9" },
    { label: "الدروس المعتمدة", value: stats.lessonsApproved, color: C.emerald, bg: C.sage },
    { label: "الدروس المعلّقة", value: stats.lessonsPending, color: C.brass, bg: "#FEF3C7" },
    { label: "مواد المكتبة", value: stats.libraryCount, color: C.emeraldDeep, bg: C.parchmentDeep },
    { label: "مقالات الإعجاز", value: stats.miraclesCount, color: C.emeraldDeep, bg: C.parchmentDeep },
    { label: "الأسئلة والأجوبة", value: stats.qaTotal, color: C.emeraldDeep, bg: C.parchmentDeep },
    { label: "إجمالي الفوائد", value: stats.fawaidTotal, color: C.emeraldDeep, bg: C.parchmentDeep },
    { label: "فوائد بانتظار الموافقة", value: stats.pendingFawaidCount, color: stats.pendingFawaidCount > 0 ? "#dc2626" : C.inkSoft, bg: stats.pendingFawaidCount > 0 ? "#FEE2E2" : C.parchmentDeep },
  ];

  const contentTypes = [
    { label: "الدروس", value: stats.lessonsTotal, section: "الدروس" },
    { label: "مواد المكتبة", value: stats.libraryCount, section: "المكتبة" },
    { label: "مقالات الإعجاز العلمي", value: stats.miraclesCount, section: "الإعجاز العلمي" },
    { label: "المشايخ", value: stats.sheikhsCount, section: "المشايخ" },
    { label: "الأسئلة والأجوبة", value: stats.qaTotal, section: "الأسئلة والأجوبة" },
    { label: "الفوائد", value: stats.fawaidTotal, section: "الفوائد" },
  ];
  const empty = contentTypes.filter(t => !t.value);
  const ready = empty.length === 0;

  return (
    <div>
      <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep, marginBottom: "1.5rem", fontFamily: "Amiri, serif" }}>
        نظرة عامة على المحتوى
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: c.bg, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1.25rem", textAlign: "center" }}>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: c.color, margin: 0, lineHeight: 1.2 }}>{c.value}</p>
            <p style={{ fontSize: "0.8125rem", color: C.inkSoft, margin: "0.375rem 0 0" }}>{c.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: ready ? "#E8F5E9" : "#FEF3C7", border: `1px solid ${ready ? C.emerald : C.brass}`, borderRadius: "0.5rem", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 700, color: ready ? C.emeraldDeep : "#92400E", fontFamily: "Amiri, serif" }}>
          {ready ? "جاهزية الإطلاق ✓" : "جاهزية الإطلاق — أقسام بحاجة إلى محتوى"}
        </h3>
        {ready ? (
          <p style={{ margin: 0, color: C.emeraldDeep, fontSize: "0.875rem", lineHeight: "1.8" }}>
            جميع أنواع المحتوى الستة تحتوي على بيانات. المنصة جاهزة للإطلاق من حيث المحتوى.
          </p>
        ) : (
          <>
            <p style={{ margin: "0 0 0.625rem", color: "#92400E", fontSize: "0.875rem", lineHeight: "1.8" }}>
              الأقسام التالية فارغة ويُنصح بتعبئتها قبل الإطلاق (يمكنك إضافة المحتوى يدويًا أو عبر الاستيراد الجماعي من كل قسم):
            </p>
            <ul style={{ margin: 0, paddingInlineStart: "1.25rem", color: "#92400E", fontSize: "0.875rem", lineHeight: "1.9" }}>
              {empty.map(t => (
                <li key={t.label}><strong>{t.label}</strong> — انتقل إلى قسم «{t.section}» لإضافة المحتوى.</li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1.25rem" }}>
        <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem", lineHeight: "1.8" }}>
          استخدم القائمة الجانبية للتنقل بين أقسام الإدارة. كل قسم يدعم الإضافة الفردية والاستيراد الجماعي عبر لصق بيانات JSON. يمكنك إضافة المشايخ والدروس والمكتبة والإعجاز العلمي والأسئلة والأجوبة والفوائد، وإدارة المحتوى المقدّم من المستخدمين.
        </p>
      </div>
    </div>
  );
}
