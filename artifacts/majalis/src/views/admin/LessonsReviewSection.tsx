/**
 * Admin — Lesson Quality Review
 * Two tabs: incomplete lessons + duplicate candidates.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useAdminShell } from "./AdminShell";
import { C } from "@/lib/theme";

const BASE = "/api/admin/lesson-quality";

async function call(body: Record<string, unknown>) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  return res.json();
}

type LessonRow = {
  id: string;
  title: string;
  speaker_name: string | null;
  mosque: string | null;
  day_of_week: string | null;
  lesson_time: string | null;
  category: string | null;
  city: string | null;
  region: string | null;
  status: string;
  completeness_score: number | null;
  missing_fields: string[] | null;
  source_id: string | null;
  created_at: string;
  external_key: string | null;
};

type Tab = "incomplete" | "duplicates";

// ─── Inline edit modal ─────────────────────────────────────────────────────

function EditModal({
  lesson,
  onClose,
  onSaved,
}: {
  lesson: LessonRow;
  onClose: () => void;
  onSaved: (updated: LessonRow) => void;
}) {
  const { showSuccess, showError } = useAdminShell();
  const [form, setForm] = useState({
    title: lesson.title || "",
    speaker_name: lesson.speaker_name || "",
    mosque: lesson.mosque || "",
    day_of_week: lesson.day_of_week || "",
    lesson_time: lesson.lesson_time || "",
    category: lesson.category || "",
    city: lesson.city || "",
  });
  const [saving, setSaving] = useState(false);

  const field = (key: keyof typeof form, label: string) => (
    <div style={{ marginBottom: "0.75rem" }}>
      <label style={{ display: "block", fontSize: "0.75rem", color: C.inkSoft, marginBottom: "0.25rem" }}>{label}</label>
      <input
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        style={{ width: "100%", padding: "0.4rem 0.6rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", fontSize: "0.875rem", background: "var(--input-bg, #fff)", color: "var(--ink, #1a1a1a)", fontFamily: "inherit" }}
        dir="rtl"
      />
    </div>
  );

  async function save() {
    setSaving(true);
    try {
      const res = await call({ action: "update-lesson", id: lesson.id, ...form });
      if (!res.ok) throw new Error(res.error || "فشل الحفظ");
      showSuccess("تم الحفظ");
      onSaved(res.lesson);
      onClose();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--surface, #fff)", borderRadius: "0.75rem", padding: "1.5rem", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, color: C.ink }}>تعديل الدرس</h3>
        {field("title", "العنوان")}
        {field("speaker_name", "اسم الشيخ")}
        {field("mosque", "المسجد")}
        {field("day_of_week", "اليوم")}
        {field("lesson_time", "الوقت")}
        {field("category", "التصنيف")}
        {field("city", "المدينة")}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
          <button type="button" onClick={onClose} style={btnStyle("secondary")}>إلغاء</button>
          <button type="button" onClick={save} disabled={saving} style={btnStyle("primary")}>{saving ? "…" : "حفظ"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Incomplete lessons tab ────────────────────────────────────────────────

function IncompleteTab() {
  const { showSuccess, showError } = useAdminShell();
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<LessonRow | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await call({ action: "list-incomplete", page: p });
      if (!res.ok) throw new Error(res.error);
      setLessons(res.lessons);
      setTotal(res.total);
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { load(page); }, [page, load]);

  async function reject(id: string) {
    if (!confirm("أرشفة هذا الدرس كبيانات ناقصة؟")) return;
    const res = await call({ action: "reject-lesson", id, reason: "incomplete_data" });
    if (res.ok) { showSuccess("تم أرشفة الدرس"); load(page); }
    else showError(res.error || "فشل");
  }

  async function backfill() {
    setLoading(true);
    const res = await call({ action: "backfill-quality" });
    if (res.ok) { showSuccess(`تم تحديث ${res.updated ?? 0} درس`); load(page); }
    else showError(res.error || "فشل");
    setLoading(false);
  }

  const totalPages = Math.ceil(total / 25);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <p style={{ fontSize: "0.875rem", color: C.inkSoft }}>{total} درس بيانات ناقصة</p>
        <button type="button" onClick={backfill} disabled={loading} style={btnStyle("secondary")}>
          إعادة حساب الجودة
        </button>
      </div>

      {loading ? (
        <p style={{ color: C.inkSoft, fontSize: "0.875rem" }}>جارٍ التحميل…</p>
      ) : lessons.length === 0 ? (
        <p style={{ color: C.emeraldDeep, fontSize: "0.875rem" }}>لا توجد دروس ناقصة</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep }}>
                {["العنوان", "الشيخ", "المسجد", "اليوم", "الوقت", "التصنيف", "المدينة", "النقاط", "الحقول الناقصة", "إجراء"].map((h) => (
                  <th key={h} style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 600, color: C.ink, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lessons.map((l) => (
                <tr key={l.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={tdStyle}>{l.title?.slice(0, 35) || "—"}</td>
                  <td style={{ ...tdStyle, color: l.speaker_name ? C.ink : C.brass }}>{l.speaker_name || "✗"}</td>
                  <td style={{ ...tdStyle, color: l.mosque ? C.ink : C.brass }}>{l.mosque || "✗"}</td>
                  <td style={{ ...tdStyle, color: l.day_of_week ? C.ink : C.brass }}>{l.day_of_week || "✗"}</td>
                  <td style={{ ...tdStyle, color: l.lesson_time ? C.ink : C.brass }}>{l.lesson_time || "✗"}</td>
                  <td style={{ ...tdStyle, color: l.category ? C.ink : C.brass }}>{l.category || "✗"}</td>
                  <td style={{ ...tdStyle, color: l.city ? C.ink : C.brass }}>{l.city || "✗"}</td>
                  <td style={tdStyle}>
                    <ScoreBadge score={l.completeness_score} />
                  </td>
                  <td style={tdStyle}>
                    {(l.missing_fields || []).join("، ") || "—"}
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    <button type="button" onClick={() => setEditing(l)} style={{ ...btnStyle("primary"), padding: "0.25rem 0.5rem", fontSize: "0.75rem", marginInlineEnd: "0.5rem" }}>تعديل</button>
                    <button type="button" onClick={() => reject(l.id)} style={{ ...btnStyle("danger"), padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>أرشفة</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", justifyContent: "center" }}>
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} style={btnStyle("secondary")}>السابق</button>
          <span style={{ fontSize: "0.875rem", alignSelf: "center", color: C.inkSoft }}>{page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={btnStyle("secondary")}>التالي</button>
        </div>
      )}

      {editing && (
        <EditModal
          lesson={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Duplicates tab ────────────────────────────────────────────────────────

type DupGroup = LessonRow[];

function DuplicatesTab() {
  const { showSuccess, showError } = useAdminShell();
  const [groups, setGroups] = useState<DupGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [merging, setMerging] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await call({ action: "list-duplicates" });
      if (!res.ok) throw new Error(res.error);
      setGroups(res.groups || []);
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  function toggleGroup(i: number) {
    setExpanded((s) => {
      const next = new Set(s);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  async function mergeGroup(idx: number, group: DupGroup) {
    // Keep the most complete lesson, delete the rest
    const sorted = [...group].sort((a, b) => (b.completeness_score ?? 0) - (a.completeness_score ?? 0));
    const keepId = sorted[0].id;
    const deleteIds = sorted.slice(1).map((l) => l.id);
    if (!confirm(`الاحتفاظ بـ "${sorted[0].title}" وحذف ${deleteIds.length} نسخة أخرى؟`)) return;

    setMerging((s) => new Set(s).add(idx));
    try {
      const res = await call({ action: "merge-duplicates", keepId, deleteIds });
      if (!res.ok) throw new Error(res.error);
      showSuccess(`تم دمج المجموعة (حُذفت ${res.merged} نسخة)`);
      setGroups((prev) => prev.filter((_, i) => i !== idx));
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : String(e));
    } finally {
      setMerging((s) => { const next = new Set(s); next.delete(idx); return next; });
    }
  }

  async function mergeAll() {
    if (!confirm(`دمج كل المجموعات (${groups.length}) تلقائياً؟ سيتم الاحتفاظ بالنسخة الأكثر اكتمالاً.`)) return;
    for (let i = 0; i < groups.length; i++) {
      await mergeGroup(i, groups[i]);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <p style={{ fontSize: "0.875rem", color: C.inkSoft }}>{groups.length} مجموعة تكرار محتملة</p>
        {groups.length > 0 && (
          <button type="button" onClick={mergeAll} style={btnStyle("primary")}>دمج الكل تلقائياً</button>
        )}
      </div>

      {loading ? (
        <p style={{ color: C.inkSoft, fontSize: "0.875rem" }}>جارٍ التحميل…</p>
      ) : groups.length === 0 ? (
        <p style={{ color: C.emeraldDeep, fontSize: "0.875rem" }}>لا توجد تكرارات</p>
      ) : (
        groups.map((group, idx) => (
          <div key={idx} style={{ border: `1px solid ${C.line}`, borderRadius: "0.5rem", marginBottom: "0.75rem", overflow: "hidden" }}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggleGroup(idx)}
              onKeyDown={(e) => e.key === "Enter" && toggleGroup(idx)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", background: C.parchmentDeep, cursor: "pointer" }}
            >
              <div>
                <strong style={{ fontSize: "0.875rem", color: C.ink }}>{group[0]?.title?.slice(0, 50)}</strong>
                <span style={{ fontSize: "0.75rem", color: C.inkSoft, marginInlineStart: "0.75rem" }}>{group.length} نسخ</span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); mergeGroup(idx, group); }}
                  disabled={merging.has(idx)}
                  style={{ ...btnStyle("primary"), padding: "0.25rem 0.75rem", fontSize: "0.75rem" }}
                >
                  {merging.has(idx) ? "…" : "دمج"}
                </button>
                <span style={{ fontSize: "0.875rem", color: C.inkSoft }}>{expanded.has(idx) ? "▲" : "▼"}</span>
              </div>
            </div>
            {expanded.has(idx) && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                  <thead>
                    <tr style={{ background: "#f9f9f9" }}>
                      {["الشيخ", "المسجد", "اليوم", "الوقت", "النقاط", "المصدر", "created_at"].map((h) => (
                        <th key={h} style={{ padding: "0.4rem 0.75rem", textAlign: "right", fontWeight: 600, color: C.inkSoft, borderBottom: `1px solid ${C.line}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.map((l) => (
                      <tr key={l.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                        <td style={tdStyle}>{l.speaker_name || "—"}</td>
                        <td style={tdStyle}>{l.mosque || "—"}</td>
                        <td style={tdStyle}>{l.day_of_week || "—"}</td>
                        <td style={tdStyle}>{l.lesson_time || "—"}</td>
                        <td style={tdStyle}><ScoreBadge score={l.completeness_score} /></td>
                        <td style={tdStyle}>{l.source_id || l.external_key?.slice(0, 20) || "—"}</td>
                        <td style={tdStyle}>{l.created_at ? new Date(l.created_at).toLocaleDateString("ar") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number | null | undefined }) {
  const s = score ?? 0;
  const pct = Math.round(s * 100);
  const color = pct >= 80 ? C.emeraldDeep : pct >= 50 ? C.brass : "#dc2626";
  return (
    <span style={{ display: "inline-block", padding: "0.1rem 0.4rem", borderRadius: "0.25rem", background: color + "22", color, fontWeight: 600, fontSize: "0.75rem" }}>
      {pct}%
    </span>
  );
}

type BtnVariant = "primary" | "secondary" | "danger";
function btnStyle(variant: BtnVariant): React.CSSProperties {
  if (variant === "primary") return { padding: "0.5rem 1rem", background: C.emerald, color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600 };
  if (variant === "danger")  return { padding: "0.5rem 1rem", background: "#dc2626", color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem" };
  return { padding: "0.5rem 1rem", background: "transparent", color: C.inkSoft, border: `1px solid ${C.line}`, borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem" };
}

const tdStyle: React.CSSProperties = { padding: "0.5rem 0.75rem", color: C.ink };

// ─── Main section ──────────────────────────────────────────────────────────

export function LessonsReviewSection() {
  const [tab, setTab] = useState<Tab>("incomplete");

  const tabs: { key: Tab; label: string }[] = [
    { key: "incomplete", label: "دروس ناقصة" },
    { key: "duplicates", label: "تكرارات محتملة" },
  ];

  return (
    <div>
      <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.25rem", fontWeight: 700, color: C.ink }}>
        مراجعة جودة الدروس
      </h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.5rem", borderBottom: `1px solid ${C.line}` }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{
              padding: "0.5rem 1.25rem",
              background: "none",
              border: "none",
              borderBottom: `3px solid ${tab === t.key ? C.emerald : "transparent"}`,
              color: tab === t.key ? C.emeraldDeep : C.inkSoft,
              fontWeight: tab === t.key ? 700 : 400,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "0.9rem",
              marginBottom: "-1px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "incomplete" && <IncompleteTab />}
      {tab === "duplicates" && <DuplicatesTab />}
    </div>
  );
}
