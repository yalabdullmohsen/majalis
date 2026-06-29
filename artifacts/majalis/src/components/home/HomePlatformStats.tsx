"use client";

import { useEffect, useState } from "react";
import { KUWAIT_SCHOLAR_REGISTRY } from "@/lib/kuwait-sheikhs-registry";
import { LESSONS_SEED } from "@/lib/lessons-seed";
import { supabase } from "@/lib/supabase";

type Stats = {
  lessonsCount: number;
  sheikhsCount: number;
  libraryCount: number;
  qaCount: number;
};

const FALLBACK: Stats = {
  lessonsCount: LESSONS_SEED.length,
  sheikhsCount: KUWAIT_SCHOLAR_REGISTRY.length,
  libraryCount: 120,
  qaCount: 500,
};

export function HomePlatformStats() {
  const [stats, setStats] = useState<Stats>(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [lessons, sheikhs, library, qa] = await Promise.all([
          supabase.from("lessons").select("*", { count: "exact", head: true }).eq("status", "approved"),
          supabase.from("sheikhs").select("*", { count: "exact", head: true }),
          supabase.from("library_items").select("*", { count: "exact", head: true }).eq("status", "approved"),
          supabase.from("qa_questions").select("*", { count: "exact", head: true }).eq("status", "published"),
        ]);
        if (cancelled) return;
        setStats({
          lessonsCount: Math.max(lessons.count ?? 0, FALLBACK.lessonsCount),
          sheikhsCount: Math.max(sheikhs.count ?? 0, FALLBACK.sheikhsCount),
          libraryCount: library.count ?? FALLBACK.libraryCount,
          qaCount: qa.count ?? FALLBACK.qaCount,
        });
      } catch {
        /* keep fallback */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = [
    { label: "درس ودورة", value: stats.lessonsCount },
    { label: "شيخ وعالم", value: stats.sheikhsCount },
    { label: "مادة علمية", value: stats.libraryCount },
    { label: "سؤال شرعي", value: stats.qaCount },
  ];

  return (
    <section className="home-stats--v2026" aria-label="إحصائيات المنصة" aria-busy={!loaded}>
      {items.map((item) => (
        <article key={item.label} className="home-stats--v2026__item">
          <strong className="home-stats--v2026__value">{item.value.toLocaleString("ar-EG")}</strong>
          <span className="home-stats--v2026__label">{item.label}</span>
        </article>
      ))}
    </section>
  );
}

export default HomePlatformStats;
