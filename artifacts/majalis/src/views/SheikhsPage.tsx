"use client";

import { useEffect, useState } from "react";
import { getSheikhs } from "@/lib/supabase";
import SheikhsPageClient from "@/components/seo/SheikhsPageClient";
import { Loading } from "@/components/ui-common";

export default function SheikhsPage() {
  const [sheikhs, setSheikhs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSheikhs()
      .then((data) => setSheikhs(Array.isArray(data) ? data : []))
      .catch(() => setSheikhs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-shell">
        <Loading />
      </div>
    );
  }

  return <SheikhsPageClient sheikhs={sheikhs} />;
}
