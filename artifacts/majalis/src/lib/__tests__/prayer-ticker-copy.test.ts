/**
 * نص شريط الصلاة — نافذة «حان الآن» والعدّ التنازلي.
 * تشغيل: node --import tsx src/lib/__tests__/prayer-ticker-copy.test.ts
 */
import assert from "node:assert/strict";
import { buildPrayerTickerCopy } from "../prayer-ticker-copy";

{
  const now = buildPrayerTickerCopy({
    prayerName: "الظهر",
    remainingHms: "٠٠:٠٠:٠٠",
    sinceSeconds: 12,
    sinceHms: "٠٠:٠٠:١٢",
  });
  assert.equal(now.isNow, true);
  assert.match(now.text, /حان الآن وقت صلاة الظهر/);
}

{
  const since = buildPrayerTickerCopy({
    prayerName: "العصر",
    remainingHms: "٠٠:٠٠:٠٠",
    sinceSeconds: 120,
    sinceHms: "٠٠:٠٢:٠٠",
  });
  assert.equal(since.isNow, false);
  assert.match(since.label, /مضى على أذان العصر/);
  assert.equal(since.text, "٠٠:٠٢:٠٠");
}

{
  const rem = buildPrayerTickerCopy({
    prayerName: "المغرب",
    remainingHms: "٠١:٠٢:٠٣",
    sinceSeconds: null,
    sinceHms: null,
  });
  assert.equal(rem.isNow, false);
  assert.match(rem.label, /المتبقي على صلاة المغرب/);
  assert.equal(rem.text, "٠١:٠٢:٠٣");
}

console.log("prayer-ticker-copy.test.ts: ok");
