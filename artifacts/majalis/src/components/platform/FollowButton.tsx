"use client";

import { useEffect, useState } from "react";
import { isFollowing, toggleFollow, type FollowKind } from "@/lib/follows";

type Props = {
  kind: FollowKind;
  id: string;
  label: string;
  href: string;
  compact?: boolean;
};

export function FollowButton({ kind, id, label, href, compact = false }: Props) {
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    setFollowing(isFollowing(kind, id));
    const onUpdate = () => setFollowing(isFollowing(kind, id));
    window.addEventListener("majalis-follows-updated", onUpdate);
    return () => window.removeEventListener("majalis-follows-updated", onUpdate);
  }, [kind, id]);

  const onToggle = () => {
    setFollowing(toggleFollow({ kind, id, label, href }));
  };

  return (
    <button
      type="button"
      className={`follow-btn${following ? " follow-btn--active" : ""}${compact ? " follow-btn--compact" : ""}`}
      onClick={onToggle}
      aria-pressed={following}
    >
      {following ? (compact ? "متابَع" : "إلغاء المتابعة") : compact ? "متابعة" : "متابعة"}
    </button>
  );
}

export default FollowButton;
