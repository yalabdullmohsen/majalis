# Navigation Cleanup Plan

## Removed Sections

| القسم | أين وُجد | نوعه | مسار |
|---|---|---|---|
| المكتبة / المكتبة العلمية | TopSectionBar، SideNav، More، FEATURED، SiteMap، Search | tab / card / nav | `/library` |
| آخر المستجدات | SideNav، More، ودجت الرئيسية | nav / widget | `/updates` |
| الفتاوى | بوابة الفقه/المجمع (`/fatwa` → `/fiqh` مسبقاً، `/fiqh-council/fatwas`) | route فرعي | لا يظهر كقسم رئيسي |
| استكشف المعرفة | SideNav، More، كتالوج الرئيسية | nav / card | `/knowledge-graph` |
| البحث العلمي / الأبحاث الشرعية | SideNav، More، navigation | nav | `/academic-research` |

## Merged Sections

### حسابي

يدمج معه:

- البطاقات المراجعة (`/flashcards`) — قسم داخل `/my-learning#flashcards`

### المناسبات والدروس (`/occasions-lessons`)

يدمج معه:

- المناسبات الإسلامية (`/occasions`)
- تقويم الدروس (`/calendar`)

### القرآن وعلومه (`/quran-knowledge`)

يدمج معه:

- علوم القرآن (`/ulum-quran`)
- فهرس القرآن / فهرس السور (`/quran/surahs`)
- أسباب النزول / قصص السور (`/quran/surah-stories`)
- قصص القرآن (نفس مسار القصص أعلاه)

### الحفظ والمراجعة (`/memorization`)

يدمج معه:

- اختبارات الحفظ القرآني (`/quran-memorization`)
- خطط الحفظ والمراجعة (`/quran/memorization-plans`)

### الدليل الإسلامي (`/islamic-directory`)

يدمج معه:

- دليل المؤسسات الإسلامية (`/institutions`)
- المشاهد والمساجد (`/islamic-landmarks`) — الاسم كما في الواجهة الحالية (ملاحظة مراجعة: احتمال التباس لفظ «المشاهد»)

## Sidebar Changes

- إزالة «من نحن» من القائمة الجانبية وقائمة المزيد فقط.
- الإبقاء على صفحة `/about` والـ footer.
- القائمة المختصرة المستهدفة: الرئيسية · القرآن · القرآن وعلومه · الحديث والسنة · الفقه والأحكام · الحفظ والمراجعة · المناسبات والدروس · الدليل الإسلامي · الصلاة · حسابي · الإعدادات.
