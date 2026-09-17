# 05 — المسارات والتنقل

**Commit:** `975505911116f6190e2d09fc97ced3dbbb02e37d`  
**مصدر Route SSOT التشغيلي:** `artifacts/majalis/src/AppRoutes.tsx` (+ `/` في `App.tsx`).  
سجل إضافي: `src/app/router/routes.ts` (`ROUTE_REGISTRY`) — يُفترض مطابقته عبر `scripts/verify-route-registry.mjs`.

## إحصاءات

| مقياس | قيمة | ثقة |
|---|---|---|
| Route path في AppRoutes | 364 | Confirmed |
| Bottom tabs حية | 5 | Confirmed `sections.registry` |
| SEO routes JSON | ~210 | Confirmed |
| Vercel redirects | 123 (تقريب من استكشاف) | Confirmed استكشاف |

## Bottom navigation (حية)

من `sections.registry.ts` عبر `config/navigation.ts` → `nav-map.ts` → `BottomNavBar.tsx`:

1. `/` الرئيسية  
2. `/quran-hub` القرآن  
3. `/lessons` الدروس  
4. `/prayer-times` الصلاة  
5. `/sections` الأقسام  

### CONFLICT

`ia-final-structure.ts` يعرّف `IA_BOTTOM_TABS` بتاب فقه بدل الأقسام — **لا يطابق** الشريط الحي. Confirmed.

## Back navigation

- منطق: `src/lib/navigation-back.ts` (يشمل تحويل fiqh-council→fiqh).
- سياسات UX تمنع FAB رجوع يغطي المحتوى في إصلاحات سابقة (وثائق UI) — تحقق انتقائي عند التعديل.

## Floating controls

- BottomNavBar، أزرار مصحف، scroll-to-top محتمل، toasts استرداد chunks (`ChunkRecoveryToast`). راجع CSS `native-feel` / capacitor UX.

## Redirects مهمة

| من | إلى | طبقة |
|---|---|---|
| `/fiqh-council`, `/fiqh-council/:rest*` | `/fiqh` | Client AppRoutes |
| `/fatwa*`, `/rulings*` | `/fiqh` | Client + vercel redirects |
| `/quran` | `/quran-hub` | Client |
| `/quran/mushaf` وغيرها | `/mushaf` | Client + vercel |
| `/library` | `/search` | Client |
| `/islamic-history` | `/tarikh-islami` | Client + vercel |
| `/aqidah` | `/tawhid` | Client |
| `/qa` | `/quiz` | Client + vercel |

**ملاحظة:** لا يوجد HTTP redirect في `vercel.json` لـ`/fiqh-council` نفسه؛ يوجد rewrite إلى `index.html` + تحويل عميل. Confirmed استكشاف.

## Lazy vs eager

- `/`: shell LCP eager + HomePage lazy.  
- باقي الصفحات: `lazy` / `SafeLazyRoute` / `AdminLazyRoute`.  
- Admin مسارات تحت `/admin*`.

## وصول

| نوع | أمثلة |
|---|---|
| Public | معظم المحتوى |
| Authenticated | مفضلة/ملف/بعض التقدم |
| Admin | `/admin*` — يتطلب دور مشرف (RLS/`is_admin`) |
| Internal | `/internal/status` |

## SEO / Prerender

- `seo-routes.json` + `prerender.mjs` + بوابات `verify:seo-prerender*`.
- صفحات admin يجب ألا تُفهرس (بوابات SEO/noindex حيث وُجدت).
- fiqh-council: noindex على مسارات بحث قديمة في headers.

## روابط ميتة / غير قابلة للوصول

- تقارير: `scripts/audit-*.mjs`, `reports/*route*`.
- مسارات كثيرة aliases قد تبدو «زائدة» لكنها Redirect مقصودة.
- **Full page reload:** روابط `<a href>` خارجية أو مطلقة قد تكسر SPA — يُفضّل wouter Link؛ افحص عند التعديل (Unknown لنسبة الحدوث الحالية دون مسح كامل).

## Navigation graph (مختصر)

```mermaid
flowchart TD
  Bottom[BottomNav 5] --> Home[/]
  Bottom --> Quran[/quran-hub]
  Bottom --> Lessons[/lessons]
  Bottom --> Prayer[/prayer-times]
  Bottom --> Sections[/sections]
  Sections --> FeatureRoutes[78 registry routes]
  Quran --> Mushaf[/mushaf]
  NavBar[NavBar/Drawer] --> Search[/search]
  NavBar --> Settings[/settings]
  NavBar --> Login[/login]
```

## قائمة المسارات

القائمة الكاملة الأبجدية لـ364 مسارًا مُستخرجة من `AppRoutes.tsx` موثّقة في جلسة الاستكشاف (انظر أيضًا `ROUTE_REGISTRY`). لإعادة الاستخراج:

```bash
rg -o 'path="[^"]+"' artifacts/majalis/src/AppRoutes.tsx
```
