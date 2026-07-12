/**
 * ContentReportButton — زر الإبلاغ عن خطأ علمي
 * يفتح نموذج بريد إلكتروني مُعبّأ مسبقاً بمعرف المحتوى والصفحة.
 */
import { Flag } from "lucide-react";

type Props = {
  contentType: string;
  contentId: string | number;
  title?: string;
};

export function ContentReportButton({ contentType, contentId, title }: Props) {
  const subject = encodeURIComponent(`إبلاغ عن خطأ علمي — ${contentType} #${contentId}`);
  const body = encodeURIComponent(
    `صفحة: ${window.location.href}\n` +
    `نوع المحتوى: ${contentType}\n` +
    `معرّف المحتوى: ${contentId}\n` +
    (title ? `العنوان: ${title}\n` : "") +
    `\nالخطأ أو الملاحظة:\n`
  );

  return (
    <a
      href={`mailto:content@majlisilm.com?subject=${subject}&body=${body}`}
      className="crb-btn"
      aria-label="الإبلاغ عن خطأ علمي"
      title="الإبلاغ عن خطأ في هذا المحتوى"
      dir="rtl"
    >
      <Flag size={12} strokeWidth={1.8} aria-hidden="true" />
      إبلاغ عن خطأ
    </a>
  );
}
