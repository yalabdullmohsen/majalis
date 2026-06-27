"use client";

import { useEffect, useState } from "react";
import {
  isFavorite,
  toggleFavorite,
  type FavoriteType,
} from "@/lib/local-favorites";

type Props = {
  type: FavoriteType;
  id: string;
  title: string;
  href: string;
  meta?: string;
  compact?: boolean;
  className?: string;
};

export function LocalFavoriteButton({
  type,
  id,
  title,
  href,
  meta,
  compact = false,
  className = "",
}: Props) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isFavorite(type, id));
    const onUpdate = () => setSaved(isFavorite(type, id));
    window.addEventListener("majalis-favorites-updated", onUpdate);
    return () => window.removeEventListener("majalis-favorites-updated", onUpdate);
  }, [type, id]);

  const onToggle = () => {
    const next = toggleFavorite({ type, id, title, href, meta });
    setSaved(next);
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`favorite-btn${saved ? " favorite-btn--active" : ""}${compact ? " favorite-btn--compact" : ""} ${className}`.trim()}
      aria-pressed={saved}
      aria-label={saved ? "إزالة من المفضلة" : "إضافة للمفضلة"}
    >
      {saved ? (compact ? "محفوظ" : "في المفضلة") : compact ? "حفظ" : "إضافة للمفضلة"}
    </button>
  );
}

export default LocalFavoriteButton;
