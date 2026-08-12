/**
 * مضيف تهيئة التشغيل الأول فقط — بلا شاشة شعار وسيطة.
 * المسار: Launch أصلي (لون صلب) ← التطبيق ← FirstRunSetup عند الحاجة.
 */
import { useEffect, useState, type ComponentType, type ReactNode } from "react";

export function AppFirstRunHost({ children }: { children: ReactNode }) {
  const [FirstRunSetup, setFirstRunSetup] = useState<ComponentType | null>(null);

  useEffect(() => {
    let alive = true;
    void import("@/components/FirstRunSetup").then((m) => {
      if (alive) setFirstRunSetup(() => m.FirstRunSetup);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      {children}
      {FirstRunSetup ? <FirstRunSetup /> : null}
    </>
  );
}

export default AppFirstRunHost;
