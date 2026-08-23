/**
 * بوابة: لا يبقى loading/buffering معلّقًا، وحالة ended، واستعادة التوقف، وتنظيف كاش الصوت.
 * تشغيل: node --import tsx src/lib/__tests__/audio-engine-stall-ended-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const engine = read("src/core/audio/AudioEngine.ts");
assert.match(engine, /"ended"/, "PlayerState يتضمن ended");
assert.match(engine, /attachAudioStallRecovery/, "AudioEngine يربط استعادة التوقف");
assert.match(engine, /shouldRecover/, "لا استعادة أثناء التحميل الأولي");
assert.match(engine, /BUFFERING_WATCH_MS|armBufferingWatch/, "مهلة watchdog للتحميل/التخزين");
assert.match(engine, /setPlayerState\("ended"\)/, "نهاية المصحف → ended");
assert.match(
  engine,
  /أثناء buffering لا نترك الحالة معلّقة/,
  "خطأ أثناء buffering لا يُتجاهل بالكامل",
);
assert.doesNotMatch(
  engine,
  /playerState === "loading" \|\| this\.playerState === "buffering"\) return/,
  "لا يُتجاهل error أثناء buffering",
);

const stall = read("src/lib/audio-stall-recovery.ts");
assert.match(stall, /shouldRecover\?:/, "خيار shouldRecover في استعادة التوقف");

const sw = read("public/sw.js");
assert.match(sw, /majalis-audio-v1/, "activate يعرف الكاش الصوتي القديم");
assert.match(sw, /OFFLINE_CACHE/, "حالة كاش الصوت من OFFLINE_CACHE");
assert.match(sw, /pathname\.startsWith\("\/audio\/"\)/, "network-first للصوت");

const html = read("index.html");
const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? "";
assert.match(head.trimStart(), /^<meta charset=/i, "charset أول عنصر في head");
assert.match(head, /id="mj-theme-boot"/, "ثيم الإقلاع في head قبل أي CSS مرئي");
{
  const themeIdx = head.indexOf('id="mj-theme-boot"');
  const critIdx = head.indexOf('id="mj-lcp-critical"');
  assert.ok(themeIdx >= 0 && critIdx > themeIdx, "سكربت الثيم قبل CSS الحرج");
}
assert.doesNotMatch(
  html,
  /localStorage\.removeItem\("majalis-theme"\)/,
  "إقلاع الثيم لا يمسح تفضيل المستخدم",
);

const dock = read("src/features/mushaf-madinah/MushafAudioDock.tsx");
assert.match(dock, /ended/, "شريط التلاوة يعرض حالة الانتهاء");

console.log("audio-engine-stall-ended-gate.test.ts: ok");
