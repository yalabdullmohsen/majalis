# P0 — تدقيق مصادر وحقوق مصحف سُنّة
**Authentic Printed Mushaf Experience — Pre-implementation Audit**  
**التاريخ:** 2026-09-14  
**الفرع:** `cursor/sunnah-authentic-mushaf-p0`  
**المرجع البصري:** صور PDF Viewer المرفقة (تكوين هندسي فقط — ليست مصدر أصول)

---

## 1) مصادر البيانات (مثبتة)

| البند | القيمة | المسار / الدليل |
|--------|---------|------------------|
| Quran data source | `quran-v2` JSON لكل صفحة | `public/data/quran-v2/pages/page-001…604.json` |
| الرواية | حفص عن عاصم | `SOURCE.json` → `mushafLabel: QCF V2 / hafs v2` |
| mushafId | **1** فقط | `SOURCE.json` · `forbiddenMushafIds: [2]` |
| Page mapping | Madinah 604 v1 | `pageMappingVersion: "madinah-604-v1"` · 604 ملف صفحة |
| Line mapping | QPC layout v2 | `lineMappingVersion: "qpc-layout-v2"` · حقل `line_number` |
| Renderer | `NewMushafReader` | `src/features/mushaf-reader/NewMushafReader.tsx` |
| Font | QPC V2 per-page WOFF2 | `public/fonts/qpc-v2/p{n}.woff2` (604) |
| Font license | KFGQPC/QUL — **غير موقّع للمتاجر** | `docs/LICENSES.md` · `fontLicenseId` pending |
| Pages | **604** | عدّ الملفات |
| Lines / page | **15** (عادي) | `linesPerPage: 15` · `maxLineNumberSeen: 15` |
| Surah metadata | `chapters.json` + صفوف `surah-header` | `public/data/quran-v2/chapters.json` |
| Juz / Hizb / Rub | حقول الآية في JSON الصفحة | `juz_number`, `hizb_number`, `rub_el_hizb_number` |
| Sajdah | `sajdah_number` في البيانات | 14 موضعًا موثّقًا |
| Waqf | مدمج في الحروف/الرموز داخل النص | لا ملف وقف منفصل — **لا تعديل يدوي** |
| Cache version | `sms-2026-09-24-gold-page-numbers` | `sunnah-mushaf-signature-preset.ts` |
| Fingerprint | codesSha / textsSha / verseOrderSha | `SOURCE.json` → `fingerprint` |
| ayahCount | 6236 | fingerprint |
| wordCount | 83665 | fingerprint |

---

## 2) توافق الخط × Line Mapping (شرط البدء)

| فحص | نتيجة |
|------|--------|
| عدد الخطوط = عدد ملفات الصفحات | ✅ 604 = 604 |
| `mushafId === 1` فقط | ✅ |
| سقف الخط الآمن | **`SIGNATURE_FONT_SIZE_MAX_PX = 24`** |
| fontSize ≥ 25 | ❌ يكسر `mushaf-measure` (lineOverflow) — موثّق في تقارير typography recovery |
| تغيير page/line mapping | ❌ ممنوع بدون مصدر مرخّص متكامل وإعادة تحقق SHA |
| `hasPdf` في القارئ | يجب أن يبقى `false` |

**الخلاصة:** الخط الحالي وLine Mapping متوافقان مع البيانات. لا حاجة لتغيير الرواية أو خرائط الصفحات لمطابقة *تكوين* المرجع إن بقي المصدر Madinah 604 / mushaf=1.

---

## 3) حقوق المرجع البصري (الصور الأربع)

| سؤال | جواب |
|-------|------|
| هل PDF/زخارف المرجع موجودة مرخّصة في المستودع؟ | **لا** — لا صور صفحات مدينة ولا PDF مصحف في الإنتاج |
| هل يجوز استخراج زخارف/خط من الصور؟ | **ممنوع** (سياسة المهمة + LICENSES) |
| هل يجوز شحن PDF كصفحات؟ | **ممنوع** — يكسر التفاعل والبحث والبوابات |
| مسار سُنّة | زخارف **أصلية** (`createdForSunnah: true`) بأسلوب مطبعي دون نسخ حرفي |

راجع: `docs/mushaf/SUNNAH_MUSHAF_ASSET_REGISTRY.md`

---

## 4) قرار GO / STOP

### ✅ GO (مسموح في P1+ ضمن القيود)
- إطار صفحة عاجي أصلي + حدود ذهبية رفيعة (SVG/CSS أصلي).
- Cartouche أسماء سور أصلي لسُنّة.
- Medallion فاتحة أصلي (ليس نسخة من الصورة).
- Verse markers أصلية.
- طبقة علامات حزب/ربع في الهامش من البيانات المعتمدة.
- فصل Reader Chrome عن Geometry الصفحة.
- Tokens ألوان مركزية.
- تحسين الهامش/الإحساس البصري **دون** رفع fontSize فوق 24 ودون scaleX/auto-fit.

### 🛑 STOP (يتطلب اعتماد مالك المشروع + مصدر مرخّص)
- تغيير `pageMappingVersion` أو `lineMappingVersion`.
- مزامنة `mushaf≠1`.
- تعديل أي حرف/تشكيل/وقف/سجدة/ترتيب كلمات.
- استخراج أصول من صور المرجع أو Tracing مطابق.
- شحن `QCF_BSML` أو صور صفحات مدينة دون توقيع KFG/QUL.
- رفع `fontSize` إلى 25+.
- تخفيض عتبات CI أو توسيع tolerance.

---

## 5) خط أساس سلامة القرآن (يُثبَّت قبل أي PR بصري)

من `public/data/quran-v2/SOURCE.json` → `fingerprint`:

```
codesSha:      b21f6bdad370b8a6feea12236c844f809b3bdf9c191d312ac216543ed3c3ab7d
textsSha:      d7d6cae756ecb5fafe2885e9ab0f7193e9771864216b93ceb364b80a39a6ae26
verseOrderSha: c7fb16ced00ce9d1cacd0d1405d9ad2958219e1f7bbe89c1ae37899d84fb1264
ayahCount:     6236
wordCount:     83665
mushafId:      1
```

بوابة التثبيت: `src/lib/__tests__/mushaf-authentic-p0-baseline-gate.test.ts`

أي اختلاف في checksum → إيقاف الدمج فورًا.

---

## 6) حالة الرأس (بعد #2025)

- اسم السورة **محذوف** من الرأس العام.
- الجزء يمين / الحزب يسار (RTL).
- اسم السورة داخل إطار بداية السورة فقط.

---

## 7) الخطوة التالية (P1) — بعد اعتماد هذا التدقيق

1. إنشاء أصول زخرفية أصلية مسجّلة في Asset Registry.
2. `AuthenticMushafPageFrame` + tokens.
3. `SunnahSurahTitleCartouche` + `SunnahFatihaMedallionLayout`.
4. `MushafMarginMarkerLayer`.
5. Reader Chrome overlay منفصل.
6. **بدون** تغيير mapping أو fontSize أو نص القرآن.

---

## 8) إقرار

- لم يُستخرج أي أصل من الصور المرجعية في P0.
- لم يُعدَّل نص القرآن ولا Page/Line Mapping في P0.
- هذا المستند تدقيق فقط؛ التنفيذ البصري يبدأ في P1 تحت قيود STOP أعلاه.
