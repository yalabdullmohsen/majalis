/**
 * Review Hub workspace — stats + filters + dual streams.
 */
import { useMemo, useState } from "react";
import { getReviewHubStore } from "@/lib/admin-review-hub";
import { useReviewHub } from "@/hooks/useReviewHub";
import { ReviewStatCards } from "./ReviewStatCards";
import { ReviewFilterBar } from "./ReviewFilterBar";
import { RecitationReviewCard } from "./RecitationReviewCard";
import { ContentModerationCard } from "./ContentModerationCard";
import type { RecitationReviewItem, ContentReviewItem } from "@/lib/admin-review-hub";

export type ReviewHubWorkspaceProps = {
  className?: string;
};

export function ReviewHubWorkspace({ className }: ReviewHubWorkspaceProps) {
  const store = useMemo(() => getReviewHubStore(), []);
  const {
    metrics,
    filter,
    filterCounts,
    streamFocus,
    searchQuery,
    selectedIds,
    visibleItems,
  } = useReviewHub(store);

  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  };

  const selectableIds = useMemo(
    () =>
      visibleItems
        .filter((i) => i.status !== "approved" && i.status !== "rejected")
        .map((i) => i.id),
    [visibleItems],
  );

  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds.includes(id));

  return (
    <div className={`rh-workspace${className ? ` ${className}` : ""}`} dir="rtl">
      <header className="rh-workspace__header">
        <div>
          <p className="rh-workspace__eyebrow">خانة المراجعة</p>
          <h1 className="rh-workspace__title">مركز المراجعة والتحقق</h1>
          <p className="rh-workspace__lead">
            ثلاث قنوات سلسة: تلاوات الذكاء، محتوى وتفسير، وإجراءات جماعية سريعة.
          </p>
        </div>
        <div className="rh-workspace__header-actions">
          <button
            type="button"
            className="rh-btn rh-btn--ghost"
            onClick={() => {
              if (allSelected) store.clearSelection();
              else store.selectMany(selectableIds);
            }}
          >
            {allSelected ? "إلغاء تحديد الكل" : "تحديد الظاهر"}
          </button>
          <button
            type="button"
            className="rh-btn rh-btn--ghost"
            onClick={() => {
              store.resetToSeed();
              flash("أُعيدت قائمة المراجعة الافتراضية");
            }}
          >
            إعادة الضبط
          </button>
        </div>
      </header>

      <ReviewStatCards metrics={metrics} />

      <ReviewFilterBar
        filter={filter}
        filterCounts={filterCounts}
        streamFocus={streamFocus}
        searchQuery={searchQuery}
        selectedCount={selectedIds.length}
        onFilter={(f) => store.setFilter(f)}
        onStreamFocus={(s) => store.setStreamFocus(s)}
        onSearch={(q) => store.setSearchQuery(q)}
        onBulkApprove={() => {
          store.bulkUpdateStatus(selectedIds, "approved");
          flash(`اعتُمد ${selectedIds.length} عنصرًا`);
        }}
        onBulkReject={() => {
          const reason = window.prompt("سبب الرفض الجماعي (اختياري):") ?? "";
          store.bulkUpdateStatus(selectedIds, "rejected", reason);
          flash("رُفضت العناصر المحددة");
        }}
        onClearSelection={() => store.clearSelection()}
      />

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
                  flash("اعتُمد المحتوى");
                }}
                onReject={(fb) => {
                  store.reject(cnt.id, fb);
                  flash("رُفض المحتوى");
                }}
              />
            );
          })
        )}
      </div>

      {toast ? (
        <div className="rh-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

export default ReviewHubWorkspace;
