"use client";
// =====================================================================
//  app/sheikhs/page.jsx — قائمة المشايخ (من قاعدة البيانات)
// =====================================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSheikhs } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { PageHeader, Loading, Empty } from "@/components/ui";

const OFFICIAL_CHANNELS = [
  {
    id: "salem-al-taweel",
    name: "الشيخ سالم بن سعد الطويل",
    embedPlaylist: "UUBnYJ5z42SIbPLfYZ3zzBWA",
    links: [
      { label: "يوتيوب", url: "https://www.youtube.com/channel/UCBnYJ5z42SIbPLfYZ3zzBWA" },
      { label: "تليجرام", url: "https://t.me/Saltaweel" },
      { label: "تويتر", url: "https://twitter.com/saltaweel" },
    ],
  },
  {
    id: "mutlaq-al-jasser",
    name: "د. مطلق جاسر الجاسر",
    embedPlaylist: null,
    links: [
      { label: "يوتيوب", url: "https://www.youtube.com/@dr-mutlaq" },
      { label: "الموقع الرسمي", url: "https://www.dr-mutlaq.com/" },
      { label: "السيرة الذاتية", url: "https://www.dr-mutlaq.com/السيرة-الذاتية/" },
      { label: "تليجرام", url: "https://t.me/mutlaqaljasser" },
    ],
  },
];

export default function SheikhsPage() {
  const [sheikhs, setSheikhs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    getSheikhs().then(({ data, error }) => {
      if (error) setFetchError("تعذّر تحميل المشايخ. تحقق من اتصالك وأعد المحاولة.");
      else setSheikhs(data);
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

      {/* ─── القنوات الرسمية الموثّقة ─── */}
      <section style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: C.emeraldDeep, marginBottom: "0.625rem", borderRight: `3px solid ${C.brass}`, paddingRight: "0.625rem" }}>
          القنوات الرسمية الموثّقة
        </h2>
        <p style={{ fontSize: "0.78rem", color: C.inkSoft, marginBottom: "1rem" }}>
          ⚠️ نعرض هنا روابط المصادر الرسمية فقط — لا نستضيف أي محتوى للمشايخ على موقعنا.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {OFFICIAL_CHANNELS.map((ch) => (
            <div
              key={ch.id}
              style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.75rem", overflow: "hidden" }}
            >
              {ch.embedPlaylist && (
                <div style={{ aspectRatio: "16/9", background: "#000" }}>
                  <iframe
                    src={`https://www.youtube.com/embed/videoseries?list=${ch.embedPlaylist}`}
                    title={`قناة ${ch.name} على يوتيوب`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ width: "100%", height: "100%", border: "none" }}
                    loading="lazy"
                  />
                </div>
              )}
              <div style={{ padding: "0.875rem" }}>
                <p style={{ fontWeight: 700, fontSize: "0.9rem", color: C.emeraldDeep, marginBottom: "0.625rem" }}>
                  {ch.name}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {ch.links.map((lnk) => (
                    <a
                      key={lnk.url}
                      href={lnk.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        padding: "0.25rem 0.625rem",
                        background: C.sage,
                        color: C.emeraldDeep,
                        borderRadius: "0.3rem",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      {lnk.label} ↗
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── المشايخ المسجّلون في المنصة ─── */}
      {loading ? (
        <Loading />
      ) : fetchError ? (
        <Empty text={fetchError} />
      ) : sheikhs.length === 0 ? null : (
        <>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: C.emeraldDeep, marginBottom: "0.875rem", borderRight: `3px solid ${C.brass}`, paddingRight: "0.625rem" }}>
            مشايخ المنصة
          </h2>
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
        </>
      )}
    </div>
  );
}
