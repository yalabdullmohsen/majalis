import { useEffect, useState } from "react";
import SheikhsPageClient from "@/components/seo/SheikhsPageClient";
import { KUWAIT_SCHOLAR_REGISTRY, mergeRegistrySheikhs } from "@/lib/kuwait-sheikhs-registry";
import { supabase } from "@/lib/supabase";
import { Loading } from "@/components/ui-common";

export default function SheikhsPage() {
  const [sheikhs, setSheikhs] = useState<any[]>(KUWAIT_SCHOLAR_REGISTRY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.from("sheikhs").select("*").order("name");
        if (!cancelled) {
          setSheikhs(mergeRegistrySheikhs(data || []));
        }
      } catch {
        if (!cancelled) setSheikhs(KUWAIT_SCHOLAR_REGISTRY);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && sheikhs.length === 0) return <Loading />;
  return <SheikhsPageClient sheikhs={sheikhs} />;
}
