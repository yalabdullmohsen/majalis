"use client";
// =====================================================================
//  app/sheikhs/[id]/page.jsx — صفحة الشيخ الكاملة (سيرة + دروس)
// =====================================================================

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSheikhById } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { Loading, Empty } from "@/components/ui";

export default function SheikhProfilePage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSheikhById(id).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <Loading />;
  if (!data?.sheikh) return <Empty text="لم يُعثر على هذا الشيخ." />;

  const s = data.sheikh;

  return (
    <div className="max-w-3xl mx-auto px-5 pb-16 pt-10">
      <div className="rounded-md border p-5 mb-6" style={{ borderColor: C.line, background: C.panel }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold" style={{ color: C.emeraldDeep, fontFamily: "Amiri, serif" }}>{s.name}</h1>
          {s.is_verified && (
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: C.sage, color: C.emeraldDeep }}>معتمد</span>
          )}
        </div>
        {s.bio && <p className="text-sm leading-relaxed mb-3" style={{ color: C.ink }}>{s.bio}</p>}
        {s.biography && (
          <div className="mb-3">
            <p className="text-sm font-bold mb-1" style={{ color: C.emeraldDeep }}>السيرة العلمية</p>
            <p className="text-sm leading-relaxed" style={{ color: C.ink }}>{s.biography}</p>
          </div>
        )}
        {s.ijazah && <p className="text-xs mb-1" style={{ color: C.brassDeep }}>الإجازة: {s.ijazah}</p>}
        {s.qualifications?.length > 0 && (
          <p className="text-xs mb-1" style={{ color: C.inkSoft }}>المؤهلات: {s.qualifications.join("، ")}</p>
        )}
        {s.specialties?.length > 0 && (
          <p className="text-xs mb-1" style={{ color: C.inkSoft }}>التخصصات: {s.specialties.join("، ")}</p>
        )}
        <p className="text-xs" style={{ color: C.inkSoft }}>
          {[s.city, s.years_experience ? `${s.years_experience} سنة خبرة` : null].filter(Boolean).join(" · ")}
        </p>
      </div>

      <h2 className="text-base font-bold mb-3" style={{ color: C.emeraldDeep }}>الدروس الحالية</h2>
      {data.lessons.length === 0 ? (
        <Empty text="لا توجد دروس منشورة لهذا الشيخ حاليًا." />
      ) : (
        <div className="space-y-2">
          {data.lessons.map((l) => (
            <div key={l.id} className="rounded-md border p-4" style={{ borderColor: C.line, background: C.panel }}>
              <p className="text-sm font-bold" style={{ color: C.emeraldDeep }}>{l.title}</p>
              <p className="text-xs" style={{ color: C.inkSoft }}>
                {[l.mosque, l.city, l.schedule].filter(Boolean).join(" · ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
