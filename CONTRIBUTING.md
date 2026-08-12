# المساهمة في majalis — بروتوكول الدمج التلقائي الآمن

مرجع السياسة: `.github/scripts/safe-auto-merge/constants.mjs` و`.github/workflows/auto-merge-to-main.yml`.

## شروط الأهلية للدمج التلقائي

1. **الحالة:** PR مفتوح **Ready** (ليس Draft) — المسودات لا تُدمَج ولا تُحوَّل تلقائياً.
2. **القاعدة:** `main` فقط.
3. **اسم الفرع** يطابق:
   ```
   /^(cursor|session|claude|codex|automation|fix|feature|security|docs|chore)\//
   ```
   مستثنى: `automation/content` · `automation/tasks` · `majalis-content-fill`.
4. **وسم أمان واحد على الأقل** من:
   - المفضّل: `safe:ui` · `safe:content` · `safe:test` · `safe:auto-merge`
   - مرادفات تراثية: `ui-safe` · `content-safe` · `tests-safe` · `code-safe` · `maintenance-safe`
5. **الحجم:** ≤ 40 ملفاً · ≤ 400 سطر حذف · ≤ 12 ملفاً محذوفاً.
6. **الفحوصات المطلوبة:** Verify build · preview-smoke · lint-typecheck-build · postgres-integration · Color contrast · (وiOS static عند انطباقه).

## وسوم تمنع الدمج التلقائي

`risky:manual-review` · `blocked:danger-path` · `manual-review` · `no-auto-merge` · ووسوم sql/migration/auth/rls/ios-native.

## مهلة الفحوصات

إن بقي فحص `pending` بلا نتيجة نهائية، أعد التشغيل أو راجع السجل. لا تُلغَ البوابات لتمرير PR.

## iOS static

مطلوب عندما يمسّ الـPR مسارات iOS/Capacitor؛ وإلا قد يُتخطى. لا تُضعف البوابة عند فشلها — أصلح السبب.
