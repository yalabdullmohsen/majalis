/**
 * Flutter `AdminMainLayout` — dark sidebar + header + IndexedStack screens.
 * Default screen = Review Hub (خانة المراجعة).
 */
import { useMemo, useState } from "react";
import { getReviewHubStore } from "@/lib/admin-review-hub";
import { useReviewHub } from "@/hooks/useReviewHub";
import { ReviewHubSidebar, type ReviewHubNavKey } from "./ReviewHubSidebar";
import { ReviewHubHeaderBar } from "./ReviewHubHeaderBar";
import { ReviewHubWorkspace } from "./ReviewHubWorkspace";
import "@/styles/pages/admin-review-hub.css";

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <div className="rh-placeholder">
      <p>{title}</p>
    </div>
  );
}

export function ReviewHubShell() {
  const store = useMemo(() => getReviewHubStore(), []);
  const { metrics, searchQuery } = useReviewHub(store);
  /** Flutter `_selectedNavIndex = 1` — Review Hub default. */
  const [active, setActive] = useState<ReviewHubNavKey>("review");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="rh-shell rh-shell--flutter" dir="rtl">
      <ReviewHubSidebar
        active={active}
        pendingCount={metrics.totalPending}
        onNavigate={setActive}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="rh-shell__main">
        <ReviewHubHeaderBar
          searchQuery={searchQuery}
          onSearch={(q) => store.setSearchQuery(q)}
          onOpenMobile={() => setMobileOpen(true)}
        />

        {/* IndexedStack equivalent */}
        <div className="rh-shell__stack">
          {active === "overview" ? (
            <PlaceholderScreen title="شاشة نظرة عامة والتحليلات" />
          ) : null}
          {active === "review" ? <ReviewHubWorkspace /> : null}
          {active === "content" ? (
            <PlaceholderScreen title="إدارة المحتوى والقرآن" />
          ) : null}
          {active === "roles" ? (
            <PlaceholderScreen title="إدارة المستخدمين والشيوخ" />
          ) : null}
          {active === "settings" ? (
            <PlaceholderScreen title="الإعدادات" />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Alias matching Flutter class name. */
export const AdminMainLayout = ReviewHubShell;
export const AdminDashboardApp = ReviewHubShell;

export default ReviewHubShell;
