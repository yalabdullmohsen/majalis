/**
 * اختبارات كتالوج نصوص الإشعارات المركزي.
 */
import assert from "node:assert/strict";
import {
  NOTIFICATION_CATALOG,
  buildPrayerLocalizedCopy,
  pickLocalizedNotification,
} from "../notifications/localization";

const FORBIDDEN = [/إذا كنت تصل/i, /إن كنت تصل/i, /!{2,}/];

for (const [key, pool] of Object.entries(NOTIFICATION_CATALOG)) {
  assert.ok(pool.length >= 1, `${key} needs templates`);
  for (const tpl of pool) {
    assert.ok(tpl.title.trim().length > 0, `${key} empty title`);
    assert.ok(tpl.body.trim().length > 0, `${key} empty body`);
    assert.ok(!tpl.title.includes("—") && !tpl.body.includes("—"), `${key} em-dash`);
    for (const re of FORBIDDEN) {
      assert.ok(!re.test(tpl.title) && !re.test(tpl.body), `${key} forbidden phrasing`);
    }
  }
}

const enter = buildPrayerLocalizedCopy({
  kind: "enter",
  prayerName: "الظهر",
  prayerTimeLabel: "١٢:١٥ م",
});
assert.ok(enter.title.length > 0);
assert.ok(enter.body.length > 0);

const pre = buildPrayerLocalizedCopy({
  kind: "pre",
  prayerName: "العصر",
  prayerTimeLabel: "٣:٣٠ م",
  minutesBefore: 15,
});
assert.match(pre.title, /اقترب أذان العصر/);
assert.match(pre.body, /^م\s*٣:٣٠$|^٣:٣٠/);
assert.doesNotMatch(pre.body, /دقائق|دقيقة|١٥/);

const morning = pickLocalizedNotification("adhkarMorning");
assert.match(morning.title, /أذكار|ورد/);

const jumuah = pickLocalizedNotification("jumuah");
assert.match(jumuah.title, /جمع/);

console.log("notifications-localization: ok");
