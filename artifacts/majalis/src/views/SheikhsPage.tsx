import { useEffect, useState } from "react";
import { Loading } from "@/components/ui-common";
import SheikhsPageClient from "@/components/seo/SheikhsPageClient";
import { getSheikhs } from "@/lib/supabase";
import { applyPageSeo } from "@/lib/seo";
import { usePageView } from "@/hooks/usePageView";

export default function SheikhsPage() {
  const [sheikhs, setSheikhs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  usePageView("sheikhs", null);

  useEffect(() => {
    applyPageSeo({
      path: "/sheikhs",
      title: "المشايخ والدعاة | المجلس العلمي",
      description: "تعرّف على المشايخ والدعاة المعتمدين وإجازاتهم وتخصصاتهم ودروسهم.",
      canonicalPath: "/sheikhs",
    });
  }, []);

  useEffect(() => {
    getSheikhs()
      .then(({ data }) => setSheikhs(data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  return <SheikhsPageClient sheikhs={sheikhs} />;
}
