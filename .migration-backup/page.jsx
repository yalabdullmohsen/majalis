"use client";
// =====================================================================
//  app/sheikhs/page.jsx — قائمة المشايخ (من قاعدة البيانات)
// =====================================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSheikhs } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { PageHeader, Loading, Empty } from "@/components/ui";

export default function SheikhsPage() {
  const [sheikhs, setSheikhs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSheikhs().then(({ data }) => {
      setSheikhs(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-5 pb-16 pt-10">
      <PageHeader
        eyebrow="نخبة معتمدة"
        title="المشايخ والدعاة"
        subtitle="تعرّف على المشايخ والدعاة المعتمدين، وإجازاتهم وتخصصاتهم ودروسهم."
      />

      {loading ? (
        <Loading />
      ) : sheikhs.length === 0 ? (
        <Empty text="لا يوجد مشايخ بعد." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sheikhs.map((s) => (
            <Link key={s.id} href={`/sheikhs/${s.id}`}>
              <div className="rounded-md border p-4" style={{ borderColor: C.line, background: C.panel, height: "100%" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-base font-bold" style={{ color: C.emeraldDeep }}>{s.name}</p>
                  {s.is_verified && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: C.sage, color: C.emeraldDeep }}>معتمد</span>
                  )}
                </div>
                {s.ijazah && <p className="text-xs mb-1" style={{ color: C.brassDeep }}>{s.ijazah}</p>}
                <p className="text-xs" style={{ color: C.inkSoft }}>
                  {[s.city, s.years_experience ? `${s.years_experience} سنة خبرة` : null].filter(Boolean).join(" · ")}
                </p>
                {s.specialties?.length > 0 && (
                  <p className="text-sm mt-2" style={{ color: C.ink }}>{s.specialties.join("، ")}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
