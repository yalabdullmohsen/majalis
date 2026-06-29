import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Loading, Empty, PageHeader } from "@/components/ui-common";
import { fetchActiveLessons } from "@/lib/lessons-service";
import { applyPageSeo } from "@/lib/seo";
import { usePageView } from "@/hooks/usePageView";

export default function MosquesPage() {
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<any[]>([]);

  usePageView("mosques", null);

  useEffect(() => {
    applyPageSeo({
      path: "/mosques",
      title: "المساجد | المجلس العلمي",
      description: "مساجد الكويت التي تُقام فيها الدروس الشرعية المعتمدة على المنصة.",
      canonicalPath: "/mosques",
    });
  }, []);

  useEffect(() => {
    fetchActiveLessons()
      .then(({ active }) => setLessons(active))
      .finally(() => setLoading(false));
  }, []);

  const mosques = useMemo(() => {
    const map = new Map<string, { name: string; region?: string; count: number }>();
    for (const lesson of lessons) {
      if (!lesson.mosque) continue;
      const key = `${lesson.mosque}::${lesson.region || ""}`;
      const prev = map.get(key);
      if (prev) prev.count += 1;
      else map.set(key, { name: lesson.mosque, region: lesson.region, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }, [lessons]);

  if (loading) return <Loading />;

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="الدروس"
        title="المساجد"
        subtitle="مساجد الكويت التي تُقام فيها الدروس الشرعية المعتمدة."
      />
      {mosques.length === 0 ? (
        <Empty text="لا توجد مساجد مسجّلة حالياً." />
      ) : (
        <div className="seo-listing-links">
          {mosques.map((mosque) => (
            <Link key={`${mosque.name}-${mosque.region || ""}`} href={`/lessons?mosque=${encodeURIComponent(mosque.name)}`}>
              {mosque.name}
              {mosque.region ? ` — ${mosque.region}` : ""}
              {" "}
              ({mosque.count.toLocaleString("ar")})
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
