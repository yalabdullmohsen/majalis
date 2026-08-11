/**
 * بوابة الوحدة ٦ — مشغّل التلاوة المستمر.
 * تشغيل: node --import tsx src/lib/__tests__/recitation-player.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  advanceAfterAyahEnded,
  createLoopRuntime,
  normalizeLoopConfig,
  singleAyahInfiniteConfig,
} from "../ayah-loop-controller";
import {
  hifzPrefsToLoopConfig,
  HIFZ_PREFS_LS_KEY,
  loadHifzPrefs,
  saveHifzPrefs,
} from "../recitation-hifz-prefs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../../");
const src = resolve(root, "src");

function read(rel: string) {
  return readFileSync(resolve(src, rel), "utf8");
}

const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k, v) => {
    mem.set(k, String(v));
  },
  removeItem: (k) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  key: () => null,
  get length() {
    return mem.size;
  },
} as Storage;

// ── حلقة الحفظ: ١–٢٠ أو لا نهائي ──────────────────────────────────────────
{
  const finite = normalizeLoopConfig({ startAyah: 1, endAyah: 2, repeatCount: 20, delayMs: 1000 }, 7);
  assert.equal(finite.repeatCount, 20);
  const over = normalizeLoopConfig({ startAyah: 1, endAyah: 2, repeatCount: 99, delayMs: 0 }, 7);
  assert.equal(over.repeatCount, 20, "يُقصّ التكرار عند ٢٠");
  const inf = normalizeLoopConfig({ startAyah: 5, endAyah: 5, repeatCount: 0, delayMs: 0 }, 7);
  assert.equal(inf.repeatCount, Number.POSITIVE_INFINITY);
  assert.equal(singleAyahInfiniteConfig(3).repeatCount, Number.POSITIVE_INFINITY);

  let rt = createLoopRuntime(inf);
  for (let i = 0; i < 5; i++) {
    const step = advanceAfterAyahEnded(rt, 5);
    assert.equal(step.next.action, "play");
    rt = step.runtime;
  }
}

// ── حفظ تفضيلات الحفظ ─────────────────────────────────────────────────────
{
  saveHifzPrefs({
    surah: 2,
    startAyah: 255,
    endAyah: 255,
    repeatCount: 0,
    delayMs: 500,
    playbackRate: 0.75,
  });
  const loaded = loadHifzPrefs();
  assert.ok(loaded);
  assert.equal(loaded!.surah, 2);
  assert.equal(loaded!.repeatCount, 0);
  assert.equal(loaded!.playbackRate, 0.75);
  const cfg = hifzPrefsToLoopConfig(loaded!);
  assert.equal(cfg.repeatCount, Number.POSITIVE_INFINITY);
  assert.match(HIFZ_PREFS_LS_KEY, /majalis-quran-loop-v1/);
}

// ── مشغّل مصغّر + محرّك ───────────────────────────────────────────────────
{
  const mini = read("components/quran/QuranMiniPlayerBar.tsx");
  assert.match(mini, /quran-mini-player--expanded/);
  assert.match(mini, /وضع الحفظ/);
  assert.match(mini, /cycleMiniPlayerRate/);
  assert.doesNotMatch(mini, /hideMiniPlayer\(\)/);
  assert.match(mini, /stopMiniPlayer/);

  const css = read("styles/components/quran-mini-player.css");
  assert.match(css, /--qmp-h:\s*56px/);
  assert.match(css, /mj-ease-spring/);
  assert.match(css, /quran-mini-player--immersive/);

  const engine = read("core/audio/AudioEngine.ts");
  assert.match(engine, /setLoopConfig\(/);
  assert.match(engine, /advanceAfterAyahEnded/);
  assert.match(engine, /0\.75,\s*1,\s*1\.25/);
  assert.match(engine, /stopAndUnload/);
  assert.match(engine, /audioInterruption/);
  assert.match(engine, /oldDeviceUnavailable|reasonNum === 2/);

  const follow = read("hooks/useMushafRecitationFollow.ts");
  assert.match(follow, /ayahKeyToPage/);
  assert.match(follow, /goToPage/);
  assert.match(follow, /touchstart/);
  assert.match(follow, /data-verse/);

  const view = read("pages/quran/ui/MushafPageView.tsx");
  assert.match(view, /useMushafRecitationFollow/);
  assert.match(view, /toggleEnginePlayForAyah/);
  assert.match(view, /showMiniPlayer/);

  const stop = read("lib/quran-mini-player.ts");
  assert.match(stop, /stopAndUnload/);

  const plist = readFileSync(resolve(root, "ios/App/App/Info.plist"), "utf8");
  assert.match(plist, /UIBackgroundModes/);
  assert.match(plist, /<string>audio<\/string>/);

  const halo = read("styles/mushaf-v2.css");
  assert.match(halo, /mf2-ayah-group--active/);
  assert.match(halo, /بلا padding يحرّك الأساس/);
}

console.log("recitation-player.test.ts: ok");
