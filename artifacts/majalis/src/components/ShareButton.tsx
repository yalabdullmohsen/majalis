interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  className?: string;
  label?: string;
  size?: "sm" | "md";
}

// أزرار المشاركة أُلغيت في كل أنحاء الموقع بطلب صريح من المالك
// (2026-07-24). يبقى المكوّن مُصدَّرًا بنفس الواجهة كي لا تُكسَر عشرات
// نقاط الاستدعاء القائمة؛ لا يعرض شيئًا الآن.
export function ShareButton(_props: ShareButtonProps) {
  return null;
}
