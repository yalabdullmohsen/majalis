# هيكل قارئ المصحف بنمط React Native

واجهة تنظيمية تطابق رسم RN دون نقل الملفات الفعلية:

```
src/quran/
  assets/       // صور، خطوط، روابط صوت
  components/   // بطاقة آية، شريط تحكم، قوائم
  screens/      // شاشة القراءة، الفهرس، الإعدادات (= views)
  hooks/        // صوت، تفضيلات، محرّك
  context/      // حالة القراءة العالمية + الوضع الليلي
  services/     // تخزين، DB، جلب، محرّكات صوت/تفسير
  constants/    // قائمة السور، قرّاء، أحجام خط، سرعات
```

## التعيين إلى المسارات الحالية

| RN sketch | هذا المجلد | التنفيذ الفعلي |
|-----------|------------|----------------|
| `/assets` | `quran/assets` | `lib/quran-audio`, `styles/quran*.css`, `public/` |
| `/components` | `quran/components` | `components/Quran*`, `components/quran/*` |
| `/screens` | `quran/screens` | `views/*` (صفحات المسارات) |
| `/hooks` | `quran/hooks` | `hooks/useQuran*`, `useAyahPlayer`, … |
| `/context` | `quran/context` | `core/quran/QuranEngineContext` + ThemePreference |
| `/services` | `quran/services` | `core/{audio,quran,tafseer}`, `lib/quran-*` |
| `/constants` | `quran/constants` | `lib/quran-surah-list`, reciters, font-size |

## الاستيراد

```ts
import { screens, hooks, constants } from "@/quran";
// أو
import { QuranViewer } from "@/quran/components";
import { MushafReaderScreen } from "@/quran/screens";
import { useQuranAudioToggle } from "@/quran/hooks";
```

لا تُكرَّر المنطق هنا — البراميل تعيد التصدير فقط.
