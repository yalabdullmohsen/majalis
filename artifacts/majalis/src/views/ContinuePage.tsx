"use client";

import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { getContinueItems } from "@/lib/user-activity";
import { getLastQuranPosition } from "@/lib/quran-content";
import { getSurahMeta } from "@/lib/quran-content";
import { useMemo } from "react";

const KIND_LABELS: Record<string, string> = {
  quran: "قرآن",
  tafsir: "تفسير",
  "surah-story": "قصة سورة",
  lesson: "درس",
  "sin-jeem": "سين وجيم",
  qa: "سؤال",
};

export default function ContinuePage() {
  const items = useMemo(() => {
    const list = getContinueItems();
    const quranPos = getLastQuranPosition();
    if (quranPos?.surah) {
      const meta = getSurahMeta(quranPos.surah);
      const quranItem = {
        kind: "quran" as const,
        id: String(quranPos.surah),
        title: `سورة ${meta.name}`,
        href: `/quran/surah/${quranPos.surah}${quranPos.ayah ? `#ayah-${quranPos.ayah}` : ""}`,
        meta: quranPos.ayah ? `آية ${quranPos.ayah}` : undefined,
        at: quranPos.at || Date.now(),
      };
      if (!list.some((i) => i.kind === "quran")) {
        list.unshift(quranItem);
      }
    }
    return list;
  }, []);

  return (
    <div className="platform-page continue-page">
      <PageHeader
        eyebrow="متابعة سريعة"
        title="واصل من حيث توقفت"
        subtitle="استأنف قراءتك أو مشاهدتك بضغطة واحدة"
      />

      {items.length === 0 ? (
        <div className="platform-empty">
          <p>لم تبدأ أي محتوى بعد.</p>
          <Link href="/discover" className="platform-link-btn">اكتشف محتوى جديد</Link>
        </div>
      ) : (
        <div className="continue-grid">
          {items.map((item) => (
            <Link key={`${item.kind}-${item.id}`} href={item.href} className="continue-card">
              <span className="continue-card__kind">{KIND_LABELS[item.kind] || item.kind}</span>
              <strong>{item.title}</strong>
              {item.meta && <p>{item.meta}</p>}
              <span className="continue-card__cta">متابعة ←</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
