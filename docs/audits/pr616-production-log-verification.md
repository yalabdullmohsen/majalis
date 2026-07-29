# التحقق من سجلات Production بعد PR #616

**Merge commit:** `c0e560497532625375271fdcc384e572de20261a`  
**مشروع Vercel:** `majalis-majalis` (`prj_W2pUhYZqBRzwplLCrr5wU4lha1DV`)

## نتيجة هذه الجلسة

تعذّر سحب سجلات Production بشكل موثوق من هذه البيئة الآلية دون واجهة Vercel Logs/Analytics مكتملة الصلاحيات. **لا يُدعى تحسن أو تراجع رقمي دون قياس.**

## خطوات يدوية للقياس

1. Vercel → Project → Deployments → افتح Deployment للـmerge commit أعلاه.
2. Runtime Logs / Observability — صفِّ بـ:
   - `504`
   - `ERR_HTTP_HEADERS_SENT` / `http.double_response_blocked`
   - `credit_exhausted` / `provider_paused`
   - `source-monitor` / `job-worker`
   - `durable_store_unavailable`
   - `relation` / RLS / UUID
3. قارن نافذة 24–72 ساعة قبل الدمج وبعده.

## جدول المؤشرات (يُملأ يدويًا)

| المؤشر | قبل PR #616 | بعد PR #616 | النتيجة | الدليل |
|---|---|---|---|---|
| عدد 504 | — | — | غير مقاس هنا | Vercel Logs |
| ERR_HTTP_HEADERS_SENT | — | — | غير مقاس هنا | Vercel Logs |
| credit_exhausted | — | — | غير مقاس هنا | Logs |
| source-monitor timeout | — | — | غير مقاس هنا | Logs |
| job-worker failures | — | — | غير مقاس هنا | Logs |
| durable_store_unavailable | — | — | غير مقاس هنا | Logs |
| relation missing | — | — | غير مقاس هنا | Logs + SQL verify |
| RLS errors | — | — | غير مقاس هنا | Logs |
| UUID errors | — | — | غير مقاس هنا | Logs |
| Auth latency | — | — | غير مقاس هنا | Analytics |
| prayer times latency | — | — | غير مقاس هنا | Analytics |
| 404 / 500 | — | — | غير مقاس هنا | Analytics |
