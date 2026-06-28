import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { PrayerSectionNav } from "@/components/prayer/PrayerSectionNav";
import { usePrayerTracker } from "@/hooks/usePrayerTracker";

export default function PrayerLogPage() {
  const { log } = usePrayerTracker();

  return (
    <div className="page-shell prayer-log-page">
      <PageHeader
        eyebrow="الصلاة"
        title="سجل الصلوات"
        subtitle="آخر 100 صلاة مسجّلة — التاريخ، المكان، والنقاط"
      />

      <PrayerSectionNav />

      <p className="prayer-tracking-links">
        <Link href="/prayer-tracking">← العودة لمتابعة الصلوات</Link>
      </p>

      {log.length === 0 ? (
        <p className="lessons-empty-state">لا توجد صلوات مسجّلة بعد. ابدأ من صفحة المواقيت.</p>
      ) : (
        <div className="prayer-log-table-wrap ui-card">
          <table className="prayer-log-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>الصلاة</th>
                <th>الحالة</th>
                <th>المكان</th>
                <th>جماعة</th>
                <th>أول وقت</th>
                <th>النقاط</th>
              </tr>
            </thead>
            <tbody>
              {log.map((entry, i) => (
                <tr key={`${entry.prayerDate}-${entry.prayerKey}-${i}`}>
                  <td>{entry.prayerDate}</td>
                  <td>{entry.prayerLabel}</td>
                  <td>{entry.status === "done" ? "تمت" : "فاتت"}</td>
                  <td>{entry.place === "mosque" ? "مسجد" : "بيت"}</td>
                  <td>{entry.congregation ? "نعم" : "—"}</td>
                  <td>{entry.isFirstTime ? "نعم" : "—"}</td>
                  <td>{entry.pointsEarned > 0 ? `+${entry.pointsEarned}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
