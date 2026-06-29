import { Link, useLocation } from "wouter";
import { buildContactChatUrl, detectPageType, savePageContext } from "@/lib/contact-chat";

export function ContactChatFloatingButton() {
  const [location] = useLocation();

  if (location.startsWith("/contact-chat") || location.startsWith("/admin")) {
    return null;
  }

  const openChat = () => {
    savePageContext({
      pageUrl: typeof window !== "undefined" ? window.location.href : location,
      pageType: detectPageType(location),
      contentTitle: typeof document !== "undefined" ? document.title : undefined,
    });
  };

  return (
    <Link
      href={buildContactChatUrl()}
      className="contact-chat-fab"
      aria-label="تواصل"
      onClick={openChat}
    >
      <span aria-hidden="true">💬</span>
      <span>تواصل</span>
    </Link>
  );
}

export default ContactChatFloatingButton;
