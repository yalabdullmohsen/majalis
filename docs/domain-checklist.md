# قائمة فحص النطاق — ssunnah.com / www.ssunnah.com

استخدمها عند 502 على apex أو تحويلات غير متوقعة. **لا تغيّر DNS من الكود** — الفحص والتوثيق فقط.

## 1) Vercel Domains

1. [Vercel Project → Settings → Domains](https://vercel.com/yousef88/majalis-majalis/settings/domains)
2. تأكد من:
   - `www.ssunnah.com` — **Production**، SSL صالح
   - `ssunnah.com` — مضاف (apex)
   - `majlisilm.com` / `www.majlisilm.com` — تحويل 308 إلى `www.ssunnah.com` (legacy)

## 2) DNS (عند المسجّل)

| السجل | المتوقع |
|--------|---------|
| `www` | CNAME → `cname.vercel-dns.com` (أو ما يعرضه Vercel) |
| `@` (apex) | A → `76.76.21.21` **أو** ALIAS/ANAME إلى Vercel حسب المسجّل |

انتظر TTL (حتى 48 ساعة نادرًا؛ غالبًا دقائق).

## 3) SSL

```bash
curl -sI https://www.ssunnah.com | head -5
curl -sI https://ssunnah.com | head -10
```

- `strict-transport-security` على www
- شهادة صالحة بلا تحذير متصفح

## 4) تحويل www و apex

```bash
# www — يجب 200 مباشرة
curl -sI -o /dev/null -w "%{http_code} %{redirect_url}\n" https://www.ssunnah.com/

# apex — 200 أو 301/308 إلى www
curl -sI -o /dev/null -w "%{http_code} %{redirect_url}\n" https://ssunnah.com/
```

المعرّف في `artifacts/majalis/vercel.json`:

- `ssunnah.com` → `https://www.ssunnah.com/:path*` (308)
- `majlisilm.com` → `https://www.ssunnah.com/:path*` (308)

## 5) canonical و sitemap

```bash
curl -s https://www.ssunnah.com/robots.txt | grep -i sitemap
curl -s https://www.ssunnah.com/sitemap.xml | head -20
```

- `Sitemap:` يشير إلى `https://www.ssunnah.com/sitemap.xml`
- لا روابط `majlisilm.com` في `<loc>`

## 6) اختبار متصفح

1. نافذة خاصة → `https://www.ssunnah.com`
2. عنوان التبويب / PWA: **سُنّة** (لا Majlisilm)
3. `https://ssunnah.com/mushaf` يصل إلى المصحف عبر www

## 7) 502 على apex — خطوات سريعة

1. تحقق Vercel Domains: هل `ssunnah.com` مربوط بالمشروع الصحيح؟
2. تحقق DNS: هل A/CNAME يطابق توصيات Vercel الحالية؟
3. أعد إصدار الشهادة من Vercel إن لزم (Domains → Refresh)
4. لا تنشر commit جديد لإصلاح DNS — أصلح البنية التحتية أولًا

## 8) أتمتة محلية

```bash
pnpm run guard:postdeploy
node scripts/postdeploy-smoke.mjs
```
