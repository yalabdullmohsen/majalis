# P0 Baseline — Sunnah Educational Mushaf

تاريخ: 2026-09-15  
فرع: `cursor/sunnah-educational-mushaf-tafsir`  
أساس: `192468dfb` (وردة/ضفيرة/كارتوش مدمجة)

## Quran Integrity
| فحص | نتيجة |
|---|---|
| mushaf-604-integrity | pages=604 ayahs=6236 lineSlots=8820 |
| Page/Line Mapping | لم تُمسّ |
| النص القرآني / التشكيل | لم يُمسّ |

## Geometry المحمية
- `--mushaf-ayah-mark-size: 0.98em`
- بلا letter-spacing / scaleX / auto-fit على النص القرآني

## P2 — التفسير
- مصادر واجهة المصحف: الميسر | السعدي | ابن كثير فقط
- أُزيل قصّ UI «مختصر/مطول»
- `fetchGenRef` + `activeEditionRef` لمنع استجابة قديمة
- بديل محلي للميسّر فقط عند فشل الشبكة (لا خلط مصادر)

## P3 — التلاوات
سجل الصوت الحالي: `style: "مرتل"` فقط للقرّاء الموثّقين.
لا مجود/معلم في الواجهة حتى يوجد مورد مستقل + verified + حقوق.
`RecitationEdition` + بوابة `mushaf-recitation-editions-gate`.
Offline = false حتى مراجعة حقوق صريحة.
