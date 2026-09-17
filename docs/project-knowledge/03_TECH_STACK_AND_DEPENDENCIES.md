# 03 — التقنيات والاعتماديات

**Commit:** `975505911116f6190e2d09fc97ced3dbbb02e37d` · لا اقتراح تحديث إصدارات في هذه المهمة.

## إصدارات مثبتة

| تقنية | إصدار / ملاحظة | المصدر |
|---|---|---|
| Node | **24** في CI (لا engines في package.json الجذر) | `.github/actions/setup-workspace` |
| pnpm | `10.34.4` | `package.json` packageManager |
| TypeScript | `~5.9.3` | root devDependencies |
| React / React DOM | catalog `19.1.0` | `pnpm-workspace.yaml` catalog |
| Vite | catalog `^7.3.2` | catalog |
| Router | wouter `^3.3.5` | majalis package.json |
| Tailwind | `^4.1.14` + `@tailwindcss/vite` | catalog |
| Supabase JS | `^2.108.2` | majalis |
| Capacitor | `^8.4.1` (+ plugins 8.x) | majalis |
| Playwright | test `1.61.1` / playwright `^1.55.0` | majalis |
| Express | `^5.2.1` | majalis/api-server حسب الحزمة |
| React Query | catalog `^5.90.21` | catalog |
| Zod | catalog `^3.25.76` | catalog |
| LHCI | `@lhci/cli@0.15.1` عبر سكربت | majalis scripts |
| framer-motion | في catalog لكن بوابة `test:native-feel` تمنع استخدامه في المنتج | AGENTS/REPO_INDEX |

## استخدامات مهمة

| اعتماد | استخدام | إنتاجي؟ | مخاطر |
|---|---|---|---|
| `@supabase/supabase-js` | Auth/بيانات | نعم | مفتاح anon عام بطبيعة Vite |
| `@capacitor/*` | أصلي | نعم للمتجر | يحتاج sync بعد build |
| Playwright | اختبارات/بوابات بصرية | CI | ثقيل |
| HLS.js | بث صوتي/فيديو حيث وُظف | نعم إن استُخدم | حجم |
| Leaflet | خرائط/قبلة إن وُظف | نعم | حجم |
| Dexie | تخزين محلي | نعم إن وُظف | ازدواج مع Preferences |
| Anthropic SDK | مساعد | خادم/سر | لا تخرج المفتاح |
| Upstash | حد معدل/كاش خادم | اختياري | أسرار |
| expo-server-sdk | api-server push | نعم لمسار Expo | منفصل عن صلاة محلية |

## بدائل مزدوجة / قديمة

- Expo mobile vs Capacitor web-wrap — المتجر = Capacitor فقط.
- `@types/react` 19.2 catalog vs Expo 19.1 — ازدواج معروف؛ `skipLibCheck`.
- جذر فيه إشارات Next قديمة (`.next/`, docs) — **ليست** مسار بناء majalis الحالي. Unknown لدرجة الاستخدام الحي.

## اختبار / جودة

- Node `--test` / `tsx` لبوابات كثيرة تحت `src/lib/__tests__`.
- ESLint flat في majalis؛ `--max-warnings` يختلف بين سياقات (AGENTS يذكر 50 للـlint المحلي؛ verify-ci يذكر 0 — **تحقق عند التشغيل**).
