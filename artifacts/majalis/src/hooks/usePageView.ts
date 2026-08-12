import { useEffect } from "react";
import { trackContentView } from "@/lib/content-analytics";

export function usePageView(contentType: string, contentId: string | undefined | null) {
  useEffect(() => {
    if (!contentId) return;
    void trackContentView(contentType, contentId);
  }, [contentType, contentId]);
}
