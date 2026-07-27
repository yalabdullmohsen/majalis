#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""تحديدُ تخريجِ كلِّ حديثٍ منسوبٍ إلى النبي ﷺ بلا تخريجٍ في محتوًى مخزَّن.

نظيرةُ `locate-quran-quotes.py` (ج-٢٦١) لكن لبُعد الحديث: هناك كان المستنَدُ
نصَّ المصحف المحلّي، وهنا نصُّ الصحيحين في طبعةٍ مسمّاة على المكتبة الشاملة
عبر `verify-hadith-citations.py` (ج-٢٢٨). والمشكلةُ التي تعالجها واحدة:
محتوًى منشورٌ ينسب لفظًا إلى النبي ﷺ بين «…» **بلا تخريجٍ مسمًّى**، فيبقى
النصُّ بلا مستنَدٍ يُراجَع عليه.

🔑 **القاعدةُ التي تحكم الأداة كلَّها: لا يُخرَّج حديثٌ من الذاكرة.** لا يُثبَت
تخريجٌ إلا بمقابلةِ لفظِ المتن بنصّ الكتاب المسمَّى حرفًا بعد التطبيع، وما لم
يُوقَف له على موضعٍ **يُترَك ويُسجَّل ولا يُخترَع له تخريج**.

وحدُّ ما تُثبته الأداةُ **الصحيحان وحدَهما** (البخاري ط السلطانية، ومسلم ت عبد
الباقي): لأنّ ثبوتَ اللفظِ فيهما يُغني عن الحكم على الإسناد، بخلاف السنن التي
يلزم فيها تصريحٌ بالدرجة لا تستخرجه المقابلةُ اللفظية ⇒ ما لم يوجد في الصحيحين
يُردّ إلى النظر البشريّ. وصيغةُ التخريج تُخبر عن الموضع فحسب: «رواه البخاري
(١٩٢٣)»، أو «رواه البخاري (٢٧٩٠) ومسلم (١٨٧٦)» إن وُجد فيهما — ولا تُطلَق
عبارةُ «متفق عليه» لأنها حكمٌ اصطلاحيّ لا تُثبته مقابلةُ لفظ.

ما تلتقطه الأداةُ وما تدَعُه:
  * تلتقط الاقتباسَ المسبوقَ **بإسنادٍ صريح** إلى النبي ﷺ (قال ﷺ، لقوله ﷺ،
    الحديث:، …) وحدَه — فسائرُ ما بين «…» في المتون أذكارٌ وأدعيةٌ وأقوالُ
    فقهاءَ لا تُخرَّج تخريجَ المرفوع.
  * وتدَعُ ما تخريجُه حاضرٌ برقمٍ (ALREADY_TAKHRIJ)، وتُعلِم بما تخريجُه ناقصٌ
    بلا رقم (PARTIAL_TAKHRIJ: «رواه مسلم» بلا موضع) فلا تلمسُه — إذ إصلاحُه
    تعديلُ نصٍّ قائمٍ لا إضافةَ ناقص.

الاستعمال:
    python3 scripts/locate-hadith-quotes.py rows.json --field body
    python3 scripts/locate-hadith-quotes.py rows.json --field body --sql out.sql
    python3 scripts/locate-hadith-quotes.py --self-test        # بلا شبكة

رمز الخروج: 0 إن خُرِّج كلُّ مرفوعٍ غيرِ مخرَّج، و1 إن بقي واحدٌ بلا موضع.
"""
from __future__ import annotations
import argparse
import importlib.util
import json
import os
import re
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))


def _load_verifier():
    spec = importlib.util.spec_from_file_location(
        'verify_hadith_citations', os.path.join(_HERE, 'verify-hadith-citations.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


EN2AR = str.maketrans('0123456789', '٠١٢٣٤٥٦٧٨٩')

# الاقتباس نفسُه
QUOTE_RE = re.compile(r'«([^»]{3,})»')

# إسنادٌ صريحٌ إلى النبي ﷺ يسبق الاقتباس مباشرةً (يُفحَص آخرُ ٦٠ حرفًا قبله).
# ملحوظة: «قال ﷺ» و«لقوله ﷺ» و«الحديث:» وما جرى مجراها؛ ولا يكفي ورودُ ﷺ
# في السياق بعيدًا عن الاقتباس، لأنّ الوصفَ ليس اقتباسًا.
ATTR_RE = re.compile(
    r'(?:'
    r'(?:قال|قوله|لقوله|لقول|يقول|روى|ورد|ثبت|جاء)\s*'
    r'(?:رسولُ?\s+الله|النبيّ?|عنه|عن\s+النبيّ?)?\s*ﷺ\s*[:،]?'
    r'|ﷺ\s*:'
    r'|(?:في\s+)?الحديث(?:\s+الشريف)?\s*:'
    r')\s*$'
)

# تخريجٌ حاضرٌ بعد الاقتباس (تُقرأ النافذةُ حتى الاقتباس التالي فقط)
TAKHRIJ_RE = re.compile(r'رواه|أخرجه|متفق\s+عليه|حديث\s*رقم|في\s+الصحيحين')
DIGIT_RE = re.compile(r'[0-9٠-٩]')

# الصحيحان وحدَهما — بترتيب الاستشهاد المتعارَف
SAHIHAYN = (('bukhari', 'البخاري'), ('muslim', 'مسلم'))
ACCEPTED = ('OK', 'OK_NORMALIZED', 'OK_GAPPED')

# ⚠️ حارسا الموضع: لا تكفي مطابقةُ اللفظِ في صفحةٍ من الصحيح ليصحّ أن يُقال
# «رواه البخاري (كذا)» — فقد يقع اللفظُ في **ترجمة الباب** لا في المسنَد،
# ويُعلَّق فيها قولُ صحابيٍّ موقوفًا فيُنسَب خطأً إلى النبي ﷺ وبرقمِ حديثٍ
# ليس هو. وقد أوقعت هذه العلّةُ في خطأ فعليّ حال بناء الأداة: قولُ ابن مسعود
# «إنَّ اللهَ لم يجعل شفاءكم فيما حرَّم عليكم» معلَّقٌ في ترجمة «باب شراب
# الحلواء والعسل» ⇒ كان سيُخرَّج «رواه البخاري (٥٦١٣)» وهو موقوفٌ لا مرفوع.
ISNAD_RE = re.compile(r'حَدَّثَنَ?[اِي]|حَدَّثَنِي|أَخْبَرَنَ?[اِي]|أَنْبَأَنَا'
                      r'|حدثن[اي]|أخبرن[اي]|أنبأنا')
# ⚠️ الطبعتان تختلفان في رسم الصلاة على النبي: ط السلطانية تكتبها بالرمز «ﷺ»،
# وط عبد الباقي لمسلم تكتبها **مبسوطةً** «صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ» ⇒ فحصُ
# الرمز وحدَه كان يردّ كلَّ أحاديث مسلم بلا استثناء (وهو خللٌ ظهر عيانًا عند
# بناء الأداة: سقطت مواضعُ مسلم كلُّها من التخريج).
MARFU_RE = re.compile(r'ﷺ')
MARFU_SPELLED = 'صلي الله عليه وسلم'      # بعد التطبيع (ى ⇐ ي)
GAP_RE = re.compile(r'\.\.\.|…')


def is_marfu(text: str, vh) -> bool:
    return bool(MARFU_RE.search(text or '')) or MARFU_SPELLED in vh.normalize(text or '')


def check_position(quote: str, text: str, vh):
    """أهذا اللفظُ مرفوعٌ في مسنَدِ الحديث نفسِه؟ يرجع (مقبول، سببُ الردّ)."""
    if not is_marfu(text, vh):
        return False, 'NOT_MARFU'          # لا إسنادَ إلى النبي ﷺ في المطابَق
    m = ISNAD_RE.search(text)
    if not m:
        return True, None                  # لا ترجمةَ تسبق المسنَد أصلًا
    head, body = text[:m.start()], text[m.start():]
    parts = [p for p in GAP_RE.split(quote) if vh.normalize_nospace(p)]
    nb, nh = vh.normalize_nospace(body), vh.normalize_nospace(head)
    in_body = all(vh.normalize_nospace(p) in nb for p in parts)
    in_head = all(vh.normalize_nospace(p) in nh for p in parts)
    if in_head and not in_body:
        return False, 'HEADING_ONLY'       # في ترجمة الباب لا في المسنَد
    return True, None


def scan(text: str):
    """يرجع قائمةَ الاقتباسات المرفوعة في نصٍّ واحد مع حالةِ تخريجِ كلٍّ منها.

    كلُّ عنصر: {start, end, quote, status} حيث status واحدٌ من:
      NEEDS_TAKHRIJ    — منسوبٌ إلى النبي ﷺ بلا تخريجٍ أصلًا  ⇒ يُعالَج
      PARTIAL_TAKHRIJ  — تخريجٌ بلا رقمِ حديث («رواه مسلم») ⇒ يُعلَم ولا يُلمَس
      ALREADY_TAKHRIJ  — تخريجٌ برقم                          ⇒ يُترَك
    وما ليس مسبوقًا بإسنادٍ صريح لا يُدرَج أصلًا.
    """
    out = []
    for m in QUOTE_RE.finditer(text or ''):
        before = (text[max(0, m.start() - 60):m.start()]).rstrip()
        if not ATTR_RE.search(before):
            continue
        after = text[m.end():m.end() + 120]
        nxt = after.find('«')
        window = after[:nxt] if nxt >= 0 else after
        if TAKHRIJ_RE.search(window):
            status = 'ALREADY_TAKHRIJ' if DIGIT_RE.search(window) else 'PARTIAL_TAKHRIJ'
        else:
            status = 'NEEDS_TAKHRIJ'
        out.append({'start': m.start(), 'end': m.end(),
                    'quote': m.group(1).strip(), 'status': status})
    return out


def takhrij_for(quote: str, vh, verbose: bool = False):
    """يقابل اللفظَ بالصحيحين، ويرجع (نصُّ التخريج أو None، تفصيلُ المقابلة).

    لا يُثبَت موضعٌ إلا بدرجةِ مقابلةٍ لفظيّة (OK/OK_NORMALIZED/OK_GAPPED)؛
    وPARTIAL — أي أنّ أكثرَ كلماته موجودةٌ بفجواتٍ غير معلَنة — **لا يُقبَل**
    لأنّ اللفظ حينئذٍ ليس هو لفظَ الكتاب فلا يصحّ أن يُنسَب إليه برقمه.
    """
    found, detail = [], {}
    for key, name in SAHIHAYN:
        try:
            r = vh.report(quote, key, verbose=verbose)
        except Exception as exc:                       # عطبُ شبكةٍ لا حكمُ غياب
            detail[key] = {'grade': 'ERROR', 'error': str(exc)}
            continue
        detail[key] = {'grade': r['grade'], 'number': r.get('number'), 'url': r.get('url')}
        if r['grade'] in ACCEPTED and r.get('number'):
            ok, why = check_position(quote, r.get('text') or '', vh)
            if not ok:
                detail[key]['rejected'] = why
                continue
            found.append((name, r['number']))
    if not found:
        return None, detail
    body = ' و'.join('%s (%s)' % (n, str(num).translate(EN2AR)) for n, num in found)
    return 'رواه ' + body, detail


def process(text: str, vh, limit_ids=None, verbose: bool = False):
    """يُعيد (النصّ بعد إضافة التخريج، سجلّ كلِّ اقتباسٍ مرفوع)."""
    hits = scan(text)
    log, out, pos = [], [], 0
    for h in hits:
        rec = {'quote': h['quote'], 'status': h['status']}
        if h['status'] != 'NEEDS_TAKHRIJ':
            log.append(rec)
            continue
        tag, detail = takhrij_for(h['quote'], vh, verbose=verbose)
        rec['detail'] = detail
        if tag:
            out.append(text[pos:h['end']])
            out.append(' (%s)' % tag)
            pos = h['end']
            rec['status'] = 'TAKHRIJ_ADDED'
            rec['tag'] = tag
        else:
            rec['status'] = 'NOT_IN_SAHIHAYN'
        log.append(rec)
    out.append(text[pos:])
    return ''.join(out), log


# ── الاختبارُ الذاتيّ: يفحص الالتقاطَ والتصنيفَ وصياغةَ التخريج بلا شبكة ──────
_SAHUR = ('حَدَّثَنَا آدَمُ: حَدَّثَنَا شُعْبَةُ عَنْ أَنَسٍ ﵁ قَالَ: قَالَ النَّبِيُّ ﷺ : '
          '«تَسَحَّرُوا، فَإِنَّ فِي السَّحُورِ بَرَكَةً.»')
# ط عبد الباقي لمسلم تبسط الصلاة على النبي ولا ترمز لها — وهو ما يختبره الضبط
_SAHUR_MUSLIM = ('حَدَّثَنَا يَحْيَى بْنُ يَحْيَى. أَخْبَرَنَا هُشَيْمٌ، عَنْ أَنَسٍ قَالَ: قَالَ '
                 'رَسُولُ اللهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ: "تَسَحَّرُوا فَإِنَّ فِي السحور بركة" .')
_NIYYA = ('حَدَّثَنَا الْحُمَيْدِيُّ: قَالَ سَمِعْتُ عُمَرَ يَقُولُ: سَمِعْتُ رَسُولَ اللهِ ﷺ '
          'يَقُولُ: «إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ»')
# نصٌّ فيه اللفظُ **في ترجمة الباب** معلَّقًا موقوفًا، والمسنَدُ بعدَه حديثٌ آخر
_TALIQ = ('بَابُ شَرَابِ الْحَلْوَاءِ وَالْعَسَلِ وَقَالَ ابْنُ مَسْعُودٍ فِي السَّكَرِ: '
          'إِنَّ اللهَ لَمْ يَجْعَلْ شِفَاءَكُمْ فِيمَا حَرَّمَ عَلَيْكُمْ. '
          'حَدَّثَنَا عَلِيٌّ: عَنْ عَائِشَةَ ﵂ قَالَتْ: كَانَ النَّبِيُّ ﷺ يُحِبُّ الْحَلْوَاءَ')
# نصٌّ لا ذِكرَ فيه للنبي ﷺ أصلًا: أثرٌ موقوف
_MAWQUF = ('وَقَالَ عُمَرُ ﵁: تَفَقَّهُوا قَبْلَ أَنْ تُسَوَّدُوا')


class _FakeVH:
    """مقابِلٌ صوريّ: يجيب من جدولٍ ثابت، فيُختبَر المنطقُ لا الشبكة."""
    TABLE = {
        'تسحروا فإن في السحور بركة': {'bukhari': ('OK', 1923, _SAHUR),
                                      'muslim': ('OK', 1095, _SAHUR_MUSLIM)},
        'إنما الأعمال بالنيات': {'bukhari': ('OK', 1, _NIYYA),
                                 'muslim': ('NOT_FOUND', None, '')},
        'من حسن إسلام المرء تركه ما لا يعنيه': {'bukhari': ('NOT_FOUND', None, ''),
                                                'muslim': ('NOT_FOUND', None, '')},
        'الطهور شطر الإيمان': {'bukhari': ('NOT_FOUND', None, ''),
                               'muslim': ('PARTIAL', 223, '')},
        'إن الله لم يجعل شفاءكم فيما حرم عليكم': {'bukhari': ('OK', 5613, _TALIQ),
                                                  'muslim': ('NOT_FOUND', None, '')},
        'تفقهوا قبل أن تسودوا': {'bukhari': ('OK', 68, _MAWQUF),
                                 'muslim': ('NOT_FOUND', None, '')},
    }

    def __init__(self, vh):
        self.normalize_nospace = vh.normalize_nospace
        self.normalize = vh.normalize

    def report(self, phrase, book, verbose=False):
        g, n, t = self.TABLE.get(phrase, {}).get(book, ('NOT_FOUND', None, ''))
        return {'grade': g, 'number': n, 'url': None, 'text': t}


SELF_TEST = [
    ('قال ﷺ: «تسحروا فإن في السحور بركة».',
     'قال ﷺ: «تسحروا فإن في السحور بركة» (رواه البخاري (١٩٢٣) ومسلم (١٠٩٥)).',
     ['TAKHRIJ_ADDED'], 'مرفوعٌ بلا تخريجٍ ثابتٌ في الصحيحين ⇒ يُخرَّج بموضعيه'),
    ('لقوله ﷺ: «إنما الأعمال بالنيات».',
     'لقوله ﷺ: «إنما الأعمال بالنيات» (رواه البخاري (١)).',
     ['TAKHRIJ_ADDED'], 'ثابتٌ في أحدهما ⇒ يُخرَّج به وحدَه بلا دعوى اتفاق'),
    ('قال ﷺ: «من حسن إسلام المرء تركه ما لا يعنيه».',
     None, ['NOT_IN_SAHIHAYN'],
     'لم يوجد في الصحيحين ⇒ لا يُخترَع له تخريجٌ ولا يُمَسّ نصُّه'),
    ('قال ﷺ: «الطهور شطر الإيمان».',
     None, ['NOT_IN_SAHIHAYN'],
     'PARTIAL — لفظُه ليس لفظَ الكتاب ⇒ لا يُنسَب إليه برقمه'),
    ('قال ﷺ: «تسحروا فإن في السحور بركة» رواه البخاري (١٩٢٣).',
     None, ['ALREADY_TAKHRIJ'], 'المخرَّجُ برقمٍ لا يُمَسّ'),
    ('قال ﷺ: «تسحروا فإن في السحور بركة» رواه البخاري.',
     None, ['PARTIAL_TAKHRIJ'], 'تخريجٌ بلا رقم ⇒ يُعلَم ولا يُلمَس (ليس نقصًا مطلقًا)'),
    ('ومن الأذكار «اللهم بك أصبحنا وبك أمسينا».',
     None, [], 'لا إسنادَ صريحًا إلى النبي ﷺ ⇒ لا يُدرَج أصلًا'),
    ('قال ابن قدامة: «الثلث كثير».',
     None, [], 'قولُ فقيهٍ لا مرفوع ⇒ لا يُدرَج ولو كان بين «…»'),
    ('كان النبي ﷺ يخصف نعله، وقال أنس: «خدمته عشر سنين».',
     None, [], 'ورودُ ﷺ بعيدًا عن الاقتباس وصفٌ لا إسناد ⇒ لا يُدرَج'),
    ('والحديث: «إن الله لم يجعل شفاءكم فيما حرم عليكم».',
     None, ['NOT_IN_SAHIHAYN'],
     '⚠️ اللفظُ في **ترجمة الباب** معلَّقًا موقوفًا لا في المسنَد ⇒ يُردّ ولا '
     'يُنسَب برقم الحديث الذي بعده'),
    ('قال ﷺ: «تفقهوا قبل أن تسودوا».',
     None, ['NOT_IN_SAHIHAYN'],
     '⚠️ النصُّ المطابَقُ لا ذِكرَ فيه للنبي ﷺ (أثرٌ موقوف) ⇒ لا يُخرَّج مرفوعًا'),
]


def self_test() -> int:
    vh = _FakeVH(_load_verifier())
    bad = 0
    for text, want_text, want_statuses, desc in SELF_TEST:
        new, log = process(text, vh)
        got = [r['status'] for r in log]
        ok = got == want_statuses and (want_text is None or new == want_text) \
            and (want_text is not None or new == text)
        bad += not ok
        print(f"{'✔' if ok else '✘'} {desc}")
        if not ok:
            print(f"    المتوقَّع={want_statuses} الناتج={got}")
            print(f"    النصّ={new!r}")
    print(f"\n=== اختبار ذاتي: {len(SELF_TEST) - bad}/{len(SELF_TEST)} نجح")
    return 1 if bad else 0


def sql_escape(s: str) -> str:
    return s.replace("'", "''")


def main() -> int:
    if '--self-test' in sys.argv:
        return self_test()
    ap = argparse.ArgumentParser(description='تخريجُ الأحاديث المنسوبة بلا تخريج')
    ap.add_argument('rows', help='ملف JSON يحوي مصفوفة صفوف (أو - للقراءة من stdin)')
    ap.add_argument('--field', default='body')
    ap.add_argument('--id-field', default='id')
    ap.add_argument('--label-field', default='title')
    ap.add_argument('--sql', help='مسارُ ملفِ SQL يُولَّد للصفوف التي تغيّرت')
    ap.add_argument('--table', default='sharia_rulings')
    ap.add_argument('--limit', type=int, help='حدُّ عددِ الصفوف المعالَجة (حجمُ الدفعة)')
    ap.add_argument('--verbose', action='store_true')
    a = ap.parse_args()

    vh = _load_verifier()
    rows = json.load(sys.stdin if a.rows == '-' else open(a.rows, encoding='utf8'))
    counts, changed, pending = {}, [], []
    for x in rows:
        text = x.get(a.field) or ''
        if a.limit is not None and len(changed) >= a.limit:
            break
        new, log = process(text, vh, verbose=a.verbose)
        for r in log:
            counts[r['status']] = counts.get(r['status'], 0) + 1
        interesting = [r for r in log if r['status'] != 'ALREADY_TAKHRIJ']
        if not interesting:
            continue
        stuck = [r for r in interesting if r['status'] == 'NOT_IN_SAHIHAYN']
        if new != text:
            changed.append((x, new, log))
            mark = '✔' if not stuck else '~'
        else:
            pending.append((x, log))
            mark = '✘' if stuck else '·'
        print(f"{mark} {str(x.get(a.label_field, ''))[:64]}")
        for r in interesting:
            print(f"    {r['status']:<18} {r.get('tag') or ''}")
            if r['status'] == 'NOT_IN_SAHIHAYN':
                print(f"      اللفظ={r['quote'][:110]}")
                print(f"      المقابلة={json.dumps(r.get('detail', {}), ensure_ascii=False)}")

    print(f"\n=== صفوف={len(rows)} مخرَّجة={len(changed)} مؤجَّلة={len(pending)} | {counts}")
    if a.sql and changed:
        with open(a.sql, 'w', encoding='utf8') as f:
            f.write('-- تخريجُ الأحاديث المنسوبة إلى النبي ﷺ بلا تخريجٍ في المحتوى المنشور.\n'
                    '-- وُلِّد آليًّا بـ scripts/locate-hadith-quotes.py: كلُّ رقمٍ هنا\n'
                    '-- مقابَلٌ بنصّ الصحيحين على الشاملة، ولم يُخرَّج ما لم يوجد فيهما.\n'
                    'BEGIN;\n')
            for x, new, _ in changed:
                f.write(f"UPDATE {a.table} SET {a.field} = '{sql_escape(new)}'\n"
                        f"  WHERE id = '{x[a.id_field]}';\n")
            f.write('COMMIT;\n')
        print(f"=== كُتب SQL: {a.sql}")
    return 1 if pending else 0


if __name__ == '__main__':
    sys.exit(main())
