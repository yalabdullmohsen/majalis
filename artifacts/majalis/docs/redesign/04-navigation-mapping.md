# Checkpoint 4 — Navigation Mapping

## Bottom Navigation (Mobile)

| القسم الحالي | Route القديم | المكان الجديد | تغيّر الاسم؟ | تغيّر Route؟ | السبب |
|--------------|---------------|---------------|--------------|--------------|-------|
| الرئيسية | `/` | Bottom 1 | لا | لا | — |
| القرآن | `/mushaf` | Bottom 2 | لا | لا | immersive داخلي |
| الصلاة | `/prayer-times` | Bottom 3 | لا | لا | immersive داخلي |
| حسابي | `/my-learning` | **المزيد / الحساب** | يظهر «حسابي» في المزيد | لا | إفساح Bottom لـ«التعلم» |
| التعلم | `/lessons` | Bottom 4 (جديد ظاهرياً) | تسمية «التعلم» | لا (route موجود) | طلب المنتج: مسار تعلم واضح |
| المزيد | sheet | Bottom 5 | لا | لا | مركز أقسام + إعدادات + حسابي |

Active لـ«التعلم» يشمل: `/lessons`, `/learn`, `/learning`, `/quiz`, `/flashcards`, `/cards`.

## TopSectionBar
- **الجوال:** مخفي (يُستبدل بالشريط السفلي + المزيد) لتقليل الازدحام.
- **≥880px:** يبقى كشريط أقسام أفقي للوصول السريع.

## Desktop
- NavBar الحالي يبقى مع PRIMARY_NAV؛ ألوان/مسافات IGDS عبر الجسر الرمزي.
- لا تغيير routes.

## Immersive
بدون تغيير: `/mushaf`, `/prayer-times`, `/quran-hub`, `/quran/recitation-test-ai` تخفي الكروم العام.
