/**
 * بوابة وحدة: parser جدول عثمان الخميس
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseOthmanScheduleHtml,
  canonicalUrl,
  OTHMAN_SCHEDULE_CANONICAL,
} from "../adapters/othmanalkhamees-schedule.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = resolve(__dirname, "../fixtures/othmanalkhamees-schedule.html");

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
}

const html = existsSync(fixturePath)
  ? readFileSync(fixturePath, "utf8")
  : `<div>جدول الدروس الأسبوعي</div>
<div class="relative overflow-hidden rounded-[26px] border-[3px] border-olive-200 bg-white p-4">
  <div class="text-olive-700 font-bold text-lg sm:text-xl shrink-0">السبت</div>
  <a href="https://www.othmanalkhamees.com/schedule/1/book"></a>
  <h3>صحيح مسلم</h3>
  <span class="text-slate-500">رقم المجلس:</span><span>35</span>
  <p><span class="font-bold text-slate-800">وصلنا إلى:</span> صفحة 688</p>
  <span class="text-xs">الساعة 10 صباحاً</span>
  <a href="https://maps.app.goo.gl/x"><span class="text-xs font-medium">مسجد الياقوت - منطقة الصديق</span></a>
  <a href="https://www.othmanalkhamees.com/schedule/1/previous-councils?utm_source=x&fbclid=1">رابط</a>
</div>
المحاضرات حضورياً`;

const items = parseOthmanScheduleHtml(html);
assert(items.length >= 1, `expected >=1 lessons, got ${items.length}`);
assert(items[0].title.includes("صحيح مسلم") || items[0].title.length > 3, "title present");
assert(items[0].url === OTHMAN_SCHEDULE_CANONICAL, "canonical url");
assert(!String(items[0].text).includes("utm_"), "no utm in text");
assert(
  canonicalUrl("https://www.othmanalkhamees.com/schedule/1/previous-councils?utm_source=x&fbclid=1") ===
    "https://www.othmanalkhamees.com/schedule/1/previous-councils",
  "strips tracking params",
);

console.log(`ok: othmanalkhamees-schedule parser (${items.length} items)`);
