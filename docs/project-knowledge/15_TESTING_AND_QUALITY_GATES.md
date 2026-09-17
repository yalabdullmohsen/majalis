# 15 — الاختبارات وبوابات الجودة

**Commit:** `975505911116f6190e2d09fc97ced3dbbb02e37d`

## مجموعات

| مجموعة | أوامر/ملفات | الغرض | في verify:ci؟ |
|---|---|---|---|
| Preflight | `pnpm run verify:preflight` | scope + throughput + path-lane unit | قبل ci |
| Typecheck/Lint | root typecheck؛ majalis eslint | صحة أنواع | نعم static-checks |
| Content guards | ضمن majalis `build` / test:content-* | سلامة محتوى | نعم عبر build |
| Unit/P0 gates | `src/lib/__tests__/*gate*.test.ts` | منع انحدار ميزات | نعم repo-gates جزئيًا |
| Bundle budget | `test:bundle-budget` | حجم entry | نعم بعد build |
| Mushaf | test:mushaf-gates + measure | سلامة عرض | حسب lane |
| Playwright visual/contrast | CI jobs | UI | حسب lane |
| LHCI | `lighthouse:ci` | أداء إدراكى | حسب lane |
| Postgres integration | `test:postgres-integration` | طوابير | حسب lane |
| Governance | agent-throughput-policy, no-runtime-ddl, unsafe-auto-merge | حوكمة | نعم |
| SEO/prerender | verify:seo-* داخل build | فهرسة | نعم عبر build |
| Native/iOS | workflows منفصلة | أصلي | حسب native lane |
| tasmee3 | `tasmee3_ci.yml` | mushafi | منفصل |

## ثغرات تغطية (مثبتة منطقيًا)

- لا يغطي verify:ci كل 364 route يدويًا.
- إشعارات الجهاز الحقيقية خارج CI لينكس غالبًا.
- Hosted RLS لا يُختبر بالكامل من git.
- اختبارات قديمة باسم fiqh-council هي **بوابات إزالة** — ليست تفعيل منتج.

## هشاشة / بطء / تكرار

- بناء majalis طويل (سلسلة generate+prerender).
- وحدات كثيرة gate — مفيدة لكن مكلفة؛ لا تعطّلها.
- Snapshots بصرية تتغير مع CSS — حدّث بحذر عند path visual.
