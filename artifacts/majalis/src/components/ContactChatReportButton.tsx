import { Link, useLocation } from "wouter";
import {
  buildContactChatUrl,
  detectPageType,
  savePageContext,
  type MessageType,
  type PageContext,
} from "@/lib/contact-chat";

type Props = {
  label?: string;
  messageType?: MessageType;
  contentId?: string;
  contentTitle?: string;
  className?: string;
};

export function ContactChatReportButton({
  label = "إبلاغ عن مشكلة",
  messageType = "بلاغ خطأ",
  contentId,
  contentTitle,
  className = "contact-chat-report-btn",
}: Props) {
  const [location] = useLocation();

  const open = () => {
    const ctx: PageContext = {
      pageUrl: typeof window !== "undefined" ? window.location.href : location,
      pageType: detectPageType(location),
      contentId,
      contentTitle: contentTitle || (typeof document !== "undefined" ? document.title : undefined),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      device: typeof window !== "undefined" && window.innerWidth <= 879 ? "mobile" : "desktop",
    };
    savePageContext(ctx);
  };

  return (
    <Link
      href={buildContactChatUrl({ type: messageType, context: { pageUrl: typeof window !== "undefined" ? window.location.href : location } })}
      className={className}
      onClick={open}
    >
      {label}
    </Link>
  );
}

export default ContactChatReportButton;
