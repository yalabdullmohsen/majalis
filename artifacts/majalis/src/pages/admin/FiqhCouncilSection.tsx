import { useEffect, useMemo, useState } from "react";
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
} from "@/lib/fiqh-council-supabase";
import { getFiqhCouncilReviewItems } from "@/lib/fiqh-council-service";
import {
  FIQH_COUNCIL_CATEGORIES,
  FIQH_ITEM_TYPES,
  FIQH_ITEM_TYPE_LABELS,
  FIQH_ITEM_STATUS_LABELS,
  fiqhItemHref,
  type FiqhItemStatus,
  type FiqhItemType,
  type FiqhCouncilSource,
  type FiqhSyncJob,
} from "@/lib/fiqh-council-types";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, inputSt, selectSt, textareaSt } from "./AdminModal";
import { useAdminShell } from "./AdminShell";

type AdminTab = "stats" | "items" | "review" | "duplicates" | "research" | "sync";

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
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
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
    ]).then(([allRes, reviewRes, sourcesRes, jobsRes, dupRes, statsRes, auditRes, logsRes, analyticsRes, unansweredRes]) => {
      setItems(allRes.data);
      setReviewItems(reviewRes.data);
      setSources(sourcesRes.data);
      setSyncJobs(jobsRes.data);
      setDuplicates(dupRes.data);
      setStats(statsRes);
      setAuditLog(auditRes.data);
      setResearchLogs(logsRes.data);
      setResearchAnalytics(analyticsRes.data);
      setUnanswered(unansweredRes.data);
      if (allRes.error && allRes.usingSeed) showError("تعذّر تحميل البيانات — عرض البذور المحلية.");
    }).finally(() => setLoading(false));
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

  const renderItemCard = (item: any) => (
    <div key={item.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "1rem" }}>
      <strong>{item.title}</strong>
      <p style={{ margin: "0.5rem 0", fontSize: "0.875rem", color: C.inkSoft }}>
        {FIQH_ITEM_TYPE_LABELS[item.type as FiqhItemType]} · {item.category} · {FIQH_ITEM_STATUS_LABELS[item.status as FiqhItemStatus] || item.status}
        {item.validation_status && <> · تحقق: {item.validation_status}</>}
        {item.external_id && <> · {item.external_id}</>}
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button onClick={() => { setForm({ ...item, tags: (item.tags || []).join("، "), evidence: formatEvidence(item.evidence) }); setOpen(true); }} style={{ fontSize: "0.75rem", cursor: "pointer" }}>تعديل</button>
        {item.status !== "published" && (
          <>
            <button onClick={() => handleApprove(item.id)} style={{ fontSize: "0.75rem", cursor: "pointer" }}>اعتماد</button>
            <button onClick={() => handlePublish(item.id)} style={{ fontSize: "0.75rem", cursor: "pointer" }}>نشر</button>
            <button onClick={() => handleReject(item.id)} style={{ fontSize: "0.75rem", cursor: "pointer", color: "#dc2626" }}>رفض</button>
          </>
        )}
        {item.status === "published" && (
          <button onClick={() => handleStatus(item.id, "draft")} style={{ fontSize: "0.75rem", cursor: "pointer" }}>إلغاء النشر</button>
        )}
        {item.status !== "archived" && (
          <button onClick={() => handleArchive(item.id)} style={{ fontSize: "0.75rem", cursor: "pointer" }}>أرشفة</button>
        )}
        <button onClick={() => setPreviewSlug(item.slug)} style={{ fontSize: "0.75rem", cursor: "pointer" }}>معاينة</button>
        <a href={fiqhItemHref(item.slug)} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem" }}>فتح</a>
        <button onClick={() => handleDelete(item.id)} style={{ fontSize: "0.75rem", color: "#dc2626", cursor: "pointer" }}>حذف</button>
      </div>
    </div>
  );

  return (
    <div className="fiqh-council-admin">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0, color: C.emeraldDeep }}>المجمع الفقهي الإسلامي ({filtered.length})</h2>
        <button
          onClick={() => { setForm({ ...EMPTY }); setOpen(true); }}
          style={{ padding: "0.5rem 1rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.375rem", cursor: "pointer" }}
        >
          + إضافة
        </button>
      </div>

      <div className="fiqh-council-admin-tabs">
        {([
          ["stats", "الإحصائيات"],
          ["items", `جميع العناصر (${items.length})`],
          ["review", `قيد المراجعة (${reviewItems.length})`],
          ["duplicates", `احتمالات التكرار (${duplicates.length})`],
          ["research", "مساعد الباحث"],
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
          <section style={{ marginTop: "1rem" }}>
            <h3 style={{ fontSize: "0.9375rem", color: C.emeraldDeep }}>سجل الاعتماد</h3>
            {auditLog.length === 0 ? (
              <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>لا توجد عمليات بعد.</p>
            ) : (
              <div style={{ display: "grid", gap: "0.35rem" }}>
                {auditLog.map((entry: any) => (
                  <div key={entry.id} className="fiqh-sync-job" style={{ fontSize: "0.75rem" }}>
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
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {duplicates.length === 0 ? (
            <p style={{ color: C.inkSoft, fontSize: "0.875rem" }}>لا توجد احتمالات تكرار.</p>
          ) : duplicates.map((dup: any) => (
            <div key={dup.id} className="fiqh-sync-job">
              <strong>تشابه {(dup.similarity_score * 100).toFixed(0)}%</strong>
              <p style={{ margin: "0.35rem 0", fontSize: "0.8125rem", color: C.inkSoft }}>
                {(dup.match_reasons || []).join(" · ")}
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => handleResolveDup(dup.id, "merged")} style={{ fontSize: "0.75rem", cursor: "pointer" }}>دمج</button>
                <button onClick={() => handleResolveDup(dup.id, "ignored")} style={{ fontSize: "0.75rem", cursor: "pointer" }}>تجاهل</button>
              </div>
            </div>
          ))}
        </div>
      ) : tab === "research" ? (
        <div style={{ display: "grid", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={async () => {
                const next = !assistantEnabled;
                await adminSetFiqhResearchEnabled(next);
                setAssistantEnabled(next);
                showSuccess(next ? "تم تفعيل المساعد" : "تم تعطيل المساعد");
              }}
              style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
            >
              {assistantEnabled ? "تعطيل مساعد الباحث" : "تفعيل مساعد الباحث"}
            </button>
            <span style={{ fontSize: "0.8125rem", color: C.inkSoft }}>
              عمليات بحث: {researchAnalytics?.total_searches ?? researchLogs.length} · غير مجاب: {researchAnalytics?.unanswered_count ?? unanswered.length}
            </span>
          </div>

          {researchAnalytics?.top_queries?.length > 0 && (
            <section>
              <h3 style={{ fontSize: "0.9375rem", color: C.emeraldDeep }}>أكثر الأسئلة بحثاً</h3>
              <div style={{ display: "grid", gap: "0.35rem" }}>
                {researchAnalytics.top_queries.map((row: any) => (
                  <div key={row.query} className="fiqh-sync-job" style={{ fontSize: "0.8125rem" }}>
                    {row.query} — {row.cnt} مرة
                  </div>
                ))}
              </div>
            </section>
          )}

          {researchAnalytics?.top_categories?.length > 0 && (
            <section>
              <h3 style={{ fontSize: "0.9375rem", color: C.emeraldDeep }}>أكثر التصنيفات بحثاً</h3>
              <div style={{ display: "grid", gap: "0.35rem" }}>
                {researchAnalytics.top_categories.map((row: any) => (
                  <div key={row.category} className="fiqh-sync-job" style={{ fontSize: "0.8125rem" }}>
                    {row.category} — {row.cnt} مرة
                  </div>
                ))}
              </div>
            </section>
          )}

          {researchAnalytics?.top_keywords?.length > 0 && (
            <section>
              <h3 style={{ fontSize: "0.9375rem", color: C.emeraldDeep }}>كلمات مفتاحية متكررة</h3>
              <div style={{ display: "grid", gap: "0.35rem" }}>
                {researchAnalytics.top_keywords.map((row: any) => (
                  <div key={row.keyword} className="fiqh-sync-job" style={{ fontSize: "0.8125rem" }}>
                    {row.keyword} — {row.cnt} مرة
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 style={{ fontSize: "0.9375rem", color: C.emeraldDeep }}>أسئلة بلا نتائج</h3>
            {unanswered.length === 0 ? (
              <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>لا توجد أسئلة مفتوحة.</p>
            ) : (
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {unanswered.map((q: any) => (
                  <div key={q.id} className="fiqh-sync-job">
                    <strong>{q.query}</strong>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
                      <select
                        id={`link-${q.id}`}
                        defaultValue=""
                        style={{ ...selectSt, fontSize: "0.75rem", minWidth: "12rem" }}
                      >
                        <option value="">ربط بمادة فقهية...</option>
                        {items.filter((i) => i.status === "published").slice(0, 80).map((item) => (
                          <option key={item.id} value={item.id}>{item.title.slice(0, 60)}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        style={{ fontSize: "0.75rem", cursor: "pointer" }}
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
                      <button type="button" style={{ fontSize: "0.75rem", cursor: "pointer" }} onClick={() => adminDismissUnansweredQuestion(q.id).then(loadItems)}>تجاهل</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 style={{ fontSize: "0.9375rem", color: C.emeraldDeep }}>آخر عمليات البحث</h3>
            <div style={{ display: "grid", gap: "0.35rem", maxHeight: "16rem", overflowY: "auto" }}>
              {researchLogs.map((log: any) => (
                <div key={log.id} className="fiqh-sync-job" style={{ fontSize: "0.75rem" }}>
                  {log.query} — {log.result_count} نتيجة · {log.retrieval_mode}
                  {log.created_at && <> · {new Date(log.created_at).toLocaleString("ar")}</>}
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : tab === "sync" ? (
        <div style={{ display: "grid", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={handleManualSync}
              disabled={syncing}
              style={{ padding: "0.5rem 1rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.375rem", cursor: syncing ? "wait" : "pointer" }}
            >
              {syncing ? "جارٍ المزامنة..." : "تشغيل المزامنة يدوياً"}
            </button>
            <span style={{ fontSize: "0.8125rem", color: C.inkSoft }}>
              المصادر الرسمية: {sources.length} · آخر عمليات: {syncJobs.length}
            </span>
          </div>

          <section>
            <h3 style={{ fontSize: "0.9375rem", color: C.emeraldDeep }}>المصادر الرسمية</h3>
            {sources.length === 0 ? (
              <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>لا توجد مصادر — نفّذ migration v6 على Supabase.</p>
            ) : (
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {sources.map((src) => (
                  <div key={src.id} className="fiqh-sync-job">
                    <strong>{src.name}</strong>
                    <div style={{ color: C.inkSoft, marginTop: "0.25rem" }}>
                      {src.organization} · {src.source_type} · {src.is_active ? "نشط" : "معطّل"}
                      {src.last_sync_at && <> · آخر مزامنة: {new Date(src.last_sync_at).toLocaleString("ar")}</>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 style={{ fontSize: "0.9375rem", color: C.emeraldDeep }}>سجل عمليات التحديث</h3>
            {syncJobs.length === 0 ? (
              <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>لا توجد عمليات مزامنة بعد.</p>
            ) : (
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {syncJobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    className="fiqh-sync-job"
                    style={{ textAlign: "right", cursor: "pointer", width: "100%" }}
                    onClick={() => setSelectedJobId(job.id === selectedJobId ? null : job.id)}
                  >
                    <strong>{job.status}</strong> · {job.trigger_type}
                    <div style={{ color: C.inkSoft, marginTop: "0.25rem" }}>
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
              <h3 style={{ fontSize: "0.9375rem", color: C.emeraldDeep }}>تفاصيل السجل</h3>
              <div style={{ display: "grid", gap: "0.35rem", maxHeight: "16rem", overflowY: "auto" }}>
                {syncLogs.map((log: any) => (
                  <div key={log.id} className="fiqh-sync-job" style={{ fontSize: "0.75rem" }}>
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
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={selectSt}>
              <option value="الكل">كل الأنواع</option>
              {FIQH_ITEM_TYPES.map((t) => <option key={t} value={t}>{FIQH_ITEM_TYPE_LABELS[t]}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectSt}>
              <option value="الكل">كل الحالات</option>
              {Object.entries(FIQH_ITEM_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              placeholder="بحث..."
              style={{ ...inputSt, flex: 1, minWidth: "140px" }}
            />
          </div>

          {loading ? <Loading /> : (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {filtered.length === 0 ? (
                <p style={{ color: C.inkSoft, fontSize: "0.875rem" }}>
                  {tab === "review" ? "لا توجد عناصر بانتظار المراجعة." : "لا توجد عناصر."}
                </p>
              ) : filtered.map(renderItemCard)}
            </div>
          )}
        </>
      )}

      {previewSlug && (
        <AdminModal open={!!previewSlug} onClose={() => setPreviewSlug(null)} title="معاينة قبل النشر" onSave={() => setPreviewSlug(null)} saving={false}>
          <p style={{ fontSize: "0.875rem", color: C.inkSoft }}>
            المعاينة متاحة للعناصر المنشورة فقط. للمسودات، راجع النموذج أو انشر مؤقتاً للمعاينة.
          </p>
          <a href={fiqhItemHref(previewSlug)} target="_blank" rel="noopener noreferrer">فتح صفحة المعاينة</a>
        </AdminModal>
      )}

      <AdminModal open={open} onClose={() => setOpen(false)} title="عنصر المجمع الفقهي" onSave={handleSave} saving={saving}>
        <Field label="العنوان"><input style={inputSt} value={form.title || ""} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="الرابط (slug)"><input style={inputSt} value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} placeholder="يُولَّد تلقائياً من العنوان" /></Field>
        <Field label="النوع">
          <select style={selectSt} value={form.type} onChange={(e) => set("type", e.target.value)}>
            {FIQH_ITEM_TYPES.map((t) => <option key={t} value={t}>{FIQH_ITEM_TYPE_LABELS[t]}</option>)}
          </select>
        </Field>
        <Field label="التصنيف">
          <select style={selectSt} value={form.category} onChange={(e) => set("category", e.target.value)}>
            {FIQH_COUNCIL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="الملخص"><textarea style={textareaSt} value={form.summary || ""} onChange={(e) => set("summary", e.target.value)} rows={2} /></Field>
        <Field label="المحتوى"><textarea style={textareaSt} value={form.content || ""} onChange={(e) => set("content", e.target.value)} rows={5} /></Field>
        <Field label="نص الحكم / الفتوى"><textarea style={textareaSt} value={form.ruling_text || ""} onChange={(e) => set("ruling_text", e.target.value)} rows={3} /></Field>
        <Field label="الأدلة (نوع|نص|مصدر — سطر لكل دليل)">
          <textarea style={textareaSt} value={form.evidence || ""} onChange={(e) => set("evidence", e.target.value)} rows={3} placeholder="قرآن|يَا أَيُّهَا..." />
        </Field>
        <Field label="المصدر"><input style={inputSt} value={form.source_name || ""} onChange={(e) => set("source_name", e.target.value)} /></Field>
        <Field label="رابط المصدر"><input style={inputSt} value={form.source_url || ""} onChange={(e) => set("source_url", e.target.value)} /></Field>
        <Field label="المجلس"><input style={inputSt} value={form.council_name || ""} onChange={(e) => set("council_name", e.target.value)} /></Field>
        <Field label="رقم الجلسة"><input style={inputSt} value={form.session_number || ""} onChange={(e) => set("session_number", e.target.value)} /></Field>
        <Field label="تاريخ الجلسة"><input style={inputSt} type="date" value={form.session_date || ""} onChange={(e) => set("session_date", e.target.value)} /></Field>
        <Field label="الوسوم (مفصولة بفاصلة)"><input style={inputSt} value={form.tags || ""} onChange={(e) => set("tags", e.target.value)} /></Field>
        <Field label="الحالة">
          <select style={selectSt} value={form.status || "draft"} onChange={(e) => set("status", e.target.value)}>
            {Object.entries(FIQH_ITEM_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
      </AdminModal>
    </div>
  );
}
