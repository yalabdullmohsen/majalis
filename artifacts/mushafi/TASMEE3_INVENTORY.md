# جرد التسميع (Tasmee3) — `artifacts/mushafi`

تاريخ الجرد: 2026-08-08  
نطاق الفحص: `artifacts/mushafi` (Flutter app «مصحفي» + خادم `server/tasmee3_asr`)  
منهجية: قراءة الكود والمسارات والوثائق المحلية فقط — بلا تعديلات خارج هذا الملف.

---

## خلاصة تنفيذية

**مصحفي/Tasmee3** تطبيق Flutter مستقل لمراجعة حفظ القرآن: جلسة تسميع بالصوت → تحويل كلام لنص (على الجهاز أو خادم Whisper اختياري) → مطابقة مع نص عثماني مضمّن → تقرير أخطاء تقريبي → خطة مراجعة محلية (SRS).  
**ليس** نظام معلم بشري، ولا يخزّن شيئاً في Supabase، ولا يضمّن تسجيلات قرّاء ولا توقيتات آيات جاهزة ولا نماذج Whisper داخل الحزمة.

---

## 1) ما الذي يفعله فعلياً؟

| القدرة | الحالة في الكود | التوضيح |
|---|---|---|
| **تسجيل صوت** | نعم | عبر حزمة `record` (ملف m4a / chunks) و/أو `speech_to_text` على الجهاز؛ مسار تجريبي PCM عبر EventChannel → WebSocket. الميكروفون يُطلب عند بدء الجلسة فقط مع حوار خصوصية. |
| **مطابقة نص** | نعم | النص المتوقع من `assets/quran/quran_uthmani.json` (6236 آية). المقارنة بعد تطبيع عربي وتقطيع كلمات. مسار الخادم يعيد Forced Alignment + edit distance؛ مسار الجهاز يستخدم `MistakeDetectionEngine` محلياً. |
| **تصحيح آلي** | جزئي / تقني فقط | يعلّم كلمات: صحيحة / ناقصة / زائدة / خاطئة / ثقة منخفضة، ونسبة دقة تقريبية، و`weakSpots` / `ayahScores` من الخادم. **ليس** تصحيحاً تجويدياً شرعياً ولا حكماً على أحكام التجويد. الوثائق القانونية تصرّح بذلك صراحة. |
| **مراجعة معلّم** | لا | لا يوجد دور معلّم، ولا لوحة إسناد، ولا تصحيح بشري، ولا مزامنة صفّ دراسي. كلمة «مراجعة» في الواجهة تعني **مراجعة المتعلم لنفسه** (خطة SRS / مواضع ضعف). |
| **تتبّع حفظ** | نعم — محلي | إتقان آية (`AyahMasteryRecord` + مستويات)، اقتراحات اليوم، خطة أسبوعية، أهداف يومية، سلسلة/شارات، سجل حتى 50 جلسة، تذكيرات محلية، تقرير PDF محلي. التخزين: `SharedPreferences` فقط. |

### تدفق الجلسة (مختصر)

1. اختيار نطاق (`RecitationTarget`: سورة/آية من→إلى) من التسميع أو من المصحف.  
2. بدء التسميع → تسجيل/تعرّف حسب `AsrEngineMode`: `auto` | `advancedServer` | `deviceFallback`.  
3. إيقاف وتحليل → نتيجة `Tasmee3Result` + أخطاء + دقة.  
4. تحديث SRS/إتقان الآيات → اقتراحات مراجعة.  
5. اختياري: حفظ مؤشرات مراجعة في المصحف، تدريب على المواضع، PDF، لوحة تقدم.

---

## 2) أين يقع المنطق الأساسي؟ وما الـAPI؟

### توزيع المنطق

| الطبقة | الموقع | الدور |
|---|---|---|
| واجهة وجلسة | الجهاز (Flutter) `lib/features/tasmee3/` | اختيار النطاق، التسجيل، العرض الحي، التقارير، الأهداف، التذكيرات، PDF |
| كشف الأخطاء (مسار الجهاز) | الجهاز — `MistakeDetectionEngine` + `ArabicNormalizer` | محاذاة متسلسلة / أنواع الأخطاء / دقة |
| SRS وإتقان | الجهاز — `Tasmee3SrsService` + مستودعات SharedPreferences | درجات، مواعيد مراجعة، اقتراحات |
| مصحف مرافق | الجهاز — `lib/features/mushaf/` | قراءة، فهرس، بحث، علامات مراجعة؛ مرتبط بالتسميع |
| ASR متقدم + محاذاة قوية | **خدمة خلفية اختيارية** — `server/tasmee3_asr` (FastAPI) | Whisper (+ timestamps) ثم alignment |
| تعرّف الجهاز | OS عبر `speech_to_text` | نص تقريبي بلا رفع صوت للخادم |

الافتراضي الإنتاجي الموثَّق: يعمل **بدون خادم**؛ رفع الصوت للخادم يتطلب تفعيل المستخدم صراحة (`allow server audio upload`) + endpoint مضبوط.

### API الخادم (`server/tasmee3_asr`, الإصدار المعلن 4.0.0)

| الطريقة | المسار | الوظيفة |
|---|---|---|
| `GET` | `/health` | صحة الخدمة، النموذج، الجهاز، الميزات، الحدود |
| `POST` | `/transcribe` | رفع ملف صوت + نص/كلمات متوقعة → نص + كلمات بزمن + `alignedWords` + `ayahScores` + `weakSpots` |
| `WS` | `/ws/live` | بث حي: JSON (`start` / `audioChunk` / `stop`) أو PCM (`startPcm` + إطارات binary) → `partial` / `final` |

**عقد `/transcribe` (حقول Form مهمة):**  
`audio`, `language`, `expectedText`, `expectedWords` (JSON), `expectedWordMap` (JSON), `fromSurah`, `fromAyah`, `toSurah`, `toAyah`  
مصادقة اختيارية: `Authorization` + `TASMEE3_ASR_API_KEY`؛ حد معدّل بسيط.

**ربط Flutter (compile-time / إعدادات):**  
- `TASMEE3_ASR_ENDPOINT` → عادة `…/transcribe`  
- `TASMEE3_ASR_WS_ENDPOINT` → `…/ws/live`  
- `TASMEE3_ASR_API_KEY`  
- أعلام تجريبية: `TASMEE3_ENABLE_EXPERIMENTAL_PCM`, `TASMEE3_DEBUG_DIAGNOSTICS`  
العميل: `AdvancedQuranAsrRecognizer` (HTTP)، `LiveAsrWebsocketRecognizer` / `LiveAsrPcmWebsocketRecognizer` (WS).

**محرك ASR على الخادم:**  
`whisper_timestamped` (افتراضي) أو `faster_whisper` اختياري عبر `TASMEE3_ASR_ENGINE`؛ النموذج من Hugging Face/OpenAI Whisper عند التشغيل — **لا يُشحن داخل تطبيق Flutter**.

**لا يوجد** REST تابع لـ Majalis/Supabase داخل مسار التسميع.

---

## 3) جداول Supabase ومخططها؟

**لا يستعمل Supabase على الإطلاق** في `artifacts/mushafi` (لا عميل، لا SQL migrations، لا استدعاءات Auth/DB).

التخزين الفعلي محلي عبر `SharedPreferences`، منها مفاتيح:

| مفتاح تقريبي | المحتوى |
|---|---|
| `tasmee3_sessions` | سجل الجلسات (حدّ أعلى عملي ~50) |
| `tasmee3_ayah_mastery_records_v1` | إتقان الآيات / SRS |
| `tasmee3_daily_goal` | الهدف اليومي |
| `tasmee3_reminders_v1` | التذكيرات |
| `tasmee3_has_seen_onboarding` | onboarding |
| `tasmee3_asr_mode` / `tasmee3_asr_endpoint` / `tasmee3_allow_server_audio_upload` / … | إعدادات المحرك |
| `tasmee3_asr_api_key` | مفتاح API (تخزين محلي) |
| `tasmee3_failed_jobs` | طابور جلسات فاشلة لإعادة المحاولة |

كذلك مستودعات المصحف المحلية (إشارات، ملاحظات، إعدادات قراءة، علامات مراجعة، …) على الجهاز فقط.

**مخطط Supabase: لا ينطبق — لا جداول.**

---

## 4) ما الأصول التي يملكها / لا يملكها «سُنّة» في هذا المسار؟

المقارنة هنا بين ما **موجود داخل `mushafi`** وما **يمتلكه/يشغّله منتج سُنّة (`artifacts/majalis`)** — من واقع المستودع، وليس فتوى ترخيص قانونية نهائية.

### يملكه مسار مصحفي / موجود في الحزمة (مع تحفظ الترخيص حيث وُثّق)

| الأصل | الحالة |
|---|---|
| نص عثماني مضمّن `assets/quran/quran_uthmani.json` (قائمة `{surah,ayah,textUthmani}`) | موجود ومُستخدم؛ الشاشة تفرض على الناشر التحقق من الترخيص قبل النشر — **لا يُنسَب في الكود إلى مصدر بعينه (مثل Tanzil) صراحة** |
| حدود صفحات 604 `assets/quran/quran_page_metadata.json` | موجود؛ يُزامَن من فهرس صفحات majalis عبر `scripts/sync-mushaf-page-metadata.mjs` (حدود فقط بلا نص) |
| خطوط Noto Naskh / Scheherazade (OFL) | موجودة في `assets/fonts/` |
| خادم ASR ككود Python في المستودع | موجود؛ نماذج Whisper تُحمَّل عند التشغيل وليست «ملكية محتوى» للمجلس |
| منطق Flutter للتسميع/المصحف/SRS | ملكية منتج مصحفي داخل monorepo |

### لا يملكه / غير مضمّن / غير مفعّل في مصحفي

| الأصل | الحالة |
|---|---|
| **تسجيلات قرّاء (ملفات صوت)** | غير مضمّنة؛ `RecitersCatalog` يضع `audioBaseUrl: ''` ويمنع الروابط غير المرخصة؛ `quran_meta.json` يذكر everyayah كـ mock مع `supportsAyahTiming: false` |
| **توقيتات آيات/كلمات جاهزة** | غير موجودة كأصول؛ `supportsAyahTiming` / `supportsWordTiming` = false؛ أزمنة الكلمات تأتي فقط من ASR وقت الجلسة إن وُجدت |
| **نماذج Whisper داخل التطبيق** | غير مضمّنة في APK/IPA؛ تُحمَّل على خادم ASR عند تشغيله |
| **تفسير الميسّر كامل** | `assets/tafsir/tafsir_muyassar.json` = `[]` (فارغ) |
| **صور مصحف المدينة / QPC V2 / مضلعات** | غير موجودة في mushafi (مسار سُنّة في majalis مختلف) |
| **حسابات/جلسات سحابية Supabase للمجلس** | غير مستخدمة هنا |
| **مراجعة معلّم أو صفوف** | غير موجودة |

### علاقة مع أصول سُنّة (majalis)

- صفحة metadata في mushafi **مشتقّة/متزامنة** من فهرس صفحات majalis (حدود صفحات).  
- نص القرآن في mushafi **ملف منفصل** عن حزم `public/data/quran*` في majalis — لا مشاركة تشغيلية مباشرة.  
- خادم التسميع **خاص بمصحفي** وليس API إنتاج majalis على Vercel.

---

## 5) نسبة المنطق القابل لإعادة الاستخدام بلا Dart؟

قياس تقريبي حسب **قيمة منطق المنتج** (وليس عدد أسطر الواجهة):

| فئة | قابلة لإعادة الاستخدام بلا Dart؟ | تقدير المساهمة من منطق التسميع |
|---|---|---|
| API خادم ASR + محاذاة + تطبيع عربي + Whisper orchestration (`server/tasmee3_asr`, ~1.3k سطر Python) | **نعم — جاهزة** (HTTP/WS مستقلة عن Flutter) | ~35–40% |
| بيانات قرآن + metadata صفحات (JSON) | **نعم** كعقود بيانات | ~10–15% |
| خوارزميات موصوفة ومكررة في Dart أيضاً: تطبيع، كشف أخطاء، SRS، weak spots (موثّقة باختبارات وحدة) | **نعم كمواصفة/قابل للنقل** — التنفيذ الحالي Dart يحتاج إعادة كتابة بلغة أخرى | ~20–25% |
| واجهة Flutter، Riverpod، SharedPreferences، PDF، إشعارات، PCM native bridges، GoRouter | **لا** بلا Dart/Flutter | ~25–35% |

**خلاصة رقمية:**  
- من **منطق التسميع الجوهري** (تعرف + مطابقة + تتبّع حفظ): نحو **~55–65%** قابل لإعادة الاستخدام أو النقل بلا الاعتماد على Dart (API Python + بيانات + خوارزميات موثّقة).  
- من **حجم الكود الكلي** لـ `lib/features/tasmee3` (~15.9k سطر Dart) + المصحف (~11.3k): النسبة تنخفض إلى نحو **~15–25%** لأن غالبية الأسطر واجهة وتخزين محلي وربط منصّات.

ازدواجية معروفة: محاذاة/أخطاء موجودة في Python (`alignment_utils.py`) **وفي** Dart (`mistake_detection_engine.dart`) — عند الدمج مع سُنّة يُفضَّل مصدر حقيقة واحد للخوارزمية.

---

## خريطة ملفات مرجعية سريعة

```
artifacts/mushafi/
├── lib/features/tasmee3/          # منتج التسميع (UI + domain + application + data)
├── lib/features/mushaf/           # مصحف مرافق مرتبط بالتسميع
├── server/tasmee3_asr/            # FastAPI: /health /transcribe /ws/live
├── assets/quran/                  # uthmani + page metadata
├── assets/tafsir/                 # فارغ حالياً
└── .github path trigger           # workflows/tasmee3_ci.yml → هذا المجلد
```

CI: `.github/workflows/tasmee3_ci.yml` يشغّل `flutter analyze` / `flutter test` وpytest لـ `server/tasmee3_asr` عند تغييرات `artifacts/mushafi/**`.

---

## إجابات مباشرة على أسئلة الجرد

1. **يفعل:** تسجيل صوت + مطابقة نص + تصحيح آلي تقني (كلمات) + تتبّع حفظ/SRS محلي. **لا يفعل:** مراجعة معلّم بشري.  
2. **المنطق:** جلسة وSRS وواجهة على الجهاز؛ ASR المتقدم + forced alignment على خادم Python اختياري (`/transcribe`, `/ws/live`, `/health`).  
3. **Supabase:** لا جداول — تخزين محلي فقط.  
4. **الأصول:** يملك نصاً مضمّناً وmetadata صفحات وكوداً؛ **لا يملك** تسجيلات قرّاء مضمّنة ولا توقيتات آيات جاهزة ولا نماذج Whisper في الحزمة ولا تفسيراً ممتلئاً.  
5. **إعادة الاستخدام بلا Dart:** نحو نصف إلى ثلثي **منطق التسميع** (API+بيانات+خوارزميات)، وأقل بكثير من إجمالي أسطر التطبيق بسبب ضخامة طبقة Flutter.
