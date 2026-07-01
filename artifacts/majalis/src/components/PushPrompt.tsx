import { useEffect, useState } from "react";
import {
  getPushSupport,
  subscribeToPush,
  unsubscribeFromPush,
  type PushPermissionState,
} from "@/lib/push-notifications";

export function PushPrompt() {
  const [state, setState] = useState<PushPermissionState>("unsupported");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setState(getPushSupport());
    navigator.serviceWorker?.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub)),
    ).catch(() => {});
  }, []);

  if (state === "unsupported") return null;

  if (state === "no-vapid") {
    return (
      <div className="push-prompt push-prompt--info">
        الإشعارات تتطلب إعداد مفتاح VAPID في بيئة الإنتاج.
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="push-prompt push-prompt--warn">
        الإشعارات مرفوضة في إعدادات المتصفح. يمكنك تفعيلها يدوياً من إعدادات الموقع.
      </div>
    );
  }

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
      } else {
        const sub = await subscribeToPush();
        setSubscribed(!!sub);
        setState(getPushSupport());
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="push-prompt">
      <div className="push-prompt__text">
        <strong>إشعارات الدروس</strong>
        <span>{subscribed ? "مفعّلة — ستصلك تذكيرات بمواعيد الدروس" : "غير مفعّلة"}</span>
      </div>
      <button
        type="button"
        className={`push-prompt__btn${subscribed ? " push-prompt__btn--off" : ""}`}
        onClick={handleToggle}
        disabled={loading}
      >
        {loading ? "…" : subscribed ? "إيقاف" : "تفعيل"}
      </button>
    </div>
  );
}
