/**
 * إرشاد RTL ودّي عند رفض/حظر إذن الميكروفون (Chrome / Safari / Edge / أصلي).
 */
import { MicOff } from "lucide-react";
import {
  detectMicHelpPlatform,
  micHelpSteps,
  type MicHelpPlatform,
} from "@/lib/mic-permission";
import "@/styles/components/mic-permission-help.css";

export type MicPermissionHelpProps = {
  open?: boolean;
  platform?: MicHelpPlatform;
  isNative?: boolean;
  isIOS?: boolean;
  isAndroid?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  /** عرض مضمّن (لوحة) بدل طبقة منبثقة */
  inline?: boolean;
  title?: string;
};

export function MicPermissionHelp({
  open = true,
  platform,
  isNative,
  isIOS,
  isAndroid,
  onRetry,
  onDismiss,
  inline = false,
  title = "يحتاج التطبيق إذن الميكروفون للاستماع لتلاوتك",
}: MicPermissionHelpProps) {
  if (!open) return null;

  const resolved =
    platform ?? detectMicHelpPlatform({ isNative, isIOS, isAndroid });
  const steps = micHelpSteps(resolved);

  const body = (
    <div
      className={`mph ${inline ? "mph--inline" : "mph--modal"}`}
      role="alertdialog"
      aria-modal={!inline}
      aria-labelledby="mph-title"
      dir="rtl"
    >
      <div className="mph__icon" aria-hidden="true">
        <MicOff size={22} />
      </div>
      <p id="mph-title" className="mph__title">
        {title}
      </p>
      <p className="mph__steps">{steps}</p>
      <div className="mph__actions">
        {onRetry ? (
          <button type="button" className="mph__btn mph__btn--primary" onClick={onRetry}>
            حسنًا، حاول مجددًا
          </button>
        ) : null}
        {onDismiss ? (
          <button type="button" className="mph__btn" onClick={onDismiss}>
            إغلاق
          </button>
        ) : null}
      </div>
    </div>
  );

  if (inline) return body;

  return (
    <div className="mph-backdrop" role="presentation">
      {body}
    </div>
  );
}

export default MicPermissionHelp;
