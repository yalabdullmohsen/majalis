/**
 * Flutter `AdminMainLayout` header — search, notifications, reviewer identity.
 */
import { Bell, Menu, Search } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export type ReviewHubHeaderBarProps = {
  searchQuery: string;
  onSearch: (q: string) => void;
  onOpenMobile: () => void;
};

export function ReviewHubHeaderBar({
  searchQuery,
  onSearch,
  onOpenMobile,
}: ReviewHubHeaderBarProps) {
  const { user } = useAuth();
  const fullName = user?.profile?.full_name?.trim() || "د. محمد العالم";
  const initial = fullName.charAt(0) || "م";

  return (
    <header className="rh-header">
      <button
        type="button"
        className="rh-mobile-toggle"
        onClick={onOpenMobile}
        aria-label="فتح القائمة"
      >
        <Menu size={18} />
      </button>

      <div className="rh-header__search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="بحث سريع برقم الآية، اسم القارئ، أو رقم المعاملة…"
          aria-label="بحث سريع"
        />
      </div>

      <div className="rh-header__spacer" />

      <button type="button" className="rh-header__icon" aria-label="الإشعارات">
        <Bell size={20} strokeWidth={1.6} />
      </button>

      <div className="rh-header__user">
        <span className="rh-header__avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="rh-header__name">{fullName}</span>
      </div>
    </header>
  );
}

export default ReviewHubHeaderBar;
