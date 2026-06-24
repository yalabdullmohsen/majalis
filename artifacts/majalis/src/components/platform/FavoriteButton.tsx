import { useEffect, useState } from "react";
import { toggleFavorite, isFavorite, type FavoriteType } from "@/lib/favorites";
import { Link } from "wouter";

type Props = {
  itemType: FavoriteType;
  itemId: string;
  label?: string;
  className?: string;
};

export function FavoriteButton({ itemType, itemId, label = "احفظ", className = "" }: Props) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    isFavorite(itemType, itemId).then(setSaved);
  }, [itemType, itemId]);

  const onClick = async () => {
    setBusy(true);
    try {
      const next = await toggleFavorite(itemType, itemId);
      setSaved(next);
    } catch (e: any) {
      if (e?.message === "LOGIN_REQUIRED") {
        alert("يرجى تسجيل الدخول أولاً");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={onClick} disabled={busy} className={`ui-card-btn ui-card-btn--ghost ${className}`}>
      {saved ? "محفوظ" : label}
    </button>
  );
}

export function FollowSheikhButton({ sheikhId }: { sheikhId: string }) {
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    isFavorite("sheikh", sheikhId).then(setFollowing);
  }, [sheikhId]);

  const onClick = async () => {
    setBusy(true);
    try {
      const next = await toggleFavorite("sheikh", sheikhId);
      setFollowing(next);
    } catch (e: any) {
      if (e?.message === "LOGIN_REQUIRED") {
        alert("يرجى تسجيل الدخول أولاً");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={onClick} disabled={busy} className="ui-card-btn">
      {following ? "متابَع" : "متابعة الشيخ"}
    </button>
  );
}

export function LoginPrompt() {
  return (
    <div className="ui-card login-prompt">
      <p>يرجى تسجيل الدخول للوصول إلى هذه الميزة.</p>
      <Link href="/login" className="ui-card-btn">تسجيل الدخول</Link>
    </div>
  );
}
