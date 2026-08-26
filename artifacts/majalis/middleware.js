/**
 * يزيل ?tab=courses|men|women من /lessons — يُبقي ?search= وغيره.
 * يجب استدعاء next() لتمرير الطلبات العادية؛ وإلا يرجع Vercel جسمًا فارغًا.
 */
import { next } from "@vercel/functions";

export default function middleware(request) {
  const url = new URL(request.url);
  const tab = url.searchParams.get("tab");
  if (tab === "courses" || tab === "men" || tab === "women") {
    url.searchParams.delete("tab");
    const qs = url.searchParams.toString();
    const dest = qs ? `${url.pathname}?${qs}` : url.pathname;
    return Response.redirect(new URL(dest, url.origin).toString(), 308);
  }
  return next();
}
