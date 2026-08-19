import { Suspense, lazy, useEffect } from "react";
import { useLocation } from "wouter";
import { applyPageSeo } from "@/lib/seo";

const AppFeatureTour = lazy(() =>
  import("@/components/onboarding/AppFeatureTour").then((m) => ({ default: m.AppFeatureTour })),
);

/** مسار /feature-tour — إعادة عرض الجولة من الإعدادات أو الرابط المباشر. */
export default function FeatureTourPage() {
  const [, navigate] = useLocation();

  useEffect(() => {
    applyPageSeo({
      path: "/feature-tour",
      title: "جولة المزايا | المجلس العلمي",
      description: "تعرّف على أهم مزايا تطبيق المجلس العلمي.",
      robots: "noindex, follow",
    });
  }, []);

  return (
    <Suspense fallback={null}>
      <AppFeatureTour
        open
        persistOnExit={false}
        onClose={() => {
          if (window.history.length > 1) window.history.back();
          else navigate("/");
        }}
      />
    </Suspense>
  );
}
