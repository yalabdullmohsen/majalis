import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { AdminModal, Field } from "@/views/admin/AdminModal";
import { AdminSectionToolbar } from "@/views/admin/AdminSectionToolbar";
import { StatusBadge } from "@/views/admin/AdminUI";
import { useAdminShell } from "@/views/admin/AdminShell";
import {
  adminFetchCategories, adminUpsertCategory, adminDeleteCategory, adminSwapCategorySortOrder,
  adminValidateCategoryForPublish, type AdminCategory,
} from "@/lib/categories-admin-service";
import { buildCategoryTree, type TreeNode } from "@/lib/category-tree";

function slugify(text: string): string {
  return text.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function CategoryNode({
  node, index, total, onMove, onReload,
}: {
  node: TreeNode<AdminCategory>; index: number; total: number; onMove: (dir: -1 | 1) => void; onReload: () => void;
}) {
  const { showSuccess, showError } = useAdminShell();
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<AdminCategory>>(node);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name?.trim()) return showError("اسم التصنيف مطلوب");
    if (form.status === "published" && node.status !== "published") {
      const check = await adminValidateCategoryForPublish(node.id);
      if (!check.ok) return showError(check.errors.join(" — "));
    }
    setSaving(true);
    const { error } = await adminUpsertCategory({ ...form, slug: form.slug?.trim() || slugify(form.name) });
    setSaving(false);
    if (error) return showError(error.message);
    showSuccess("تم الحفظ");
    setOpen(false);
    onReload();
  };

  const del = async () => {
    if (!confirm(`حذف تصنيف «${node.name}» وكل تصنيفاته الفرعية؟ (الدروس المرتبطة تبقى، فقط يُفصَل ربطها)`)) return;
    const { error } = await adminDeleteCategory(node.id);
    if (error) return showError(error.message);
    onReload();
  };

  const addChild = async () => {
    const name = prompt("اسم التصنيف الفرعي الجديد؟");
    if (!name?.trim()) return;
    const { error } = await adminUpsertCategory({ parent_id: node.id, name: name.trim(), slug: slugify(name), sort_order: node.children.length, status: "draft" });
    if (error) return showError(error.message);
    setExpanded(true);
    onReload();
  };

  return (
    <div className="adm-item-card">
      <div className="adm-section-hdr">
        {node.children.length > 0 && (
          <button type="button" className="adm-btn-sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
        <div style={{ flex: 1 }}>
          <strong>{node.name}</strong> <StatusBadge status={node.status} />
          {node.children.length > 0 && <span className="adm-type-badge">{node.children.length} فرعي</span>}
        </div>
        <div className="adm-item-actions">
          <button type="button" className="adm-btn-sm" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp size={13} /></button>
          <button type="button" className="adm-btn-sm" disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDown size={13} /></button>
          <button type="button" className="adm-btn-sm" onClick={addChild}><Plus size={13} /> فرعي</button>
          <button type="button" className="adm-btn-sm" onClick={() => { setForm(node); setOpen(true); }}><Pencil size={13} /> تعديل</button>
          <button type="button" className="adm-btn-del" onClick={del}><Trash2 size={13} /> حذف</button>
        </div>
      </div>

      {expanded && node.children.length > 0 && (
        <div style={{ paddingInlineStart: "1.25rem" }}>
          {node.children.map((child, i, arr) => (
            <CategoryNode
              key={child.id}
              node={child}
              index={i}
              total={arr.length}
              onMove={async (dir) => {
                const other = arr[i + dir];
                if (!other) return;
                await adminSwapCategorySortOrder(child, other);
                onReload();
              }}
              onReload={onReload}
            />
          ))}
        </div>
      )}

      <AdminModal open={open} onClose={() => setOpen(false)} title="بيانات التصنيف" onSave={save} saving={saving}>
        <Field label="الاسم"><input className="adm-input" value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
        <Field label="المعرّف (slug)"><input className="adm-input" dir="ltr" value={form.slug ?? ""} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} /></Field>
        <Field label="الوصف"><textarea className="adm-textarea" rows={2} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
        <Field label="الحالة">
          <select className="adm-select" value={form.status ?? "draft"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AdminCategory["status"] }))}>
            <option value="draft">مسودة</option>
            <option value="published">منشور</option>
            <option value="archived">مؤرشف</option>
          </select>
        </Field>
        <p className="adm-empty-msg">النشر مقفل تلقائيًا إن لم يوجد محتوى فعلي (درس معتمد أو سلسلة منشورة) تحت هذا التصنيف أو أحد فروعه.</p>
      </AdminModal>
    </div>
  );
}

export function CategoriesSection() {
  const { showError } = useAdminShell();
  const [flat, setFlat] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await adminFetchCategories();
    if (error) showError(error.message);
    setFlat(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const tree = buildCategoryTree(flat);
  const filteredTree = search.trim()
    ? tree.filter((n) => n.name.includes(search) || n.children.some((c) => c.name.includes(search)))
    : tree;

  const publishedCount = flat.filter((c) => c.status === "published").length;

  return (
    <div>
      <AdminSectionToolbar
        title="شجرة التصنيفات (تعلّم)"
        count={flat.length}
        badge={<span className="adm-type-badge">{publishedCount} منشور</span>}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث باسم التصنيف…"
        actions={
          <button
            type="button"
            className="adm-btn-add"
            onClick={async () => {
              const name = prompt("اسم الباب الرئيسي الجديد؟");
              if (!name?.trim()) return;
              const { error } = await adminUpsertCategory({ name: name.trim(), slug: slugify(name), sort_order: tree.length, status: "draft", parent_id: null });
              if (error) return showError(error.message);
              load();
            }}
          >
            <Plus size={14} /> إضافة باب رئيسي
          </button>
        }
      />

      {loading ? <p className="adm-empty-msg">جاري التحميل…</p> : (
        <>
          {filteredTree.length === 0 && <p className="adm-empty-msg">لا تصنيفات مطابقة.</p>}
          {filteredTree.map((node, i, arr) => (
            <CategoryNode
              key={node.id}
              node={node}
              index={i}
              total={arr.length}
              onMove={async (dir) => {
                const other = arr[i + dir];
                if (!other) return;
                await adminSwapCategorySortOrder(node, other);
                load();
              }}
              onReload={load}
            />
          ))}
        </>
      )}
    </div>
  );
}
