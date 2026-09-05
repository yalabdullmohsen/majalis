import { useLayoutEffect, useRef, useState } from "react";
import { ShareFaida } from "@/components/ShareFaida";
import "@/styles/components/section-share-actions.css";

const MARKER = "data-section-share-actions";
const SYNC = "ssunnah:section-share-sync";

type Props = {
  /** عنوان المشاركة */
  title: string;
  /** رابط الصفحة — الافتراضي عنوان URL الحالي */
  url?: string;
  className?: string;
};

/**
 * مجموعة مشاركة واحدة في نهاية القسم/الصفحة:
 * مشاركة · واتساب · نسخ
 *
 * أي نسخة إضافية في نفس المستند تُخفى تلقائيًا (يُبقى الأخير في DOM = نهاية الصفحة).
 */
export function SectionShareActions({ title, url, className = "" }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [isPrimary, setIsPrimary] = useState(true);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const sync = () => {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>(`[${MARKER}]`),
      ).filter((n) => n.isConnected);
      if (nodes.length === 0) {
        setIsPrimary(true);
        return;
      }
      const last = nodes[nodes.length - 1];
      setIsPrimary(last === host);
    };

    host.setAttribute(MARKER, "1");
    sync();
    window.addEventListener(SYNC, sync);
    window.dispatchEvent(new Event(SYNC));

    return () => {
      window.removeEventListener(SYNC, sync);
      host.removeAttribute(MARKER);
      window.dispatchEvent(new Event(SYNC));
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={`section-share-actions${isPrimary ? "" : " section-share-actions--dup"} ${className}`.trim()}
      data-section-share-actions=""
      hidden={!isPrimary}
      aria-hidden={!isPrimary}
    >
      {isPrimary ? (
        <ShareFaida title={title} url={url} className="section-share-actions__faida" />
      ) : null}
    </div>
  );
}

export default SectionShareActions;
