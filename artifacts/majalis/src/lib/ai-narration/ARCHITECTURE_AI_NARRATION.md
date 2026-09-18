# سرد سُنّة الواعي (AI Narration) — تدقيق وتصميم

Brand: **سُنّة**. نطاق: مسار النطق فقط.  
**ممنوع:** تعديل نص القرآن · تعديل المحتوى المصدري · اختراع معنى · إعادة صياغة علمية.

---

## 1) Current narration architecture

### مسارات القراءة الفعلية (خريطة)

| المسار | الموقع | المحرّك | الحالة |
|---|---|---|---|
| Web Speech (جهاز) | `src/lib/speech-read-aloud.ts` | `window.speechSynthesis` + `SpeechSynthesisUtterance` | **الافتراضي** عند غياب Neural |
| Orchestrator | `src/lib/ai-narration/ai-reader-orchestrator.ts` | Lexicon → SSML → Neural أو Device | مستخدم من قصص الأنبياء |
| Neural TTS (سحابة) | `lib/api-handlers/narration-tts.js` + `neural-tts-client.ts` | Azure Neural (`ar-SA-ZariyahNeural`) | اختياري عبر `VITE_NEURAL_TTS_ENABLED` / `sunnah.neuralTts` |
| قاموس النطق | `pronunciation-lexicon.ts` | استبدال نطق فقط (لا عرض) | lexicon-v1 (≥50 مصطلح) |
| بروفيلات إيقاع | `narration-profiles.ts` | أوضاع + نوع محتوى → rate/break/gap | أساس |
| تجهيز عربي | `arabic-prep.ts` | ترقيم/مسافات للنطق فقط | أساس |
| تقسيم SSML | `ssml-builder.ts` | عنوان/فقرة/اقتباس/قائمة + `<break>` + `breakScale` | ssml-v1 |
| حماية النص | `audio-reader/protected-text.ts` | عزل قرآن/حديث/ذكر/أذان | إلزامي قبل أي نطق |
| Audio Reader P0 | `audio-reader/*` | بيان تحضير فقط — **playback OFF** | أعلام كلها `false` |
| تنسيق الصوت العام | `app-audio-coordinator.ts` + `exclusive-audio-bus.ts` | يوقف Speech عند أي صوت آخر | مفعّل |
| واجهة مستخدم | `ProphetStoriesPage.tsx` فقط | زر قراءة → `playAiNarration` (immersive / prophet_story) | المسار الوحيد المنتج حاليًا |

### ما لا يوجد في المستودع

- **لا** `AVSpeechSynthesizer` (iOS native)
- **لا** Capacitor Text-to-Speech plugin
- **لا** محرك Android `TextToSpeech` داخل هذا المسار
- **لا** طبقة LLM قبل النطق (فهم سياقي حقيقي) — الموجود حتمي (lexicon + segmentation + profiles)

### تدفق التشغيل الحالي

```
UI (أنبياء)
  → playAiNarration({ title, body, mode, contentKind })
    → resolveNarrationProsody
    → stripNoise
    → partitionProtectedText  (يحذف المحمي من المسار المنطوق)
    → prepareArabicForNarration
    → applyPronunciationLexicon
    → segmentEditorialText + buildArabicSsml(breakScale)
    → إن Neural مفعّل: POST /api/narration/tts → Audio
    → وإلا: speakDevicePrepared → speakArabicSegments (تدريجي + gapMs)
    → ممنوع: speakArabicText على نص المصدر الخام
```

---

## 2) Weaknesses found

1. **نطق حرفي على الجهاز:** Web Speech لا يفهم SSML؛ يعتمد على قاموس + مقاطع + فواصل — تحسّن، لكن بلا Neural يبقى محدودًا.
2. **قاموس أوسع لكن غير شامل:** علماء/كتب/مصطلحات أساسية أُضيفت؛ التغطية الكاملة تحتاج موجات لاحقة.
3. **أوضاع قراءة:** أساس `standard` / `educational` / `immersive` موجود في البروفيلات؛ UI التبديل بين الأوضاع follow-up.
4. **وعي بنوع المحتوى:** `NarrationContentKind` مربوط في المنسّق؛ التعميم على كل الصفحات follow-up.
5. **بث تدريجي على الجهاز:** أُصلِح عبر `speakArabicSegments` + فواصل حسب البروفيل (كان سابقًا utterance واحدًا).
6. **Neural اختياري ونادر:** بدون مفاتيح Azure يعود لصوت الجهاز بعد Prep فقط.
7. **تغطية واجهات ضعيفة:** مسار القراءة المنتج = قصص الأنبياء فقط؛ الدروس/العلماء/العقيدة/التاريخ/الفوائد بلا زر سرد موحّد (follow-up).
8. **Audio Reader P0 غير مفعّل للتشغيل:** جيد للحماية، لكنه يترك فجوة منتج بين «المعمارية» و«التجربة».
9. **Fallback بعد Prep:** الجهاز يتلقى مقاطع مُجهَّزة؛ ممنوع raw source في المسار المنتج.
10. **لا طبقة «فهم قبل الكلام» عبر LLM:** الحالي قواعد حتمية (lexicon + segmentation + profiles) — أسلم شرعًا؛ LLM اختياري خلف بوابة تطابق رموز لاحقًا.

---

## 3) AI narration design

### مبدأ صارم

> الذكاء يجهّز **طبقة نطق** (تشكيل حرج · وقفات · تأكيد · تقسيم)  
> **ولا يغيّر** النص المعروض ولا المعنى العلمي.

أي مخرجات AI للمستقبل يجب أن تمر ببوابة `assertSegmentsPreserveText` / مطابقة رموز بعد إزالة علامات الوقف فقط.

### طبقات مقترحة (وموجود جزئيًا)

```
Content (عرض ثابت)
  → Eligibility (عائلات مسموحة فقط)
  → Protect (عزل قرآن/حديث/ذكر/أذان)
  → ArabicPrep (تشكيل حرج + قاموس + علامات وقف للنطق)
  → ProsodyPlan (أوضاع + نوع محتوى → معدل/وقفات)
  → ProgressiveSpeak (مقطع→مقطع، بدون حجب UI)
  → Engine: Azure Neural SSML  |  Device Web Speech (محسَّن)
  → Fallback: ArabicPrep فقط — ممنوع raw source text
```

### أوضاع القراءة

| Mode | معدل تقريبي | وقفات | استخدام |
|---|---|---|---|
| `standard` | 0.95 | عادية | عام |
| `educational` | 0.82 | أوضح + أطول | تعليم/شرح |
| `immersive` | 0.90 | ناعمة | سيرة/قصص تحريرية |

### بروفيلات المحتوى (إيقاع فقط)

| Kind | نبرة | ملاحظات |
|---|---|---|
| `quran_metadata` | رسمي هادئ | وصف تحريري فقط — لا آيات |
| `hadith_editorial` | هادئ | متن محمي إن وُجد — لا TTS للمتن المرجعي |
| `scholar_bio` | إخباري | قاموس أسماء |
| `benefits` | أوضح قليلًا | فواصل جمل أقوى |
| `history` / `lesson` | متوازن | عناوين بوقف أطول |
| `prophet_story` | غامر خفيف | الوضع الحالي |

### LLM مستقبلي (اختياري، خلف بوابة)

- إدخال: نص تحريري مسموح + نوع المحتوى + الوضع  
- إخراج: JSON `{ segments: [{text, pauseMs, emphasis}], pronunciations: [] }`  
- رفض إن اختلفت الرموز عن الأصل  
- لا يُستدعى لنص محمي أبدًا  
- مهلة قصيرة + كاش بالمحتوى/النسخة

---

## 4) Implementation plan

| مرحلة | عمل | حالة |
|---|---|---|
| P1 تدقيق | خريطة المسارات أعلاه | ✅ هذا المستند |
| P2 طبقة تجهيز | `narration-profiles` + ربط Orchestrator | ✅ أساس في هذا الفرع |
| P3 عربي | توسيع lexicon + وقفات جهاز بالمقاطع | ✅ أساس |
| P4 Prosody | SSML breaks حسب الوضع/النوع | ✅ أساس |
| P5 أوضاع | `standard` / `educational` / `immersive` | ✅ أساس |
| P6 وعي محتوى | `NarrationContentKind` | ✅ أساس |
| P7 Streaming | `speakArabicSegments` متتابع غير حاجب | ✅ أساس |
| P8 أداء | تحضير sync خفيف + تشغيل async | ✅ (التحضير حتمي محلي) |
| P9 Fallback | Device بعد Prep فقط | ✅ موجود ويُشدَّد |
| لاحقًا | تعميم UI على دروس/علماء/فوائد/تاريخ | Follow-up |
| لاحقًا | LLM اختياري خلف بوابة حفظ المعنى | Follow-up |
| لاحقًا | AVSpeech / Capacitor إن لزم أصليًا | Follow-up |

---

## 5) Performance impact

| عنصر | أثر |
|---|---|
| Lexicon + segmentation | CPU محلي صغير؛ لا شبكة |
| Progressive device speech | يبدأ أول مقطع فورًا؛ أفضل من utterance عملاق |
| Neural Azure | شبكة + حتى ~12s timeout؛ UI لا يُحجب (async) |
| LLM مستقبلي | تكلفة/خصوصية؛ يجب كاش + تعطيل افتراضي |
| حماية partition | رخيص؛ يمنع TTS محظور |

هدف: رسم الصفحة فوري؛ السرد لاحقًا بدون `await` على المسار الحرج للعرض.

---

## 6) Testing results (بوابات)

- `sunnah-ai-narration-back-dark-p0-gate` — حماية قرآن + حفظ الرموز + لا مفاتيح في العميل  
- `audio-reader-p0-gate` — أهلية العائلات + playback OFF  
- `ai-narration-pipeline-gate` — أوضاع/بروفيلات + Prep + ممنوع `speakArabicText` في المُنسّق + مقاطع تدريجية  


تحقق يدوي لاحقًا: دروس · علماء · حديث تحريري · عقيدة · تاريخ · فوائد · أوصاف أقسام — مع التأكد أن الآيات/المتون المرجعية لا تُنطق.

---

## قرارات هندسية

1. **لا TTS لنص القرآن/المصحف/المتن المرجعي** — بشري أو محمي فقط.  
2. **Fallback = Prep لا خام.**  
3. **أي AI لاحق = طبقة نطق ببوابة تطابق رموز.**  
4. **تعميم الواجهات** يتبع استقرار المسار على الأنبياء ثم التوسيع علمًا بعلم.
