import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import SheikhDetailClient from "@/components/seo/SheikhDetailClient";
import {
  KUWAIT_SCHOLAR_REGISTRY,
  resolveScholarProfile,
  lessonsForScholar,
} from "@/lib/kuwait-sheikhs-registry";
import { fetchLessons } from "@/lib/lessons-service";
import { supabase } from "@/lib/supabase";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { Loading } from "@/components/ui-common";

export default function SheikhDetailPage() {
  const [, params] = useRoute("/sheikhs/:id");
  const id = params?.id || "";
  const [sheikh, setSheikh] = useState<any>(null);
  const [lessons, setLessons] = useState<KuwaitLessonRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const profile = resolveScholarProfile(id);
      let resolved = profile;

      if (!resolved) {
        try {
          const { data } = await supabase.from("sheikhs").select("*").eq("id", id).maybeSingle();
          if (data) resolved = resolveScholarProfile(data.name) || (data as typeof profile);
        } catch {
          /* registry fallback */
        }
      }

      const { lessons: allLessons } = await fetchLessons({ bypassCache: true });
      const scholarLessons = resolved
        ? lessonsForScholar(resolved, allLessons)
        : allLessons.filter((l) => l.sheikhName && resolveScholarProfile(l.sheikhName)?.id === id);

      if (!cancelled) {
        setSheikh(resolved || KUWAIT_SCHOLAR_REGISTRY.find((s) => s.id === id) || null);
        setLessons(scholarLessons);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <Loading />;
  return <SheikhDetailClient sheikh={sheikh} lessons={lessons} />;
}
