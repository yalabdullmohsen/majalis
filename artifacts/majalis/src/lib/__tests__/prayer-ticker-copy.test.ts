/**
 * نص شريط الصلاة — نافذة «حان وقت» والعدّ المدمج.
 * تشغيل: node --import tsx src/lib/__tests__/prayer-ticker-copy.test.ts
 */
import assert from "node:assert/strict";
import {
  buildPrayerChipCopy,
  buildPrayerTickerCopy,
  formatChipDuration,
  PRAYER_CHIP_NOW_WINDOW_SEC,
} from "../prayer-ticker-copy";

{
  const now = buildPrayerTickerCopy({
    prayerName: "الظهر",
    remainingHms: "٠٠:٠٠:٠٠",
    sinceSeconds: 12,
    sinceHms: "٠٠:٠٠:١٢",
  });
  assert.equal(now.isNow, true);
  assert.match(now.text, /حان وقت الظهر/);
}

{
  const since = buildPrayerTickerCopy({
    prayerName: "العصر",
    remainingHms: "٠٠:٠٠:٠٠",
    sinceSeconds: PRAYER_CHIP_NOW_WINDOW_SEC,
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
  assert.equal(rem.label, "المغرب");
  assert.equal(rem.text, "٠١:٠٢:٠٣");
}

{
  assert.equal(formatChipDuration(4500), "١:١٥");
  const chip = buildPrayerChipCopy({
    prayerName: "المغرب",
    remainingSeconds: 2712,
    sinceSeconds: null,
  });
  assert.equal(chip.text, "المغرب ٤٥:١٢");
  assert.equal(chip.urgent, false);
}

console.log("prayer-ticker-copy.test.ts: ok");
