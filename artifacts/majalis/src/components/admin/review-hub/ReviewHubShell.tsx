/**
 * Review Hub shell — minimalist layout around the moderation workspace.
 */
import { useMemo, useState } from "react";
import { getReviewHubStore } from "@/lib/admin-review-hub";
import { useReviewHub } from "@/hooks/useReviewHub";
import {
  ReviewHubMobileToggle,
  ReviewHubSidebar,
  type ReviewHubNavKey,
} from "./ReviewHubSidebar";
import { ReviewHubWorkspace } from "./ReviewHubWorkspace";
import "@/styles/pages/admin-review-hub.css";

export function ReviewHubShell() {
  const store = useMemo(() => getReviewHubStore(), []);
  const { darkMode, sidebarCollapsed } = useReviewHub(store);
  const [active, setActive] = useState<ReviewHubNavKey>("review");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="rh-shell"
      dir="rtl"
      data-theme={darkMode ? "dark" : "light"}
    >
      <ReviewHubSidebar
        collapsed={sidebarCollapsed}
        darkMode={darkMode}
        active={active}
        onToggleCollapse={() => store.toggleSidebar()}
        onToggleDark={() => store.setDarkMode(!darkMode)}
        onNavigate={setActive}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="rh-shell__main">
        <div className="rh-shell__top">
          <ReviewHubMobileToggle onOpen={() => setMobileOpen(true)} />
          <p className="rh-shell__crumb">الإدارة / خانة المراجعة</p>
        </div>
        {active === "review" || active === "overview" ? (
          <ReviewHubWorkspace />
        ) : (
          <div className="rh-workspace rh-workspace--hint">
            <p>
              هذا القسم يفتح من القائمة الجانبية في لوحة الإدارة الكلاسيكية.
              استخدم الروابط للانتقال إلى المحتوى أو المستخدمين أو الإعدادات.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewHubShell;
