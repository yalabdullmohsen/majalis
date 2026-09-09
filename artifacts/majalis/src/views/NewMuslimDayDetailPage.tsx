import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { PageHeader, Empty } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import { useAuth } from "@/components/AuthProvider";
import { getNewMuslimPath, getNewMuslimProgress, markNewMuslimDayComplete, type NewMuslimDay } from "@/lib/dawah-service";
import { DiscoverIslamShell } from "@/components/discover-islam/DiscoverIslamShell";

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

  if (days === null) {
    return (
      <DiscoverIslamShell detail>
        <PageHeader eyebrow="التعريف بالإسلام" title="اليوم" />
      </DiscoverIslamShell>
    );
  }
  if (!item) {
    return (
      <DiscoverIslamShell detail>
        <Empty text="لم يُعثر على هذا اليوم." />
      </DiscoverIslamShell>
    );
  }

  const isDone = completed.includes(dayNum);
  const next = days.find((d) => d.day_number === dayNum + 1);
  const prev = days.find((d) => d.day_number === dayNum - 1);

  return (
    <DiscoverIslamShell detail>
      <PageHeader eyebrow={`التعريف بالإسلام · اليوم ${dayNum} من ${days.length}`} title={item.title} />
      <div className="dii-block dii-block--muted">
        <p className="page-desc dii-detailed-answer">{item.content_ar}</p>
      </div>

      {user ? (
        <button type="button" disabled={busy || isDone} onClick={onComplete} className="asp-run-btn" style={{ marginTop: "1rem" }}>
          {isDone ? "✓ تم إنجاز هذا اليوم" : "وضع علامة إنجاز"}
        </button>
      ) : (
        <p className="dii-path-day-title" style={{ marginTop: "1rem" }}>سجّل الدخول لحفظ تقدّمك عبر الأيام.</p>
      )}

      <div className="dii-cta-row dii-section">
        {prev && <Link href={`/discover-islam/new-muslim/${prev.day_number}`} className="asp-add-btn">اليوم السابق</Link>}
        <Link href="/discover-islam/new-muslim" className="page-link-inline">كل الأيام</Link>
        {next && <Link href={`/discover-islam/new-muslim/${next.day_number}`} className="asp-run-btn">اليوم التالي</Link>}
      </div>
    </DiscoverIslamShell>
  );
}
