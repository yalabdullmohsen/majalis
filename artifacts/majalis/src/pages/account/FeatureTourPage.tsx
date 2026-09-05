import { Suspense, lazy, useEffect } from "react";
import { useLocation } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { goBackOrFallback } from "@/lib/navigation-back";

const AppFeatureTour = lazy(() =>
  import("@/components/onboarding/AppFeatureTour").then((m) => ({ default: m.AppFeatureTour })),
);

/** مسار /feature-tour — إعادة عرض الجولة من الإعدادات أو الرابط المباشر. */
export default function FeatureTourPage() {
  const [location] = useLocation();

  useEffect(() => {
    applyPageSeo({
      path: "/feature-tour",
      title: "جولة المزايا | سُنّة",
      description: "تعرّف على أهم مزايا تطبيق سُنّة.",
      robots: "noindex, follow",
    });
  }, []);

  return (
    <Suspense fallback={null}>
      <AppFeatureTour
        open
        persistOnExit={false}
        onClose={() => {
          goBackOrFallback(location || "/feature-tour", "/");
        }}
      />
    </Suspense>
  );
}
