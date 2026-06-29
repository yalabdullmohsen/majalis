# Vision 2.0 — Phase 1 Report: الباحث العلمي الإسلامي

## ما أُضيف

### 1. محرك بحث موسّع (`corpus-search.mjs`)
بحث موحّد في:
- القرآن (114 سورة)
- التفسير (روابط `/quran/tafsir`)
- الحديث (الأربعون النووية)
- المتون (10 متون رئيسية)
- العلماء (`sheikhs` — موثقون فقط)
- المساجد (`mosques`)
- الحلقات (`quran_scientific_circles` — منشورة فقط)
- الأبحاث (`fiqh_council_items` — published)
- المسارات (`learning_paths`)
- سؤال وجواب (`sin_jeem_questions`)

**لا بيانات Placeholder** — النتائج من DB أو فهارس ثابتة موثقة فقط.

### 2. API Autocomplete
- `GET /api/search-autocomplete?q=...`
- اقتراحات: سور، أحاديث، دروس، موضوعات علمية
- مدمج في `SearchSuggestions` مع debounce 200ms

### 3. تحسين `unifiedSearch`
- دمج `searchExtendedCorpus` مع RPC و semantic و platform bridge
- أنواع جديدة في ranker و url-resolver

### 4. واجهة الباحث العلمي
- `/search` و `/scholar-search` — نفس الصفحة
- عنوان: **الباحث العلمي الإسلامي**
- إصلاح short-circuit: لا تُخفى نتائج legacy عند وجود نتائج ذكية
- فلاتر موسّعة (14 نوع محتوى)

### 5. خارطة Vision 2.0
- `reports/vision-2.0-roadmap.md` — 18 مرحلة مع تبعيات

## الصفحات
| المسار | الوصف |
|--------|--------|
| `/search`, `/search/:q` | الباحث العلمي |
| `/scholar-search`, `/scholar-search/:q` | alias |

## API جديدة
| Endpoint | Method |
|----------|--------|
| `/api/search-autocomplete` | GET |

## الاختبارات
```bash
node artifacts/majalis/scripts/test-vision-2-phase1-scholar-search.mjs
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
```

## العقبات المتبقية
1. **Supabase RPC** `search_platform` — يحتاج migration على الإنتاج
2. **Semantic search** — يعتمد على embeddings + service role
3. **مساجد/علماء** — بيانات DB قليلة حتى يُثرى المحتوى
4. **المراحل 2–18** — مخططة في roadmap، كل مرحلة PR مستقل

## الجاهزية
Phase 1 **جاهزة للدمج** — البحث يعمل offline (قرآن/حديث/متون) وonline مع Supabase.

**الفرع:** `cursor/vision-2-phase1-scholar-search-92e6`
