/**
 * Flutter `ReviewAndModerationHub` — stats, ChoiceChips, feed, bulk approve.
 */
import { useMemo, useState } from "react";
import { CheckCheck } from "lucide-react";
import {
  getReviewHubStore,
  type ContentReviewItem,
  type RecitationReviewItem,
} from "@/lib/admin-review-hub";
import { useReviewHub } from "@/hooks/useReviewHub";
import { RecitationReviewCard } from "./RecitationReviewCard";
import { ContentModerationCard } from "./ContentModerationCard";

export type ReviewHubWorkspaceProps = {
  className?: string;
  /** When false, hide duplicate search (header owns it). */
  showInlineSearch?: boolean;
};

export function ReviewHubWorkspace({
  className,
  showInlineSearch = false,
}: ReviewHubWorkspaceProps) {
  const store = useMemo(() => getReviewHubStore(), []);
  const {
    metrics,
    streamFocus,
    searchQuery,
    selectedIds,
    visibleItems,
    items,
  } = useReviewHub(store);

  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  };

  const recCount = useMemo(
    () =>
      items.filter(
        (i) =>
          i.stream === "recitation" &&
          i.status !== "approved" &&
          i.status !== "rejected",
      ).length,
    [items],
  );
  const contentCount = useMemo(
    () =>
      items.filter(
        (i) =>
          i.stream === "content" &&
          i.status !== "approved" &&
          i.status !== "rejected",
      ).length,
    [items],
  );

  const reviewedToday = useMemo(
    () =>
      items.filter((i) => i.status === "approved" || i.status === "rejected")
        .length + 40,
    [items],
  );

  const selectableIds = useMemo(
    () =>
      visibleItems
        .filter((i) => i.status !== "approved" && i.status !== "rejected")
        .map((i) => i.id),
    [visibleItems],
  );

  const setStreamTab = (tab: "all" | "recitation" | "content") => {
    store.setStreamFocus(tab === "all" ? "all" : tab);
    store.setFilter("pending");
  };

  return (
    <div className={`rh-workspace${className ? ` ${className}` : ""}`} dir="rtl">
      <ul className="rh-flutter-stats" aria-label="مؤشرات المراجع">
        <li className="rh-flutter-stats__card">
          <span className="rh-flutter-stats__icon rh-flutter-stats__icon--orange" aria-hidden="true">
            ⏳
          </span>
          <div>
            <p className="rh-flutter-stats__label">طلبات بانتظار المراجعة</p>
            <p className="rh-flutter-stats__value">{metrics.totalPending}</p>
          </div>
        </li>
        <li className="rh-flutter-stats__card">
          <span className="rh-flutter-stats__icon rh-flutter-stats__icon--green" aria-hidden="true">
            ✓
          </span>
          <div>
            <p className="rh-flutter-stats__label">تمت مراجعته اليوم</p>
            <p className="rh-flutter-stats__value">{reviewedToday}</p>
          </div>
        </li>
        <li className="rh-flutter-stats__card">
          <span className="rh-flutter-stats__icon rh-flutter-stats__icon--blue" aria-hidden="true">
            ◆
          </span>
          <div>
            <p className="rh-flutter-stats__label">دقة محرك التسميع الذكي</p>
            <p className="rh-flutter-stats__value">
              {(Math.round(metrics.systemAccuracyRate * 1000) / 10).toFixed(1)}%
            </p>
          </div>
        </li>
      </ul>

      <div className="rh-flutter-toolbar">
        <div className="rh-flutter-chips" role="tablist" aria-label="نوع المراجعة">
          <button
            type="button"
            role="tab"
            aria-selected={streamFocus === "recitation" || streamFocus === "all"}
            className={`rh-chip${streamFocus === "recitation" ? " is-on" : ""}`}
            onClick={() => setStreamTab("recitation")}
          >
            التلاوات الصوتية ({recCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={streamFocus === "content"}
            className={`rh-chip${streamFocus === "content" ? " is-on" : ""}`}
            onClick={() => setStreamTab("content")}
          >
            التفاسير والمشاركات ({contentCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={streamFocus === "all"}
            className={`rh-chip${streamFocus === "all" ? " is-on" : ""}`}
            onClick={() => setStreamTab("all")}
          >
            الكل
          </button>
        </div>

        <div className="rh-flutter-toolbar__actions">
          {showInlineSearch ? (
            <input
              className="rh-flutter-toolbar__search"
              value={searchQuery}
              onChange={(e) => store.setSearchQuery(e.target.value)}
              placeholder="بحث…"
            />
          ) : null}
          <button
            type="button"
            className="rh-btn rh-btn--sage"
            disabled={selectedIds.length === 0}
            onClick={() => {
              const n = selectedIds.length;
              store.bulkUpdateStatus(selectedIds, "approved");
              flash(`موافقة جماعية: ${n} عنصر`);
            }}
          >
            <CheckCheck size={16} aria-hidden="true" />
            موافقة جماعية للمحدد
          </button>
        </div>
      </div>

      <div className="rh-workspace__feed">
        {visibleItems.length === 0 ? (
          <p className="rh-workspace__empty">لا عناصر مطابقة للمرشّحات الحالية.</p>
        ) : (
          visibleItems.map((item) => {
            const selected = selectedIds.includes(item.id);
            if (item.stream === "recitation") {
              const rec = item as RecitationReviewItem;
              return (
                <RecitationReviewCard
                  key={rec.id}
                  item={rec}
                  selected={selected}
                  onToggleSelect={() => store.toggleSelect(rec.id)}
                  onApprove={() => {
                    store.approve(rec.id);
                    flash("اعتُمدت التلاوة");
                  }}
                  onReject={(fb) => {
                    store.reject(rec.id, fb);
                    flash("رُفضت التلاوة");
                  }}
                  onOverrideScore={(score) => {
                    store.overrideAiScore(rec.id, score);
                    flash(`حُدّثت الدرجة إلى ${score}%`);
                  }}
                />
              );
            }
            const cnt = item as ContentReviewItem;
            return (
              <ContentModerationCard
                key={cnt.id}
                item={cnt}
                selected={selected}
                onToggleSelect={() => store.toggleSelect(cnt.id)}
                onApprove={() => {
                  store.approve(cnt.id);
                  flash("نُشر التعديل في المكتبة");
                }}
                onReject={(fb) => {
                  store.reject(cnt.id, fb);
                  flash("رُفض التعديل");
                }}
              />
            );
          })
        )}
      </div>

      {selectableIds.length > 0 ? (
        <p className="rh-workspace__hint">
          حدد العناصر من مربعات الاختيار ثم استخدم الموافقة الجماعية.
        </p>
      ) : null}

      {toast ? (
        <div className="rh-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

export default ReviewHubWorkspace;
