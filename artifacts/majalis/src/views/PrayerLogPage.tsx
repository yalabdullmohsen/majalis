import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { usePrayerTracker } from "@/hooks/usePrayerTracker";

export default function PrayerLogPage() {
  const { log } = usePrayerTracker();

  return (
    <div className="page-shell prayer-log-page">
      <PageHeader
        eyebrow="العبادة"
        title="سجل الصلوات"
        subtitle="آخر 100 صلاة مسجّلة — التاريخ، المكان، والنقاط"
      />

      <nav className="prayer-subnav" aria-label="أقسام الصلاة">
        <Link href="/prayer-times">المواقيت</Link>
        <Link href="/prayer-achievements">الإنجازات</Link>
        <Link href="/prayer-log" className="is-active">سجل الصلوات</Link>
        <Link href="/prayer-ranks">مراتب الخشوع</Link>
      </nav>

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
