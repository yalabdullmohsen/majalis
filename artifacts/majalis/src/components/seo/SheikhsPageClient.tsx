"use client";

import { Link } from "wouter";
import { PageHeader, Empty } from "@/components/ui-common";

const OFFICIAL_CHANNELS: {
  id: string;
  name: string;
  embedPlaylist: string | null;
  links: { label: string; url: string }[];
}[] = [
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

export default function SheikhsPageClient({
  sheikhs,
}: {
  sheikhs: any[];
}) {
  return (
    <div className="page-shell ds-page">
      <PageHeader
        eyebrow="نخبة معتمدة"
        title="المشايخ والدعاة"
        subtitle="تعرّف على المشايخ والدعاة المعتمدين، وإجازاتهم وتخصصاتهم ودروسهم."
      />

      {/* ─── القنوات الرسمية الموثّقة ─── */}
      <section style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0D1B2A", marginBottom: "1rem", borderRight: "3px solid #C9A84C", paddingRight: "0.75rem" }}>
          القنوات الرسمية الموثّقة
        </h2>
        <p style={{ fontSize: "0.82rem", color: "#6b7280", marginBottom: "1.25rem" }}>
          ⚠️ نعرض هنا روابط المصادر الرسمية فقط — لا نستضيف أي محتوى للمشايخ على موقعنا.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {OFFICIAL_CHANNELS.map((ch) => (
            <div
              key={ch.id}
              style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}
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
              <div style={{ padding: "1rem" }}>
                <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0D1B2A", marginBottom: "0.75rem" }}>
                  {ch.name}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {ch.links.map((lnk) => (
                    <a
                      key={lnk.url}
                      href={lnk.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        padding: "0.3rem 0.75rem",
                        background: "#f3f4f6",
                        color: "#374151",
                        borderRadius: "0.375rem",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        textDecoration: "none",
                        border: "1px solid #e5e7eb",
                        transition: "background 0.15s",
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
      {sheikhs.length === 0 ? (
        <Empty text="لا يوجد مشايخ بعد." />
      ) : (
        <>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0D1B2A", marginBottom: "1rem", borderRight: "3px solid #C9A84C", paddingRight: "0.75rem" }}>
            مشايخ المنصة
          </h2>
          <p className="seo-listing-intro">
            {sheikhs.length.toLocaleString("ar-EG")} شيخ وعالم معتمد — اختر اسماً لعرض السيرة والدروس المرتبطة.
          </p>
          <div className="page-card-grid">
            {sheikhs.map((sheikh) => (
              <Link key={sheikh.id} href={`/sheikhs/${sheikh.id}`} className="page-card">
                <div className="page-card-header">
                  <p>{sheikh.name}</p>
                  {sheikh.is_verified && <span className="page-tag">معتمد</span>}
                </div>
                {sheikh.ijazah && <p className="page-meta">{sheikh.ijazah}</p>}
                {sheikh.specialties?.length > 0 && (
                  <p className="page-desc">{sheikh.specialties.join("، ")}</p>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
