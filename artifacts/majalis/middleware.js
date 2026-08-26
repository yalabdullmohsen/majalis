/**
 * يزيل ?tab=courses|men|women من /lessons — يُفعَّل عبر vercel.json → proxy.
 * يُبقي ?search= وغيره من المعاملات المفيدة.
 */
export default function middleware(request) {
  const url = new URL(request.url);
  const tab = url.searchParams.get("tab");
  if (tab !== "courses" && tab !== "men" && tab !== "women") return;
  url.searchParams.delete("tab");
  const qs = url.searchParams.toString();
  const dest = qs ? `${url.pathname}?${qs}` : url.pathname;
  return Response.redirect(new URL(dest, url.origin).toString(), 308);
}
