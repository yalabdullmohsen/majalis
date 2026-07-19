import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader, Empty } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import { useAuth } from "@/components/AuthProvider";
import { getNewMuslimPath, getNewMuslimProgress, type NewMuslimDay } from "@/lib/dawah-service";
import "@/styles/discover-islam.css";

export default function NewMuslimPathPage() {
  const { user } = useAuth();
  const [days, setDays] = useState<NewMuslimDay[] | null>(null);
  const [completed, setCompleted] = useState<number[]>([]);

  useEffect(() => {
    applyPageSeo({
      path: "/discover-islam/new-muslim",
      title: "مسار المسلم الجديد — 30 يومًا | التعريف بالإسلام",
      description: "برنامج تدريجي مدته 30 يومًا يرافقك خطوة بخطوة في أول أيامك مسلمًا.",
    });
    getNewMuslimPath("all").then(setDays);
  }, []);

  useEffect(() => {
    if (user?.id) getNewMuslimProgress(user.id).then(setCompleted);
  }, [user?.id]);

  return (
    <div className="page-shell narrow content-hub-page">
      <PageHeader eyebrow="المسلم الجديد" title="مسار الثلاثين يومًا" subtitle="لا سباق ولا حساب للتأخر — أكمل بالسرعة التي تناسبك، وارجع إلى أي يوم متى شئت." />

      {days === null ? null : days.length === 0 ? (
        <Empty text="محتوى المسار لا يزال قيد الإعداد." />
      ) : (
        <ol className="dii-path-list">
          {days.map((d) => {
            const done = completed.includes(d.day_number);
            return (
              <li key={d.id}>
                <Link href={`/discover-islam/new-muslim/${d.day_number}`} className={`dii-path-day ui-card${done ? " dii-path-day--done" : ""}`}>
                  <span className="dii-path-day-num">{d.day_number}</span>
                  <span className="dii-path-day-title">{d.title}</span>
                  {done && <span className="page-tag">تم</span>}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
