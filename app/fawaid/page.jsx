"use client";
// =====================================================================
//  app/fawaid/page.jsx — الفوائد + إرسال للمراجعة (من القاعدة)
// =====================================================================

import { useEffect, useState } from "react";
import { getApprovedFawaid, submitFawaid } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { C } from "@/lib/theme";
import { PageHeader, Loading, Empty } from "@/components/ui";

export default function FawaidPage() {
  const { user, isLoggedIn } = useAuth();
  const [fawaid, setFawaid] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    getApprovedFawaid().then(({ data }) => {
      setFawaid(data);
      setLoading(false);
    });
  }, []);

  const submit = async () => {
    if (!isLoggedIn) { alert("سجّل الدخول أولًا لإرسال فائدة."); return; }
    if (!text.trim()) return;
    await submitFawaid(user.id, text.trim(), author.trim() || null);
    setText(""); setAuthor("");
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto px-5 pb-16 pt-10">
      <PageHeader
        eyebrow="تذكير وتدبر"
        title="فوائد دينية"
        subtitle="فوائد موجزة للتذكر، بعضها من فريق المنصة وبعضها من مساهمات الزوار بعد مراجعتها."
      />

      {loading ? (
        <Loading />
      ) : fawaid.length === 0 ? (
        <Empty text="لا توجد فوائد بعد." />
      ) : (
        <div className="space-y-3 mb-10">
          {fawaid.map((f) => (
            <div key={f.id} className="rounded-md border p-4" style={{ borderColor: C.line, background: C.panel }}>
              <p className="text-sm leading-relaxed" style={{ color: C.ink }}>{f.text}</p>
              {f.author_name && <p className="text-xs mt-2" style={{ color: C.inkSoft }}>— {f.author_name}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-md border p-5" style={{ borderColor: C.line, background: C.panel }}>
        <h2 className="text-base font-bold mb-1" style={{ color: C.emeraldDeep }}>شارك فائدة</h2>
        <p className="text-xs mb-3" style={{ color: C.inkSoft }}>سيراجعها فريق المنصة قبل نشرها للعموم.</p>
        <textarea
          value={text} onChange={(e) => setText(e.target.value)} rows={3}
          placeholder="اكتب الفائدة هنا..."
          className="w-full text-sm rounded-md border px-3 py-2 outline-none resize-none mb-3"
          style={{ borderColor: C.line, background: C.parchment, color: C.ink }}
        />
        <input
          value={author} onChange={(e) => setAuthor(e.target.value)}
          placeholder="اسمك (اختياري)"
          className="w-full text-sm rounded-md border px-3 py-2 outline-none mb-3"
          style={{ borderColor: C.line, background: C.parchment, color: C.ink }}
        />
        <button onClick={submit} className="text-sm font-bold px-5 py-2.5 rounded-md" style={{ background: C.emerald, color: C.parchment }}>
          إرسال للمراجعة
        </button>
        {sent && <p className="text-xs mt-2" style={{ color: C.brassDeep }}>تم الإرسال، شكرًا لك. ستظهر بعد الموافقة.</p>}
      </div>
    </div>
  );
}
