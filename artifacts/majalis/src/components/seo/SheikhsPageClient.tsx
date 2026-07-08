"use client";

import { AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
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
  const { isAdmin } = useAuth();
  return (
    <div className="page-shell ds-page">
      <PageHeader
        eyebrow="نخبة معتمدة"
        title="المشايخ والدعاة"
        subtitle="تعرّف على المشايخ والدعاة المعتمدين، وإجازاتهم وتخصصاتهم ودروسهم."
      />

      {/* ─── القنوات الرسمية الموثّقة ─── */}
      <section className="spc-channels-section">
        <h2 className="spc-section-h2">القنوات الرسمية الموثّقة</h2>
        <p className="spc-section-note">
          <AlertTriangle size={14} className="inline ml-1" />نعرض هنا روابط المصادر الرسمية فقط — لا نستضيف أي محتوى للمشايخ على موقعنا.
        </p>
        <div className="spc-channels-grid">
          {OFFICIAL_CHANNELS.map((ch) => (
            <div key={ch.id} className="spc-channel-card">
              {ch.embedPlaylist && (
                <div className="spc-channel-video">
                  <iframe
                    src={`https://www.youtube.com/embed/videoseries?list=${ch.embedPlaylist}`}
                    title={`قناة ${ch.name} على يوتيوب`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="spc-channel-iframe"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="spc-channel-body">
                <p className="spc-channel-name">{ch.name}</p>
                <div className="spc-channel-links">
                  {ch.links.map((lnk) => (
                    <a key={lnk.url} href={lnk.url} target="_blank" rel="noopener noreferrer" className="spc-channel-link">
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
          <h2 className="spc-section-h2">مشايخ المنصة</h2>
          <p className="seo-listing-intro">
            {isAdmin ? `${sheikhs.length.toLocaleString("ar-EG")} شيخ وعالم معتمد — ` : ""}اختر اسماً لعرض السيرة والدروس المرتبطة.
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
