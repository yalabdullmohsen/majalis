"use client";
// =====================================================================
//  app/admin/page.jsx — لوحة التحكم (محمية للمشرف فقط)
//  مراجعة الفوائد + إضافة درس
// =====================================================================

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getPendingFawaid, moderateFawaid, supabase } from "@/lib/supabase";
import { C, GOVERNORATES } from "@/lib/theme";
import { Loading } from "@/components/ui";

export default function AdminPage() {
  const { isLoggedIn, isAdmin, loading } = useAuth();

  if (loading) return <Loading />;
  if (!isLoggedIn)
    return <p className="text-center py-10" style={{ color: C.inkSoft }}>سجّل الدخول أولًا.</p>;
  if (!isAdmin)
    return <p className="text-center py-10" style={{ color: C.inkSoft }}>هذه الصفحة للمشرفين فقط.</p>;

  return <AdminContent />;
}

function AdminContent() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState({ title: "", mosque: "", city: "", category: "", schedule: "" });
  const [saved, setSaved] = useState(false);

  const loadPending = () => getPendingFawaid().then((d) => { setPending(d); setLoading(false); });
  useEffect(() => { loadPending(); }, []);

  const decide = async (id, status) => {
    await moderateFawaid(id, status);
    setPending((p) => p.filter((f) => f.id !== id));
  };

  const addLesson = async () => {
    if (!lesson.title.trim()) return;
    await supabase.from("lessons").insert({ ...lesson, status: "approved" });
    setLesson({ title: "", mosque: "", city: "", category: "", schedule: "" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const f = (k) => (e) => setLesson((s) => ({ ...s, [k]: e.target.value }));

  return (
    <div className="max-w-4xl mx-auto px-5 pb-16 pt-10">
      <h1 className="text-2xl font-bold mb-6" style={{ color: C.emeraldDeep, fontFamily: "Amiri, serif" }}>لوحة التحكم</h1>

      {/* إضافة درس */}
      <div className="rounded-md border p-5 mb-8" style={{ borderColor: C.line, background: C.panel }}>
        <h2 className="text-base font-bold mb-3" style={{ color: C.emeraldDeep }}>إضافة درس جديد</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input value={lesson.title} onChange={f("title")} placeholder="عنوان الدرس *"
            className="text-sm rounded-md border px-3 py-2 outline-none" style={{ borderColor: C.line, background: C.parchment }} />
          <input value={lesson.mosque} onChange={f("mosque")} placeholder="المسجد"
            className="text-sm rounded-md border px-3 py-2 outline-none" style={{ borderColor: C.line, background: C.parchment }} />
          <select value={lesson.city} onChange={f("city")}
            className="text-sm rounded-md border px-3 py-2 outline-none" style={{ borderColor: C.line, background: C.parchment }}>
            <option value="">المحافظة</option>
            {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <input value={lesson.category} onChange={f("category")} placeholder="التصنيف (تفسير/فقه...)"
            className="text-sm rounded-md border px-3 py-2 outline-none" style={{ borderColor: C.line, background: C.parchment }} />
          <input value={lesson.schedule} onChange={f("schedule")} placeholder="الموعد (مثال: كل ثلاثاء بعد المغرب)"
            className="text-sm rounded-md border px-3 py-2 outline-none" style={{ borderColor: C.line, background: C.parchment }} />
        </div>
        <button onClick={addLesson} className="text-sm font-bold px-5 py-2.5 rounded-md" style={{ background: C.emerald, color: C.parchment }}>
          نشر الدرس
        </button>
        {saved && <p className="text-xs mt-2" style={{ color: C.brassDeep }}>تم النشر، وأصبح ظاهرًا في صفحة الدروس.</p>}
      </div>

      {/* مراجعة الفوائد */}
      <h2 className="text-base font-bold mb-3" style={{ color: C.emeraldDeep }}>مراجعة الفوائد المرسلة</h2>
      {loading ? (
        <Loading />
      ) : pending.length === 0 ? (
        <p className="text-sm" style={{ color: C.inkSoft }}>لا توجد فوائد بانتظار المراجعة.</p>
      ) : (
        <div className="space-y-3">
          {pending.map((f) => (
            <div key={f.id} className="rounded-md border p-4" style={{ borderColor: C.line, background: C.panel }}>
              <p className="text-sm mb-1" style={{ color: C.ink }}>{f.text}</p>
              <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{f.author_name ? `— ${f.author_name}` : "بدون اسم"}</p>
              <div className="flex gap-2">
                <button onClick={() => decide(f.id, "approved")} className="text-xs font-bold px-3 py-1.5 rounded-md" style={{ background: C.emerald, color: C.parchment }}>قبول</button>
                <button onClick={() => decide(f.id, "rejected")} className="text-xs font-bold px-3 py-1.5 rounded-md border" style={{ borderColor: C.line, color: C.inkSoft }}>رفض</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
