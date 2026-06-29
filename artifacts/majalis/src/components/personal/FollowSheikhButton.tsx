import { useCallback, useEffect, useState } from "react";
import { followSheikh, isFollowingSheikh, unfollowSheikh } from "@/lib/personal-learning/sheikh-follow";
import { supabase } from "@/lib/supabase";

type Props = {
  sheikhId: string;
  sheikhName?: string;
  compact?: boolean;
};

export function FollowSheikhButton({ sheikhId, sheikhName, compact }: Props) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoggedIn(Boolean(user));
      if (user) {
        isFollowingSheikh(sheikhId).then(setFollowing).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, [sheikhId]);

  const toggle = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setLoading(true);
    const ok = following
      ? await unfollowSheikh(sheikhId)
      : await followSheikh(sheikhId, sheikhName);
    if (ok) setFollowing(!following);
    setLoading(false);
  }, [following, sheikhId, sheikhName]);

  if (!loggedIn) return null;

  return (
    <button
      type="button"
      className={`ds-btn ${following ? "ds-btn--ghost" : "ds-btn--primary"}${compact ? " ds-btn--sm" : ""}`}
      onClick={() => void toggle()}
      disabled={loading}
      aria-pressed={following}
    >
      {loading ? "…" : following ? "✓ متابع" : "+ متابعة"}
    </button>
  );
}

export default FollowSheikhButton;
