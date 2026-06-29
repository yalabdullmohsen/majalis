import { useEffect, useMemo, useState } from "react";
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
import type { ScholarProfile } from "@/lib/scholar-biography";
import { mergeScholarProfiles } from "@/lib/scholar-biography";
import { Loading } from "@/components/ui-common";

function findSimilarSheikhs(profile: ScholarProfile, all: ScholarProfile[], limit = 4): ScholarProfile[] {
  const specs = new Set(profile.specialties || []);
  if (!specs.size) return [];
  return all
    .filter((s) => s.id !== profile.id)
    .map((s) => ({
      s,
      score: (s.specialties || []).filter((t) => specs.has(t)).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.s);
}

export default function SheikhDetailPage() {
  const [, params] = useRoute("/sheikhs/:id");
  const id = params?.id || "";
  const [sheikh, setSheikh] = useState<ScholarProfile | null>(null);
  const [lessons, setLessons] = useState<KuwaitLessonRecord[]>([]);
  const [similar, setSimilar] = useState<ScholarProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const registryProfile = resolveScholarProfile(id);
      let dbRow: Partial<ScholarProfile> | null = null;

      try {
        const { data } = await supabase.from("sheikhs").select("*").eq("id", id).maybeSingle();
        if (data) dbRow = data as Partial<ScholarProfile>;
        if (!dbRow && registryProfile) {
          const { data: byName } = await supabase
            .from("sheikhs")
            .select("*")
            .ilike("name", registryProfile.name)
            .maybeSingle();
          if (byName) dbRow = byName as Partial<ScholarProfile>;
        }
      } catch {
        /* registry-only profile */
      }

      const merged = mergeScholarProfiles(dbRow, registryProfile || KUWAIT_SCHOLAR_REGISTRY.find((s) => s.id === id) || null);

      const { lessons: allLessons } = await fetchLessons({ bypassCache: true });
      const scholarLessons = merged
        ? lessonsForScholar(merged as Parameters<typeof lessonsForScholar>[0], allLessons)
        : allLessons.filter((l) => l.sheikhName && resolveScholarProfile(l.sheikhName)?.id === id);

      let allProfiles: ScholarProfile[] = KUWAIT_SCHOLAR_REGISTRY as ScholarProfile[];
      try {
        const { data: dbSheikhs } = await supabase.from("sheikhs").select("*");
        allProfiles = (dbSheikhs || []).map((row) =>
          mergeScholarProfiles(row as ScholarProfile, resolveScholarProfile(row.name) || null),
        ).filter(Boolean) as ScholarProfile[];
      } catch {
        /* registry only */
      }

      if (!cancelled) {
        setSheikh(merged);
        setLessons(scholarLessons);
        setSimilar(merged ? findSimilarSheikhs(merged, allProfiles) : []);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <Loading />;
  return <SheikhDetailClient sheikh={sheikh} lessons={lessons} similarSheikhs={similar} />;
}
