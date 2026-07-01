"use client";

import { useEffect, useRef } from "react";
import { PageHeader } from "@/components/ui-common";

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: (el?: HTMLElement) => void;
      };
    };
  }
}

function TwitterTimeline({ username }: { username: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    const load = () => {
      if (window.twttr?.widgets) {
        window.twttr.widgets.load(containerRef.current ?? undefined);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.charset = "utf-8";
      document.body.appendChild(script);
    };

    // Lazy: defer until component is visible
    if (!("IntersectionObserver" in window)) {
      load();
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          load();
          obs.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="janaza-embed-wrapper">
      <a
        className="twitter-timeline"
        data-lang="ar"
        data-theme="light"
        data-height="700"
        data-chrome="noheader nofooter noborders"
        href={`https://twitter.com/${username}`}
      >
        جارٍ تحميل تغريدات @{username}…
      </a>
    </div>
  );
}

export default function JanazaPage() {
  return (
    <div className="page-shell narrow" dir="rtl">
      <PageHeader
        eyebrow="إعلانات الوفيات"
        title="آخر الجنائز"
        subtitle="آخر إعلانات الوفيات والجنائز في الكويت"
      />

      <div className="janaza-card ui-card">
        <TwitterTimeline username="kuwaitdeaths" />

        <div className="janaza-source-note">
          <span>المحتوى منقول بإذن من صاحب الحساب •</span>
          <a
            href="https://twitter.com/kuwaitdeaths"
            target="_blank"
            rel="noopener noreferrer"
            className="janaza-source-link"
          >
            @kuwaitdeaths على X (تويتر)
          </a>
        </div>
      </div>
    </div>
  );
}
