"use client";

import { useCallback, useEffect, useState } from "react";
import { C } from "@/lib/theme";
import { useAdminShell } from "@/views/admin/AdminShell";
import {
  listTelegramChannels,
  addTelegramChannel,
  updateTelegramChannel,
  deleteTelegramChannel,
  listTelegramLessons,
  updateTelegramLesson,
  deleteTelegramLesson,
  listExtractionLogs,
  triggerExtraction,
  type TelegramChannel,
  type TelegramImportedLesson,
  type ExtractionLog,
} from "@/lib/telegram-admin-api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ar-KW", { dateStyle: "short", timeStyle: "short" });
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "0.15rem 0.5rem",
      borderRadius: "0.25rem", fontSize: "0.73rem", fontWeight: 600,
      background: ok ? "#ECFDF5" : "#FEF2F2",
      color: ok ? "#065F46" : "#991B1B",
    }}>{label}</span>
  );
}

const CATEGORIES = ["عام", "عقيدة", "فقه", "حديث", "تفسير", "أخلاق", "سيرة", "دعوة", "تزكية", "قرآن"];

// ── Add/Edit Channel Modal ────────────────────────────────────────────────────

function ChannelModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<TelegramChannel>;
  onSave: (data: { name: string; telegram_username: string; category: string; description: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [username, setUsername] = useState(initial?.telegram_username || "");
  const [category, setCategory] = useState(initial?.category || "عام");
  const [description, setDescription] = useState(initial?.description || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) { setErr("الاسم ومعرّف القناة مطلوبان"); return; }
    setBusy(true); setErr("");
    try {
      await onSave({ name: name.trim(), telegram_username: username.replace(/^@/, "").trim(), category, description: description.trim() });
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
      <div style={{ background: "#fff", borderRadius: "0.75rem", padding: "1.5rem", width: "min(480px, 95vw)", maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>{initial?.id ? "تعديل القناة" : "إضافة قناة Telegram جديدة"}</h3>
        {err && <p style={{ color: "#991B1B", fontSize: "0.85rem", margin: "0 0 0.75rem" }}>{err}</p>}
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            اسم القناة (للعرض)
            <input value={name} onChange={e => setName(e.target.value)} required
              style={{ display: "block", width: "100%", marginTop: "0.25rem", padding: "0.4rem 0.6rem", border: "1px solid #D1D5DB", borderRadius: "0.35rem", fontSize: "0.9rem" }} />
          </label>
          <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            معرّف Telegram (بدون @)
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="DrosQ8" required dir="ltr"
              style={{ display: "block", width: "100%", marginTop: "0.25rem", padding: "0.4rem 0.6rem", border: "1px solid #D1D5DB", borderRadius: "0.35rem", fontSize: "0.9rem" }} />
          </label>
          <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            الفئة
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{ display: "block", width: "100%", marginTop: "0.25rem", padding: "0.4rem 0.6rem", border: "1px solid #D1D5DB", borderRadius: "0.35rem", fontSize: "0.9rem" }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            وصف (اختياري)
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              style={{ display: "block", width: "100%", marginTop: "0.25rem", padding: "0.4rem 0.6rem", border: "1px solid #D1D5DB", borderRadius: "0.35rem", fontSize: "0.9rem", resize: "vertical" }} />
          </label>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} disabled={busy}
              style={{ padding: "0.4rem 1rem", borderRadius: "0.35rem", border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer", fontSize: "0.85rem" }}>إلغاء</button>
            <button type="submit" disabled={busy}
              style={{ padding: "0.4rem 1.1rem", borderRadius: "0.35rem", border: "none", background: C.emerald, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>
              {busy ? "جاري الحفظ…" : "حفظ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Lesson Modal ─────────────────────────────────────────────────────────

function EditLessonModal({
  lesson,
  onSave,
  onClose,
}: {
  lesson: TelegramImportedLesson;
  onSave: (patch: { title: string; speaker_name: string; category: string; description: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [speaker, setSpeaker] = useState(lesson.speaker_name || "");
  const [category, setCategory] = useState(lesson.category || "عام");
  const [description, setDescription] = useState(lesson.description || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await onSave({ title: title.trim(), speaker_name: speaker.trim(), category, description: description.trim() });
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
      <div style={{ background: "#fff", borderRadius: "0.75rem", padding: "1.5rem", width: "min(560px, 95vw)", maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>تعديل الدرس المستخرج</h3>
        {err && <p style={{ color: "#991B1B", fontSize: "0.85rem", margin: "0 0 0.75rem" }}>{err}</p>}
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            العنوان
            <input value={title} onChange={e => setTitle(e.target.value)} required
              style={{ display: "block", width: "100%", marginTop: "0.25rem", padding: "0.4rem 0.6rem", border: "1px solid #D1D5DB", borderRadius: "0.35rem", fontSize: "0.9rem" }} />
          </label>
          <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            الشيخ / المقدّم
            <input value={speaker} onChange={e => setSpeaker(e.target.value)}
              style={{ display: "block", width: "100%", marginTop: "0.25rem", padding: "0.4rem 0.6rem", border: "1px solid #D1D5DB", borderRadius: "0.35rem", fontSize: "0.9rem" }} />
          </label>
          <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            الموضوع
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{ display: "block", width: "100%", marginTop: "0.25rem", padding: "0.4rem 0.6rem", border: "1px solid #D1D5DB", borderRadius: "0.35rem", fontSize: "0.9rem" }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            النص الكامل
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={6}
              style={{ display: "block", width: "100%", marginTop: "0.25rem", padding: "0.4rem 0.6rem", border: "1px solid #D1D5DB", borderRadius: "0.35rem", fontSize: "0.85rem", resize: "vertical" }} />
          </label>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} disabled={busy}
              style={{ padding: "0.4rem 1rem", borderRadius: "0.35rem", border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer", fontSize: "0.85rem" }}>إلغاء</button>
            <button type="submit" disabled={busy}
              style={{ padding: "0.4rem 1.1rem", borderRadius: "0.35rem", border: "none", background: C.emerald, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>
              {busy ? "جاري الحفظ…" : "حفظ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Channels tab ──────────────────────────────────────────────────────────────

function ChannelsTab() {
  const { showSuccess, showError } = useAdminShell();
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | TelegramChannel | null>(null);
  const [extracting, setExtracting] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listTelegramChannels()
      .then(setChannels)
      .catch(() => setChannels([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: { name: string; telegram_username: string; category: string; description: string }) => {
    if (typeof modal === "object" && modal !== null) {
      await updateTelegramChannel(modal.id, data);
      showSuccess("تم تعديل القناة");
    } else {
      await addTelegramChannel(data);
      showSuccess("تمت إضافة القناة");
    }
    load();
  };

  const handleToggle = async (ch: TelegramChannel) => {
    try {
      await updateTelegramChannel(ch.id, { is_active: !ch.is_active });
      showSuccess(ch.is_active ? "تم إيقاف القناة" : "تم تفعيل القناة");
      load();
    } catch { showError("حدث خطأ"); }
  };

  const handleDelete = async (ch: TelegramChannel) => {
    if (!confirm(`حذف قناة "${ch.name}"؟ سيتم حذف كل سجلاتها.`)) return;
    try {
      await deleteTelegramChannel(ch.id);
      showSuccess("تم الحذف");
      load();
    } catch (e: unknown) { showError(e instanceof Error ? e.message : "حدث خطأ"); }
  };

  const handleExtract = async (ch: TelegramChannel) => {
    setExtracting(ch.id);
    try {
      const r = await triggerExtraction(ch.id);
      const res = r.results?.[0];
      showSuccess(`استُخلص ${res?.lessonsCreated ?? 0} درس جديد — تجاوز ${res?.lessonsSkipped ?? 0}`);
      load();
    } catch (e: unknown) { showError(e instanceof Error ? e.message : "فشل الاستخلاص"); }
    finally { setExtracting(null); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>قنوات Telegram</h2>
        <button onClick={() => setModal("add")}
          style={{ padding: "0.4rem 1rem", border: "none", background: C.emerald, color: "#fff", borderRadius: "0.35rem", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>
          + إضافة قناة
        </button>
      </div>

      {loading ? (
        <p style={{ color: C.inkSoft, fontSize: "0.9rem" }}>جاري التحميل…</p>
      ) : channels.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", border: "2px dashed #E5E7EB", borderRadius: "0.5rem" }}>
          <p style={{ color: C.inkSoft, margin: 0 }}>لا توجد قنوات. أضف قناة Telegram الأولى.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 600 }}>القناة</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 600 }}>الفئة</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 600 }}>الحالة</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 600 }}>آخر استخلاص</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 600 }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {channels.map(ch => (
                <tr key={ch.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "0.6rem 0.75rem" }}>
                    <div style={{ fontWeight: 600 }}>{ch.name}</div>
                    <a href={`https://t.me/${ch.telegram_username}`} target="_blank" rel="noreferrer"
                      style={{ color: C.emerald, fontSize: "0.78rem", textDecoration: "none" }}>
                      @{ch.telegram_username}
                    </a>
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem", color: C.inkSoft }}>{ch.category}</td>
                  <td style={{ padding: "0.6rem 0.75rem" }}>
                    <Badge ok={ch.is_active} label={ch.is_active ? "نشطة" : "موقوفة"} />
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem", color: C.inkSoft, fontSize: "0.8rem" }}>
                    {fmt(ch.last_scraped_at)}
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem" }}>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      <button onClick={() => handleExtract(ch)} disabled={extracting === ch.id}
                        style={{ padding: "0.25rem 0.6rem", fontSize: "0.78rem", border: "1px solid #D1D5DB", borderRadius: "0.25rem", background: "#fff", cursor: "pointer" }}>
                        {extracting === ch.id ? "…" : "استخلاص الآن"}
                      </button>
                      <button onClick={() => setModal(ch)}
                        style={{ padding: "0.25rem 0.6rem", fontSize: "0.78rem", border: "1px solid #D1D5DB", borderRadius: "0.25rem", background: "#fff", cursor: "pointer" }}>
                        تعديل
                      </button>
                      <button onClick={() => handleToggle(ch)}
                        style={{ padding: "0.25rem 0.6rem", fontSize: "0.78rem", border: "1px solid #D1D5DB", borderRadius: "0.25rem", background: "#fff", cursor: "pointer" }}>
                        {ch.is_active ? "إيقاف" : "تفعيل"}
                      </button>
                      <button onClick={() => handleDelete(ch)}
                        style={{ padding: "0.25rem 0.6rem", fontSize: "0.78rem", border: "1px solid #FECACA", color: "#991B1B", borderRadius: "0.25rem", background: "#fff", cursor: "pointer" }}>
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ChannelModal
          initial={typeof modal === "object" ? modal : undefined}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ── Lessons tab ───────────────────────────────────────────────────────────────

function LessonsTab() {
  const { showSuccess, showError } = useAdminShell();
  const [lessons, setLessons] = useState<TelegramImportedLesson[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TelegramImportedLesson | null>(null);
  const [preview, setPreview] = useState<TelegramImportedLesson | null>(null);

  const load = useCallback((p = 1) => {
    setLoading(true);
    listTelegramLessons({ page: p })
      .then(r => { setLessons(r.lessons); setTotal(r.total); setPages(r.pages); })
      .catch(() => setLessons([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page); }, [load, page]);

  const handleSave = async (patch: { title: string; speaker_name: string; category: string; description: string }) => {
    if (!editing) return;
    await updateTelegramLesson(editing.id, patch);
    showSuccess("تم التعديل");
    load(page);
  };

  const handleDelete = async (l: TelegramImportedLesson) => {
    if (!confirm("حذف هذا الدرس المستخرج نهائيًا؟")) return;
    try {
      await deleteTelegramLesson(l.id);
      showSuccess("تم الحذف");
      load(page);
    } catch { showError("حدث خطأ"); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
          الدروس المستخرجة من Telegram
          {total > 0 && <span style={{ color: C.inkSoft, fontWeight: 400, fontSize: "0.85rem", marginRight: "0.5rem" }}>({total})</span>}
        </h2>
      </div>

      {loading ? (
        <p style={{ color: C.inkSoft, fontSize: "0.9rem" }}>جاري التحميل…</p>
      ) : lessons.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", border: "2px dashed #E5E7EB", borderRadius: "0.5rem" }}>
          <p style={{ color: C.inkSoft, margin: 0 }}>لا توجد دروس مستخرجة بعد.</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 600 }}>العنوان</th>
                  <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 600 }}>الموضوع</th>
                  <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 600 }}>وقت الاستخلاص</th>
                  <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 600 }}>المصدر</th>
                  <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 600 }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map(l => (
                  <tr key={l.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "0.6rem 0.75rem", maxWidth: "260px" }}>
                      <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                      {l.speaker_name && <div style={{ color: C.inkSoft, fontSize: "0.78rem" }}>{l.speaker_name}</div>}
                    </td>
                    <td style={{ padding: "0.6rem 0.75rem", color: C.inkSoft }}>{l.category || "—"}</td>
                    <td style={{ padding: "0.6rem 0.75rem", color: C.inkSoft, fontSize: "0.8rem" }}>{fmt(l.auto_imported_at)}</td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>
                      {l.telegram_message_url ? (
                        <a href={l.telegram_message_url} target="_blank" rel="noreferrer"
                          style={{ color: C.emerald, fontSize: "0.78rem", textDecoration: "none" }}>
                          رابط الرسالة ↗
                        </a>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>
                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button onClick={() => setPreview(l)}
                          style={{ padding: "0.25rem 0.6rem", fontSize: "0.78rem", border: "1px solid #D1D5DB", borderRadius: "0.25rem", background: "#fff", cursor: "pointer" }}>
                          عرض
                        </button>
                        <button onClick={() => setEditing(l)}
                          style={{ padding: "0.25rem 0.6rem", fontSize: "0.78rem", border: "1px solid #D1D5DB", borderRadius: "0.25rem", background: "#fff", cursor: "pointer" }}>
                          تعديل
                        </button>
                        <button onClick={() => handleDelete(l)}
                          style={{ padding: "0.25rem 0.6rem", fontSize: "0.78rem", border: "1px solid #FECACA", color: "#991B1B", borderRadius: "0.25rem", background: "#fff", cursor: "pointer" }}>
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "1rem" }}>
              {page > 1 && <button onClick={() => setPage(p => p - 1)} style={{ padding: "0.3rem 0.8rem", border: "1px solid #D1D5DB", borderRadius: "0.35rem", background: "#fff", cursor: "pointer", fontSize: "0.85rem" }}>السابق</button>}
              <span style={{ padding: "0.3rem 0.75rem", fontSize: "0.85rem", color: C.inkSoft }}>{page} / {pages}</span>
              {page < pages && <button onClick={() => setPage(p => p + 1)} style={{ padding: "0.3rem 0.8rem", border: "1px solid #D1D5DB", borderRadius: "0.35rem", background: "#fff", cursor: "pointer", fontSize: "0.85rem" }}>التالي</button>}
            </div>
          )}
        </>
      )}

      {editing && (
        <EditLessonModal lesson={editing} onSave={handleSave} onClose={() => setEditing(null)} />
      )}

      {preview && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
          <div style={{ background: "#fff", borderRadius: "0.75rem", padding: "1.5rem", width: "min(600px, 95vw)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", maxWidth: "80%" }}>{preview.title}</h3>
              <button onClick={() => setPreview(null)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: C.inkSoft }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              {preview.category && <Badge ok label={preview.category} />}
              {preview.speaker_name && <span style={{ fontSize: "0.82rem", color: C.inkSoft }}>{preview.speaker_name}</span>}
            </div>
            {preview.telegram_message_url && (
              <div style={{ padding: "0.5rem 0.75rem", background: "#F0FDF4", borderRadius: "0.35rem", marginBottom: "0.75rem", fontSize: "0.82rem" }}>
                📍 مصدر: Telegram —{" "}
                <a href={preview.telegram_message_url} target="_blank" rel="noreferrer" style={{ color: C.emerald }}>
                  الرسالة الأصلية ↗
                </a>
                <span style={{ color: C.inkSoft, marginRight: "0.5rem" }}>⚠️ مستخرج آليًا — لم يُراجع بعد</span>
              </div>
            )}
            <p style={{ fontSize: "0.9rem", lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0 }}>{preview.description}</p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem", justifyContent: "flex-end" }}>
              <button onClick={() => { setEditing(preview); setPreview(null); }}
                style={{ padding: "0.35rem 0.9rem", border: "1px solid #D1D5DB", borderRadius: "0.35rem", background: "#fff", cursor: "pointer", fontSize: "0.85rem" }}>
                تعديل
              </button>
              <button onClick={() => setPreview(null)}
                style={{ padding: "0.35rem 0.9rem", border: "none", background: C.emerald, color: "#fff", borderRadius: "0.35rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Logs tab ──────────────────────────────────────────────────────────────────

function LogsTab() {
  const [logs, setLogs] = useState<ExtractionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listExtractionLogs()
      .then(r => setLogs(r.logs))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (s: string) =>
    s === "success" ? "#065F46" : s === "partial_success" ? "#92400E" : "#991B1B";
  const statusBg = (s: string) =>
    s === "success" ? "#ECFDF5" : s === "partial_success" ? "#FFFBEB" : "#FEF2F2";

  return (
    <div>
      <h2 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700 }}>سجلات الاستخلاص</h2>
      {loading ? (
        <p style={{ color: C.inkSoft, fontSize: "0.9rem" }}>جاري التحميل…</p>
      ) : logs.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", border: "2px dashed #E5E7EB", borderRadius: "0.5rem" }}>
          <p style={{ color: C.inkSoft, margin: 0 }}>لا توجد سجلات بعد.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 600 }}>القناة</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 600 }}>الوقت</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 600 }}>الرسائل</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 600 }}>دروس جديدة</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 600 }}>تجاوز</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 600 }}>الحالة</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 600 }}>ملاحظة</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "0.5rem 0.75rem" }}>
                    {log.telegram_channels
                      ? <><strong>{log.telegram_channels.name}</strong><br /><span style={{ color: C.inkSoft }}>@{log.telegram_channels.telegram_username}</span></>
                      : "—"}
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem", color: C.inkSoft }}>{fmt(log.created_at)}</td>
                  <td style={{ padding: "0.5rem 0.75rem", textAlign: "center" }}>{log.messages_fetched}</td>
                  <td style={{ padding: "0.5rem 0.75rem", textAlign: "center", color: "#065F46", fontWeight: 700 }}>{log.lessons_created}</td>
                  <td style={{ padding: "0.5rem 0.75rem", textAlign: "center", color: C.inkSoft }}>{log.lessons_skipped}</td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>
                    <span style={{ padding: "0.15rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 600, background: statusBg(log.status), color: statusColor(log.status) }}>
                      {log.status === "success" ? "نجح" : log.status === "partial_success" ? "جزئي" : "فشل"}
                    </span>
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem", color: "#991B1B", fontSize: "0.78rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.error_message || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

type Tab = "channels" | "lessons" | "logs";

export function TelegramSection() {
  const [tab, setTab] = useState<Tab>("channels");

  const tabs: { key: Tab; label: string }[] = [
    { key: "channels", label: "القنوات" },
    { key: "lessons",  label: "الدروس المستخرجة" },
    { key: "logs",     label: "السجلات" },
  ];

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1100px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.15rem", fontWeight: 800 }}>تكامل Telegram</h1>
        <p style={{ margin: 0, fontSize: "0.85rem", color: C.inkSoft }}>
          استخلاص الدروس الإسلامية من قنوات Telegram ونشرها مباشرة في المنصة.
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.25rem", borderBottom: "2px solid #E5E7EB", marginBottom: "1.5rem" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "0.5rem 1.1rem",
              border: "none",
              borderBottom: `2px solid ${tab === t.key ? C.emerald : "transparent"}`,
              background: "none",
              cursor: "pointer",
              fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? C.emerald : C.inkSoft,
              fontSize: "0.9rem",
              marginBottom: "-2px",
              transition: "color 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "channels" && <ChannelsTab />}
      {tab === "lessons"  && <LessonsTab />}
      {tab === "logs"     && <LogsTab />}
    </div>
  );
}
