# مصادر الصوت (تلاوة / أذان / تفسير صوتي)

هذا المستند “مرجع واحد” يوضح مصادر ملفات الصوت التي يستهلكها التطبيق، ويستخدمها قسم/شاشة **المصادر والتراخيص** داخل التطبيق (في حال تفعيلها).

## تلاوة القرآن (Ayah-level)

### EveryAyah (مقسّمة حسب الآية — أفضل لمزامنة الإبراز)
- النمط: `https://everyayah.com/data/{reciter_folder}/{SSS}{AAA}.mp3`
- حيث `SSS` رقم السورة بثلاث خانات، و`AAA` رقم الآية بثلاث خانات.
- الجودة المستخدمة للمزامنة (وفق مواصفة المشروع): `128kbps` وما فوق.

#### القرّاء (المعتمدون كبداية من `audio-registry.json`)
| reciterId | القارئ | جودة | reciter_folder | مثال URL |
|---|---|---:|---|---|
| `husary` | محمود خليل الحصري | 128 | `Husary_128kbps` | `https://everyayah.com/data/Husary_128kbps/002255.mp3` |
| `minshawi` | محمد صديق المنشاوي | 128 | `Minshawy_Murattal_128kbps` | `https://everyayah.com/data/Minshawy_Murattal_128kbps/002255.mp3` |
| `alafasy` | مشاري راشد العفاسي | 128 | `Alafasy_128kbps` | `https://everyayah.com/data/Alafasy_128kbps/002255.mp3` |

### احتياط Islamic Network CDN (عند فشل everyayah)
- النمط: `https://cdn.islamic.network/quran/audio/128/{edition}/{ayahNumber}.mp3`

## تلاوة القرآن (Surah-level — استماع متصل وبمسار كامل السورة)

يستعمل التطبيق مسارات `mp3quran.net` لمسارات السورة كاملة عند الحاجة للاستماع غير المقيد بالآية:
- `mp3quran.net` (Full-surah): `${surahBaseUrl}/${SSS}.mp3`

## الأذان

الأذان داخل التطبيق يعتمد على حزمة أصول محلية `/audio/adhan/*` (تشغيل داخل التطبيق أو مع استمرار Background Mode)، مع مقاطع قصيرة لنغمة إشعار iOS ضمن `/sounds/adhan/*.caf` (≤30 ثانية).

كما يوجد احتياط CDN (مشابه لمستودع mohsalvi/adhan-audio):
- CDN: `https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main`

### حالة “الفجر” منفصل
- في الكتالوج، الفجر يُحل عبر `fajrUrl` (عند توفره)، مع إبقاء باقي الصلوات على `general`.

## التفسير الصوتي

التفسير الصوتي يعتمد على كتالوج `tafsir-audio-catalog.json` المعرّف في `public/data/`.
- حالياً قد تكون الحزمة فارغة بحسب سياسة الترخيص في المشروع.

