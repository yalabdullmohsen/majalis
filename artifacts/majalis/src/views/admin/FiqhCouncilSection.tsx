import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  adminGetAllFiqhCouncilItems,
  adminUpsertFiqhCouncilItem,
  adminDeleteFiqhCouncilItem,
  adminSetFiqhCouncilItemStatus,
  adminGetFiqhCouncilSources,
  adminGetFiqhSyncJobs,
  adminGetFiqhSyncLogs,
  adminTriggerFiqhSync,
  adminArchiveFiqhCouncilItem,
  adminApproveFiqhCouncilItem,
  adminRejectFiqhCouncilItem,
  adminPublishFiqhCouncilItem,
  adminGetFiqhDuplicates,
  adminResolveDuplicate,
  adminGetFiqhStats,
  adminGetFiqhAuditLog,
  adminGetFiqhResearchLogs,
  adminGetFiqhResearchAnalytics,
  adminGetFiqhUnanswered,
  adminSetFiqhResearchEnabled,
  adminLinkUnansweredQuestion,
  adminDismissUnansweredQuestion,
  adminGetSuggestedRelations,
  adminApproveSuggestedRelation,
  adminRejectSuggestedRelation,
  adminMergeSuggestedRelation,
  adminUpsertSuggestedRelation,
  adminGetFiqhSessions,
  adminUpsertFiqhSession,
  adminArchiveFiqhSession,
  adminGetFiqhAlerts,
  adminMarkFiqhAlertRead,
} from "@/lib/fiqh-council-supabase";
import { scanAllPotentialRelations } from "@/lib/fiqh-relation-engine";
import { getFiqhCouncilReviewItems } from "@/lib/fiqh-council-service";
import { FIQH_SESSIONS_PUBLISHED_SEED } from "@/lib/fiqh-sessions-seed";
import {
  FIQH_COUNCIL_CATEGORIES,
  FIQH_ITEM_TYPES,
  FIQH_ITEM_TYPE_LABELS,
  FIQH_ITEM_STATUS_LABELS,
  FIQH_SESSION_STATUS_LABELS,
  FIQH_VERIFICATION_STATUS_LABELS,
  fiqhItemHref,
  fiqhSessionHref,
  type FiqhItemStatus,
  type FiqhItemType,
  type FiqhCouncilSource,
  type FiqhSyncJob,
} from "@/lib/fiqh-council-types";
import { SkeletonCardGrid } from "@/components/ui-common";
import { AdminModal, Field } from "./AdminModal";
import { useAdminShell } from "./AdminShell";
import { FiqhCompletionBarFromItem } from "@/components/fiqh-council/FiqhCompletionBar";

type AdminTab = "stats" | "items" | "review" | "duplicates" | "relations" | "research" | "sessions" | "sync";

const EMPTY = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  ruling_text: "",
  type: "resolution" as FiqhItemType,
  category: "القضايا المعاصرة",
  source_name: "",
  source_url: "",
  council_name: "المجمع الفقهي الإسلامي",
  session_number: "",
  session_date: "",
  tags: "",
  evidence: "",
  status: "draft" as FiqhItemStatus,
};

function slugify(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^؀-ۿa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80) || `fiqh-${Date.now()}`;
}

function parseEvidence(raw: string) {
  if (!raw.trim()) return [];
  return raw.split("\n").map((line) => {
    const [type, ...rest] = line.split("|");
    const text = rest.join("|").trim();
    return { type: type.trim(), text };
  }).filter((e) => e.text);
}

function formatEvidence(items?: { type?: string; text?: string; source?: string }[]) {
  if (!items?.length) return "";
  return items.map((e) => [e.type, e.text, e.source].filter(Boolean).join(" | ")).join("\n");
}

export function FiqhCouncilSection() {
  const { showSuccess, showError } = useAdminShell();
  const [tab, setTab] = useState<AdminTab>("items");
  const [items, setItems] = useState<any[]>([]);
  const [reviewItems, setReviewItems] = useState<any[]>([]);
  const [sources, setSources] = useState<FiqhCouncilSource[]>([]);
  const [syncJobs, setSyncJobs] = useState<FiqhSyncJob[]>([]);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [researchLogs, setResearchLogs] = useState<any[]>([]);
  const [researchAnalytics, setResearchAnalytics] = useState<any>(null);
  const [unanswered, setUnanswered] = useState<any[]>([]);
  const [suggestedRelations, setSuggestedRelations] = useState<any[]>([]);
  const [localRelationScan, setLocalRelationScan] = useState<any[]>([]);
  const [scanningRelations, setScanningRelations] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [assistantEnabled, setAssistantEnabled] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [open, setOpen] = useState(false);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("الكل");
  const [filterType, setFilterType] = useState("الكل");
  const [adminSearch, setAdminSearch] = useState("");

  const loadItems = () => {
    setLoading(true);
    Promise.all([
      adminGetAllFiqhCouncilItems(),
      getFiqhCouncilReviewItems(),
      adminGetFiqhCouncilSources(),
      adminGetFiqhSyncJobs(15),
      adminGetFiqhDuplicates(),
      adminGetFiqhStats(),
      adminGetFiqhAuditLog(undefined, 20),
      adminGetFiqhResearchLogs(25),
      adminGetFiqhResearchAnalytics(30),
      adminGetFiqhUnanswered(20),
      adminGetSuggestedRelations("pending"),
      adminGetFiqhSessions(30),
      adminGetFiqhAlerts(25),
    ]).then(([allRes, reviewRes, sourcesRes, jobsRes, dupRes, statsRes, auditRes, logsRes, analyticsRes, unansweredRes, relRes, sessionsRes, alertsRes]) => {
      const reviewData = reviewRes.data ?? [];
      const dupData = dupRes.data ?? [];
      const jobsData = jobsRes.data ?? [];
      const unansweredData = unansweredRes.data ?? [];
      setItems(allRes.data ?? []);
      setReviewItems(reviewData);
      setSources(sourcesRes.data ?? []);
      setSyncJobs(jobsData);
      setDuplicates(dupData);
      setStats(statsRes);
      setAuditLog(auditRes.data ?? []);
      setResearchLogs(logsRes.data ?? []);
      setResearchAnalytics(analyticsRes.data ?? []);
      setUnanswered(unansweredData);
      setSuggestedRelations(relRes.data ?? []);
      setSessions(sessionsRes.data?.length ? sessionsRes.data : FIQH_SESSIONS_PUBLISHED_SEED);
      const computedAlerts = [
        ...(reviewData.length ? [{ id: "local-review", title: `${reviewData.length} عناصر بانتظار المراجعة`, alert_type: "needs_review", severity: "warning", is_read: false }] : []),
        ...(dupData.length ? [{ id: "local-dup", title: `${dupData.length} احتمالات تكرار`, alert_type: "duplicate_found", severity: "info", is_read: false }] : []),
        ...(unansweredData.length ? [{ id: "local-unanswered", title: `${unansweredData.length} أسئلة بلا نتائج`, alert_type: "needs_review", severity: "info", is_read: false }] : []),
        ...(jobsData.some((j: FiqhSyncJob) => j.status === "failed") ? [{ id: "local-sync-fail", title: "فشل في آخر مزامنة", alert_type: "sync_failed", severity: "error", is_read: false }] : []),
      ];
      setAlerts([...computedAlerts, ...(alertsRes.data || [])]);
      if (allRes.error && allRes.usingSeed) showError("تعذّر تحميل البيانات، عرض البذور المحلية.");
    }).catch(() => showError("تعذّر تحميل بيانات المجمع الفقهي.")).finally(() => setLoading(false));
  };

  useEffect(() => { loadItems(); }, []);

  useEffect(() => {
    if (!selectedJobId) {
      setSyncLogs([]);
      return;
    }
    adminGetFiqhSyncLogs(selectedJobId).then(({ data }) => setSyncLogs(data));
  }, [selectedJobId]);

  const filtered = useMemo(() => {
    const pool = tab === "review" ? reviewItems : items;
    return pool.filter((item) => {
      if (filterStatus !== "الكل" && item.status !== filterStatus) return false;
      if (filterType !== "الكل" && item.type !== filterType) return false;
      if (adminSearch.trim()) {
        const q = adminSearch.trim();
        const hay = [item.title, item.summary, item.slug, item.category, ...(item.tags || [])].join(" ");
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, reviewItems, tab, filterStatus, filterType, adminSearch]);

  const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title?.trim()) return showError("العنوان مطلوب");
    const slug = form.slug?.trim() || slugify(form.title);
    setSaving(true);
    const payload = {
      ...form,
      slug,
      evidence: typeof form.evidence === "string" ? parseEvidence(form.evidence) : form.evidence,
      tags: String(form.tags || "")
        .split(/[,،]/)
        .map((t: string) => t.trim())
        .filter(Boolean),
    };
    const { error } = await adminUpsertFiqhCouncilItem(payload);
    setSaving(false);
    if (error) return showError(`تعذّر الحفظ: ${error.message}`);
    showSuccess("تم حفظ العنصر");
    setOpen(false);
    loadItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذا العنصر؟")) return;
    const { error } = await adminDeleteFiqhCouncilItem(id);
    if (error) showError(error.message);
    else showSuccess("تم الحذف");
    loadItems();
  };

  const handleStatus = async (id: string, status: FiqhItemStatus) => {
    const { error } = await adminSetFiqhCouncilItemStatus(id, status);
    if (error) showError(error.message);
    else showSuccess(status === "published" ? "تم النشر" : status === "archived" ? "تمت الأرشفة" : "تم تحديث الحالة");
    loadItems();
  };

  const handleApprove = async (id: string) => {
    const { error } = await adminApproveFiqhCouncilItem(id);
    if (error) showError(error.message);
    else showSuccess("تم الاعتماد");
    loadItems();
  };

  const handleReject = async (id: string) => {
    const reason = prompt("سبب الرفض:");
    if (!reason?.trim()) return;
    const { error } = await adminRejectFiqhCouncilItem(id, reason.trim());
    if (error) showError(error.message);
    else showSuccess("تم الرفض");
    loadItems();
  };

  const handlePublish = async (id: string) => {
    const { error } = await adminPublishFiqhCouncilItem(id);
    if (error) showError(error.message);
    else showSuccess("تم النشر");
    loadItems();
  };

  const handleResolveDup = async (id: string, action: "merged" | "ignored") => {
    const { error } = await adminResolveDuplicate(id, action);
    if (error) showError(error.message);
    else showSuccess(action === "merged" ? "تم الدمج" : "تم التجاهل");
    loadItems();
  };

  const handleArchive = async (id: string) => {
    const { error } = await adminArchiveFiqhCouncilItem(id);
    if (error) showError(error.message);
    else showSuccess("تمت الأرشفة");
    loadItems();
  };

  const handleManualSync = async () => {
    setSyncing(true);
    const { ok, error, result } = await adminTriggerFiqhSync();
    setSyncing(false);
    if (!ok) return showError(error || "فشلت المزامنة");
    showSuccess(`تمت المزامنة: ${JSON.stringify(result?.summary || result || "نجح")}`);
    loadItems();
  };

  const handleScanRelations = async () => {
    setScanningRelations(true);
    try {
      const scan = scanAllPotentialRelations(items, 0.55);
      setLocalRelationScan(scan.slice(0, 30));
      for (const row of scan.slice(0, 20)) {
        await adminUpsertSuggestedRelation({
          item_id: row.itemId,
          related_item_id: row.match.relatedItemId,
          similarity_score: row.match.score,
          match_reasons: row.match.reasons,
        });
      }
      const { data } = await adminGetSuggestedRelations("pending");
      setSuggestedRelations(data ?? []);
      showSuccess(`تم فحص ${scan.length} علاقة محتملة`);
    } catch {
      showError("تعذّر فحص العلاقات المقترحة.");
    } finally {
      setScanningRelations(false);
    }
  };

  const handleApproveRelation = async (id: string) => {
    const { error } = await adminApproveSuggestedRelation(id);
    if (error) showError(error.message);
    else showSuccess("تم اعتماد العلاقة");
    loadItems();
  };

  const handleRejectRelation = async (id: string) => {
    const { error } = await adminRejectSuggestedRelation(id);
    if (error) showError(error.message);
    else showSuccess("تم رفض العلاقة");
    loadItems();
  };

  const handleMergeRelation = async (id: string) => {
    const { error } = await adminMergeSuggestedRelation(id);
    if (error) showError(error.message);
    else showSuccess("تم وسم العلاقة كمكررة");
    loadItems();
  };

  const renderItemCard = (item: any) => (
    <div key={item.id} className="fcs-item-card">
      <strong>{item.title}</strong>
      <p className="fcs-item-meta">
        {FIQH_ITEM_TYPE_LABELS[item.type as FiqhItemType]} · {item.category} · {FIQH_ITEM_STATUS_LABELS[item.status as FiqhItemStatus] || item.status}
        {item.validation_status && <> · تحقق: {item.validation_status}</>}
        {item.external_id && <> · {item.external_id}</>}
      </p>
      <FiqhCompletionBarFromItem item={item} className="fiqh-admin-item-completion" />
      <div className="fcs-item-actions">
        <button type="button" onClick={() => { setForm({ ...item, tags: (item.tags || []).join("، "), evidence: formatEvidence(item.evidence) }); setOpen(true); }} className="fcs-btn">تعديل</button>
        {item.status !== "published" && (
          <>
            <button type="button" onClick={() => handleApprove(item.id)} className="fcs-btn">اعتماد</button>
            <button type="button" onClick={() => handlePublish(item.id)} className="fcs-btn">نشر</button>
            <button type="button" onClick={() => handleReject(item.id)} className="fcs-btn--danger">رفض</button>
          </>
        )}
        {item.status === "published" && (
          <button type="button" onClick={() => handleStatus(item.id, "draft")} className="fcs-btn">إلغاء النشر</button>
        )}
        {item.status !== "archived" && (
          <button type="button" onClick={() => handleArchive(item.id)} className="fcs-btn">أرشفة</button>
        )}
        <button type="button" onClick={() => setPreviewSlug(item.slug)} className="fcs-btn">معاينة</button>
        <a href={fiqhItemHref(item.slug)} target="_blank" rel="noopener noreferrer" className="fcs-a">فتح</a>
        <button type="button" onClick={() => handleDelete(item.id)} className="fcs-btn--danger">حذف</button>
      </div>
    </div>
  );

  return (
    <div className="fiqh-council-admin">
      <div className="fcs-header">
        <h2 className="fcs-title">المجمع الفقهي الإسلامي ({filtered.length})</h2>
        <div className="fcs-header-actions">
          <Link href="/admin/fiqh-review" className="fcs-link">المراجعة العلمية</Link>
          <Link href="/admin/fiqh-quality" className="fcs-link">جودة البيانات</Link>
          <button
            onClick={() => { setForm({ ...EMPTY }); setOpen(true); }}
            className="fcs-add-btn"
          >
            + إضافة
          </button>
        </div>
      </div>

      <div className="fiqh-council-admin-tabs">
        {([
          ["stats", "الإحصائيات"],
          ["items", `جميع العناصر (${items.length})`],
          ["review", `قيد المراجعة (${reviewItems.length})`],
          ["duplicates", `احتمالات التكرار (${duplicates.length})`],
          ["relations", `مراجعة العلاقات (${suggestedRelations.length})`],
          ["research", "مساعد الباحث"],
          ["sessions", `الجلسات (${sessions.length})`],
          ["sync", "المزامنة"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={tab === key ? "fiqh-council-admin-tab fiqh-council-admin-tab--active" : "fiqh-council-admin-tab"}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {alerts.filter((a) => !a.is_read).length > 0 && (
        <section className="fiqh-admin-alerts ui-card fcs-alerts-sec">
          <h3 className="fcs-h3">إشعارات الإدارة</h3>
          <div className="fcs-grid-gap">
            {alerts.filter((a) => !a.is_read).slice(0, 8).map((alert) => (
              <div key={alert.id} className="fiqh-sync-job fcs-text-sm">
                <strong>{alert.title}</strong>
                {alert.message && <span className="fcs-muted">، {alert.message}</span>}
                {!String(alert.id).startsWith("local-") && (
                  <button type="button" className="fcs-btn--ms" onClick={() => adminMarkFiqhAlertRead(alert.id).then(loadItems)}>تم</button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "stats" ? (
        <div>
          <div className="fiqh-admin-stats">
            {[
              ["total", "الإجمالي"],
              ["published", "منشور"],
              ["needsReview", "مراجعة"],
              ["draft", "مسودة"],
              ["archived", "مؤرشف"],
              ["rejected", "مرفوض"],
            ].map(([key, label]) => (
              <div key={key} className="fiqh-admin-stat">
                <strong>{stats[key] ?? 0}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <section className="fcs-stats-sec">
            <h3 className="fcs-h3">سجل الاعتماد</h3>
            {auditLog.length === 0 ? (
              <p className="fcs-text-sm">لا توجد عمليات بعد.</p>
            ) : (
              <div className="fcs-grid-gap">
                {auditLog.map((entry: any) => (
                  <div key={entry.id} className="fiqh-sync-job fcs-text-xs">
                    {entry.action} · {entry.from_status} → {entry.to_status}
                    {entry.actor_email && <> · {entry.actor_email}</>}
                    {entry.created_at && <> · {new Date(entry.created_at).toLocaleString("ar")}</>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : tab === "duplicates" ? (
        <div className="fcs-grid-gap-md">
          {duplicates.length === 0 ? (
            <p className="fcs-empty">لا توجد احتمالات تكرار.</p>
          ) : duplicates.map((dup: any) => (
            <div key={dup.id} className="fiqh-sync-job">
              <strong>تشابه {(dup.similarity_score * 100).toFixed(0)}%</strong>
              <p className="fcs-dup-reasons">
                {(dup.match_reasons || []).join(" · ")}
              </p>
              <div className="fcs-dup-actions">
                <button type="button" onClick={() => handleResolveDup(dup.id, "merged")} className="fcs-btn">دمج</button>
                <button type="button" onClick={() => handleResolveDup(dup.id, "ignored")} className="fcs-btn">تجاهل</button>
              </div>
            </div>
          ))}
        </div>
      ) : tab === "relations" ? (
        <div className="fcs-grid-gap-lg">
          <div className="fcs-flex-header">
            <button
              type="button"
              onClick={handleScanRelations}
              disabled={scanningRelations}
              className="fcs-scan-btn"
            >
              {scanningRelations ? "جارٍ الفحص..." : "فحص علاقات مقترحة"}
            </button>
            <span className="fcs-text-sm">
              معلّقة: {suggestedRelations.length} · محلية: {localRelationScan.length}
            </span>
          </div>

          {suggestedRelations.length === 0 && localRelationScan.length === 0 ? (
            <p className="fcs-empty">لا توجد علاقات مقترحة، شغّل الفحص.</p>
          ) : (
            <div className="fcs-grid-gap-md">
              {(suggestedRelations.length ? suggestedRelations : localRelationScan.map((row, i) => ({
                id: `local-${i}`,
                item_id: row.itemId,
                related_item_id: row.match.relatedItemId,
                similarity_score: row.match.score,
                match_reasons: row.match.reasons,
                item: items.find((x) => x.id === row.itemId),
                related_item: items.find((x) => x.id === row.match.relatedItemId),
              }))).map((rel: any) => (
                <div key={rel.id} className="fiqh-sync-job">
                  <strong>تشابه {((rel.similarity_score || 0) * 100).toFixed(0)}%</strong>
                  <p className="fcs-relation-title">
                    {rel.item?.title || rel.item_id} ↔ {rel.related_item?.title || rel.related_item_id}
                  </p>
                  <p className="fcs-relation-reasons">
                    {(rel.match_reasons || []).join(" · ")}
                  </p>
                  <div className="fcs-relation-actions">
                    {!String(rel.id).startsWith("local-") && (
                      <>
                        <button type="button" className="fcs-btn" onClick={() => handleApproveRelation(rel.id)}>اعتماد</button>
                        <button type="button" className="fcs-btn" onClick={() => handleRejectRelation(rel.id)}>رفض</button>
                        <button type="button" className="fcs-btn" onClick={() => handleMergeRelation(rel.id)}>دمج</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : tab === "research" ? (
        <div className="fcs-grid-gap-lg">
          <div className="fcs-flex-header">
            <button
              type="button"
              onClick={async () => {
                const next = !assistantEnabled;
                await adminSetFiqhResearchEnabled(next);
                setAssistantEnabled(next);
                showSuccess(next ? "تم تفعيل المساعد" : "تم تعطيل المساعد");
              }}
              className="fcs-toggle-btn"
            >
              {assistantEnabled ? "تعطيل مساعد الباحث" : "تفعيل مساعد الباحث"}
            </button>
            <span className="fcs-text-sm">
              عمليات بحث: {researchAnalytics?.total_searches ?? researchLogs.length} · غير مجاب: {researchAnalytics?.unanswered_count ?? unanswered.length}
            </span>
          </div>

          {researchAnalytics?.top_queries?.length > 0 && (
            <section>
              <h3 className="fcs-h3">أكثر الأسئلة بحثاً</h3>
              <div className="fcs-grid-gap">
                {researchAnalytics.top_queries.map((row: any) => (
                  <div key={row.query} className="fiqh-sync-job fcs-text-sm">
                    {row.query}، {row.cnt} مرة
                  </div>
                ))}
              </div>
            </section>
          )}

          {researchAnalytics?.top_categories?.length > 0 && (
            <section>
              <h3 className="fcs-h3">أكثر التصنيفات بحثاً</h3>
              <div className="fcs-grid-gap">
                {researchAnalytics.top_categories.map((row: any) => (
                  <div key={row.category} className="fiqh-sync-job fcs-text-sm">
                    {row.category}، {row.cnt} مرة
                  </div>
                ))}
              </div>
            </section>
          )}

          {researchAnalytics?.top_keywords?.length > 0 && (
            <section>
              <h3 className="fcs-h3">كلمات مفتاحية متكررة</h3>
              <div className="fcs-grid-gap">
                {researchAnalytics.top_keywords.map((row: any) => (
                  <div key={row.keyword} className="fiqh-sync-job fcs-text-sm">
                    {row.keyword}، {row.cnt} مرة
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="fcs-h3">أسئلة بلا نتائج</h3>
            {unanswered.length === 0 ? (
              <p className="fcs-text-sm">لا توجد أسئلة مفتوحة.</p>
            ) : (
              <div className="fcs-grid-gap-sm">
                {unanswered.map((q: any) => (
                  <div key={q.id} className="fiqh-sync-job">
                    <strong>{q.query}</strong>
                    <div className="fcs-unanswered-actions">
                      <select
                        id={`link-${q.id}`}
                        defaultValue=""
                        className="adm-select fcs-sel-sm"
                      >
                        <option value="">ربط بمادة فقهية...</option>
                        {items.filter((i) => i.status === "published").slice(0, 80).map((item) => (
                          <option key={item.id} value={item.id}>{item.title.slice(0, 60)}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="fcs-btn"
                        onClick={() => {
                          const sel = document.getElementById(`link-${q.id}`) as HTMLSelectElement | null;
                          const itemId = sel?.value;
                          if (!itemId) return showError("اختر مادة فقهية للربط");
                          adminLinkUnansweredQuestion(q.id, itemId).then(({ error }) => {
                            if (error) showError(error.message);
                            else showSuccess("تم ربط السؤال بالمادة");
                            loadItems();
                          });
                        }}
                      >
                        ربط
                      </button>
                      <button type="button" className="fcs-btn" onClick={() => adminDismissUnansweredQuestion(q.id).then(loadItems)}>تجاهل</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="fcs-h3">آخر عمليات البحث</h3>
            <div className="fcs-logs-grid">
              {researchLogs.map((log: any) => (
                <div key={log.id} className="fiqh-sync-job fcs-text-xs">
                  {log.query}، {log.result_count} نتيجة · {log.retrieval_mode}
                  {log.created_at && <> · {new Date(log.created_at).toLocaleString("ar")}</>}
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : tab === "sessions" ? (
        <div className="fcs-grid-gap-lg">
          <p className="fcs-text-sm">
            إدارة جلسات المجمع، لا تُنشر للعامة إلا بعد التوثيق والاعتماد.
          </p>
          {sessions.length === 0 ? (
            <p className="fcs-empty">لا توجد جلسات، أضف من Supabase أو migration v10.</p>
          ) : (
            <div className="fcs-grid-gap-md">
              {sessions.map((s: any) => (
                <div key={s.id} className="fiqh-sync-job">
                  <strong>{s.session_title}</strong>
                  <p className="fcs-session-meta">
                    {FIQH_SESSION_STATUS_LABELS[s.status as keyof typeof FIQH_SESSION_STATUS_LABELS] || s.status}
                    {" · "}{FIQH_VERIFICATION_STATUS_LABELS[s.verification_status as keyof typeof FIQH_VERIFICATION_STATUS_LABELS] || s.verification_status}
                    {s.start_date && <> · {s.start_date}</>}
                  </p>
                  <div className="fcs-session-actions">
                    {s.publish_status === "published" && (
                      <a href={fiqhSessionHref(s.slug)} target="_blank" rel="noopener noreferrer" className="fcs-a">معاينة</a>
                    )}
                    <button type="button" className="fcs-btn" onClick={() => adminUpsertFiqhSession({ ...s, publish_status: "published", verification_status: "verified" }).then(loadItems)}>نشر</button>
                    <button type="button" className="fcs-btn" onClick={() => adminArchiveFiqhSession(s.id).then(loadItems)}>أرشفة</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : tab === "sync" ? (
        <div className="fcs-grid-gap-lg">
          <div className="fcs-flex-header">
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="fcs-sync-btn"
            >
              {syncing ? "جارٍ المزامنة..." : "تشغيل المزامنة يدوياً"}
            </button>
            <span className="fcs-text-sm">
              المصادر الرسمية: {sources.length} · آخر عمليات: {syncJobs.length}
            </span>
          </div>

          <section>
            <h3 className="fcs-h3">المصادر الرسمية</h3>
            {sources.length === 0 ? (
              <p className="fcs-text-sm">لا توجد مصادر، نفّذ migration v6 على Supabase.</p>
            ) : (
              <div className="fcs-grid-gap-sm">
                {sources.map((src) => (
                  <div key={src.id} className="fiqh-sync-job">
                    <strong>{src.name}</strong>
                    <div className="fcs-source-meta">
                      {src.organization} · {src.source_type} · {src.is_active ? "نشط" : "معطّل"}
                      {src.last_sync_at && <> · آخر مزامنة: {new Date(src.last_sync_at).toLocaleString("ar")}</>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="fcs-h3">سجل عمليات التحديث</h3>
            {syncJobs.length === 0 ? (
              <p className="fcs-text-sm">لا توجد عمليات مزامنة بعد.</p>
            ) : (
              <div className="fcs-grid-gap-sm">
                {syncJobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    className="fiqh-sync-job fcs-job-btn"
                    onClick={() => setSelectedJobId(job.id === selectedJobId ? null : job.id)}
                  >
                    <strong>{job.status}</strong> · {job.trigger_type}
                    <div className="fcs-job-meta">
                      جلب: {job.total_fetched} · جديد: {job.inserted_count} · تحديث: {job.updated_count} · تخطّي: {job.skipped_count} · تكرار: {job.duplicate_count} · أخطاء: {job.error_count}
                      {job.created_at && <> · {new Date(job.created_at).toLocaleString("ar")}</>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {selectedJobId && syncLogs.length > 0 && (
            <section>
              <h3 className="fcs-h3">تفاصيل السجل</h3>
              <div className="fcs-logs-grid">
                {syncLogs.map((log: any) => (
                  <div key={log.id} className="fiqh-sync-job fcs-text-xs">
                    [{log.level || log.status}] {log.message || log.action}
                    {log.external_id && <> · {log.external_id}</>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <>
          <div className="fcs-filters-row">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="adm-select">
              <option value="الكل">كل الأنواع</option>
              {FIQH_ITEM_TYPES.map((t) => <option key={t} value={t}>{FIQH_ITEM_TYPE_LABELS[t]}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="adm-select">
              <option value="الكل">كل الحالات</option>
              {Object.entries(FIQH_ITEM_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              placeholder="بحث..."
              className="adm-input fcs-search"
            />
          </div>

          {loading ? <SkeletonCardGrid count={6} /> : (
            <div className="fcs-items-grid">
              {filtered.length === 0 ? (
                <p className="fcs-empty">
                  {tab === "review" ? "لا توجد عناصر بانتظار المراجعة." : "لا توجد عناصر."}
                </p>
              ) : filtered.map(renderItemCard)}
            </div>
          )}
        </>
      )}

      {previewSlug && (
        <AdminModal open={!!previewSlug} onClose={() => setPreviewSlug(null)} title="معاينة قبل النشر" onSave={() => setPreviewSlug(null)} saving={false}>
          <p className="fcs-text-sm">
            المعاينة متاحة للعناصر المنشورة فقط. للمسودات، راجع النموذج أو انشر مؤقتاً للمعاينة.
          </p>
          <a href={fiqhItemHref(previewSlug)} target="_blank" rel="noopener noreferrer">فتح صفحة المعاينة</a>
        </AdminModal>
      )}

      <AdminModal open={open} onClose={() => setOpen(false)} title="عنصر المجمع الفقهي" onSave={handleSave} saving={saving}>
        <Field label="العنوان"><input className="adm-input" value={form.title || ""} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="الرابط (slug)"><input className="adm-input" value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} placeholder="يُولَّد تلقائياً من العنوان" /></Field>
        <Field label="النوع">
          <select className="adm-select" value={form.type} onChange={(e) => set("type", e.target.value)}>
            {FIQH_ITEM_TYPES.map((t) => <option key={t} value={t}>{FIQH_ITEM_TYPE_LABELS[t]}</option>)}
          </select>
        </Field>
        <Field label="التصنيف">
          <select className="adm-select" value={form.category} onChange={(e) => set("category", e.target.value)}>
            {FIQH_COUNCIL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="الملخص"><textarea className="adm-textarea" value={form.summary || ""} onChange={(e) => set("summary", e.target.value)} rows={2} /></Field>
        <Field label="المحتوى"><textarea className="adm-textarea" value={form.content || ""} onChange={(e) => set("content", e.target.value)} rows={5} /></Field>
        <Field label="نص الحكم / الفتوى"><textarea className="adm-textarea" value={form.ruling_text || ""} onChange={(e) => set("ruling_text", e.target.value)} rows={3} /></Field>
        <Field label="الأدلة (نوع|نص|مصدر، سطر لكل دليل)">
          <textarea className="adm-textarea" value={form.evidence || ""} onChange={(e) => set("evidence", e.target.value)} rows={3} placeholder="قرآن|يَا أَيُّهَا..." />
        </Field>
        <Field label="المصدر"><input className="adm-input" value={form.source_name || ""} onChange={(e) => set("source_name", e.target.value)} /></Field>
        <Field label="رابط المصدر"><input className="adm-input" value={form.source_url || ""} onChange={(e) => set("source_url", e.target.value)} /></Field>
        <Field label="المجلس"><input className="adm-input" value={form.council_name || ""} onChange={(e) => set("council_name", e.target.value)} /></Field>
        <Field label="رقم الجلسة"><input className="adm-input" value={form.session_number || ""} onChange={(e) => set("session_number", e.target.value)} /></Field>
        <Field label="تاريخ الجلسة"><input className="adm-input" type="date" value={form.session_date || ""} onChange={(e) => set("session_date", e.target.value)} /></Field>
        <Field label="الوسوم (مفصولة بفاصلة)"><input className="adm-input" value={form.tags || ""} onChange={(e) => set("tags", e.target.value)} /></Field>
        <Field label="الحالة">
          <select className="adm-select" value={form.status || "draft"} onChange={(e) => set("status", e.target.value)}>
            {Object.entries(FIQH_ITEM_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
      </AdminModal>
    </div>
  );
}
