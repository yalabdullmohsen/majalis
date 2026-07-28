import { useEffect, useMemo, useState } from "react";
import {
  Archive, CheckCircle2, ChevronDown, ChevronUp, EyeOff,
  FolderTree, MoreVertical, Plus, RotateCcw, Send, Trash2,
} from "lucide-react";
import { AdminModal, Field } from "@/views/admin/AdminModal";
import { AdminSectionToolbar } from "@/views/admin/AdminSectionToolbar";
import { StatusBadge } from "@/views/admin/AdminUI";
import { useAdminShell } from "@/views/admin/AdminShell";
import { useAuth } from "@/components/AuthProvider";
import {
  adminAnalyzeCategories,
  adminBulkPublishCategories,
  adminChangeCategoryStatus,
  adminDeleteCategory,
  adminDetachOrphanParent,
  adminFetchCategories,
  adminFixEmptySlug,
  adminSwapCategorySortOrder,
  adminUpsertCategory,
  adminValidateCategoryForPublish,
  type AdminCategory,
} from "@/lib/categories-admin-service";
import {
  CATEGORY_STATUS_META,
  countCategoryStatuses,
  normalizeCategoryStatus,
  type CategoryStatus,
} from "@/lib/category-status";
import {
  buildCategoryTree,
  filterCategoryTreeByStatus,
  filterCategoryTreeDeep,
  flattenTreeIds,
  type StructuralIssue,
  type TreeNode,
} from "@/lib/category-tree";
import "@/styles/pages/admin-categories.css";

type StatusTab = "all" | CategoryStatus | "needs_fix";

function slugify(text: string): string {
  return text.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function CategoryStatusChip({ status }: { status: string }) {
  const meta = CATEGORY_STATUS_META[normalizeCategoryStatus(status)];
  return (
    <span
      className={`cat-status-chip cat-status-chip--${normalizeCategoryStatus(status)}`}
      title={meta.label}
    >
      <span aria-hidden="true">{meta.icon}</span>
      <StatusBadge status={normalizeCategoryStatus(status)} label={meta.label} />
    </span>
  );
}

function CategoryTreeItem({
  node, index, total, depth, expandAll, selectedIds, onToggleSelect, onMove, onReload, parentPublished,
}: {
  node: TreeNode<AdminCategory>;
  index: number;
  total: number;
  depth: number;
  expandAll: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onMove: (dir: -1 | 1) => void;
  onReload: () => void;
  parentPublished: boolean;
}) {
  const { showSuccess, showError } = useAdminShell();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(expandAll || depth < 1);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState<Partial<AdminCategory>>(node);
  const [saving, setSaving] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => { setExpanded(expandAll || depth < 1); }, [expandAll, depth]);

  const st = normalizeCategoryStatus(node.status);
  const selected = selectedIds.has(node.id);

  const save = async () => {
    if (!form.name?.trim()) return showError("اسم التصنيف مطلوب");
    if (form.status === "published" && node.status !== "published") {
      const check = await adminValidateCategoryForPublish(node.id);
      if (!check.ok) return showError(check.errors.join(" — "));
    }
    setSaving(true);
    const { error } = await adminUpsertCategory({ ...form, id: node.id, slug: form.slug?.trim() || slugify(form.name) });
    setSaving(false);
    if (error) return showError(error.message);
    showSuccess("تم الحفظ");
    setOpen(false);
    onReload();
  };

  const changeStatus = async (next: CategoryStatus, reason?: string) => {
    const sensitive = next === "published" || next === "archived" || next === "rejected";
    if (sensitive && !confirm(`تأكيد تغيير حالة «${node.name}» إلى «${CATEGORY_STATUS_META[next].label}»؟`)) return;
    const { error } = await adminChangeCategoryStatus({
      category: node, next, reason: reason ?? null, actorId: user?.id ?? null, cascadeAncestors: next === "published",
    });
    if (error) return showError(error.message);
    showSuccess(`تم التحديث → ${CATEGORY_STATUS_META[next].label}`);
    setMenuOpen(false);
    onReload();
  };

  const del = async () => {
    if (!confirm(`حذف تصنيف «${node.name}» وكل تصنيفاته الفرعية؟`)) return;
    const { error } = await adminDeleteCategory(node.id);
    if (error) return showError(error.message);
    onReload();
  };

  const addChild = async () => {
    const name = prompt("اسم التصنيف الفرعي الجديد؟");
    if (!name?.trim()) return;
    const { error } = await adminUpsertCategory({
      parent_id: node.id, name: name.trim(), slug: slugify(name), sort_order: node.children.length, status: "draft",
    });
    if (error) return showError(error.message);
    setExpanded(true);
    onReload();
  };

  return (
    <div className={`cat-node cat-node--depth-${Math.min(depth, 4)}`} data-status={st}>
      <div className="cat-node__row">
        <label className="cat-node__check">
          <input type="checkbox" checked={selected} onChange={() => onToggleSelect(node.id)} aria-label={`تحديد ${node.name}`} />
        </label>
        {node.children.length > 0 ? (
          <button type="button" className="adm-btn-sm cat-node__expand" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        ) : <span className="cat-node__expand-spacer" aria-hidden="true" />}

        <div className="cat-node__main">
          <div className="cat-node__title-line">
            <strong className="cat-node__name">{node.name}</strong>
            <CategoryStatusChip status={st} />
          </div>
          <div className="cat-node__meta">
            <span dir="ltr" className="cat-node__slug">{node.slug || "—"}</span>
            {node.children.length > 0 && <span className="adm-type-badge">{node.children.length} فرعي</span>}
            {!parentPublished && depth > 0 && <span className="cat-node__warn">الأب غير منشور للمستخدم</span>}
          </div>
        </div>

        <div className="cat-node__actions-desktop adm-item-actions">
          <button type="button" className="adm-btn-sm" disabled={index === 0} onClick={() => onMove(-1)}>↑</button>
          <button type="button" className="adm-btn-sm" disabled={index === total - 1} onClick={() => onMove(1)}>↓</button>
          <button type="button" className="adm-btn-sm" onClick={addChild}><Plus size={13} /> فرعي</button>
          <button type="button" className="adm-btn-sm" onClick={() => { setForm(node); setOpen(true); }}>تعديل</button>
          {st !== "published" && <button type="button" className="adm-btn-sm" onClick={() => changeStatus("published")}><CheckCircle2 size={13} /> نشر</button>}
          {st === "published" && <button type="button" className="adm-btn-sm" onClick={() => changeStatus("hidden")}><EyeOff size={13} /> إخفاء</button>}
          <button type="button" className="adm-btn-del" onClick={del}><Trash2 size={13} /></button>
        </div>

        <div className="cat-node__actions-mobile">
          <button type="button" className="adm-btn-sm" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="cat-node__menu" role="menu">
              <button type="button" role="menuitem" onClick={() => { setForm(node); setOpen(true); setMenuOpen(false); }}>تعديل</button>
              <button type="button" role="menuitem" onClick={addChild}>إضافة فرعي</button>
              <button type="button" role="menuitem" onClick={() => changeStatus("pending_review")}><Send size={13} /> إرسال للمراجعة</button>
              <button type="button" role="menuitem" onClick={() => changeStatus("published")}><CheckCircle2 size={13} /> اعتماد ونشر</button>
              <button type="button" role="menuitem" onClick={() => changeStatus("draft")}><RotateCcw size={13} /> إرجاع لمسودة</button>
              <button type="button" role="menuitem" onClick={() => changeStatus(st === "hidden" ? "draft" : "hidden")}>
                {st === "hidden" ? "إلغاء الإخفاء" : "إخفاء"}
              </button>
              <button type="button" role="menuitem" onClick={() => changeStatus("archived")}><Archive size={13} /> أرشفة</button>
              <button type="button" role="menuitem" onClick={() => { setRejectOpen(true); setMenuOpen(false); }}>رفض…</button>
              <button type="button" role="menuitem" className="is-danger" onClick={del}>حذف</button>
            </div>
          )}
        </div>
      </div>

      {expanded && node.children.length > 0 && (
        <div className="cat-node__children">
          {node.children.map((child, i, arr) => (
            <CategoryTreeItem
              key={child.id}
              node={child}
              index={i}
              total={arr.length}
              depth={depth + 1}
              expandAll={expandAll}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onMove={async (dir) => {
                const other = arr[i + dir];
                if (!other) return;
                await adminSwapCategorySortOrder(child, other);
                onReload();
              }}
              onReload={onReload}
              parentPublished={st === "published"}
            />
          ))}
        </div>
      )}

      <AdminModal open={open} onClose={() => setOpen(false)} title="بيانات التصنيف" onSave={save} saving={saving}>
        <Field label="الاسم"><input className="adm-input" value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
        <Field label="المعرّف (slug)"><input className="adm-input" dir="ltr" value={form.slug ?? ""} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} /></Field>
        <Field label="الوصف"><textarea className="adm-textarea" rows={2} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
        <Field label="الحالة">
          <select className="adm-select" value={form.status ?? "draft"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as CategoryStatus }))}>
            {(Object.keys(CATEGORY_STATUS_META) as CategoryStatus[]).map((k) => (
              <option key={k} value={k}>{CATEGORY_STATUS_META[k].label}</option>
            ))}
          </select>
        </Field>
      </AdminModal>

      <AdminModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="رفض التصنيف"
        onSave={async () => {
          if (!rejectReason.trim()) return showError("سبب الرفض مطلوب");
          await changeStatus("rejected", rejectReason.trim());
          setRejectOpen(false);
          setRejectReason("");
        }}
        saving={false}
      >
        <Field label="سبب الرفض">
          <textarea className="adm-textarea" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
        </Field>
      </AdminModal>
    </div>
  );
}

export function CategoriesSection() {
  const { showError, showSuccess } = useAdminShell();
  const { user } = useAuth();
  const [flat, setFlat] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<StatusTab>("all");
  const [showAllStatuses, setShowAllStatuses] = useState(true);
  const [expandAll, setExpandAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(80);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error, truncated } = await adminFetchCategories();
    if (error) {
      showError(error.message);
      setLoadError(error.message);
      // إن كان الخطأ بسبب RLS/عدم صلاحية مشرف ستظهر المنشورة فقط
      if (/permission|rls|policy|jwt/i.test(error.message)) {
        setLoadError("تعذّر جلب كل الحالات — تحقق من صلاحية is_admin() في الجلسة.");
      }
    }
    setFlat(data ?? []);
    if (truncated) showError("تم قطع الجلب عند حدّ أعلى — راجع عدد الصفوف في قاعدة البيانات.");
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const counts = useMemo(() => countCategoryStatuses(flat), [flat]);
  const issues = useMemo(() => adminAnalyzeCategories(flat), [flat]);
  const issueIds = useMemo(() => new Set(issues.map((i) => i.categoryId)), [issues]);

  const tree = useMemo(() => {
    let t = buildCategoryTree(flat);
    if (search.trim()) t = filterCategoryTreeDeep(t, search);
    if (!showAllStatuses && tab === "all") {
      // حتى مع إظهار الكل مفعّل افتراضيًا — إن أُوقف نعرض المنشور فقط كمعاينة مستخدم
      t = filterCategoryTreeByStatus(t, "published");
    } else if (tab !== "all" && tab !== "needs_fix") {
      t = filterCategoryTreeByStatus(t, tab);
    } else if (tab === "needs_fix") {
      const keep = issueIds;
      const filterIssues = (nodes: TreeNode<AdminCategory>[]): TreeNode<AdminCategory>[] =>
        nodes
          .map((n) => {
            const children = filterIssues(n.children);
            if (keep.has(n.id) || children.length) return { ...n, children };
            return null;
          })
          .filter(Boolean) as TreeNode<AdminCategory>[];
      t = filterIssues(t);
    }
    return t;
  }, [flat, search, tab, showAllStatuses, issueIds]);

  const visibleIds = useMemo(() => flattenTreeIds(tree), [tree]);
  const pageIds = visibleIds.slice(0, pageSize);
  const pageSet = useMemo(() => new Set(pageIds), [pageIds]);

  const pagedTree = useMemo(() => {
    const filterPage = (nodes: TreeNode<AdminCategory>[]): TreeNode<AdminCategory>[] =>
      nodes
        .map((n) => {
          const children = filterPage(n.children);
          if (pageSet.has(n.id) || children.length) return { ...n, children };
          return null;
        })
        .filter(Boolean) as TreeNode<AdminCategory>[];
    return filterPage(tree);
  }, [tree, pageSet]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCats = flat.filter((c) => selectedIds.has(c.id));

  const bulkPublish = async () => {
    if (selectedCats.length === 0) return showError("حدّد عناصر أولًا");
    if (!confirm(`اعتماد ونشر ${selectedCats.length} عنصرًا محددًا؟ لن تُنشر العناصر الناقصة.`)) return;
    const result = await adminBulkPublishCategories(selectedCats, user?.id ?? null);
    showSuccess(`نُشر ${result.published} من ${result.attempted}. تخطّي ${result.skipped.length}.`);
    if (result.skipped.length) {
      console.info("bulk-publish-skipped", result.skipped);
    }
    setSelectedIds(new Set());
    load();
  };

  const tabs: Array<{ key: StatusTab; label: string; count: number }> = [
    { key: "all", label: "الكل", count: counts.total },
    { key: "published", label: "المنشور", count: counts.published },
    { key: "pending_review", label: "قيد المراجعة", count: counts.pending_review },
    { key: "draft", label: "المسودات", count: counts.draft },
    { key: "hidden", label: "المخفي", count: counts.hidden },
    { key: "rejected", label: "المرفوض", count: counts.rejected },
    { key: "archived", label: "المؤرشف", count: counts.archived },
    { key: "needs_fix", label: "يحتاج معالجة", count: new Set(issues.map((i) => i.categoryId)).size },
  ];

  const fixIssue = async (issue: StructuralIssue<AdminCategory>) => {
    if (issue.kind === "missing_parent" || issue.kind === "orphan") {
      if (!confirm("جعل العنصر جذرًا (فصل الأب المفقود)؟")) return;
      const { error } = await adminDetachOrphanParent(issue.category);
      if (error) return showError(error.message);
      showSuccess("تم فصل الأب المفقود");
      load();
      return;
    }
    if (issue.kind === "empty_slug") {
      const { error } = await adminFixEmptySlug(issue.category);
      if (error) return showError(error.message);
      showSuccess("تم توليد slug");
      load();
      return;
    }
    showError("هذا النوع يحتاج مراجعة يدوية من بطاقة التعديل.");
  };

  return (
    <div className="cat-admin" dir="rtl">
      <AdminSectionToolbar
        title="أبواب العلم (تصنيفات)"
        count={counts.total}
        badge={
          <span className="cat-admin__badges">
            <span className="adm-type-badge">{counts.publicVisible} ظاهر للمستخدم</span>
            <span className="adm-type-badge">{counts.unpublished} غير منشور</span>
            <span className="adm-type-badge">{new Set(issues.map((i) => i.categoryId)).size} بأخطاء</span>
          </span>
        }
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث بالاسم أو slug أو المعرّف أو الحالة أو اسم الأب…"
        actions={
          <>
            <button
              type="button"
              className="adm-btn-add"
              onClick={async () => {
                const name = prompt("اسم الباب الرئيسي الجديد؟");
                if (!name?.trim()) return;
                const { error } = await adminUpsertCategory({
                  name: name.trim(), slug: slugify(name), sort_order: buildCategoryTree(flat).length, status: "draft", parent_id: null,
                });
                if (error) return showError(error.message);
                load();
              }}
            >
              <Plus size={14} /> باب رئيسي
            </button>
          </>
        }
      />

      {loadError && <p className="cat-admin__error" role="alert">{loadError}</p>}

      <div className="cat-admin__stats" aria-live="polite">
        <span>الإجمالي: <strong>{counts.total}</strong></span>
        <span>ظاهر للمستخدمين: <strong>{counts.publicVisible}</strong></span>
        <span>غير منشور: <strong>{counts.unpublished}</strong></span>
        <span>قيد المراجعة: <strong>{counts.pending_review}</strong></span>
        <span>أخطاء بنيوية: <strong>{new Set(issues.map((i) => i.categoryId)).size}</strong></span>
      </div>

      <div className="cat-admin__toolbar">
        <label className="cat-admin__toggle">
          <input
            type="checkbox"
            checked={showAllStatuses}
            onChange={(e) => setShowAllStatuses(e.target.checked)}
          />
          إظهار جميع الحالات
        </label>
        <button type="button" className="adm-btn-sm" onClick={() => setExpandAll((v) => !v)}>
          <FolderTree size={14} /> {expandAll ? "إغلاق الكل" : "فتح الكل"}
        </button>
        <button type="button" className="adm-btn-sm" disabled={selectedIds.size === 0} onClick={bulkPublish}>
          <CheckCircle2 size={14} /> اعتماد ونشر جماعي ({selectedIds.size})
        </button>
      </div>

      <div className="cat-admin__tabs" role="tablist" aria-label="تصفية حسب الحالة">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`cat-admin__tab${tab === t.key ? " is-active" : ""}`}
            onClick={() => { setTab(t.key); setPageSize(80); }}
          >
            {t.label} <span className="cat-admin__tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "needs_fix" && (
        <section className="cat-admin__needs" aria-label="عناصر تحتاج مراجعة">
          <h3>عناصر تحتاج معالجة</h3>
          {issues.length === 0 ? (
            <p className="adm-empty-msg">لا مشاكل بنيوية مكتشفة.</p>
          ) : (
            <ul className="cat-admin__needs-list">
              {issues.slice(0, 100).map((issue) => (
                <li key={`${issue.kind}-${issue.categoryId}`}>
                  <div>
                    <strong>{issue.category.name || issue.categoryId}</strong>
                    <CategoryStatusChip status={issue.category.status} />
                    <p>{issue.message}</p>
                    <p className="cat-admin__hint">مقترح: {issue.suggestedAction}</p>
                  </div>
                  <button type="button" className="adm-btn-sm" onClick={() => fixIssue(issue)}>إصلاح</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {loading ? (
        <p className="adm-empty-msg">جاري التحميل…</p>
      ) : (
        <>
          {pagedTree.length === 0 && <p className="adm-empty-msg">لا تصنيفات مطابقة — جرّب «الكل» أو «إظهار جميع الحالات».</p>}
          {pagedTree.map((node, i, arr) => (
            <CategoryTreeItem
              key={node.id}
              node={node}
              index={i}
              total={arr.length}
              depth={0}
              expandAll={expandAll}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onMove={async (dir) => {
                const other = arr[i + dir];
                if (!other) return;
                await adminSwapCategorySortOrder(node, other);
                load();
              }}
              onReload={load}
              parentPublished
            />
          ))}

          <div className="cat-admin__pager">
            <span>المعروض: {Math.min(pageSize, visibleIds.length)} / الإجمالي المطابق: {visibleIds.length} (من أصل {counts.total} في قاعدة البيانات)</span>
            {pageSize < visibleIds.length && (
              <button type="button" className="adm-btn-sm" onClick={() => setPageSize((n) => n + 80)}>
                تحميل المزيد
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
