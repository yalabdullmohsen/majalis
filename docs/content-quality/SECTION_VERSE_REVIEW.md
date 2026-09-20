# SECTION_VERSE_REVIEW — موجة PR-1 (جرد + تحقق مصدر)

> **قاعدة:** لا يُعاد كتابة النص القرآني آليًا ولا من الذاكرة. أي `TEXT_MISMATCH` = `RELEASE_BLOCKER_CRITICAL`.
>
> المصدر المعتمد للتحقق: `artifacts/majalis/public/data/quran/surah-XXX.json` (لقطة محلية موثّقة — راجع `artifacts/majalis/docs/quran-data-source.md`).
>
> تاريخ الجرد: 2026-09-20 · السكربت: `scripts/inventory-section-verses.mjs`

## ملخص

| مؤشر | قيمة |
|---|---|
| اقتباسات ROUTE_QUOTE | 37 |
| منها type=ayah | 33 |
| type≠ayah (حديث وغيره) | 4 |
| TEXT_MISMATCH / عدم تطابق كامل | 33 |
| توصية REMOVE | 8 |
| مسارات ثيم بلا اقتباس | 4 |

## قرارات منتج مؤكدة

- `/quiz` (تحدي الأسئلة / سين جيم): **REMOVE** بطاقة الآية بالكامل — بلا استبدال. مقدمة مباشرة للمسابقة فقط.
- ممنوع استبدال آية بأخرى في هذه الموجة.
- PR-2+ للمكوّن الموحّد والحذف التنفيذي بعد دمج هذا التقرير.

## سجل الآيات (ROUTE_QUOTE)

| route | sectionId | surah:ayah | integrity | relevance | decision | blocker |
|---|---|---|---|---|---|---|
| `/tafsir` | tafsir | 16:44 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/quran-hub/tajweed` | quran-tajweed | 73:4 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/quran-hub/qiraat` | quran-qiraat | 15:9 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/ulum-quran` | ulum-quran | 38:29 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/quran/surah-stories` | quran-asbab | 12:111 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/quran/people` | quran-figures | 4:164 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/quran-knowledge` | quran-topics | 58:11 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/seerah` | seerah | 21:107 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/tarikh-islami` | islamic-history | 22:41 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/nations` | nations | 29:40 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/prophets` | prophets | 6:83 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/fiqh` | fiqh | 16:43 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/fiqh/usul` | usul-fiqh | 59:7 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/quiz` | qa | 20:114 | TEXT_MISMATCH | IRRELEVANT_TO_SECTION | **REMOVE** | YES |
| `/memorization` | memorization | 54:17 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/islamic-directory` | islam-guide | 58:11 | TEXT_MISMATCH | VERIFIED_BUT_UNNECESSARY | **REMOVE** | YES |
| `/duas` | duas | 40:60 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/adhkar` | adhkar | 13:28 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/tawhid` | aqidah | 112:1 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/lessons` | lessons | 20:114 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/library` | library | 39:9 | TEXT_MISMATCH | VERIFIED_BUT_UNNECESSARY | **REMOVE** | YES |
| `/academic-research` | research | 16:43 | TEXT_MISMATCH | VERIFIED_BUT_UNNECESSARY | **REMOVE** | YES |
| `/islamic-glossary` | glossary | 2:31 | TEXT_MISMATCH | VERIFIED_BUT_UNNECESSARY | **REMOVE** | YES |
| `/universities` | universities | 58:11 | TEXT_MISMATCH | VERIFIED_BUT_UNNECESSARY | **REMOVE** | YES |
| `/institutions` | institutions | 5:2 | TEXT_MISMATCH | VERIFIED_BUT_UNNECESSARY | **REMOVE** | YES |
| `/islamic-landmarks` | islamic-landmarks | 24:36 | TEXT_MISMATCH | VERIFIED_BUT_UNNECESSARY | **REMOVE** | YES |
| `/discover-islam` | discover-islam | 2:137 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/arabic-language` | arabic-language | 12:2 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/maqasid-sharia` | maqasid-sharia | 21:107 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/dalail-nubuwwah` | dalail-nubuwwah | 12:108 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/miracles` | miracles | 41:53 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/stories` | stories | 12:111 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |
| `/islamic-sects` | islamic-sects | 3:103 | TEXT_MISMATCH | NEEDS_SCHOLAR_REVIEW | **NEEDS_SCHOLAR_REVIEW** | YES |

## تفاصيل لكل موضع

### `/tafsir`

- **sectionId:** tafsir (registry match: true)
- **ref:** النحل: ٤٤
- **sourceKey:** 16:44
- **sourcePath:** artifacts/majalis/public/data/quran/surah-016.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** KEEP_IF_TEXT_VERIFIED_ELSE_BLOCK / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 76 حرفًا

### `/quran-hub/tajweed`

- **sectionId:** quran-tajweed (registry match: true)
- **ref:** المزمل: ٤
- **sourceKey:** 73:4
- **sourcePath:** artifacts/majalis/public/data/quran/surah-073.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** KEEP_IF_TEXT_VERIFIED_ELSE_BLOCK / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 31 حرفًا

### `/quran-hub/qiraat`

- **sectionId:** quran-qiraat (registry match: true)
- **ref:** الحجر: ٩
- **sourceKey:** 15:9
- **sourcePath:** artifacts/majalis/public/data/quran/surah-015.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** KEEP_IF_TEXT_VERIFIED_ELSE_BLOCK / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 61 حرفًا

### `/ulum-quran`

- **sectionId:** ulum-quran (registry match: true)
- **ref:** ص: ٢٩
- **sourceKey:** 38:29
- **sourcePath:** artifacts/majalis/public/data/quran/surah-038.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** KEEP_IF_TEXT_VERIFIED_ELSE_BLOCK / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 64 حرفًا

### `/quran/surah-stories`

- **sectionId:** quran-asbab (registry match: true)
- **ref:** يوسف: ١١١
- **sourceKey:** 12:111
- **sourcePath:** artifacts/majalis/public/data/quran/surah-012.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** KEEP_IF_TEXT_VERIFIED_ELSE_BLOCK / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 59 حرفًا

### `/quran/people`

- **sectionId:** quran-figures (registry match: true)
- **ref:** النساء: ١٦٤
- **sourceKey:** 4:164
- **sourcePath:** artifacts/majalis/public/data/quran/surah-004.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** NEEDS_SCHOLAR_REVIEW / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 86 حرفًا

### `/quran-knowledge`

- **sectionId:** quran-topics (registry match: true)
- **ref:** المجادلة: ١١
- **sourceKey:** 58:11
- **sourcePath:** artifacts/majalis/public/data/quran/surah-058.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** NEEDS_SCHOLAR_REVIEW / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 82 حرفًا

### `/seerah`

- **sectionId:** seerah (registry match: true)
- **ref:** الأنبياء: ١٠٧
- **sourceKey:** 21:107
- **sourcePath:** artifacts/majalis/public/data/quran/surah-021.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** KEEP_IF_TEXT_VERIFIED_ELSE_BLOCK / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 51 حرفًا

### `/tarikh-islami`

- **sectionId:** islamic-history (registry match: true)
- **ref:** الحج: ٤١
- **sourceKey:** 22:41
- **sourcePath:** artifacts/majalis/public/data/quran/surah-022.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** NEEDS_SCHOLAR_REVIEW / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 168 حرفًا

### `/nations`

- **sectionId:** nations (registry match: true)
- **ref:** العنكبوت: ٤٠
- **sourceKey:** 29:40
- **sourcePath:** artifacts/majalis/public/data/quran/surah-029.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** NEEDS_SCHOLAR_REVIEW / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 76 حرفًا

### `/prophets`

- **sectionId:** prophets (registry match: true)
- **ref:** الأنعام: ٨٣
- **sourceKey:** 6:83
- **sourcePath:** artifacts/majalis/public/data/quran/surah-006.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** KEEP_IF_TEXT_VERIFIED_ELSE_BLOCK / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 95 حرفًا

### `/fiqh`

- **sectionId:** fiqh (registry match: true)
- **ref:** النحل: ٤٣
- **sourceKey:** 16:43
- **sourcePath:** artifacts/majalis/public/data/quran/surah-016.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** NEEDS_SCHOLAR_REVIEW / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 56 حرفًا

### `/fiqh/usul`

- **sectionId:** usul-fiqh (registry match: true)
- **ref:** الحشر: ٧
- **sourceKey:** 59:7
- **sourcePath:** artifacts/majalis/public/data/quran/surah-059.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** NEEDS_SCHOLAR_REVIEW / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 69 حرفًا

### `/quiz`

- **sectionId:** qa (registry match: true)
- **ref:** طه: ١١٤
- **sourceKey:** 20:114
- **sourcePath:** artifacts/majalis/public/data/quran/surah-020.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** IRRELEVANT_TO_SECTION
- **recommendedAction / finalDecision:** REMOVE / **REMOVE**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 28 حرفًا

### `/memorization`

- **sectionId:** memorization (registry match: null)
- **ref:** القمر: ١٧
- **sourceKey:** 54:17
- **sourcePath:** artifacts/majalis/public/data/quran/surah-054.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** NEEDS_SCHOLAR_REVIEW / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 63 حرفًا

### `/islamic-directory`

- **sectionId:** islam-guide (registry match: true)
- **ref:** المجادلة: ١١
- **sourceKey:** 58:11
- **sourcePath:** artifacts/majalis/public/data/quran/surah-058.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** VERIFIED_BUT_UNNECESSARY
- **recommendedAction / finalDecision:** REMOVE / **REMOVE**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 82 حرفًا

### `/duas`

- **sectionId:** duas (registry match: true)
- **ref:** غافر: ٦٠
- **sourceKey:** 40:60
- **sourcePath:** artifacts/majalis/public/data/quran/surah-040.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** KEEP_IF_TEXT_VERIFIED_ELSE_BLOCK / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 45 حرفًا

### `/adhkar`

- **sectionId:** adhkar (registry match: true)
- **ref:** الرعد: ٢٨
- **sourceKey:** 13:28
- **sourcePath:** artifacts/majalis/public/data/quran/surah-013.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** KEEP_IF_TEXT_VERIFIED_ELSE_BLOCK / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 45 حرفًا

### `/tawhid`

- **sectionId:** aqidah (registry match: true)
- **ref:** الإخلاص: ١
- **sourceKey:** 112:1
- **sourcePath:** artifacts/majalis/public/data/quran/surah-112.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** KEEP_IF_TEXT_VERIFIED_ELSE_BLOCK / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 24 حرفًا

### `/lessons`

- **sectionId:** lessons (registry match: true)
- **ref:** طه: ١١٤
- **sourceKey:** 20:114
- **sourcePath:** artifacts/majalis/public/data/quran/surah-020.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** NEEDS_SCHOLAR_REVIEW / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 28 حرفًا

### `/library`

- **sectionId:** library (registry match: null)
- **ref:** الزمر: ٩
- **sourceKey:** 39:9
- **sourcePath:** artifacts/majalis/public/data/quran/surah-039.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** VERIFIED_BUT_UNNECESSARY
- **recommendedAction / finalDecision:** REMOVE / **REMOVE**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 69 حرفًا

### `/academic-research`

- **sectionId:** research (registry match: true)
- **ref:** النحل: ٤٣
- **sourceKey:** 16:43
- **sourcePath:** artifacts/majalis/public/data/quran/surah-016.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** VERIFIED_BUT_UNNECESSARY
- **recommendedAction / finalDecision:** REMOVE / **REMOVE**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 56 حرفًا

### `/islamic-glossary`

- **sectionId:** glossary (registry match: true)
- **ref:** البقرة: ٣١
- **sourceKey:** 2:31
- **sourcePath:** artifacts/majalis/public/data/quran/surah-002.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** VERIFIED_BUT_UNNECESSARY
- **recommendedAction / finalDecision:** REMOVE / **REMOVE**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 37 حرفًا

### `/universities`

- **sectionId:** universities (registry match: true)
- **ref:** المجادلة: ١١
- **sourceKey:** 58:11
- **sourcePath:** artifacts/majalis/public/data/quran/surah-058.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** VERIFIED_BUT_UNNECESSARY
- **recommendedAction / finalDecision:** REMOVE / **REMOVE**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 82 حرفًا

### `/institutions`

- **sectionId:** institutions (registry match: null)
- **ref:** المائدة: ٢
- **sourceKey:** 5:2
- **sourcePath:** artifacts/majalis/public/data/quran/surah-005.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** VERIFIED_BUT_UNNECESSARY
- **recommendedAction / finalDecision:** REMOVE / **REMOVE**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 42 حرفًا

### `/islamic-landmarks`

- **sectionId:** islamic-landmarks (registry match: null)
- **ref:** النور: ٣٦
- **sourceKey:** 24:36
- **sourcePath:** artifacts/majalis/public/data/quran/surah-024.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** VERIFIED_BUT_UNNECESSARY
- **recommendedAction / finalDecision:** REMOVE / **REMOVE**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 65 حرفًا

### `/discover-islam`

- **sectionId:** discover-islam (registry match: true)
- **ref:** البقرة: ١٣٧
- **sourceKey:** 2:137
- **sourcePath:** artifacts/majalis/public/data/quran/surah-002.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** NEEDS_SCHOLAR_REVIEW / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 57 حرفًا

### `/arabic-language`

- **sectionId:** arabic-language (registry match: true)
- **ref:** يوسف: ٢
- **sourceKey:** 12:2
- **sourcePath:** artifacts/majalis/public/data/quran/surah-012.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** KEEP_IF_TEXT_VERIFIED_ELSE_BLOCK / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 64 حرفًا

### `/maqasid-sharia`

- **sectionId:** maqasid-sharia (registry match: true)
- **ref:** الأنبياء: ١٠٧
- **sourceKey:** 21:107
- **sourcePath:** artifacts/majalis/public/data/quran/surah-021.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** NEEDS_SCHOLAR_REVIEW / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 51 حرفًا

### `/dalail-nubuwwah`

- **sectionId:** dalail-nubuwwah (registry match: true)
- **ref:** يوسف: ١٠٨
- **sourceKey:** 12:108
- **sourcePath:** artifacts/majalis/public/data/quran/surah-012.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** NEEDS_SCHOLAR_REVIEW / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 87 حرفًا

### `/miracles`

- **sectionId:** miracles (registry match: true)
- **ref:** فصّلت: ٥٣
- **sourceKey:** 41:53
- **sourcePath:** artifacts/majalis/public/data/quran/surah-041.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** KEEP_IF_TEXT_VERIFIED_ELSE_BLOCK / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 97 حرفًا

### `/stories`

- **sectionId:** stories (registry match: null)
- **ref:** يوسف: ١١١
- **sourceKey:** 12:111
- **sourcePath:** artifacts/majalis/public/data/quran/surah-012.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** NEEDS_SCHOLAR_REVIEW / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 59 حرفًا

### `/islamic-sects`

- **sectionId:** islamic-sects (registry match: true)
- **ref:** آل عمران: ١٠٣
- **sourceKey:** 3:103
- **sourcePath:** artifacts/majalis/public/data/quran/surah-003.json
- **textIntegrityStatus:** TEXT_MISMATCH (TEXT_MISMATCH)
- **referenceStatus:** PARSED_OK
- **relevanceStatus:** NEEDS_SCHOLAR_REVIEW
- **recommendedAction / finalDecision:** NEEDS_SCHOLAR_REVIEW / **NEEDS_SCHOLAR_REVIEW**
- **reviewerType:** quran_source + scholar
- **notes:** النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي.
- **compare:** اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي
- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول 57 حرفًا

## مسارات ثيم بلا آية في ROUTE_QUOTE

- `/fawaid` — لا اقتباس في ROUTE_QUOTE — نتيجة جرد صريحة.
- `/flashcards` — لا اقتباس في ROUTE_QUOTE — نتيجة جرد صريحة.
- `/sunnah-studies` — لا اقتباس في ROUTE_QUOTE — نتيجة جرد صريحة.
- `/amr-bil-maruf` — لا اقتباس في ROUTE_QUOTE — نتيجة جرد صريحة.

## مواضع إضافية مُشار إليها (لم تُفحَص بايت-لبايت في PR-1)

تتطلب موجة لاحقة من الجرد الموسّع:
- `src/components/home/HomeSacredOfDay.tsx`
- `src/views/ArkanIslamPage.tsx`
- `src/views/MiraclesPage.tsx`
- `src/pages/account/ui/FawaidView.tsx`
- `src/views/AdabTalabIlmPage.tsx`
- `محتوى daily-verse / ticker (آية اليوم)`

## حالات موحّدة (قاموس)

- `VERIFIED_EXACT` — تطابق بايت-لبايت مع المصدر المحلي
- `TEXT_MISMATCH` — اختلاف رسم/تشكيل/اقتطاع → RELEASE_BLOCKER_CRITICAL
- `INVALID_REFERENCE` — مرجع غير قابل للحل
- `REMOVE` / `KEEP` / `NEEDS_SCHOLAR_REVIEW` / `REPLACE_AFTER_REVIEW` (الأخير محظور بلا اعتماد بشري)
