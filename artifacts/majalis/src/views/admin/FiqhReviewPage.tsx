import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AdminShell, useAdminShell } from "@/views/admin/AdminShell";
import { Loading } from "@/components/ui-common";
import { FiqhAdminSubnav } from "@/components/fiqh-council/FiqhAdminSubnav";
import { FiqhCompletionBarFromItem } from "@/components/fiqh-council/FiqhCompletionBar";
import {
  adminApproveFiqhCouncilItem,
  adminArchiveFiqhCouncilItem,
  adminGetAllFiqhCouncilItems,
  adminGetFiqhDuplicates,
  adminPublishFiqhCouncilItem,
  adminRejectFiqhCouncilItem,
  adminReturnFiqhItemForEdit,
} from "@/lib/fiqh-council-supabase";
import {
  classifyReviewQueues,
  verifyFiqhItem,
  type FiqhReviewQueueKind,
} from "@/lib/fiqh-verification-service";
import {
  FIQH_ITEM_STATUS_LABELS,
  FIQH_ITEM_TYPE_LABELS,
  fiqhItemHref,
  type FiqhCouncilItem,
} from "@/lib/fiqh-council-types";

const QUEUE_LABELS: Record<FiqhReviewQueueKind, string> = {
  needs_review: "بانتظار المراجعة",
  missing_source: "ناقصة المصدر",
  missing_category: "ناقصة التصنيف",
  potential_duplicate: "تكرار محتمل",
  broken_link: "رابط معطل",
  needs_summary: "تحتاج ملخصًا",
  needs_session: "تحتاج ربط جلسة",
};

function ReviewContent() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState<FiqhCouncilItem[]>([]);
  const [duplicateSlugs, setDuplicateSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<FiqhReviewQueueKind | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, dupRes] = await Promise.all([
        adminGetAllFiqhCouncilItems(),
        adminGetFiqhDuplicates(100),
      ]);
      setItems(itemsRes.data || []);
      const slugs = new Set<string>();
      for (const d of dupRes.data || []) {
        const item = (itemsRes.data || []).find((i) => i.id === d.item_id);
        const cand = (itemsRes.data || []).find((i) => i.id === d.candidate_id);
        if (item) slugs.add(item.slug);
        if (cand) slugs.add(cand.slug);
      }
      setDuplicateSlugs(slugs);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (["archived", "rejected"].includes(item.status || "")) return false;
      const queues = classifyReviewQueues(item, duplicateSlugs);
      if (queue === "all") return queues.length > 0 || ["imported", "needs_review", "review", "approved"].includes(item.status || "");
      return queues.includes(queue);
    });
  }, [items, duplicateSlugs, queue]);

  const runAction = async (action: string, item: FiqhCouncilItem) => {
    if (String(item.id).startsWith("seed-")) {
      showError("لا يمكن تنفيذ الإجراء على بيانات البذور المحلية.");
      return;
    }
    try {
      if (action === "approve") {
        const { error } = await adminApproveFiqhCouncilItem(item.id);
        if (error) throw error;
        showSuccess("تم اعتماد المادة.");
      } else if (action === "publish") {
        const verification = verifyFiqhItem(item, { existingItems: items.filter((i) => i.id !== item.id) });
        if (!verification.canPublish) {
          showError(verification.issues.map((i) => i.message).join(" · "));
          return;
        }
        const { error } = await adminPublishFiqhCouncilItem(item.id);
        if (error) throw error;
        showSuccess("تم نشر المادة للعامة.");
      } else if (action === "reject") {
        const reason = window.prompt("سبب الرفض:");
        if (!reason?.trim()) return;
        const { error } = await adminRejectFiqhCouncilItem(item.id, reason.trim());
        if (error) throw error;
        showSuccess("تم رفض المادة.");
      } else if (action === "return") {
        const notes = window.prompt("ملاحظات الإرجاع للتعديل:") || "يحتاج تعديل";
        const { error } = await adminReturnFiqhItemForEdit(item.id, notes);
        if (error) throw error;
        showSuccess("أُعيدت المادة للتعديل.");
      } else if (action === "archive") {
        const { error } = await adminArchiveFiqhCouncilItem(item.id);
        if (error) throw error;
        showSuccess("تمت الأرشفة.");
      }
      await load();
    } catch (e) {
      showError(String((e as { message?: string })?.message || "فشل الإجراء"));
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="fiqh-admin-page">
      <FiqhAdminSubnav active="/admin/fiqh-review" />
      <header className="fiqh-admin-page-header">
        <h1>المراجعة العلمية</h1>
        <p>مراجعة المواد قبل النشر — لا تُعرض للعامة إلا بعد التحقق والاعتماد.</p>
      </header>

      <div className="fiqh-review-filters">
        <button type="button" className={queue === "all" ? "fiqh-review-filter--active" : ""} onClick={() => setQueue("all")}>الكل ({filtered.length})</button>
        {(Object.keys(QUEUE_LABELS) as FiqhReviewQueueKind[]).map((key) => (
          <button
            key={key}
            type="button"
            className={queue === key ? "fiqh-review-filter--active" : ""}
            onClick={() => setQueue(key)}
          >
            {QUEUE_LABELS[key]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="adm-empty-msg">لا توجد مواد في هذه القائمة.</p>
      ) : (
        <div className="fiqh-review-list">
          {filtered.map((item) => {
            const verification = verifyFiqhItem(item, { existingItems: items.filter((i) => i.id !== item.id) });
            const queues = classifyReviewQueues(item, duplicateSlugs);
            return (
              <article key={item.id} className="fiqh-review-card ui-card">
                <div className="fiqh-review-card-head">
                  <div>
                    <h2>{item.title}</h2>
                    <p className="fiqh-review-meta">
                      {FIQH_ITEM_TYPE_LABELS[item.type]} · {item.category || "—"} · {FIQH_ITEM_STATUS_LABELS[item.status || "draft"]}
                    </p>
                  </div>
                  <FiqhCompletionBarFromItem item={item} />
                </div>

                {queues.length > 0 && (
                  <div className="fiqh-review-tags">
                    {queues.map((q) => (
                      <span key={q} className="fiqh-review-tag">{QUEUE_LABELS[q]}</span>
                    ))}
                  </div>
                )}

                {verification.issues.length > 0 && (
                  <ul className="fiqh-review-issues">
                    {verification.issues.map((issue) => (
                      <li key={issue.code} className={issue.severity === "error" ? "fiqh-review-issue--error" : ""}>
                        {issue.message}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="fiqh-review-actions">
                  <button type="button" onClick={() => runAction("approve", item)}>اعتماد</button>
                  <button type="button" onClick={() => runAction("publish", item)}>نشر</button>
                  <button type="button" onClick={() => runAction("return", item)}>إرجاع للتعديل</button>
                  <button type="button" onClick={() => runAction("reject", item)}>رفض</button>
                  <button type="button" onClick={() => runAction("archive", item)}>أرشفة</button>
                  {item.source_url && (
                    <a href={item.source_url} target="_blank" rel="noopener noreferrer">فتح المصدر</a>
                  )}
                  {item.status === "published" && verification.canPublish && (
                    <Link href={fiqhItemHref(item.slug)} target="_blank">معاينة عامة</Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FiqhReviewPage() {
  return (
    <AdminShell section="fiqh-council" onSectionChange={() => {}}>
      <ReviewContent />
    </AdminShell>
  );
}
