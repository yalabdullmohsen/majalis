-- ═══════════════════════════════════════════════════════════════════════════
-- universities_verify_original7_v1.sql
--
-- التحقق الفردي من الجامعات السبع الأصلية التي كانت last_reviewed_by=
-- "بيانات تجريبية — يحتاج تحقق" رغم is_published=true (أُنجزت الدفعة الثامنة
-- الجديدة في universities_expand_v1.sql دون لمس هذه السبع). كل صف حُقِّق
-- عبر WebSearch مباشر وقت الكتابة (2026-07-18).
--
-- اكتشاف حقيقي واحد: صف "jordan-islamic-sciences" كان website_url خاطئاً
-- تماماً — aabu.edu.jo هو موقع "جامعة آل البيت" (جامعة عامة عادية، لا علاقة
-- مباشرة بالتخصص الشرعي كاسمها)، بينما "جامعة العلوم الإسلامية العالمية"
-- (World Islamic Sciences and Education University / WISE) — المؤسسة
-- الحقيقية المقصودة بالاسم العربي في هذا الصف — موقعها الرسمي wise.edu.jo.
-- صُحِّح الرابط والاسم الإنجليزي معاً (كان name_en يقول خطأً "Al al-Bayt
-- University" وهي مؤسسة مختلفة تماماً).
--
-- الست الأخرى (IIUM ماليزيا، الجامعة الإسلامية بالمدينة، جامعة الإمام محمد
-- بن سعود، جامعة قطر-كلية الشريعة، جامعة أم درمان الإسلامية، جامعة أم
-- القرى) تحقّقت أن أسماءها ومواقعها الرسمية صحيحة كما هي — لم تُعدَّل، فقط
-- حُدِّث last_reviewed_by لتأكيد التحقق الفعلي.
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE universities
SET
  website_url = 'https://www.wise.edu.jo',
  name_en = 'World Islamic Sciences and Education University (WISE)',
  about = 'جامعة أردنية حكومية تأسست عام 2008 تحت مظلة مؤسسة آل البيت الملكية للفكر الإسلامي، متخصصة في العلوم الإسلامية والشريعة. (تصحيح: الرابط السابق aabu.edu.jo كان يخص جامعة آل البيت وهي مؤسسة مختلفة).',
  last_reviewed_by = 'تحقق يدوي عبر بحث مباشر — 2026-07-18 (تصحيح: website_url وname_en كانا يشيران خطأً لجامعة آل البيت)',
  last_updated_at = now()
WHERE slug = 'jordan-islamic-sciences';

UPDATE universities
SET last_reviewed_by = 'تحقق يدوي عبر بحث مباشر — 2026-07-18 (الاسم والموقع الرسمي صحيحان، لا تعديل)',
    last_updated_at = now()
WHERE slug IN (
  'iium-malaysia',
  'imam-university',
  'islamic-university-madinah',
  'qatar-faculty-shariah',
  'sudan-university-islamic',
  'umm-al-qura-university'
);
