/**
 * اختبار منطق إخفاء الكروم عند التمرير.
 * التشغيل: node --import tsx src/hooks/__tests__/useScrollDirection.test.ts
 */
import assert from "node:assert/strict";
import { resolveShouldHideChrome } from "../useScrollDirection.ts";

assert.deepEqual(
  resolveShouldHideChrome({ scrollY: 10, deltaY: 20, currentlyHidden: false, forceShow: false }),
  { isScrollingDown: false, shouldHideChrome: false },
  "أعلى الصفحة: إظهار دائم",
);

assert.deepEqual(
  resolveShouldHideChrome({ scrollY: 80, deltaY: 12, currentlyHidden: false, forceShow: false }),
  { isScrollingDown: true, shouldHideChrome: true },
  "نزول > 8px: إخفاء",
);

assert.deepEqual(
  resolveShouldHideChrome({ scrollY: 80, deltaY: -12, currentlyHidden: true, forceShow: false }),
  { isScrollingDown: false, shouldHideChrome: false },
  "صعود: إظهار",
);

assert.deepEqual(
  resolveShouldHideChrome({ scrollY: 200, deltaY: 20, currentlyHidden: false, forceShow: true }),
  { isScrollingDown: false, shouldHideChrome: false },
  "forceShow يمنع الإخفاء",
);

assert.deepEqual(
  resolveShouldHideChrome({ scrollY: 100, deltaY: 2, currentlyHidden: true, forceShow: false }),
  { isScrollingDown: true, shouldHideChrome: true },
  "حركة صغيرة تبقي الحالة",
);

console.log("useScrollDirection.test.ts: ok");
