import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { PageHeader, Empty } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import { useAuth } from "@/components/AuthProvider";
import { getNewMuslimPath, getNewMuslimProgress, markNewMuslimDayComplete, type NewMuslimDay } from "@/lib/dawah-service";
import "@/styles/discover-islam.css";

export default function NewMuslimDayDetailPage() {
  const { day } = useParams<{ day: string }>();
  const dayNum = Number(day);
  const { user } = useAuth();
  const [days, setDays] = useState<NewMuslimDay[] | null>(null);
  const [completed, setCompleted] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getNewMuslimPath("all").then(setDays);
  }, []);

  useEffect(() => {
    if (user?.id) getNewMuslimProgress(user.id).then(setCompleted);
  }, [user?.id]);

  const item = days?.find((d) => d.day_number === dayNum) ?? null;

  useEffect(() => {
    if (item) {
      applyPageSeo({ path: `/discover-islam/new-muslim/${dayNum}`, title: `اليوم ${dayNum}: ${item.title} | مسار المسلم الجديد`, description: item.title });
    }
  }, [item, dayNum]);

  const onComplete = async () => {
    if (!user?.id) return;
    setBusy(true);
    try {
      const r = await markNewMuslimDayComplete(user.id, dayNum);
      if (r.ok) setCompleted((prev) => [...new Set([...prev, dayNum])]);
    } finally {
      setBusy(false);
    }
  };

  if (days === null) return <div className="page-shell narrow"><PageHeader eyebrow="المسلم الجديد" title="جارٍ التحميل..." /></div>;
  if (!item) return <div className="page-shell narrow"><Empty text="لم يُعثر على هذا اليوم." /></div>;

  const isDone = completed.includes(dayNum);
  const next = days.find((d) => d.day_number === dayNum + 1);
  const prev = days.find((d) => d.day_number === dayNum - 1);

  return (
    <div className="page-shell narrow dii-question-page">
      <PageHeader eyebrow={`اليوم ${dayNum} من ${days.length}`} title={item.title} showBack />
      <div className="ui-card">
        <p className="page-desc dii-detailed-answer">{item.content_ar}</p>
      </div>

      {user ? (
        <button type="button" disabled={busy || isDone} onClick={onComplete} className="asp-run-btn" style={{ marginTop: "1rem" }}>
          {isDone ? "✓ تم إنجاز هذا اليوم" : "وضع علامة إنجاز"}
        </button>
      ) : (
        <p className="dii-path-day-title" style={{ marginTop: "1rem" }}>سجّل الدخول لحفظ تقدّمك عبر الأيام.</p>
      )}

      <div className="dii-cta-row" style={{ marginTop: "1.5rem" }}>
        {prev && <Link href={`/discover-islam/new-muslim/${prev.day_number}`} className="asp-add-btn">اليوم السابق</Link>}
        <Link href="/discover-islam/new-muslim" className="page-link-inline">كل الأيام</Link>
        {next && <Link href={`/discover-islam/new-muslim/${next.day_number}`} className="asp-run-btn">اليوم التالي</Link>}
      </div>
    </div>
  );
}
