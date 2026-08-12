"use client";
// =====================================================================
//  app/lessons/page.jsx — الدروس مع الفلترة والتسجيل (من القاعدة)
// =====================================================================

import { useEffect, useState } from "react";
import {
  getLessons, registerForLesson, unregisterFromLesson, getMyRegistrations,
} from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { C, GOVERNORATES } from "@/lib/theme";
import { PageHeader, Loading, Empty, Chip } from "@/components/ui";

export default function LessonsPage() {
  const { user, isLoggedIn } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("كل المحافظات");
  const [search, setSearch] = useState("");
  const [registered, setRegistered] = useState([]);

  const load = () => {
    setLoading(true);
    getLessons({ city, search }).then(({ data }) => {
      setLessons(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [city]);

  useEffect(() => {
    if (user) getMyRegistrations(user.id).then(setRegistered);
  }, [user]);

  const toggleReg = async (lessonId) => {
    if (!isLoggedIn) {
      alert("سجّل الدخول أولًا للتسجيل في الدرس.");
      return;
    }
    if (registered.includes(lessonId)) {
      await unregisterFromLesson(user.id, lessonId);
      setRegistered((r) => r.filter((x) => x !== lessonId));
    } else {
      await registerForLesson(user.id, lessonId);
      setRegistered((r) => [...r, lessonId]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-5 pb-16 pt-10">
      <PageHeader
        eyebrow="تعلّم منظّم"
        title="الدروس والدورات"
        subtitle="تصفّح الدروس حسب المحافظة، وسجّل فيما يناسبك ليُحفظ في حسابك."
      />

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="ابحث عن درس أو مسجد..."
          className="w-full text-sm rounded-md border px-3 py-2 outline-none"
          style={{ borderColor: C.line, background: C.panel, color: C.ink }}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
        {["كل المحافظات", ...GOVERNORATES].map((g) => (
          <Chip key={g} active={city === g} onClick={() => setCity(g)}>{g}</Chip>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : lessons.length === 0 ? (
        <Empty text="لا توجد دروس مطابقة." />
      ) : (
        <div className="space-y-3">
          {lessons.map((l) => {
            const isReg = registered.includes(l.id);
            return (
              <div key={l.id} className="rounded-md border p-4" style={{ borderColor: C.line, background: C.panel }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold" style={{ color: C.emeraldDeep }}>{l.title}</p>
                    <p className="text-xs mt-1" style={{ color: C.inkSoft }}>
                      {[l.sheikhs?.name, l.mosque, l.city, l.schedule].filter(Boolean).join(" · ")}
                    </p>
                    {l.category && (
                      <span className="text-xs inline-block mt-2 px-2 py-0.5 rounded" style={{ background: C.parchmentDeep, color: C.brassDeep }}>
                        {l.category}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleReg(l.id)}
                    className="text-xs font-bold px-3 py-1.5 rounded-md shrink-0"
                    style={isReg ? { background: C.sage, color: C.emeraldDeep } : { background: C.emerald, color: C.parchment }}
                  >
                    {isReg ? "مسجّل ✓" : "سجّل"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
