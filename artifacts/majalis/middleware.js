/**
 * يزيل ?tab=courses|men|women من /lessons — Vercel redirects تحافظ على query افتراضيًا.
 * يُبقي ?search= وغيره من المعاملات المفيدة.
 */
export default function middleware(request) {
  const url = new URL(request.url);
  if (url.pathname !== "/lessons") return;
  const tab = url.searchParams.get("tab");
  if (tab !== "courses" && tab !== "men" && tab !== "women") return;
  url.searchParams.delete("tab");
  const qs = url.searchParams.toString();
  const dest = qs ? `${url.pathname}?${qs}` : url.pathname;
  return Response.redirect(new URL(dest, url.origin).toString(), 308);
}

export const config = {
  matcher: "/lessons",
};
