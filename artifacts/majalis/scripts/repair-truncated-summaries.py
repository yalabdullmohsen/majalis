#!/usr/bin/env python3
"""إصلاحُ الملخَّصات المبتورة التي قُطع فيها اقتباسٌ قرآنيّ في وسط كلمة.

المشكلة التي يعالجها: حقلُ `summary` في `sharia_rulings` مقطوعٌ عند ١٦٠ حرفًا
بلا علامةِ حذف، وفي بعض الصفوف وقع القطعُ **داخل آيةٍ بين ﴿﴾** فبقي المصحف
معروضًا مبتورًا في وسط الكلمة (﴿وَارْكَع، ﴿لَّا يَمَسُّهُ إِلَّا الْمُ) —
وهذا أشدُّ من مجرّدِ بترِ جملة.

والإصلاحُ **نقلٌ حرفيّ لا إنشاء**: نصُّ الملخَّص موجودٌ بحرفه داخل `body`
الخاصِّ بالصفِّ نفسِه (فُحص: ١٦٧ من ١٧٥ مبتورًا هي سلاسلُ فرعيّةٌ من `body`)،
فيُمَدّ الملخَّصُ من `body` نفسِه حتى ينغلقَ الاقتباسُ بـ﴾، ويُلتقَط معه
وسمُ الموضع `[سورة: رقم]` إن تلاه مباشرةً، ثم تُختَم بـ«…» إن بقي في `body`
كلامٌ بعده. فلا يُضاف حرفٌ من خارج الصفّ، ولا تُعادُ صياغةُ شيء.

وبوابةُ الأمان: كلُّ اقتباسٍ في النصّ الناتج يُعرَض على
`verify-quran-citations.py` فلا يُكتَب SQL إن سقط منها اقتباسٌ واحد.

**الوضعُ الثاني `--mode prose`** (أُضيف في ج-٢٦٥): بقيّةُ المبتور ممّا لا آيةَ
فيه — نثرٌ مقطوعٌ عند ١٦٠ حرفًا بالضبط بلا «…» فينتهي في وسط الكلمة
(«…والمسجد، وحفر» / «…مخالفة ال»). والعلاجُ نقلٌ كذلك: يُمَدّ الملخَّصُ من
`body` الخاصِّ بالصفِّ نفسِه إلى **أقربِ حدِّ جملة** (‎. أو ؟ أو !‎ يتلوه فراغٌ
أو نهايةُ النصّ) ثم يُختَم بـ«…» إن بقي في `body` كلامٌ بعده — وعلامةُ النقطة
تُبدَل بـ«…» فلا يجتمعان («البئر…» لا «البئر.…») جريًا على صيغةِ
`summarizeText` التي لا تُبقي ترقيمًا قبل علامةِ الحذف. فإن لم يوجد حدُّ جملةٍ
دون سقفِ `--max-extend` مُدَّ إلى آخرِ الكلمة الجارية فحسب، وإن تعذّر تُرك الصفُّ
ولم يُمَسّ.

الاستعمال:
    python3 scripts/repair-truncated-summaries.py rows.json
    python3 scripts/repair-truncated-summaries.py rows.json --mode prose --sql out.sql
    python3 scripts/repair-truncated-summaries.py rows.json --sql out.sql --table sharia_rulings
    python3 scripts/repair-truncated-summaries.py --self-test
"""
from __future__ import annotations
import argparse, json, re, sys

# قوسا الآية في محتوى المنصّة: ﴿ (U+FD3F) و﴾ (U+FD3E)
OPEN, CLOSE = '﴿', '﴾'

# وسمُ الموضع الذي يلي الاقتباسَ مباشرةً: [البقرة: ٤٣] أو [النساء: ٤٨ و١١٦]
TAG_RE = re.compile(r'^\s*\[[^\[\]]+?:\s*[٠-٩۰-۹0-9\sو\-]+\]')
ELLIPSIS = '…'


def needs_repair(summary: str) -> bool:
    """يُصلَح ما فيه ﴿ بلا ﴾ يقابلها — أي اقتباسٌ مبتورٌ في وسطه."""
    return summary.count(OPEN) != summary.count(CLOSE)


def repair(summary: str, body: str):
    """يمدّ الملخَّصَ من `body` حتى ينغلقَ الاقتباس. يرجع (النصّ، الحالة)."""
    if not needs_repair(summary):
        return summary, 'NO_CHANGE'
    idx = body.find(summary)
    if idx < 0:
        return summary, 'NOT_IN_BODY'
    rest = body[idx + len(summary):]
    close = rest.find(CLOSE)
    if close < 0:
        return summary, 'NO_CLOSE_IN_BODY'
    end = close + 1
    tag = TAG_RE.match(rest[end:])
    if tag:
        end += tag.end()
    out = summary + rest[:end]
    if rest[end:].strip():
        out += ELLIPSIS
    if needs_repair(out):
        return summary, 'STILL_UNBALANCED'
    return out, 'REPAIRED'


# حدُّ الجملة: نقطةٌ أو استفهامٌ أو تعجُّبٌ يتلوه فراغٌ أو نهايةُ النصّ
SENT_END_RE = re.compile(r'[.؟!](?=\s|$)')
# علامةُ نهايةٍ في آخرِ الملخَّص: ما دلَّ على أنّ الجملةَ انغلقت لا بُترت
TERMINAL_RE = re.compile(r'[.؟!»)"…]\s*$')
TRUNC_LEN = 160          # الطولُ الذي قُطع عنده الملخَّصُ في المصدر
MAX_EXTEND = 200         # أقصى ما يُمَدُّ به الملخَّصُ بحثًا عن حدِّ الجملة


def is_truncated(summary: str, trunc_len: int | None = TRUNC_LEN) -> bool:
    """هل الملخَّصُ مبتور؟ `trunc_len=None` ⇒ المِلاكُ غيابُ علامةِ النهاية لا الطول.

    (وُسِّع في ج-٢٧١: البترُ ليس محصورًا في ١٦٠ حرفًا كما افترضت الدفعاتُ
    السابقة، فبقيت صفوفٌ مبتورةٌ بأطوالٍ أخرى خارجَ المُنتقي.)
    """
    if summary.rstrip().endswith(ELLIPSIS):
        return False
    if trunc_len is None:
        return not TERMINAL_RE.search(summary)
    return len(summary) == trunc_len


def _close_quote(rest: str, end: int):
    """يمدُّ حدَّ القطعِ حتى ينغلقَ اقتباسٌ فُتح داخله (مع وسمِ الموضع)."""
    close = rest.find(CLOSE, end)
    if close < 0:
        return None
    end = close + 1
    tag = TAG_RE.match(rest[end:])
    return end + tag.end() if tag else end


def repair_prose(summary: str, body: str, trunc_len: int | None = TRUNC_LEN,
                 max_extend: int = MAX_EXTEND):
    """يمدُّ ملخَّصًا نثريًّا مبتورًا إلى أقربِ حدِّ جملةٍ من `body`."""
    if not is_truncated(summary, trunc_len):
        return summary, 'NO_CHANGE'
    idx = body.find(summary)
    if idx < 0:
        return summary, 'NOT_IN_BODY'
    rest = body[idx + len(summary):]
    if not rest.strip():
        return summary, 'AT_END'          # الملخَّصُ هو آخرُ المتن ⇒ غيرُ مبتور

    m = SENT_END_RE.search(rest[:max_extend])
    if m:
        end, kind = m.end(), 'PROSE_REPAIRED'
    else:                                  # لا حدَّ جملةٍ قريبًا ⇒ أتمِمِ الكلمةَ فحسب
        w = re.search(r'\s', rest[:max_extend])
        if not w:
            return summary, 'NO_BOUNDARY'
        end, kind = w.start(), 'WORD_REPAIRED'

    out = summary + rest[:end]
    if needs_repair(out):                  # وقع القطعُ داخل ﴿…﴾ ⇒ أغلِقْه
        end = _close_quote(rest, end)
        if end is None:
            return summary, 'STILL_UNBALANCED'
        out = summary + rest[:end]
    out = out.rstrip()
    if rest[end:].strip():
        out = (out[:-1] if out.endswith('.') else out) + ELLIPSIS
    return out, kind


SELF_TESTS = [
    # (الملخَّص، المتن، المتوقَّع، الحالة)
    ('قال تعالى: ' + OPEN + 'وَارْكَع',
     'س: قال تعالى: ' + OPEN +
     'وَارْكَعُوا' + CLOSE +
     ' [البقرة: ٤٣] وزيادة',
     'قال تعالى: ' + OPEN + 'وَارْكَعُوا' +
     CLOSE + ' [البقرة: ٤٣]' + ELLIPSIS, 'REPAIRED'),
    # لا شيء بعد الوسم في المتن ⇒ لا تُضاف «…»
    ('أ ' + OPEN + 'ب', 'س أ ' + OPEN + 'بج' + CLOSE + ' [النور: ٢٧]',
     'أ ' + OPEN + 'بج' + CLOSE + ' [النور: ٢٧]', 'REPAIRED'),
    # اقتباسٌ مكتملٌ أصلًا ⇒ لا يُمَسّ
    ('أ ' + OPEN + 'ب' + CLOSE + ' ج', 'أ ' + OPEN + 'ب' + CLOSE + ' ج د',
     'أ ' + OPEN + 'ب' + CLOSE + ' ج', 'NO_CHANGE'),
    # الملخَّص ليس داخل المتن ⇒ لا يُخمَّن، يُترَك
    ('أ ' + OPEN + 'ب', 'نصٌّ آخر تمامًا', 'أ ' + OPEN + 'ب', 'NOT_IN_BODY'),
    # وسمٌ بموضعين (النساء: ٤٨ و١١٦) يُلتقَط كاملًا
    ('أ ' + OPEN + 'ب', 'أ ' + OPEN + 'بج' + CLOSE + ' [النساء: ٤٨ و١١٦]. تتمّة',
     'أ ' + OPEN + 'بج' + CLOSE + ' [النساء: ٤٨ و١١٦]' + ELLIPSIS, 'REPAIRED'),
    # المتنُ نفسُه لا يُغلق الاقتباس ⇒ يُترَك ويُبلَّغ
    ('أ ' + OPEN + 'ب', 'أ ' + OPEN + 'بج بلا إغلاق', 'أ ' + OPEN + 'ب', 'NO_CLOSE_IN_BODY'),
    # اقتباسان مكتملان ⇒ متوازنٌ فلا يُمَسّ
    ('أ ' + OPEN + 'ب' + CLOSE + ' و' + OPEN + 'ج' + CLOSE, 'أ...',
     'أ ' + OPEN + 'ب' + CLOSE + ' و' + OPEN + 'ج' + CLOSE, 'NO_CHANGE'),
]


PROSE_TESTS = [
    # (الملخَّص، المتن، طولُ القطع، سقفُ المدّ، المتوقَّع، الحالة)
    # مبتورٌ في وسط الكلمة وبعد الجملةِ كلامٌ ⇒ النقطةُ تُبدَل بـ«…»
    ('قال زيد وحفر', 'قال زيد وحفر البئر. وزاد غيره.', 12, 200,
     'قال زيد وحفر البئر…', 'PROSE_REPAIRED'),
    # لا كلامَ بعد الجملة ⇒ تبقى النقطةُ ولا تُضاف «…»
    ('قال زيد وحفر', 'قال زيد وحفر البئر.', 12, 200,
     'قال زيد وحفر البئر.', 'PROSE_REPAIRED'),
    # الاستفهامُ يبقى ثم تُضاف «…»
    ('قال زيد وحفر', 'قال زيد وحفر البئر؟ نعم.', 12, 200,
     'قال زيد وحفر البئر؟…', 'PROSE_REPAIRED'),
    # حدُّ الجملةِ وقع داخلَ ﴿…﴾ ⇒ يُمَدُّ حتى الإغلاقِ ووسمِ الموضع
    ('قال ' + OPEN + 'أ', 'قال ' + OPEN + 'أ. ب' + CLOSE + ' [النور: ٣]. ثم', 6, 200,
     'قال ' + OPEN + 'أ. ب' + CLOSE + ' [النور: ٣]' + ELLIPSIS, 'PROSE_REPAIRED'),
    # لا حدَّ جملةٍ دون السقف ⇒ تُتَمُّ الكلمةُ الجاريةُ فحسب
    ('أب', 'أبجد ثم كلامٌ طويلٌ بلا نقطة', 2, 6, 'أبجد' + ELLIPSIS, 'WORD_REPAIRED'),
    # موسومٌ بـ«…» أصلًا ⇒ لا يُمَسّ
    ('قال زيد' + ELLIPSIS, 'قال زيد وحفر البئر.', 8, 200,
     'قال زيد' + ELLIPSIS, 'NO_CHANGE'),
    # طولٌ مخالفٌ لطولِ القطع ⇒ ليس مبتورًا فلا يُمَسّ
    ('قال زيد', 'قال زيد وحفر البئر.', 160, 200, 'قال زيد', 'NO_CHANGE'),
    # ليس داخلَ المتن ⇒ لا يُخمَّن
    ('قال زيد وحفر', 'نصٌّ آخر تمامًا', 12, 200, 'قال زيد وحفر', 'NOT_IN_BODY'),
    # الملخَّصُ هو آخرُ المتن ⇒ غيرُ مبتورٍ أصلًا
    ('قال زيد وحفر', 'قال زيد وحفر', 12, 200, 'قال زيد وحفر', 'AT_END'),
    # === مُنتقي ج-٢٧١: trunc_len=None ⇒ العبرةُ بغياب علامةِ النهاية لا بالطول ===
    # مبتورٌ بطولٍ لا يوافق ١٦٠ ⇒ كان يُفلَت قبلُ، وصار يُصلَح
    ('قال زيد وحفر', 'قال زيد وحفر البئر. وزاد غيره.', None, 200,
     'قال زيد وحفر البئر…', 'PROSE_REPAIRED'),
    # منغلقٌ بنقطة ⇒ ليس مبتورًا فلا يُمَسّ
    ('قال زيد.', 'قال زيد. وزاد غيره.', None, 200, 'قال زيد.', 'NO_CHANGE'),
    # منغلقٌ بغلقِ اقتباسٍ « » ⇒ ليس مبتورًا
    ('قال «الصبرُ ضياء»', 'قال «الصبرُ ضياء» ثم زاد.', None, 200,
     'قال «الصبرُ ضياء»', 'NO_CHANGE'),
    # جوابٌ قصيرٌ تامٌّ هو آخرُ المتن ⇒ AT_END لا مدَّ له (عشرةُ صفوفٍ منه في ج-٢٧١)
    ('الزكاة', '**الجواب:** الزكاة', None, 200, 'الزكاة', 'AT_END'),
]


def self_test() -> int:
    ok = 0
    for summary, body, want, want_st in SELF_TESTS:
        got, st = repair(summary, body)
        good = got == want and st == want_st
        ok += good
        print(('✔' if good else '✘'), st, '|', repr(got[:60]))
        if not good:
            print('    المتوقَّع=', want_st, repr(want[:60]))
    print(f'\n=== اختبار ذاتي (آية مبتورة): {ok}/{len(SELF_TESTS)} نجح')

    ok2 = 0
    for summary, body, tlen, mext, want, want_st in PROSE_TESTS:
        got, st = repair_prose(summary, body, tlen, mext)
        good = got == want and st == want_st
        ok2 += good
        print(('✔' if good else '✘'), st, '|', repr(got[:60]))
        if not good:
            print('    المتوقَّع=', want_st, repr(want[:60]))
    print(f'=== اختبار ذاتي (نثرٌ مبتور): {ok2}/{len(PROSE_TESTS)} نجح')
    return 0 if ok == len(SELF_TESTS) and ok2 == len(PROSE_TESTS) else 1


def main() -> int:
    ap = argparse.ArgumentParser(description='إصلاحُ الملخَّصات المبتورة داخل اقتباسٍ قرآنيّ')
    ap.add_argument('rows', nargs='?')
    ap.add_argument('--field', default='summary')
    ap.add_argument('--body-field', default='body')
    ap.add_argument('--id-field', default='id')
    ap.add_argument('--label-field', default='title')
    ap.add_argument('--table', default='sharia_rulings')
    ap.add_argument('--sql')
    ap.add_argument('--mode', choices=('quran', 'prose'), default='quran',
                    help='quran: بترٌ داخل ﴿…﴾ | prose: نثرٌ مقطوعٌ عند حدِّ الطول')
    ap.add_argument('--trunc-len', default=str(TRUNC_LEN),
                    help="طولُ القطع، أو any ⇒ كلُّ ملخَّصٍ لا ينتهي بعلامةِ نهاية")
    ap.add_argument('--max-extend', type=int, default=MAX_EXTEND)
    ap.add_argument('--self-test', action='store_true')
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if not a.rows:
        ap.error('يلزم ملفُ الصفوف أو --self-test')

    trunc_len = None if str(a.trunc_len).lower() == 'any' else int(a.trunc_len)
    rows = json.load(sys.stdin if a.rows == '-' else open(a.rows, encoding='utf-8'))
    done = ('REPAIRED',) if a.mode == 'quran' else ('PROSE_REPAIRED', 'WORD_REPAIRED')
    skip = ('NO_CHANGE',) if a.mode == 'quran' else ('NO_CHANGE', 'AT_END')
    stats, updates = {}, []
    for r in rows:
        summary, body = r.get(a.field) or '', r.get(a.body_field) or ''
        if a.mode == 'quran':
            out, st = repair(summary, body)
        else:
            out, st = repair_prose(summary, body, trunc_len, a.max_extend)
        stats[st] = stats.get(st, 0) + 1
        mark = '✔' if st in done else ('·' if st in skip else '✘')
        if st not in skip:
            print(f"{mark} {r.get(a.label_field, '')[:60]}\n    {st}: {out[-80:]!r}")
        if st in done:
            updates.append((r[a.id_field], out))

    print(f"\n=== صفوف={len(rows)} مُصلَحة={len(updates)} | {stats}")
    if a.sql and updates:
        with open(a.sql, 'w', encoding='utf-8') as f:
            f.write('-- إصلاحُ الملخَّصات المبتورة.\n')
            f.write('-- وُلِّد آليًّا بـ scripts/repair-truncated-summaries.py: كلُّ حرفٍ مُضافٍ\n')
            f.write('-- منقولٌ بحرفه من حقل body الخاصِّ بالصفِّ نفسِه، لا من خارجه.\n')
            f.write('BEGIN;\n')
            for rid, text in updates:
                esc = text.replace("'", "''")
                f.write(f"UPDATE {a.table} SET {a.field} = '{esc}'\n  WHERE {a.id_field} = '{rid}';\n")
            f.write('COMMIT;\n')
        print(f'=== كُتب SQL: {a.sql}')
    return 0 if not any(k not in done + skip for k in stats) else 1


if __name__ == '__main__':
    sys.exit(main())
