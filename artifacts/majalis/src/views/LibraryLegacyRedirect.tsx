import { useEffect, useState } from "react";
import { Redirect } from "wouter";
import { Loading, Empty } from "@/components/ui-common";
import { getLibraryItemById } from "@/lib/supabase";
import { detailPath } from "@/lib/library/content-types";
import type { ContentType } from "@/lib/library/content-types";

/** Legacy /library/:id — redirect to typed detail route. */
export default function LibraryLegacyRedirect({ params }: { params: { id: string } }) {
  const [target, setTarget] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    getLibraryItemById(params.id).then(({ data }) => {
      if (!data) {
        setMissing(true);
        return;
      }
      const ct = (data.content_type || "book") as ContentType;
      setTarget(detailPath(ct, data.id));
    });
  }, [params.id]);

  if (missing) return <Empty text="المحتوى غير موجود." />;
  if (!target) return <Loading />;
  return <Redirect to={target} />;
}
