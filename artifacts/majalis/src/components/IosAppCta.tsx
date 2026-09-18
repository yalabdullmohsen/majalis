/**
 * دعوة غير مزعجة لتحميل تطبيق الآيفون — تظهر فقط عند وجود رابط App Store إنتاجي.
 */
import { useEffect } from "react";
import { hasIosAppStoreUrl, IOS_APP_STORE_URL } from "@/lib/ios-app-store";

type Variant = "strip" | "footer" | "inline";

type Props = {
  variant?: Variant;
  className?: string;
};

const COPY = {
  strip: {
    lead: "رفيقك اليومي لطلب العلم",
    detail: "حمّل تطبيق سُنّة على الآيفون وواصل التعلم من حيث توقفت.",
    action: "حمّل على الآيفون",
  },
  footer: {
    lead: "تطبيق سُنّة على الآيفون",
    detail: "الدروس والعلماء والقرآن في تجربة واحدة.",
    action: "App Store",
  },
  inline: {
    lead: "واصل تعلمك من أي مكان",
    detail: "استمع للدروس واحفظ فوائدك وتابع تقدّمك على الآيفون.",
    action: "حمّل التطبيق",
  },
} as const;

export function IosAppCta({ variant = "strip", className = "" }: Props) {
  const visible = hasIosAppStoreUrl();

  useEffect(() => {
    if (!visible) return;
    void import("@/styles/components/ios-app-cta.css");
  }, [visible]);

  if (!visible) return null;

  const copy = COPY[variant];
  const rootClass = ["ios-app-cta", `ios-app-cta--${variant}`, className].filter(Boolean).join(" ");

  return (
    <aside className={rootClass} aria-label="تحميل تطبيق سُنّة على الآيفون">
      <div className="ios-app-cta__text">
        <p className="ios-app-cta__lead">{copy.lead}</p>
        <p className="ios-app-cta__detail">{copy.detail}</p>
      </div>
      <a
        className="ios-app-cta__action"
        href={IOS_APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        dir="ltr"
      >
        {copy.action}
      </a>
    </aside>
  );
}

export default IosAppCta;
