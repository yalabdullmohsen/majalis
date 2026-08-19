# قائمة اختبار الصوت — **ثلاث نقاط حاسمة (لا تُؤجَّل)**

## 1. الخلفية: HTML5 كافٍ أم AVQueuePlayer ضرورة؟

**لا تُقرّر قبل هذا الاختبار بالضبط:**

1. شغّل تلاوة آية-بآية من المصحف
2. **اقفل الشاشة** → انتظر **60 ثانية** → هل ما زالت التلاوة تعمل؟
3. **أخرج التطبيق للخلفية** (Home) → هل استمرّت؟

| النتيجة | الإجراء |
|---------|---------|
| توقّف خلال 60ث أو عند الخلفية | **AVQueuePlayer/Swift ضرورة** — WKWebView يُعلّق HTML5 ما لم تُضبط `AVAudioSession(.playback)` + `UIBackgroundModes: audio` بشكل أصلي مستمر |
| استمرّت 60ث+ في الخلفية | HTML5 + Media Session **قد يكفي** — وثّق الجهاز/iOS version |

**التحقق التقني الحالي:**
- `Info.plist`: `UIBackgroundModes` → `audio`
- `MajlisPlaybackAudioPlugin.swift`: `enablePlayback()` → `.playback`
- يُستدعى من `AudioEngine.activatePlaybackSession()` عند التشغيل

---

## 2. الفجوة بين الآيات — **≤ 120 ms**

الهدف رقمي لا انطباعي.

**قياس (Safari Web Inspector → Console على iPhone):**

```javascript
(() => {
  const gaps = [];
  let lastEnd = 0;
  const eng = window.__MAJALIS_AUDIO_ENGINE__;
  if (!eng) { console.warn("افتح /mushaf وشغّل آية أولاً"); return; }
  eng.onAyahChange(({ surah, ayah }) => {
    const now = performance.now();
    if (lastEnd) gaps.push({ gapMs: now - lastEnd, surah, ayah });
    lastEnd = now;
  });
  eng.getSound()?.addEventListener("ended", () => { lastEnd = performance.now(); });
  window.__MAJALIS_GAP_PROBE__ = gaps;
  console.log("gap probe armed");
})();
```

| gapMs | الحكم |
|------:|-------|
| ≤ 120 | pass |
| 121–250 | تحسين preload |
| > 250 | fail |

---

## 3. ملفات `.caf` — **≤ 30 ثانية**

```bash
pnpm run verify:adhan-caf-durations
```

**اختبار إشعار حقيقي:** بعد **إعادة تشغيل الجهاز** → أذان تجريبي → سماع النغمة (لا صمت).

---

## أوامر QA

```bash
pnpm run audit:audio:stratified
pnpm run audit:audio:full
pnpm run generate:adhan-bundle
pnpm run verify:adhan-caf-durations
npx cap open ios
```
